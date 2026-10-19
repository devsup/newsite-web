/**
 * 复制文本到剪贴板.
 *
 * 优先使用 Clipboard API（HTTPS / localhost 可用）；
 * 内网 http 属于非安全上下文，navigator.clipboard 不可用时退化到临时 textarea + execCommand。
 * 返回是否复制成功，由调用方决定提示文案。
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) {
    return false
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)

      return true
    }
    catch {
      // 继续走下面的兜底
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  }
  finally {
    document.body.removeChild(textarea)
  }
}
