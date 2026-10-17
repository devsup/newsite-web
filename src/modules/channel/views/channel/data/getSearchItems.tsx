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

/**
 * 搜索项：ID 精确匹配、渠道名称用可搜索下拉（选项来自渠道列表）、渠道编码模糊匹配，
 * 状态用 system-status 字典（1 启用 / 2 禁用）。
 *
 * 名称下拉的值是完整渠道名（后端按 name like 匹配），这样不用改搜索接口、
 * 同名渠道也能一次筛出来。
 */
export default function getSearchItems(t: any, channels: Array<{ id: number, name: string }> = []): MaSearchItem[] {
  return [
    {
      label: () => t('ID'),
      prop: 'id',
      render: 'input',
    },
    {
      label: () => t('channel.name'),
      prop: 'name',
      render: 'select',
      renderProps: {
        clearable: true,
        filterable: true,
        placeholder: t('form.pleaseSelect', { msg: t('channel.name') }),
        options: channels.map(item => ({ label: item.name, value: item.name })),
      },
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
        dictName: DICT_SYSTEM_STATUS,
      },
    },
  ]
}
