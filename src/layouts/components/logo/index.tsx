/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import '@/layouts/style/logo.scss'
import type { SystemSettings } from '#/global'
import LogoSvg from '@/assets/images/logo.svg'
import { useSiteStore } from '@/store/modules/useSiteStore.ts'

export default defineComponent({
  name: 'Logo',
  props: {
    showLogo: { type: Boolean, default: true },
    showTitle: { type: Boolean, default: true },
    title: { type: String, default: null },
  },
  setup(props) {
    // 站点名称 / 图标来自系统设置（免鉴权接口），store 内部做了「只请求一次」的去重；
    // 接口不可用时保持内置品牌名与内置 SVG，不影响首屏渲染
    const site = useSiteStore()
    site.load()
    const settings: SystemSettings.welcomePage = useSettingStore().getSettings('welcomePage')
    return () => {
      const title = props.title ?? site.name
      return (
        <router-link to={settings.path} class={['mine-main-logo', 'cursor-pointer']} title={title}>
          {props.showLogo && (
            <img src={site.icon || LogoSvg} alt={title} class="mine-logo-img" />
          )}
          {props.showTitle && (
            <span class="mine-logo-title">{title}</span>
          )}
        </router-link>
      )
    }
  },
})
