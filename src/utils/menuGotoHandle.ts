/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { Router } from 'vue-router'
import type { MineRoute } from '#/global'
import { ElMessage } from 'element-plus'

/**
 * 外链只允许 http / https.
 *
 * 菜单的 meta.link 由后台配置（permission:menu:save），如果不校验协议，
 * 配成 javascript: / data: 时 window.open 可能执行脚本，属于存储型 XSS 面。
 */
function isSafeHttpLink(link?: string): boolean {
  if (!link) {
    return false
  }

  try {
    const url = new URL(link, window.location.origin)
    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  catch {
    return false
  }
}

export default async function menuGotoHandle(router: Router, route: MineRoute.routeRecord) {
  const setting = useSettingStore().getSettings('mainAside')
  switch (route?.meta?.type) {
    case 'L':
      if (route.meta?.link && isSafeHttpLink(route.meta.link)) {
        window.open(route.meta.link, '_blank', 'noopener,noreferrer')
      }
      else {
        // 非法协议直接拦下，不执行 window.open
        ElMessage.warning(useTrans().globalTrans('menu.invalidLink'))
      }
      break
    case 'I':
      await router.push({ path: route.path })
      break
    default :
      if (route?.redirect ?? undefined) {
        await router.push({ path: route.redirect })
      }
      else if (route.path && (route.component || route.components)) {
        await router.push({ path: route.path })
      }
      else if (setting.enableOpenFirstRoute && route?.children?.length) {
        if (route?.children[0]) {
          await menuGotoHandle(router, route?.children[0])
          break
        }
      }
      break
  }
}
