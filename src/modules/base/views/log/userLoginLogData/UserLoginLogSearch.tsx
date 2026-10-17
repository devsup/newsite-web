/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */

import type { MaSearchItem } from '@mineadmin/search'
import MaDictSelect from '@/components/ma-dict-picker/ma-dict-select.vue'

export default function getSearchItems(t: any): MaSearchItem[] {
  return [
    {
      label: () => t('baseLoginLog.username'),
      prop: 'username',
      render: 'input',
    },
    {
      // 登录时间范围：后端按 login_time 做 whereBetween，值是 ['开始', '结束'] 两段字符串。
      // datetimerange + valueFormat 避免把 Date 对象直接丢给接口（默认 ISO 带时区，与 datetime 比较会偏）；
      // defaultTime 让只选日期时自动补 00:00:00 / 23:59:59。
      label: () => t('baseLoginLog.login_time'),
      prop: 'login_time',
      render: 'DatePicker',
      span: 2,
      renderProps: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        startPlaceholder: t('baseLoginLog.startTime'),
        endPlaceholder: t('baseLoginLog.endTime'),
        defaultTime: [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)],
        clearable: true,
      },
    },
    {
      label: () => t('baseLoginLog.ip'),
      prop: 'ip',
      render: 'input',
    },
    {
      label: () => t('baseLoginLog.status'),
      prop: 'status',
      render: () => MaDictSelect,
      renderProps: {
        clearable: true,
        placeholder: '',
        dictName: 'system-state',
      },
    },
  ]
}
