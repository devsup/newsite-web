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
import type { DataCenterEventVo } from '~/dataCenter/api/dataCenter'

import { ElTag, ElTooltip } from 'element-plus'
import MaRemoteSelect from '@/components/ma-remote-select/index.vue'
import { channelOptions, merchantOptions } from '~/dataCenter/api/dataCenter'

/**
 * 上报事件明细的通用页面.
 *
 * 渠道访问记录 / 商户点击记录 / 下载记录三张表结构完全一致，只是「允许的事件类型」和
 * 要展示的列不同；抽成一个组件，避免三份重复代码。各路由页只传接口函数与文案 key。
 */
const props = withDefaults(defineProps<{
  /** 该页面自己的列表接口（渠道记录 / 商户记录 / 下载记录） */
  endpoint: (params: any) => Promise<any>
  /** 页面标题 / 副标题的 i18n key */
  titleKey: string
  subtitleKey: string
  /** 该页面允许展示的事件类型（1落地页 2导航页 3商户点击 4下载 5安装） */
  eventTypes: number[]
  /** 是否展示商户筛选与商户列 */
  showMerchant?: boolean
  /** 是否展示扣量列（安装事件） */
  showDeducted?: boolean
}>(), {
  showMerchant: false,
  showDeducted: false,
})

const t = useTrans().globalTrans
const today = useDayjs().format('YYYY-MM-DD')
const defaultRange = [useDayjs().subtract(6, 'day').format('YYYY-MM-DD'), today]

/** 事件类型 → 文案 key / 标签颜色 */
const EVENT_TYPE_META: Record<number, { key: string, tag: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  1: { key: 'landing', tag: 'primary' },
  2: { key: 'navigation', tag: 'success' },
  3: { key: 'merchantClick', tag: 'warning' },
  4: { key: 'download', tag: 'info' },
  5: { key: 'install', tag: 'danger' },
}

const CLIENT_TYPE_KEYS: Record<number, string> = {
  1: 'android',
  2: 'ios',
  3: 'windows',
  4: 'mac',
  5: 'other',
}

function eventTypeText(type: number): string {
  const meta = EVENT_TYPE_META[type]
  return meta ? t(`dataCenter.eventTypes.${meta.key}`) : String(type)
}

function clientTypeText(type: number): string {
  const key = CLIENT_TYPE_KEYS[type]
  return key ? t(`dataCenter.clientTypes.${key}`) : '-'
}

/** 事件类型下拉只展示当前页面允许的类型 */
const eventTypeOptions = props.eventTypes.map(type => ({
  value: type,
  label: eventTypeText(type),
}))

const searchItems: any[] = []

if (props.eventTypes.length > 1) {
  searchItems.push({
    label: () => t('dataCenter.eventType'),
    prop: 'event_type',
    render: 'select',
    renderProps: {
      clearable: true,
      options: eventTypeOptions,
    },
  })
}

// 日期放前面：MaSearch 折叠时只展示前几项，记录页最常用的筛选就是时间
searchItems.push({
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
})

searchItems.push({
  label: () => t('dataCenter.channel'),
  prop: 'channel_id',
  render: () => MaRemoteSelect,
  renderProps: {
    clearable: true,
    filterable: true,
    placeholder: t('dataCenter.selectedChannel'),
    api: channelOptions,
    dataHandle: (response: any) => (response.data || []).map((item: any) => ({
      label: `${item.label}（${item.code}）`,
      value: item.value,
    })),
  },
})

if (props.showMerchant) {
  searchItems.push({
    label: () => t('dataCenter.merchant'),
    prop: 'merchant_id',
    render: () => MaRemoteSelect,
    renderProps: {
      clearable: true,
      filterable: true,
      placeholder: t('dataCenter.selectedMerchant'),
      api: merchantOptions,
      dataHandle: (response: any) => response.data || [],
    },
  })
}

searchItems.push({
  label: () => t('dataCenter.ip'),
  prop: 'ip',
  render: 'input',
})

const tableColumns: any[] = [
  { type: 'index', width: '60px' },
  { label: () => t('ID'), prop: 'id', width: '80px' },
  {
    label: () => t('dataCenter.eventType'),
    prop: 'event_type',
    width: '120px',
    cellRender: ({ row }: { row: DataCenterEventVo }) => {
      const meta = EVENT_TYPE_META[row.event_type]
      return <ElTag type={meta?.tag || 'info'}>{eventTypeText(row.event_type)}</ElTag>
    },
  },
  {
    label: () => t('dataCenter.channel'),
    prop: 'channel_name',
    minWidth: '140px',
    showOverflowTooltip: true,
    cellRender: ({ row }: { row: DataCenterEventVo }) => row.channel_name || '-',
  },
  { label: () => t('dataCenter.channelCode'), prop: 'channel_code', minWidth: '120px' },
]

if (props.showMerchant) {
  tableColumns.push({
    label: () => t('dataCenter.merchant'),
    prop: 'merchant_name',
    minWidth: '160px',
    cellRender: ({ row }: { row: DataCenterEventVo }) => row.merchant_name || '-',
  })
}

tableColumns.push(
  { label: () => t('dataCenter.ip'), prop: 'ip', minWidth: '130px' },
  {
    label: () => t('dataCenter.clientType'),
    prop: 'client_type',
    width: '120px',
    cellRender: ({ row }: { row: DataCenterEventVo }) => clientTypeText(row.client_type),
  },
  {
    label: () => t('dataCenter.serverType'),
    prop: 'server_type',
    width: '120px',
    cellRender: ({ row }: { row: DataCenterEventVo }) => clientTypeText(row.server_type),
  },
  { label: () => t('dataCenter.browserId'), prop: 'browser_id', minWidth: '170px', showOverflowTooltip: true },
  {
    // UA 可能很长：单行截断 + 悬浮看全，避免把行高顶成两三倍
    label: () => t('dataCenter.userAgent'),
    prop: 'user_agent',
    minWidth: '260px',
    showOverflowTooltip: false,
    cellRender: ({ row }: { row: DataCenterEventVo }) => {
      const ua = row.user_agent || '-'
      return (
        <ElTooltip content={ua} placement="top" showAfter={300}>
          <span class="block max-w-[280px] truncate">{ua}</span>
        </ElTooltip>
      )
    },
  },
)

if (props.showDeducted) {
  tableColumns.push({
    label: () => t('dataCenter.deducted'),
    prop: 'is_deducted',
    width: '100px',
    cellRender: ({ row }: { row: DataCenterEventVo }) => (
      <ElTag type={row.is_deducted === 1 ? 'danger' : 'info'}>
        {row.is_deducted === 1 ? t('dataCenter.yes') : t('dataCenter.no')}
      </ElTag>
    ),
  })
}

tableColumns.push(
  { label: () => t('dataCenter.requestId'), prop: 'request_id', minWidth: '220px', showOverflowTooltip: true },
  { label: () => t('dataCenter.occurredAt'), prop: 'occurred_at', width: '170px' },
)

const options = ref<MaProTableOptions>({
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t(props.titleKey),
    subTitle: () => t(props.subtitleKey),
  },
  tableOptions: {
    stripe: true,
    border: true,
  },
  searchOptions: {
    // 记录页筛选不多（事件类型 / 日期 / 渠道 / 商户 / IP），全部展开比折叠更好用
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
    // 日期区间是数组，后端只认 start_date / end_date 两个字段
    api: async (params: any) => {
      const query = { ...params }
      const range = Array.isArray(query.date_range) && query.date_range.length === 2
        ? query.date_range
        : defaultRange
      query.start_date = range[0]
      query.end_date = range[1]
      delete query.date_range
      return props.endpoint(query)
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
    <MaProTable :options="options" :schema="schema" />
  </div>
</template>

<style scoped lang="scss">
</style>
