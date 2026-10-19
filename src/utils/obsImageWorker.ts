/**
 * 注册 OBS 图片解密 Service Worker.
 *
 * 图片在 OBS 里是 AES-256-GCM 密文，后端返回的是「图片域名 + 对象键」直连地址，
 * 必须由 Service Worker 拦截 <img> 请求、解密后再交给浏览器渲染（详见 public/sw-obs-image.js）。
 *
 * 配置来自构建环境变量：
 * - `VITE_OBS_CONTENT_KEY`：与后端 `OBS_CONTENT_KEY` 一致的 base64 密钥（放 `.env.*.local`）；
 * - `VITE_OBS_IMAGE_ORIGINS`：允许解密的图片来源，逗号分隔（OBS 地址或 CDN 域名）；
 * 两者缺一就不注册，避免把非加密来源的图片也接管。
 */
const SW_URL = '/sw-obs-image.js'

export function registerObsImageWorker(): void {
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

  const sendConfig = (worker: ServiceWorker | null | undefined): void => {
    worker?.postMessage({ type: 'obs-image-config', key, origins })
  }

  navigator.serviceWorker.register(SW_URL)
    .then(async (registration) => {
      sendConfig(registration.active)

      const pending = registration.active || registration.waiting || registration.installing
      pending?.addEventListener('statechange', () => {
        if (pending.state === 'activated') {
          sendConfig(pending)
        }
      })

      await navigator.serviceWorker.ready
      sendConfig(navigator.serviceWorker.controller)
    })
    .catch((error) => {
      console.warn('[obs-image] Service Worker 注册失败，图片将以密文显示', error)
    })

  // SW 更新接管后重新下发配置（内存里的密钥会随旧实例销毁）
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    sendConfig(navigator.serviceWorker.controller)
  })
}
