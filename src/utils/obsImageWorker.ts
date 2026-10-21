/**
 * 注册 OBS 图片解密 Service Worker.
 *
 * 图片在 OBS 里是 AES-256-GCM 密文，后端返回的是「图片域名 + 对象键」直连地址，
 * 必须由 Service Worker 拦截 <img> 请求、解密后再交给浏览器渲染（详见 public/sw-obs-image.js）。
 *
 * 配置来自构建环境变量：
 * VITE_OBS_CONTENT_KEY：与后端 OBS_CONTENT_KEY 一致的 base64 密钥（放 .env.*.local）；
 * VITE_OBS_IMAGE_ORIGINS：允许解密的图片来源，逗号分隔（OBS 地址或 CDN 域名）；
 * 两者缺一就不注册，避免把非加密来源的图片也接管。
 */
const SW_URL = '/sw-obs-image.js'

/**
 * 是否已经等过 controller 接管（避免同一页面重复等 1.5s）
 */
let controllerReady = false

/**
 * 注册并等待图片解密 Worker 接管当前页面.
 *
 * 必须等它 resolve 后再 `app.mount()`：首屏 <img> 在挂载时立刻发请求，如果此时页面
 * 还没有 Service Worker 控制器（首次访问 / SW 刚更新），请求会直接拿到 OBS 密文并显示
 * 「加载失败」，只有手动刷新才恢复。等到 controller 存在且密钥下发完成后再挂载，
 * 首屏图片就能一次成功。
 *
 * 未配置密钥 / 非安全上下文 / 注册失败时直接 resolve，不阻塞页面。
 */
export async function registerObsImageWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const key = String(import.meta.env.VITE_OBS_CONTENT_KEY ?? '')
  const origins = String(import.meta.env.VITE_OBS_IMAGE_ORIGINS ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  if (!key || origins.length === 0) {
    return
  }

  // Service Worker 只在安全上下文可用（HTTPS 或 localhost）
  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.warn('[obs-image] 当前不是安全上下文，无法注册图片解密 Service Worker')

    return
  }

  /**
   * 给 Worker 下发密钥，并等它回执.
   *
   * postMessage 是异步的，只发不等的话挂载后立刻发出的图片请求可能仍落在「没有密钥」的
   * Worker 里（透传密文 → 加载失败）。超时 1s 兜底，Worker 异常时也不能把页面卡死。
   */
  const sendConfig = async (worker: ServiceWorker | null | undefined): Promise<void> => {
    if (!worker) {
      return
    }

    await new Promise<void>((resolve) => {
      let timer: number | undefined

      const done = (): void => {
        window.clearTimeout(timer)
        resolve()
      }

      const onMessage = (event: MessageEvent): void => {
        if ((event.data as { type?: string } | null)?.type !== 'obs-image-config-ack') {
          return
        }
        navigator.serviceWorker.removeEventListener('message', onMessage)
        done()
      }

      timer = window.setTimeout(() => {
        navigator.serviceWorker.removeEventListener('message', onMessage)
        done()
      }, 1000)
      navigator.serviceWorker.addEventListener('message', onMessage)
      worker.postMessage({ type: 'obs-image-config', key, origins })
    })
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL)

    // active Worker 就绪（首次注册时 register 返回的 active 可能还是 null）；
    // SW 安装失败时 ready 会一直 pending，3s 兜底避免页面永远不挂载
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 3000)
      }),
    ])

    // 首次访问时页面还没有 controller，等 activate 里的 clients.claim() 触发 controllerchange；
    // 1.5s 超时兜底，避免 SW 异常时页面一直不挂载
    if (!navigator.serviceWorker.controller && !controllerReady) {
      await new Promise<void>((resolve) => {
        // 超时后监听器仍保留：它只会 resolve 已经完成的 Promise，没有副作用
        const timer = window.setTimeout(resolve, 1500)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.clearTimeout(timer)
          resolve()
        }, { once: true })
      })
      controllerReady = true
    }

    await sendConfig(navigator.serviceWorker.controller || registration.active)

    // SW 更新接管后重新下发配置（内存里的密钥会随旧实例销毁）
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      void sendConfig(navigator.serviceWorker.controller)
    })
  }
  catch (error) {
    console.warn('[obs-image] Service Worker 注册失败，图片将以密文显示', error)
  }
}
