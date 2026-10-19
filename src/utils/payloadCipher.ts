/**
 * 通用载荷加解密（AES-256-GCM，浏览器侧）.
 *
 * 与后端 `App\Library\Crypto\PayloadCipher` 一一对应，格式完全一致：
 *
 * ```
 * 密文 = base64( MAGIC + iv(12) + tag(16) + ciphertext )
 * ```
 *
 * - `MAGIC` 默认 `PAY1`（配置项 `PAYLOAD_CIPHER_MAGIC` / `VITE_PAYLOAD_CIPHER_MAGIC`），
 *   用来区分「密文」和「普通字符串」，改版本号前后端必须一起改；
 * - `iv` 每次随机生成，同样的明文每次得到不同密文；
 * - GCM 认证标签由 WebCrypto 自动附带在密文尾部，这里按后端约定拆出来重新拼进格式里；
 * - **内容改一个字节就解不开**（能防篡改），但**不防重放**；要防重放得在业务层带
 *   时间戳 / nonce。
 *
 * 与具体业务无关：接口请求响应、分享链接参数、本地缓存里需要加密的内容都能用。
 * 接口相关的封装（开关、请求发送、错误处理）在 `apiCrypto.ts`。
 *
 * 安全边界：密钥最终会随前端产物分发，能被逆向拿到，这套机制是「提高抓包 / 爬虫门槛」，
 * 不是密码学意义上的保密。真正的敏感数据不要交给浏览器保存。
 */

/** 默认魔术字节，与后端 `crypto.payload.magic` 一致 */
const DEFAULT_MAGIC = 'PAY1'

/** 加解密可选参数：不传就用构建期变量里的密钥与魔术字节 */
export interface PayloadCipherOptions {
  /** base64 编码的 32 字节密钥，默认 `VITE_PAYLOAD_CIPHER_KEY` */
  keyBase64?: string
  /** 密文头部标识，默认 `VITE_PAYLOAD_CIPHER_MAGIC`（`PAY1`） */
  magic?: string
}

/** GCM 初始向量长度 */
const IV_LENGTH = 12

/** GCM 认证标签长度 */
const TAG_LENGTH = 16

/**
 * base64 转字节数组.
 *
 * 显式用 `new ArrayBuffer` 建底层缓冲，返回类型才是 `Uint8Array<ArrayBuffer>`
 * （WebCrypto 的 BufferSource 不接受 `Uint8Array<ArrayBufferLike>`）。
 */
function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** 字节数组转 base64 */
function bytesToBase64(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/** 取魔术字节（构建期变量优先） */
function resolveMagic(magic?: string): string {
  return magic ?? String(import.meta.env.VITE_PAYLOAD_CIPHER_MAGIC ?? DEFAULT_MAGIC)
}

/** 取密钥（构建期变量优先），缺失时直接报错而不是静默降级 */
function resolveKey(keyBase64?: string): string {
  const key = keyBase64 ?? import.meta.env.VITE_PAYLOAD_CIPHER_KEY
  if (!key) {
    throw new Error('未配置 VITE_PAYLOAD_CIPHER_KEY，无法加解密内容')
  }
  return key
}

/** 导入 AES-GCM 密钥 */
async function importKey(keyBase64: string, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', base64ToBytes(keyBase64), 'AES-GCM', false, [usage])
}

/**
 * 加密明文（不做 JSON 包装）.
 *
 * @param plain 明文字符串
 * @param options 可选密钥与魔术字节，默认取构建期变量（见 PayloadCipherOptions）
 */
export async function encryptString(
  plain: string,
  options: PayloadCipherOptions = {},
): Promise<string> {
  const key = await importKey(resolveKey(options.keyBase64), 'encrypt')
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const sealed = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LENGTH * 8 },
    key,
    new TextEncoder().encode(plain),
  ))

  // WebCrypto 返回「密文 + 认证标签」，按后端格式（magic + iv + tag + 密文）重新拼
  const tag = sealed.subarray(sealed.length - TAG_LENGTH)
  const ciphertext = sealed.subarray(0, sealed.length - TAG_LENGTH)
  const magicBytes = new TextEncoder().encode(resolveMagic(options.magic))

  const out = new Uint8Array(magicBytes.length + IV_LENGTH + TAG_LENGTH + ciphertext.length)
  out.set(magicBytes, 0)
  out.set(iv, magicBytes.length)
  out.set(tag, magicBytes.length + IV_LENGTH)
  out.set(ciphertext, magicBytes.length + IV_LENGTH + TAG_LENGTH)

  return bytesToBase64(out)
}

/**
 * 解密 encryptString() 的产物.
 *
 * @param payload base64 密文
 * @param options 可选密钥与魔术字节，默认取构建期变量（见 PayloadCipherOptions）
 */
export async function decryptString(
  payload: string,
  options: PayloadCipherOptions = {},
): Promise<string> {
  const raw = base64ToBytes(payload)
  const magicBytes = new TextEncoder().encode(resolveMagic(options.magic))
  const magic = new TextDecoder().decode(raw.subarray(0, magicBytes.length))
  if (magic !== resolveMagic(options.magic)) {
    throw new Error(`无法识别的密文格式：${magic}`)
  }

  // 一律用「复制成新 buffer」的写法，保证类型是 Uint8Array<ArrayBuffer>
  const iv = new Uint8Array(raw.subarray(magicBytes.length, magicBytes.length + IV_LENGTH))
  const tag = new Uint8Array(raw.subarray(magicBytes.length + IV_LENGTH, magicBytes.length + IV_LENGTH + TAG_LENGTH))
  const ciphertext = new Uint8Array(raw.subarray(magicBytes.length + IV_LENGTH + TAG_LENGTH))

  // WebCrypto 的 AES-GCM 要求「密文 + 认证标签」拼在一起传入
  const combined = new Uint8Array(ciphertext.length + tag.length)
  combined.set(ciphertext)
  combined.set(tag, ciphertext.length)

  const key = await importKey(resolveKey(options.keyBase64), 'decrypt')
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined)

  return new TextDecoder().decode(plain)
}

/**
 * 加密结构体（先 JSON 序列化），解出来还是原来的数组 / 对象.
 */
export async function encryptPayload(
  data: unknown,
  options: PayloadCipherOptions = {},
): Promise<string> {
  return encryptString(JSON.stringify(data), options)
}

/**
 * 解密 encryptPayload() 的产物并反序列化.
 */
export async function decryptPayload<T = unknown>(
  payload: string,
  options: PayloadCipherOptions = {},
): Promise<T> {
  return JSON.parse(await decryptString(payload, options)) as T
}

/**
 * 判断一个字符串是不是本模块产出的密文（按魔术字节判断）.
 *
 * 用于「历史明文 / 新密文混存」的兼容场景：能解就解，不能解按明文处理。
 */
export function looksEncrypted(value: unknown, magic?: string): value is string {
  if (typeof value !== 'string') {
    return false
  }

  try {
    const raw = base64ToBytes(value)
    const magicBytes = new TextEncoder().encode(resolveMagic(magic))

    return new TextDecoder().decode(raw.subarray(0, magicBytes.length)) === resolveMagic(magic)
  }
  catch {
    return false
  }
}
