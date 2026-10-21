<script setup lang="tsx">
import type { MaTableExpose } from '@mineadmin/table'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { DataCenterChannelVo, DataCenterMerchantVo } from '~/dataCenter/api/dataCenter'

import { ElButton } from 'element-plus'
import MaSvgIcon from '@/components/ma-svg-icon/index.vue'
import MaRemoteSelect from '@/components/ma-remote-select/index.vue'
import useDialog from '@/hooks/useDialog.ts'
import useTable from '@/hooks/useTable.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'
import {
  channelOfDay,
  channelOptions,
  comprehensiveChannelMerchants,
  formatChannelOptionLabel,
  merchantOfDay,
  merchantOptions,
} from '~/dataCenter/api/dataCenter'
import { ResultCode } from '@/utils/ResultCode.ts'

import ChannelMerchantDialog from '~/dataCenter/views/channelLog/components/ChannelMerchantDialog.vue'
import MerchantChannelDialog from './MerchantChannelDialog.vue'

/**
 * 综合统计某一天的渠道 / 商户明细弹窗（与参考站点对齐）.
 *
 * 渠道模式「来源渠道明细」：支持按渠道名称 / 编码 / 日期筛选，行内可继续「跳转商户」；
 * 商户模式「跳转商户明细」：支持按商户名称 / 日期筛选，行内可继续「查看渠道」。
 * 表格用 ma-table（弹窗里禁用 MaProTable，它会按视口算高度导致溢出）。
 */
const props = defineProps<{
  mode: 'channel' | 'merchant'
  date: string
}>()

const t = useTrans().globalTrans
const msg = useMessage()
const loading = ref(false)
const rows = ref<Array<DataCenterChannelVo | DataCenterMerchantVo>>([])
const detailTable = ref<MaTableExpose>()
let tableInstance: MaTableExpose | undefined

const filters = ref<{ date: string, channelId?: number, merchantId?: number, code: string }>({
  date: props.date,
  channelId: undefined,
  merchantId: undefined,
  code: '',
})

// 渠道 / 商户筛选都是可搜索下拉（选项 value 是 ID，与后端 channel_id / merchant_id 对齐）
const channelApi: any = channelOptions
const merchantApi: any = merchantOptions

// 二层弹窗：渠道 → 商户；商户 → 渠道
const merchantDialog: UseDialogExpose = useDialog({ width: '660px', footer: false, class: 'dc-nested-dialog' })
const channelDialog: UseDialogExpose = useDialog({ width: '660px', footer: false, class: 'dc-nested-dialog' })
const nested = ref<{ channelId: number, channelName: string, merchantId: number, merchantName: string, statDate: string }>({
  channelId: 0,
  channelName: '',
  merchantId: 0,
  merchantName: '',
  statDate: props.date,
})

const description = computed(() => props.mode === 'channel'
  ? t('dataCenter.comprehensive.channelDialogDesc')
  : t('dataCenter.comprehensive.merchantDialogDesc'))

function openMerchants(row: DataCenterChannelVo): void {
  nested.value = {
    ...nested.value,
    channelId: Number(row.channel_id),
    channelName: String(row.channel_name || ''),
    statDate: filters.value.date,
  }
  merchantDialog.setTitle(t('dataCenter.channelLog.merchantDialogTitle', {
    channel: row.channel_name,
    date: filters.value.date,
  }))
  merchantDialog.open()
}

function openChannels(row: DataCenterMerchantVo): void {
  nested.value = {
    ...nested.value,
    merchantId: Number(row.merchant_id),
    merchantName: String(row.merchant_name || ''),
    statDate: filters.value.date,
  }
  channelDialog.setTitle(t('dataCenter.comprehensive.merchantChannelTitle', {
    merchant: row.merchant_name,
    date: filters.value.date,
  }))
  channelDialog.open()
}

function applyColumns(): void {
  const table = detailTable.value ?? tableInstance
  if (!table) {
    return
  }

  if (props.mode === 'channel') {
    table.setColumns([
      { label: () => t('ID'), prop: 'channel_id', width: '80px' },
      { label: () => t('dataCenter.columns.channelName'), prop: 'channel_name', minWidth: '150px', showOverflowTooltip: true },
      { label: () => t('dataCenter.channelCode'), prop: 'channel_code', minWidth: '110px' },
      { label: () => t('dataCenter.channelLog.channelUv'), prop: 'channel_uv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.merchantPv'), prop: 'merchant_pv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.merchantUv'), prop: 'merchant_uv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.landPv'), prop: 'land_pv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.landUv'), prop: 'land_uv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.naviPv'), prop: 'navi_pv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.naviUv'), prop: 'navi_uv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.downloadPv'), prop: 'download_pv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.downloadUv'), prop: 'download_uv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.installNum'), prop: 'install_num', minWidth: '110px' },
      { label: () => t('dataCenter.channelLog.installDeducted'), prop: 'install_deducted', minWidth: '110px' },
      { label: () => t('dataCenter.channelLog.clickRatio'), prop: 'click_ratio', minWidth: '150px' },
      { label: () => t('dataCenter.channelLog.installRatio'), prop: 'install_ratio', minWidth: '150px' },
      {
        label: () => t('crud.operation'),
        width: '140px',
        cellRender: ({ row }: any) => (
          <ElButton
            size="small"
            class="dc-row-action dc-row-action--merchant"
            onClick={() => openMerchants(row)}
          >
            <MaSvgIcon name="material-symbols:storefront-outline" size={15} class="mr-1" />
            {t('dataCenter.channelLog.jumpMerchant')}
          </ElButton>
        ),
      },
    ])
    return
  }

  table.setColumns([
    { label: () => t('dataCenter.statDate'), prop: 'stat_date', width: '120px' },
    { label: () => t('dataCenter.merchantId'), prop: 'merchant_id', width: '90px' },
    { label: () => t('dataCenter.columns.merchantName'), prop: 'merchant_name', minWidth: '150px', showOverflowTooltip: true },
    { label: () => t('dataCenter.merchantLog.displayName'), prop: 'display_name', minWidth: '200px', showOverflowTooltip: true },
    { label: () => t('dataCenter.merchantLog.clickPv'), prop: 'click_pv', minWidth: '90px' },
    { label: () => t('dataCenter.merchantLog.clickUv'), prop: 'click_uv', minWidth: '90px' },
    {
      // 参考站点：来源渠道列直接是可点击的「查看渠道」入口
      label: () => t('dataCenter.merchantLog.channelNames'),
      prop: 'channel_names',
      minWidth: '140px',
      cellRender: ({ row }: any) => (
        <ElButton
          size="small"
          class="dc-row-action dc-row-action--channel"
          onClick={() => openChannels(row)}
        >
          <MaSvgIcon name="material-symbols:analytics-outline" size={15} class="mr-1" />
          {t('dataCenter.comprehensive.viewChannels')}
        </ElButton>
      ),
    },
  ])
}

async function refresh(): Promise<void> {
  loading.value = true
  try {
    const response = props.mode === 'channel'
      ? await channelOfDay(filters.value.date, { channel_id: filters.value.channelId, code: filters.value.code })
      : await merchantOfDay(filters.value.date, { merchant_id: filters.value.merchantId })

    if (response.code === ResultCode.SUCCESS) {
      rows.value = response.data || []
      ;(detailTable.value ?? tableInstance)?.setData([...rows.value])
    }
    else {
      msg.error(response.message)
    }
  }
  finally {
    loading.value = false
  }
}

function reset(): void {
  filters.value = { date: props.date, channelId: undefined, merchantId: undefined, code: '' }
  refresh()
}

useTable('detailTable').then((table: MaTableExpose) => {
  tableInstance = table
  // border=true 才能拖动表头调整列宽
  table.setOptions({ stripe: true, border: true, adaption: false })
  applyColumns()
  table.setData([...rows.value])
})

onMounted(() => {
  filters.value.date = props.date
  refresh()
})

watch(() => [props.mode, props.date], () => {
  filters.value = { date: props.date, channelId: undefined, merchantId: undefined, code: '' }
  applyColumns()
  refresh()
})
</script>

<template>
  <div class="day-detail">
    <div class="day-detail__desc">
      {{ description }}
    </div>

    <div class="day-detail__filters">
      <!-- 时间筛选统一放第一位 -->
      <el-date-picker
        v-model="filters.date"
        type="date"
        value-format="YYYY-MM-DD"
        :clearable="false"
        class="day-detail__date"
      />
      <!-- 渠道 / 商户下拉走 dataCenter:options 接口：没有该按钮权限时不渲染，避免请求 403 -->
      <MaRemoteSelect
        v-if="mode === 'channel' && hasAuth('dataCenter:options')"
        v-model="filters.channelId"
        :api="channelApi"
        :data-handle="(response: any) => (response.data || []).map((item: any) => ({
          label: formatChannelOptionLabel(item),
          value: item.value,
        }))"
        clearable
        filterable
        class="day-detail__select"
        :placeholder="t('dataCenter.comprehensive.channelNamePlaceholder')"
      />
      <MaRemoteSelect
        v-else-if="mode === 'merchant' && hasAuth('dataCenter:options')"
        v-model="filters.merchantId"
        :api="merchantApi"
        :data-handle="(response: any) => response.data || []"
        clearable
        filterable
        class="day-detail__select"
        :placeholder="t('dataCenter.comprehensive.merchantNamePlaceholder')"
      />
      <el-input
        v-if="mode === 'channel'"
        v-model="filters.code"
        clearable
        class="day-detail__input day-detail__input--code"
        :placeholder="t('dataCenter.channelCode')"
        @keyup.enter="refresh"
      />
      <ElButton type="primary" @click="refresh">
        {{ t('crud.search') }}
      </ElButton>
      <ElButton @click="reset">
        {{ t('crud.reset') }}
      </ElButton>
    </div>

    <ma-table ref="detailTable" v-loading="loading" max-height="420" />

    <component :is="merchantDialog.Dialog">
      <ChannelMerchantDialog
        v-if="nested.channelId"
        :channel-id="nested.channelId"
        :channel-name="nested.channelName"
        :stat-date="nested.statDate"
        :api="comprehensiveChannelMerchants"
      />
    </component>

    <component :is="channelDialog.Dialog">
      <MerchantChannelDialog
        v-if="nested.merchantId"
        :merchant-id="nested.merchantId"
        :merchant-name="nested.merchantName"
        :stat-date="nested.statDate"
      />
    </component>
  </div>
</template>

<style scoped lang="scss">
/* 操作列：浅色底 + 彩色文字的小按钮（与综合统计里两个明细入口一致） */
:global(.dc-row-action.el-button) {
  gap: 2px;
  padding: 4px 10px;
  font-size: 12px;
  white-space: nowrap;
  border: 0;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

:global(.dc-row-action--channel.el-button) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

:global(.dc-row-action--channel.el-button:hover) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
}

:global(.dc-row-action--merchant.el-button) {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

:global(.dc-row-action--merchant.el-button:hover) {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-8);
}
/* 操作列：只显示商户图标，文案放悬浮提示里 */
:global(.day-detail__action.el-button.is-link) {
  padding: 2px 6px;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

:global(.day-detail__action.el-button.is-link:hover) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 二层弹窗与参考站点一致：右上只保留关闭，不显示全屏按钮 */
:global(.dc-nested-dialog .el-dialog__header .el-link.el-dialog__headerbtn) {
  display: none;
}

.day-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.day-detail__desc {
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.day-detail__filters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.day-detail__select {
  width: 300px;
}

.day-detail__input {
  width: 200px;
}

.day-detail__input--code {
  width: 140px;
}

.day-detail__date {
  width: 160px;
}
</style>
