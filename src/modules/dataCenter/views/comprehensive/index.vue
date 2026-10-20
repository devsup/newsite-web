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
import type { MaProTableOptions, MaProTableSchema } from '@mineadmin/pro-table'
import type { DataCenterDailyVo, DataCenterSummary } from '~/dataCenter/api/dataCenter'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'

import { ElButton } from 'element-plus'
import { overview } from '~/dataCenter/api/dataCenter'
import useDialog from '@/hooks/useDialog.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

import DayDetailDialog from './components/DayDetailDialog.vue'

defineOptions({ name: 'dataCenter:comprehensive' })

const t = useTrans().globalTrans
const today = useDayjs().format('YYYY-MM-DD')
const defaultRange = [useDayjs().subtract(9, 'day').format('YYYY-MM-DD'), today]

const detailDialog: UseDialogExpose = useDialog({ width: '1080px', footer: false })

const summary = ref<DataCenterSummary>({
  channel_pv: 0,
  channel_uv: 0,
  land_pv: 0,
  land_uv: 0,
  navi_pv: 0,
  navi_uv: 0,
  install_num: 0,
  install_deducted: 0,
  download_pv: 0,
  download_uv: 0,
  merchant_pv: 0,
  merchant_uv: 0,
  install_ratio: 0,
  download_ratio: 0,
  merchant_click_ratio: 0,
  channel_count: 0,
  merchant_count: 0,
})

function percent(value?: number): string {
  return `${Number(value || 0).toFixed(2)}%`
}

function openChannelDetail(row: DataCenterDailyVo): void {
  detailDialog.setTitle(`${t('dataCenter.comprehensive.channelDetail')} · ${row.stat_date}`)
  detailDialog.open({ mode: 'channel', date: row.stat_date })
}

function openMerchantDetail(row: DataCenterDailyVo): void {
  detailDialog.setTitle(`${t('dataCenter.comprehensive.merchantDetail')} · ${row.stat_date}`)
  detailDialog.open({ mode: 'merchant', date: row.stat_date })
}

/** 顶部指标分组：一组一张卡片，避免把十几个数字平铺成一大片 */
interface OverviewItem { label: string, value: string | number, unit?: string }

const overviewCards = computed<Array<{ title: string, items: OverviewItem[] }>>(() => [
  {
    title: t('dataCenter.comprehensive.groupChannel'),
    items: [
      { label: t('dataCenter.comprehensive.channelPv'), value: summary.value.channel_pv, unit: 'PV' },
      { label: t('dataCenter.comprehensive.channelUv'), value: summary.value.channel_uv, unit: 'UV' },
      { label: t('dataCenter.comprehensive.merchantClickRatio'), value: percent(summary.value.merchant_click_ratio) },
    ],
  },
  {
    title: t('dataCenter.comprehensive.groupLanding'),
    items: [
      { label: t('dataCenter.comprehensive.landPv'), value: summary.value.land_pv, unit: 'PV' },
      { label: t('dataCenter.comprehensive.landUv'), value: summary.value.land_uv, unit: 'UV' },
    ],
  },
  {
    title: t('dataCenter.comprehensive.groupNavi'),
    items: [
      { label: t('dataCenter.comprehensive.naviPv'), value: summary.value.navi_pv, unit: 'PV' },
      { label: t('dataCenter.comprehensive.naviUv'), value: summary.value.navi_uv, unit: 'UV' },
    ],
  },
  {
    title: t('dataCenter.comprehensive.groupMerchant'),
    items: [
      { label: t('dataCenter.comprehensive.merchantPv'), value: summary.value.merchant_pv, unit: 'PV' },
      { label: t('dataCenter.comprehensive.merchantUv'), value: summary.value.merchant_uv, unit: 'UV' },
    ],
  },
  {
    title: t('dataCenter.comprehensive.groupInstall'),
    items: [
      { label: t('dataCenter.comprehensive.installNum'), value: summary.value.install_num },
      { label: t('dataCenter.comprehensive.installDeducted'), value: summary.value.install_deducted },
      { label: t('dataCenter.comprehensive.installRatio'), value: percent(summary.value.install_ratio) },
    ],
  },
  {
    title: t('dataCenter.comprehensive.groupDownload'),
    items: [
      { label: t('dataCenter.comprehensive.downloadPv'), value: summary.value.download_pv, unit: 'PV' },
      { label: t('dataCenter.comprehensive.downloadUv'), value: summary.value.download_uv, unit: 'UV' },
      { label: t('dataCenter.comprehensive.downloadRatio'), value: percent(summary.value.download_ratio) },
    ],
  },
  {
    title: t('dataCenter.comprehensive.groupCoverage'),
    items: [
      { label: t('dataCenter.comprehensive.channelCount'), value: summary.value.channel_count ?? 0 },
      { label: t('dataCenter.comprehensive.merchantCount'), value: summary.value.merchant_count ?? 0 },
    ],
  },
])

const searchItems: any[] = [
  {
    label: () => t('dataCenter.dateRange'),
    prop: 'date_range',
    render: 'DatePicker',
    span: 2,
    renderProps: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD',
      startPlaceholder: t('dataCenter.startDate'),
      endPlaceholder: t('dataCenter.endDate'),
      clearable: true,
    },
  },
]

const tableColumns: any[] = [
  { label: () => t('dataCenter.statDate'), prop: 'stat_date', width: '130px' },
  { label: () => t('dataCenter.comprehensive.channelPv'), prop: 'channel_pv', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.channelUv'), prop: 'channel_uv', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.landPv'), prop: 'land_pv', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.landUv'), prop: 'land_uv', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.naviPv'), prop: 'navi_pv', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.naviUv'), prop: 'navi_uv', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.merchantPv'), prop: 'merchant_pv', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.merchantUv'), prop: 'merchant_uv', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.installNum'), prop: 'install_num', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.installDeducted'), prop: 'install_deducted', minWidth: '100px' },
  {
    label: () => t('dataCenter.comprehensive.installRatio'),
    prop: 'install_ratio',
    minWidth: '120px',
    cellRender: ({ row }: { row: DataCenterDailyVo }) => percent(Number(row.install_ratio || 0)),
  },
  { label: () => t('dataCenter.comprehensive.downloadPv'), prop: 'download_pv', minWidth: '100px' },
  { label: () => t('dataCenter.comprehensive.downloadUv'), prop: 'download_uv', minWidth: '100px' },
  {
    label: () => t('dataCenter.comprehensive.downloadRatio'),
    prop: 'download_ratio',
    minWidth: '120px',
    cellRender: ({ row }: { row: DataCenterDailyVo }) => percent(Number(row.download_ratio || 0)),
  },
  {
    label: () => t('dataCenter.comprehensive.merchantClickRatio'),
    prop: 'merchant_click_ratio',
    minWidth: '130px',
    cellRender: ({ row }: { row: DataCenterDailyVo }) => percent(Number(row.merchant_click_ratio || 0)),
  },
  {
    label: () => t('crud.operation'),
    width: '190px',
    cellRender: ({ row }: { row: DataCenterDailyVo }) => (
      <div class="flex-center gap-2">
        <ElButton link type="primary" onClick={() => openChannelDetail(row)}>
          {t('dataCenter.comprehensive.channelDetail')}
        </ElButton>
        <ElButton link type="primary" onClick={() => openMerchantDetail(row)}>
          {t('dataCenter.comprehensive.merchantDetail')}
        </ElButton>
      </div>
    ),
  },
]

const options = ref<MaProTableOptions>({
  // 页面顶部有一组指标卡片，表格底边距要相应下移，否则会出现整页滚动
  adaptionOffsetBottom: 340,
  header: {
    mainTitle: () => t('dataCenter.comprehensive.title'),
    subTitle: () => t('dataCenter.comprehensive.subtitle'),
  },
  tableOptions: {
    stripe: true,
    border: true,
  },
  searchOptions: {
    fold: false,
    foldButtonShow: false,
    defaultValue: {
      date_range: defaultRange,
    },
    text: {
      searchBtn: () => t('crud.search'),
      resetBtn: () => t('crud.reset'),
    },
  },
  searchFormOptions: { labelWidth: '100px' },
  requestOptions: {
    api: async (params: any) => {
      const query = { ...params }
      const range = Array.isArray(query.date_range) && query.date_range.length === 2
        ? query.date_range
        : defaultRange
      query.start_date = range[0]
      query.end_date = range[1]
      delete query.date_range

      const response = await overview(query)
      if (response.code === ResultCode.SUCCESS && response.data?.summary) {
        summary.value = response.data.summary
      }

      return response
    },
  },
})

const schema = ref<MaProTableSchema>({
  searchItems,
  tableColumns,
})
</script>

<template>
  <div class="mine-layout pt-3">
    <div class="data-center-overview">
      <el-card
        v-for="card in overviewCards"
        :key="card.title"
        class="data-center-overview__card"
        shadow="never"
      >
        <div class="data-center-overview__title">
          {{ card.title }}
        </div>
        <div class="data-center-overview__metrics">
          <div v-for="item in card.items" :key="item.label" class="data-center-overview__metric">
            <div class="data-center-overview__label">
              {{ item.label }}
            </div>
            <div class="data-center-overview__value">
              {{ item.value }}<span v-if="item.unit" class="data-center-overview__unit">{{ item.unit }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <MaProTable :options="options" :schema="schema" />

    <component :is="detailDialog.Dialog">
      <template #default="{ mode, date }">
        <DayDetailDialog v-if="date" :mode="mode" :date="date" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
.data-center-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin: 0 12px 12px;
}

.data-center-overview__card {
  border-radius: 8px;

  :deep(.el-card__body) {
    padding: 12px 14px;
  }
}

.data-center-overview__title {
  padding-left: 9px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.data-center-overview__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 10px;
}

.data-center-overview__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.data-center-overview__value {
  margin-top: 2px;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.data-center-overview__unit {
  margin-left: 3px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}
</style>
