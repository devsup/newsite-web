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

/** 搜索项：ip / 封禁原因 / 备注模糊匹配，状态用 system-status 字典（1 启用 / 2 禁用） */
export default function getSearchItems(t: any): MaSearchItem[] {
  return [
    {
      label: () => t('ipBlacklist.ip'),
      prop: 'ip',
      render: 'input',
    },
    {
      label: () => t('ipBlacklist.banReason'),
      prop: 'ban_reason',
      render: 'input',
    },
    {
      label: () => t('crud.remark'),
      prop: 'remark',
      render: 'input',
    },
    {
      label: () => t('crud.status'),
      prop: 'status',
      render: () => MaDictSelect,
      renderProps: {
        clearable: true,
        placeholder: '',
        dictName: 'system-status',
      },
    },
  ]
}
