<!--
 - MineAdmin is committed to providing solutions for quickly building web applications
 - Please view the LICENSE file that was distributed with this source code,
 - For the full copyright and license information.
 - Thank you very much for using MineAdmin.
 -
 - @Author X.Mo<root@imoi.cn>
 - @Link   https://github.com/mineadmin
-->
<script setup lang="tsx">
import type { MaProTableExpose, MaProTableOptions, MaProTableSchema } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { BaoTaConfigOption } from '~/setting/api/baota.ts'

import { configOptions, siteList } from '~/setting/api/baota.ts'
import getSearchItems from './data/getSearchItems.tsx'
import getTableColumns from './data/getTableColumns.tsx'
import { useMessage } from '@/hooks/useMessage.ts'
import useDialog from '@/hooks/useDialog.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

import ConfigManager from './components/ConfigManager.vue'
import DomainManager from './components/DomainManager.vue'
import SslConfig from './components/SslConfig.vue'

defineOptions({ name: 'setting:baota' })

const proTableRef = ref<MaProTableExpose>() as Ref<MaProTableExpose>
const t = useTrans().globalTrans
const msg = useMessage()

// 防止「列表失败 → 刷新配置下拉 → 再次失败」形成请求环
let configSyncing = false

// 启用中的 API 配置（页面顶部下拉）与当前选中项
const configList = ref<BaoTaConfigOption[]>([])
const currentConfigId = ref<number>()

// API 配置管理：内容自带搜索与表格，所以关掉弹窗底部按钮
const configDialog: UseDialogExpose = useDialog({ width: '1150px', footer: false })
const domainDialog: UseDialogExpose = useDialog({ width: '820px', footer: false })
const sslDialog: UseDialogExpose = useDialog({ width: '1080px', footer: false })

const options = ref<MaProTableOptions>({
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t('baota.mainTitle'),
    subTitle: () => t('baota.subTitle'),
  },
  tableOptions: {
    stripe: true,
    border: true,
  },
  searchOptions: {
    fold: false,
    text: {
      searchBtn: () => t('crud.search'),
      resetBtn: () => t('crud.reset'),
    },
  },
  searchFormOptions: { labelWidth: '90px' },
  requestOptions: {
    // 必须先把 API 配置选出来：没有配置时后端不知道该调哪个面板
    autoRequest: false,
    api: async (params: any) => {
      const response = await siteList({ ...params, config_id: params.config_id || currentConfigId.value })

      // MaProTable 会吞掉 api 的异常，列表会静默变空，所以这里主动把失败原因提示出来；
      // 失败常见于「当前配置已被删除或禁用」（例如在别的标签页改过），此时顺带同步一次
      // 配置下拉并回落到可用配置，让页面自愈，而不是停在一个已经不存在的配置上。
      if (response.code !== ResultCode.SUCCESS) {
        msg.error(response.message)
        if (!configSyncing) {
          configSyncing = true
          loadConfigList().finally(() => {
            configSyncing = false
          })
        }
      }

      return response
    },
  },
})

const schema = computed<MaProTableSchema>(() => ({
  searchItems: getSearchItems(t, configList, (value?: number) => {
    // 切换面板时立即按新配置重新拉取列表，并回到第一页
    // （否则可能停在新面板并不存在的页码上，表现为「明明有站点却空表」）
    currentConfigId.value = value
    if (value) {
      proTableRef.value?.setRequestParams({ config_id: value, page: 1 }, true)
    }
  }),
  tableColumns: getTableColumns(t, domainDialog, sslDialog),
}))

/**
 * 拉取启用中的配置并选中第一项。
 *
 * 当前选中的配置若已被禁用 / 删除，会自动回落到列表首项，避免下拉显示空值而列表报错。
 */
async function loadConfigList(): Promise<void> {
  const response = await configOptions()
  if (response.code !== ResultCode.SUCCESS) {
    return
  }

  configList.value = response.data || []
  const exists = configList.value.some((item: BaoTaConfigOption) => item.value === currentConfigId.value)
  if (!exists) {
    currentConfigId.value = configList.value[0]?.value
  }

  proTableRef.value?.setSearchForm({ config_id: currentConfigId.value })
  if (currentConfigId.value) {
    proTableRef.value?.setRequestParams({ config_id: currentConfigId.value, page: 1 }, true)
  }
}

/** 打开 API 配置管理弹窗 */
function openConfigManager(): void {
  configDialog.setTitle(t('baota.configTitle'))
  configDialog.open()
}

/** 配置增删改后：刷新下拉，并按当前选中项重新拉列表 */
async function onConfigChanged(): Promise<void> {
  await loadConfigList()
  proTableRef.value?.refresh()
}

/** 域名 / SSL 变更后刷新网站列表（域名数量与证书信息都会随之变化） */
function onSiteChanged(): void {
  proTableRef.value?.refresh()
}

onMounted(loadConfigList)
</script>

<template>
  <div class="mine-layout pt-3">
    <MaProTable ref="proTableRef" :options="options" :schema="schema">
      <template #actions>
        <el-button
          v-auth="['baota:index']"
          plain
          @click="openConfigManager"
        >
          {{ t('baota.apiConfigManager') }}
        </el-button>
        <el-button type="primary" @click="() => proTableRef?.refresh()">
          {{ t('baota.refreshSites') }}
        </el-button>
      </template>

      <!-- 一个配置都没有时给出明确入口，而不是留一张空表让用户发呆 -->
      <template #empty>
        <el-empty>
          <template v-if="configList.length === 0">
            <p class="text-[var(--el-text-color-secondary)]">
              {{ t('baota.noConfigTip') }}
            </p>
            <el-button v-auth="['baota:save']" type="primary" @click="openConfigManager">
              {{ t('baota.configAdd') }}
            </el-button>
          </template>
        </el-empty>
      </template>
    </MaProTable>

    <component :is="configDialog.Dialog">
      <template #default>
        <ConfigManager @changed="onConfigChanged" />
      </template>
    </component>

    <component :is="domainDialog.Dialog">
      <template #default="{ siteId, webname }">
        <DomainManager
          v-if="siteId"
          :config-id="currentConfigId"
          :site-id="siteId"
          :webname="webname"
          @changed="onSiteChanged"
        />
      </template>
    </component>

    <component :is="sslDialog.Dialog">
      <template #default="{ siteId, webname }">
        <SslConfig
          v-if="siteId"
          :config-id="currentConfigId"
          :site-id="siteId"
          :webname="webname"
          @changed="onSiteChanged"
        />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
</style>
