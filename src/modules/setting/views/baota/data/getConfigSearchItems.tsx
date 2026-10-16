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

/** API 配置管理弹窗的搜索项：名称、地址各一个输入框（后端各自做模糊匹配） */
export default function getConfigSearchItems(t: any): MaSearchItem[] {
  return [
    {
      label: () => t('baota.configName'),
      prop: 'name',
      render: 'input',
      renderProps: {
        placeholder: t('baota.configSearchPlaceholder'),
        clearable: true,
      },
    },
    {
      label: () => t('baota.apiUrl'),
      prop: 'api_url',
      render: 'input',
      renderProps: {
        clearable: true,
      },
    },
  ]
}
