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

/** 搜索项：ID 精确匹配、渠道名称与渠道编码模糊匹配，状态用 system-status 字典（1 启用 / 2 禁用） */
export default function getSearchItems(t: any): MaSearchItem[] {
  return [
    {
      label: () => t('ID'),
      prop: 'id',
      render: 'input',
    },
    {
      label: () => t('channel.name'),
      prop: 'name',
      render: 'input',
    },
    {
      label: () => t('channel.code'),
      prop: 'code',
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
