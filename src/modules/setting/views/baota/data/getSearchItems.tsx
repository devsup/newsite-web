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
import type { Ref } from 'vue'
import type { BaoTaConfigOption } from '~/setting/api/baota.ts'

import MaDictSelect from '@/components/ma-dict-picker/ma-dict-select.vue'

/**
 * 主页面搜索项：API 配置 + 站点关键字。
 *
 * config_id 名义上是搜索项，实际是页面的「数据源开关」：后端必须知道调哪个面板，
 * 所以不可清空（clearable 固定 false），切换后由 onChange 通知页面立刻重新拉列表。
 * search 关键字由面板侧过滤（面板接口自带 search 参数），不是在本地筛。
 */
export default function getSearchItems(
  t: any,
  options: Ref<BaoTaConfigOption[]>,
  onConfigChange: (value?: number) => void,
): MaSearchItem[] {
  return [
    {
      label: () => t('baota.apiConfig'),
      prop: 'config_id',
      render: () => MaDictSelect,
      renderProps: {
        clearable: false,
        filterable: true,
        placeholder: t('baota.selectApiConfig'),
        // 用「函数式数据」而不是求值后的数组：配置列表是异步加载的，
        // 函数式能保证下拉每次渲染都读到最新的配置项
        data: () => options.value.map((item: BaoTaConfigOption) => ({ label: item.label, value: item.value })),
        onChange: (value?: number) => onConfigChange(value),
      },
    },
    {
      label: () => t('crud.search'),
      prop: 'search',
      render: 'input',
      renderProps: {
        placeholder: t('baota.searchPlaceholder'),
        clearable: true,
      },
    },
  ]
}
