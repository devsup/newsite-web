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
      // 日志按天分表：只选单日，后端直接定位该日的日表，不再跨表 UNION 查询。
      // valueFormat 固定 YYYY-MM-DD，避免把 Date 对象交给 axios 后序列化成带时区的 ISO 串。
      label: () => t('baseOperationLog.created_at'),
      prop: 'created_at',
      render: 'DatePicker',
      span: 2,
      renderProps: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        placeholder: t('baseOperationLog.created_at'),
        clearable: true,
      },
    },
    {
      label: () => t('baseOperationLog.username'),
      prop: 'username',
      render: 'input',
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
