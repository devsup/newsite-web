/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import App from './App.vue'
import MineBootstrap from './bootstrap'
import { registerObsImageWorker } from './utils/obsImageWorker'

// OBS 图片是密文，先注册解密 Worker，再挂载页面（Worker 没配好时会自动跳过）
registerObsImageWorker()

const app = createApp(App)

MineBootstrap(app).then(() => {
  app.mount('#app')
}).catch((err) => {
  console.error('MineAdmin-UI start fail', err)
})
