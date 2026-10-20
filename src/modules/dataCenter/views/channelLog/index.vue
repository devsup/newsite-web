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
import type { DataCenterChannelVo } from '~/dataCenter/api/dataCenter'

import MaRemoteSelect from '@/components/ma-remote-select/index.vue'
import { channelOptions, channelPage } from '~/dataCenter/api/dataCenter'

defineOptions({ name: 'dataCenter:channelLog' })

const t = useTrans().globalTrans
const today = useDayjs().format('YYYY-MM-DD')

/** 渠道日统计：按渠道 + 日期展示上报汇总，数值全部来自 channel_daily_stat */
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
  {
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
  },
  {
    label: () => t('dataCenter.channelCode'),
    prop: 'code',
    render: 'input',
  },
]

const tableColumns: any[] = [
  { type: 'index', width: '60px' },
  { label: () => t('dataCenter.channel'), prop: 'channel_name', minWidth: '150px' },
  { label: () => t('dataCenter.channelCode'), prop: 'channel_code', minWidth: '120px' },
  { label: () => t('dataCenter.channelLog.channelPv'), prop: 'channel_pv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.channelUv'), prop: 'channel_uv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.landPv'), prop: 'land_pv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.landUv'), prop: 'land_uv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.naviPv'), prop: 'navi_pv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.naviUv'), prop: 'navi_uv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.installNum'), prop: 'install_num', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.installDeducted'), prop: 'install_deducted', minWidth: '100px' },
  {
    label: () => t('dataCenter.channelLog.installRatio'),
    prop: 'install_ratio',
    minWidth: '120px',
    cellRender: ({ row }: { row: DataCenterChannelVo }) => `${Number(row.install_ratio || 0).toFixed(2)}%`,
  },
  { label: () => t('dataCenter.channelLog.downloadPv'), prop: 'download_pv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.downloadUv'), prop: 'download_uv', minWidth: '100px' },
  {
    label: () => t('dataCenter.channelLog.downloadRatio'),
    prop: 'download_ratio',
    minWidth: '120px',
    cellRender: ({ row }: { row: DataCenterChannelVo }) => `${Number(row.download_ratio || 0).toFixed(2)}%`,
  },
  { label: () => t('dataCenter.statDate'), prop: 'stat_date', width: '130px' },
]

const options = ref<MaProTableOptions>({
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t('dataCenter.channelLog.title'),
    subTitle: () => t('dataCenter.channelLog.subtitle'),
  },
  tableOptions: {
    stripe: true,
    border: true,
  },
  searchOptions: {
    fold: false,
    foldButtonShow: false,
    defaultValue: {
      date_range: [today, today],
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
        : [today, today]
      query.start_date = range[0]
      query.end_date = range[1]
      delete query.date_range
      return channelPage(query)
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
