import type { ResponseStruct } from '#/global'
import { ResultCode } from '@/utils/ResultCode.ts'

/** 免鉴权接口 GET /admin/passport/site-info 的返回结构 */
export interface SiteInfo {
  /** 系统设置 → 站点名称 */
  site_name: string
  /** 系统设置 → 站点图标（附件 URL，可能是加密附件的 /attachment/xxx） */
  site_icon: string
  /** 系统设置 → 站点背景（登录页左侧大图） */
  site_image: string
}

/** 站点名称 / 图标都为空时的兜底：前端构建时注入的品牌名 */
const DEFAULT_TITLE = (import.meta.env.VITE_APP_TITLE as string) || 'SiteAdmin'

/**
 * 站点基础信息（左上角 logo 与名称、登录页标题）.
 *
 * 数据来自系统设置 site_name / site_icon，走免鉴权接口，登录页也能拿到。
 * 只在第一次渲染 logo 时请求一次，后续复用；设置页保存后会 load(true) 强制刷新。
 */
/**
 * 用 canvas 把图标裁成圆角，返回 PNG dataURL.
 *
 * favicon 是浏览器自己渲染的，CSS 加不了圆角，只能先在 canvas 里裁好再喂给 <link rel="icon">。
 * 站点图标与应用可能不同源（本地前端 2888 → 后端 9501），必须带 crossOrigin 才能读 canvas，
 * 否则 toDataURL() 会因画布被污染直接抛安全错误。
 *
 * @param url 图标地址
 * @param size 输出尺寸（favicon 64px 足够，太大只增加内存）
 */
function roundedIconDataUrl(url: string, size = 64): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('canvas 2d context unavailable'))
          return
        }
        // 圆角半径 = 1/4 边长，与登录页图标（44px + 11px）保持同一比例
        ctx.beginPath()
        ctx.roundRect(0, 0, size, size, size / 4)
        ctx.clip()
        ctx.drawImage(image, 0, 0, size, size)
        resolve(canvas.toDataURL('image/png'))
      }
      catch (error) {
        reject(error)
      }
    }
    image.onerror = () => reject(new Error('site icon load failed'))
    image.src = url
  })
}

/**
 * 把浏览器标签页图标换成系统设置里的「站点图标」（圆角版）.
 *
 * 直接操作 <link rel="icon">：index.html 里写死的是内置 favicon.ico（带 type="image/x-icon"），
 * 换成 jpg/png 时必须把旧的 link 整个替换掉——只改 href 会保留错误 type，浏览器按 ico 解析失败、图标不生效。
 *
 * @param url 站点图标地址；为空时回到内置 /favicon.ico
 */
async function applyFavicon(url: string): Promise<void> {
  let href = '/favicon.ico'
  if (url) {
    href = url
    try {
      href = await roundedIconDataUrl(url)
    }
    catch {
      // 跨域被拦或图片本身加载失败：退回原始图标，至少能换掉默认的 favicon（只是不带圆角）
    }
  }

  for (const link of Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'))) {
    link.parentNode?.removeChild(link)
  }
  const link = document.createElement('link')
  link.rel = 'icon'
  link.href = href
  document.head.appendChild(link)
}

export const useSiteStore = defineStore('site', () => {
  const name = ref<string>(DEFAULT_TITLE)
  const icon = ref<string>('')
  /** 登录页左侧背景图：空字符串时用内置渐变背景 */
  const image = ref<string>('')
  const loaded = ref(false)

  /** 防并发：多个 logo（侧边栏 + 移动端顶栏）同时挂载时只打一次接口 */
  let pending: Promise<void> | null = null

  /**
   * 加载站点信息.
   *
   * @param force 强制重新请求（设置页保存后调用）
   */
  async function load(force = false): Promise<void> {
    if (pending && !force) {
      return pending
    }
    if (loaded.value && !force) {
      return
    }

    pending = (async () => {
      try {
        const response: ResponseStruct<SiteInfo> = await useHttp().get('/admin/passport/site-info')
        if (response.code === ResultCode.SUCCESS && response.data) {
          // 允许在设置里清空：清空后回退到默认品牌名 / 内置 SVG
          name.value = response.data.site_name || DEFAULT_TITLE
          icon.value = response.data.site_icon || ''
          image.value = response.data.site_image || ''
          // 浏览器标签页图标也跟站点图标走（清空后回到内置 /favicon.ico）；
          // 裁圆角是异步的，不阻塞 store 加载
          void applyFavicon(icon.value)
          // 缓存站点名：index.html 的启动加载页在 Vue 挂载前就要显示它（那时调不了接口）
          try {
            localStorage.setItem('mine_site_name', name.value)
          }
          catch {
            // 隐私模式下 localStorage 可能不可写，加载页退回默认品牌名即可
          }
        }
      }
      catch {
        // 接口失败（未启动 / 网络异常）保持内置品牌，不影响页面渲染
      }
      finally {
        loaded.value = true
        pending = null
      }
    })()

    return pending
  }

  return { name, icon, image, loaded, load }
})
