/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { Dictionary } from '#/global'

// eval（任意 PHP 代码执行）与 command（执行控制台命令）两类任务已永久停用，
// 这里不再提供选项；后端 FormRequest 与执行层同样会拒绝，绕过页面直接调接口也无效。
export default [
  { label: 'URL任务', value: 'url', i18n: 'dictionary.crontab.url', color: 'success' },
  { label: '类任务', value: 'class', i18n: 'dictionary.crontab.class', color: 'primary' },
  { label: '回调任务', value: 'callback', i18n: 'dictionary.crontab.callback', color: 'info' },
] as Dictionary[]
