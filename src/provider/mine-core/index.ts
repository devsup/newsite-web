/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { ProviderService } from '#/global'
import type { MaFormItem, MaFormOptions } from '@mineadmin/form'
import type { MaSearchItem, MaSearchOptions } from '@mineadmin/search'
import type { MaTableColumns, MaTableOptions, PaginationProps } from '@mineadmin/table'
import type { App } from 'vue'
import MaSvgIcon from '@/components/ma-svg-icon/index.vue'
import ContextMenu from '@imengyu/vue3-context-menu'
import MaForm from '@mineadmin/form'
import MaProTable from '@mineadmin/pro-table'
import MaSearch from '@mineadmin/search'

import MaTable from '@mineadmin/table'

// maTable样式
import '@mineadmin/table/dist/style.css'
// maSearch样式
import '@mineadmin/search/dist/style.css'
// MaProTable样式
import '@mineadmin/pro-table/dist/style.css'

interface MineCoreCommonConfig {
  table?: {
    commonOptions: MaTableOptions
    commonColumns: MaTableColumns[]
    commonPagination: PaginationProps | null
  }
  form?: {
    commonOptions: MaFormOptions
    commonItems: MaFormItem[]
  }
  search?: {
    commonOptions: MaSearchOptions
    commonItems: MaSearchItem[]
  }
}

function commonConfig(): MineCoreCommonConfig {
  return {
    table: {
      commonOptions: {},
      commonColumns: [],
      commonPagination: null,
    },
    form: {
      commonOptions: {},
      commonItems: [],
    },
    search: {
      commonOptions: {},
      commonItems: [],
    },
  }
}

const provider: ProviderService.Provider = {
  name: 'mine-core',
  setProvider(app: App) {
    app.use(MaTable)
    app.use(MaForm)
    app.use(MaSearch)
    app.use(MaProTable, {
      ssr: false,
      provider: {
        app,
        icon: markRaw(MaSvgIcon),
        contextMenu: ContextMenu.showContextMenu,
      },
      // 全局默认每页条数：pro-table 内置默认是 10，这里统一改成 30，
      // 页面自己的 options.requestOptions.requestPage.size 仍然优先（浅合并时整体覆盖）
      // 注：类型上 requestOptions.api 是必填，但此处只放默认分页，api 由各页面提供，故断言
      options: {
        requestOptions: {
          requestPage: { size: 30 },
        },
      } as any,
    })
    app.config.globalProperties.$mineCore = commonConfig()
  },
  getProvider(): any {
    return useGlobal().$mineCore
  },
}

export default provider as ProviderService.Provider
