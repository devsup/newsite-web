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
import { DICT_SYSTEM_STATE } from '@/constants/dict.ts'

export default function getSearchItems(t: any): MaSearchItem[] {
  return [
    {
      // 日志按天分表：只选单日，后端直接定位该日的日表，不再跨表 UNION 查询。
      label: () => t('baseLoginLog.login_time'),
      prop: 'login_time',
      render: 'DatePicker',
      span: 2,
      renderProps: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        placeholder: t('baseLoginLog.login_time'),
        clearable: true,
      },
    },
    {
      label: () => t('baseLoginLog.username'),
      prop: 'username',
      render: 'input',
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
        dictName: DICT_SYSTEM_STATE,
      },
    },
  ]
}
