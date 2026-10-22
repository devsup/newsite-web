/**
 * 对外接口（/api/**）的请求封装：双向加解密 + 信封解包.
 *
 * 加解密能力来自通用层 payloadCipher.ts（与后端 App\Library\Crypto\PayloadCipher 对应），
 * 本文件只处理「接口」相关的部分：开关、参数打包、请求发送、响应解包、错误提示。
 *
 * 后端 ApiEncryptMiddleware 在 API_ENCRYPT_ENABLED=true 时：
 *
 * 请求：参数加密后放 payload（GET 走查询串 ?payload=<base64>，POST 走 body
 *   {"payload":"<base64>"}），后端解密成真实参数再交给控制器；channel_code 会被转成
 *   Channel-Code 请求头。
 * 响应：data 直接换成密文字符串（不加 encrypted 之类标识）：
 *   { "code": 200, "message": "成功", "data": "QVBJRTF..." }
 *
 * 判断「要不要解密」靠两点：typeof data === 'string'（接口约定 data 只可能是数组或对象）
 * 且密文魔术字节匹配（looksEncrypted）。
 *
 * 用法：
 * ts
 * const categories = await requestApi<TopFooterCategory[]>('/api/v1/top-footer/list', {
 *   channelCode: route.query.code as string,
 * })
 *
 *
 * 开关是按模块的（模块 = 后端 app/Http 下的目录）：VITE_CRYPT_ENABLED_API /
 * VITE_CRYPT_ENABLED_ADMIN，与后端 CRYPT_ENABLED_<MODULE> 一一对应，两边一起开或一起关。
 * 模块开关关掉时接口是纯明文，用浏览器 / curl 直接看。
 */

import { decryptPayload, encryptPayload, looksEncrypted } from './payloadCipher'

/** 业务成功码，与后端 ResultCode::SUCCESS 一致 */
const CODE_SUCCESS = 200

/** 后端的标准响应信封（加密时 data 是密文字符串） */
export interface ApiEnvelope<T> {
  /** 业务码：200 成功，其余按失败处理 */
  code: number
  /** 提示文案（失败时直接展示） */
  message: string
  /** 业务数据；加密时是 base64 密文字符串 */
  data: T | string | null
}

/** requestApi 的可选项 */
export interface ApiRequestOptions {
  /** 请求方法：默认 GET */
  method?: 'GET' | 'POST'
  /** 查询参数；加密时与 body 一起并入 payload */
  query?: Record<string, unknown>
  /** 请求体（POST） */
  body?: Record<string, unknown>
  /** 渠道编码：加密时并入 payload 的 channel_code，明文时放 Channel-Code 头 */
  channelCode?: string
  /**
   * 用哪把密钥：对应后端 crypto.rules 里该路径规则的 key，
   * 也是密钥池 crypto.keys 的名称（前端读 VITE_PAYLOAD_CIPHER_KEY_<NAME>）。
   * 默认 api（与后端 /api/* 规则一致）。模块要用独立密钥时两边都改。
   */
  cryptoKey?: string
  /**
   * 是否加解密：不传则跟随该模块的开关（VITE_CRYPT_ENABLED_<cryptoKey>）。
   * 传 false 表示这个请求按明文收发，对应后端规则里的 enabled: false
   * （两边要一致，否则一端加密一端不加密会解不开）。
   */
  encrypt?: boolean
  /** 额外请求头 */
  headers?: Record<string, string>
}

/**
 * 密钥池名称 => 构建期变量：default -> VITE_PAYLOAD_CIPHER_KEY，
 * channel -> VITE_PAYLOAD_CIPHER_KEY_CHANNEL。
 *
 * 具名密钥没配就直接抛错，不静默回退到主密钥：
 * 回退的后果是「前端以为用 channel 密钥、后端按 channel 密钥解」，一旦后端真的切了规则，
 * 这里就会变成一个极难定位的解密失败。
 */
function resolveKeyByCryptoKey(cryptoKey: string): string | undefined {
  if (cryptoKey === 'default') {
    return import.meta.env.VITE_PAYLOAD_CIPHER_KEY
  }

  const envName = `VITE_PAYLOAD_CIPHER_KEY_${cryptoKey.toUpperCase()}`
  const value = (import.meta.env as Record<string, string | undefined>)[envName]
  if (!value) {
    throw new Error(`未配置 ${envName}（cryptoKey: ${cryptoKey}），请与后端 crypto.keys.${cryptoKey} 使用同一密钥`)
  }

  return value
}

/**
 * 某个模块是否开启加解密.
 *
 * 「模块」= 后端 app/Http 下的一个目录（Admin / Api / ...），与后端
 * CRYPT_ENABLED_<MODULE> 一一对应：api（默认开）、admin（默认关）。
 * 业务内的细分（landing / channel）不单独设开关，属于 api 模块。
 *
 * 变量没配时按「开启」处理（与后端 env(..., true) 的默认值保持一致），
 * 显式写 false 才会关闭——这样新增模块忘了配也不会悄悄变成明文。
 */
export function isCryptEnabled(cryptoKey: string): boolean {
  const envName = `VITE_CRYPT_ENABLED_${cryptoKey.toUpperCase()}`
  const value = (import.meta.env as Record<string, string | undefined>)[envName]

  return value === undefined ? true : String(value).toLowerCase() === 'true'
}

/**
 * 请求对外接口：请求加密（开关打开时）+ 响应自动解密.
 *
 * 开关打开：参数合并成 {...query, ...body, channel_code} 加密后发送
 * 开关关闭：GET 用查询串、POST 用 JSON body，渠道编码并入 channel_code 参数
 *   （不自定义请求头：自定义头会触发 CORS 预检，浏览器默认不放行）
 * 模块独立密钥：传 cryptoKey: 'channel' → 读 VITE_PAYLOAD_CIPHER_KEY_CHANNEL
 * 单个请求免加密：传 encrypt: false（与后端规则的 enabled: false 对应）
 * 响应 data 是密文时自动解密
 * code !== 200 抛错（错误信息用后端 message，页面可直接提示）
 *
 * @param url 接口地址（如 /api/v1/web/config，相对地址会自动接 API baseURL）
 * @param options 方法 / 参数 / 渠道编码 / 额外请求头
 */
export async function requestApi<T = unknown>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', query = {}, body = {}, channelCode, cryptoKey = 'api', headers = {} } = options
  const baseUrl = String(import.meta.env.VITE_APP_API_BASEURL ?? '').replace(/\/$/, '')
  // 单个请求可以覆盖模块开关（对应后端规则里的 enabled: false）
  const encrypted = options.encrypt ?? isCryptEnabled(cryptoKey)
  // 明文请求不需要密钥：模块开关关闭时，别因为没配密钥就报错
  const keyBase64 = encrypted ? resolveKeyByCryptoKey(cryptoKey) : undefined

  let requestUrl = `${baseUrl}${url}`
  let requestBody: string | undefined
  const requestHeaders: Record<string, string> = { ...headers }

  if (encrypted) {
    // 渠道编码并入加密参数，不明文出现在 URL / body / 头里
    const params: Record<string, unknown> = { ...query, ...body }
    if (channelCode) {
      params.channel_code = channelCode
    }
    const payload = await encryptPayload(params, { keyBase64 })

    if (method === 'GET') {
      requestUrl += `${requestUrl.includes('?') ? '&' : '?'}payload=${encodeURIComponent(payload)}`
    }
    else {
      requestHeaders['Content-Type'] = 'application/json'
      requestBody = JSON.stringify({ payload })
    }
  }
  else {
    // 明文模式把渠道编码放查询串，而不是 Channel-Code 自定义头：
    // 自定义头会触发 CORS 预检，而浏览器默认不放行未声明的头（后端 CorsMiddleware 的头列表里没有它）
    const search = new URLSearchParams()
    const plainQuery: Record<string, unknown> = { ...query }
    if (channelCode) {
      plainQuery.channel_code = channelCode
    }
    Object.entries(plainQuery).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, String(value))
      }
    })
    const searchString = search.toString()
    if (searchString !== '') {
      requestUrl += `${requestUrl.includes('?') ? '&' : '?'}${searchString}`
    }

    if (method !== 'GET') {
      requestHeaders['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }
  }

  const response = await fetch(requestUrl, { method, headers: requestHeaders, body: requestBody })
  const envelope = (await response.json()) as ApiEnvelope<T>

  if (envelope.code !== CODE_SUCCESS) {
    throw new Error(envelope.message || '请求失败')
  }

  if (looksEncrypted(envelope.data)) {
    return decryptPayload<T>(envelope.data, { keyBase64 })
  }

  return envelope.data as T
}
