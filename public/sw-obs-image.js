/*
 * OBS 图片解密 Service Worker.
 *
 * 背景：图片在 OBS 里是 AES-256-GCM 密文（OBSE1 + iv + tag + ciphertext），
 * 后端响应里的 url 已经改成「图片域名 + 对象键」的直连地址，浏览器不能直接当图片渲染。
 *
 * 这里全局拦截「配置过的图片来源」发出的 <img> 请求：
 *   1. 用 cors 模式重新请求（OBS 已配置 CORS）；
 *   2. 拿到密文后判断魔术字节，非密文（历史明文/其它资源）原样返回；
 *   3. 密文用 WebCrypto 解密，返回带正确 Content-Type 的 Response；
 *   4. 解密结果写入 Cache API，刷新页面/Service Worker 重启后不重复解密。
 *
 * 这样资源库、上传预览、商户卡片、H5 卡片都不需要改组件。
 * 配置由页面在注册时通过 postMessage 下发（密钥不写在 SW 文件里）。
 */

/* eslint-disable no-restricted-globals */

let config = { key: '', origins: [] }

const CACHE_NAME = 'obs-images-v2'

const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  avif: 'image/avif',
}

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'obs-image-config') {
    return
  }

  const origins = (data.origins || [])
    .map((item) => {
      try {
        return new URL(item).origin
      }
      catch {
        return ''
      }
    })
    .filter(Boolean)

  config = { key: String(data.key || ''), origins }

  // 回执：页面在挂载前要确认密钥已生效，否则首屏图片请求会拿到密文（显示加载失败）
  event.source?.postMessage({ type: 'obs-image-config-ack' })
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 清掉旧版本缓存（解密结果格式/密钥可能变化）
    const names = await caches.keys()
    await Promise.all(names.filter(name => name.startsWith('obs-images-') && name !== CACHE_NAME).map(name => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || request.destination !== 'image') {
    return
  }

  let url
  try {
    url = new URL(request.url)
  }
  catch {
    return
  }

  // 只处理配置过的图片域名（OBS 或 CDN），其它图片（图标、第三方图）完全不碰
  if (!config.key || !config.origins.includes(url.origin)) {
    return
  }

  event.respondWith(respondWithDecrypted(url))
})

async function respondWithDecrypted(url) {
  const cacheKey = url.origin + url.pathname
  const cache = await caches.open(CACHE_NAME)

  const cached = await cache.match(cacheKey)
  if (cached) {
    return cached
  }

  let response
  try {
    // 原请求是 no-cors（<img> 默认），改成 cors 才能读取响应体；OBS 已配置 Access-Control-Allow-Origin。
    // cache: 'reload' 必须加：浏览器可能已经缓存过「no-cors 且没有 ACAO」的同一 URL，
    // 直接复用缓存会触发 CORS 失败（表现为部分图片 200 但 fetch 报 No ACAO header）。
    response = await fetch(url.href, { mode: 'cors', credentials: 'omit', cache: 'reload' })
  }
  catch (error) {
    // 仍有极少数环境会把「无 ACAO 的响应」塞进浏览器缓存，加一次性参数强制回源重试
    try {
      const retryUrl = new URL(url.href)
      retryUrl.searchParams.set('_obs_retry', Date.now().toString())
      response = await fetch(retryUrl.href, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
    }
    catch (retryError) {
      console.warn('[obs-image] 图片请求失败', url.href, error, retryError)

      return Response.error()
    }
  }

  if (!response.ok) {
    return response
  }

  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const magic = bytes.length >= 5 ? new TextDecoder().decode(bytes.subarray(0, 5)) : ''

  // 非密文（音视频/历史明文/其它资源）：原样返回并缓存
  if (magic !== 'OBSE1') {
    const plain = new Response(buffer, { status: response.status, headers: response.headers })
    await cache.put(cacheKey, plain.clone())

    return plain
  }

  try {
    const decrypted = await decrypt(bytes)
    const ext = (url.pathname.split('.').pop() || '').toLowerCase()
    const result = new Response(decrypted, {
      headers: {
        'Content-Type': MIME_BY_EXT[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
    await cache.put(cacheKey, result.clone())

    return result
  }
  catch (error) {
    console.warn('[obs-image] 解密失败，返回原始内容', url.href, error)

    return new Response(buffer, { status: response.status, headers: response.headers })
  }
}

/** OBSE1 + iv(12) + tag(16) + ciphertext → 明文 */
async function decrypt(bytes) {
  const iv = bytes.subarray(5, 17)
  const tag = bytes.subarray(17, 33)
  const ciphertext = bytes.subarray(33)

  // WebCrypto 要求 tag 拼在密文末尾
  const merged = new Uint8Array(ciphertext.length + tag.length)
  merged.set(ciphertext)
  merged.set(tag, ciphertext.length)

  const key = await crypto.subtle.importKey('raw', base64ToBytes(config.key), 'AES-GCM', false, ['decrypt'])

  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, merged)
}

function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}
