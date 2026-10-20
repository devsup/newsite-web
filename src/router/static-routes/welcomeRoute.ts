/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { RouteRecordRaw } from 'vue-router'

const welcomeRoute: RouteRecordRaw = {
  name: 'welcome',
  path: '/welcome',
  meta: {
    title: '工作台',
    i18n: 'menu.welcome',
    icon: 'material-symbols:space-dashboard-outline',
  },
  component: () => import('~/base/views/welcome/index.vue'),
}

export default welcomeRoute
