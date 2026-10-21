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

const app = createApp(App)

/**
 * MaProTable 的已知卸载竞态.
 *
 * 页面请求还没返回时就切走（KeepAlive 缓存 + 快速点菜单），第三方组件内部仍会通过
 * 已经销毁的 ref 调用 setLoadingState / setOptions / getElTableRef 等方法，
 * 抛 "Cannot read properties of undefined (reading 'xxx')" 并冒到 mounted hook。
 * 这是组件自身的时序问题，不影响数据与页面；这里只吞掉这一种错误，其它错误照常输出。
 */
const PRO_TABLE_UNMOUNT_RACE = /Cannot read properties of (?:undefined|null) \(reading '(?:setLoadingState|setOptions|setPagination|setData|setColumns|getElTableRef|getElTableStates)'\)/

function isProTableUnmountRace(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '')
  if (PRO_TABLE_UNMOUNT_RACE.test(message)) {
    return true
  }

  // MaProTable 的 ue() 在请求失败/组件已卸载时 reject 的是普通对象 { response, data, total }
  return !!error && typeof error === 'object'
    && 'response' in error && 'data' in error && 'total' in error
}

app.config.errorHandler = (error, _instance, info) => {
  if (isProTableUnmountRace(error)) {
    return
  }

  console.error(error, info)
}

// onMounted 里的 async 异常不会走 errorHandler，会变成 unhandled rejection，这里一并过滤
window.addEventListener('unhandledrejection', (event) => {
  if (isProTableUnmountRace(event.reason)) {
    event.preventDefault()
  }
})

// OBS 图片是密文：等解密 Worker 接管当前页面后再挂载，否则首屏图片请求会拿到密文显示「加载失败」
registerObsImageWorker().finally(() => {
  MineBootstrap(app).then(() => {
    app.mount('#app')
  }).catch((err) => {
    console.error('SiteAdmin-UI start fail', err)
  })
})
