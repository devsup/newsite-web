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

export default function getSearchItems(t: any): MaSearchItem[] {
  return [
    {
      label: () => t('baseOperationLog.username'),
      prop: 'username',
      render: 'input',
    },
    {
      // 时间范围：后端按 created_at 做 whereBetween，值是 ['开始', '结束'] 两段字符串。
      // 用 datetimerange + valueFormat，避免把 Date 对象直接丢给接口（默认会序列化成 ISO 带时区，
      // 与 MySQL 的 datetime 比较会差几个小时）；defaultTime 让只选日期时自动补 00:00:00 / 23:59:59。
      label: () => t('baseOperationLog.created_at'),
      prop: 'created_at',
      render: 'DatePicker',
      span: 2,
      renderProps: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        startPlaceholder: t('baseOperationLog.startTime'),
        endPlaceholder: t('baseOperationLog.endTime'),
        defaultTime: [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)],
        clearable: true,
      },
    },
    {
      label: () => t('baseOperationLog.router'),
      prop: 'router',
      render: 'input',
    },
    {
      label: () => t('baseOperationLog.service_name'),
      prop: 'service_name',
      render: 'input',
    },
    {
      label: () => t('baseOperationLog.ip'),
      prop: 'ip',
      render: 'input',
    },
  ]
}
