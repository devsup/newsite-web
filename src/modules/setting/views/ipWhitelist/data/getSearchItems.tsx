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
import { DICT_SYSTEM_STATUS } from '@/constants/dict.ts'

/** 搜索项：ip / 备注模糊匹配，状态用 system-status 字典（1 启用 / 2 禁用） */
export default function getSearchItems(t: any): MaSearchItem[] {
  return [
    {
      label: () => t('ipWhitelist.ip'),
      prop: 'ip',
      render: 'input',
    },
    {
      label: () => t('ipWhitelist.remark'),
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
        dictName: DICT_SYSTEM_STATUS,
      },
    },
  ]
}
