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
import type { DataCenterMerchantVo } from '~/dataCenter/api/dataCenter'

import MaRemoteSelect from '@/components/ma-remote-select/index.vue'
import { merchantOptions, merchantPage } from '~/dataCenter/api/dataCenter'

defineOptions({ name: 'dataCenter:merchantLog' })

const t = useTrans().globalTrans
const today = useDayjs().format('YYYY-MM-DD')

/** 商户日统计：按商户 + 日期展示点击 PV/UV */
const searchItems: any[] = [
  {
    label: () => t('dataCenter.dateRange'),
    prop: 'date_range',
    render: 'DatePicker',
    span: 2,
    renderProps: {
      type: 'daterange',
      name: ['date_range_start', 'date_range_end'],
      valueFormat: 'YYYY-MM-DD',
      startPlaceholder: t('dataCenter.startDate'),
      endPlaceholder: t('dataCenter.endDate'),
      clearable: true,
    },
  },
  {
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
  },
]

const tableColumns: any[] = [
  { type: 'index', width: '60px' },
  { label: () => t('dataCenter.merchantId'), prop: 'merchant_id', width: '90px' },
  { label: () => t('dataCenter.merchant'), prop: 'merchant_name', minWidth: '200px' },
  { label: () => t('dataCenter.merchantLog.clickPv'), prop: 'click_pv', minWidth: '110px' },
  { label: () => t('dataCenter.merchantLog.clickUv'), prop: 'click_uv', minWidth: '110px' },
  {
    label: () => t('dataCenter.merchantLog.clickRate'),
    prop: 'click_rate',
    minWidth: '130px',
    cellRender: ({ row }: { row: DataCenterMerchantVo }) => `${Number(row.click_rate || 0).toFixed(2)}%`,
  },
  { label: () => t('dataCenter.statDate'), prop: 'stat_date', width: '130px' },
]

const options = ref<MaProTableOptions>({
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t('dataCenter.merchantLog.title'),
    subTitle: () => t('dataCenter.merchantLog.subtitle'),
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
      return merchantPage(query)
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
