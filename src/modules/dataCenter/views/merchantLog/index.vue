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

// 列与顺序按参考站点：统计日期 / 商户ID / 商户名称 / 显示名称 / 商户PV / 商户UV / 来源渠道
const tableColumns: any[] = [
  { label: () => t('dataCenter.statDate'), prop: 'stat_date', width: '130px' },
  { label: () => t('dataCenter.merchantId'), prop: 'merchant_id', width: '90px' },
  { label: () => t('dataCenter.columns.merchantName'), prop: 'merchant_name', minWidth: '180px' },
  // 后端按参考站点格式拼接：#ID 商户名 · 应用名（show_info.app_name）
  { label: () => t('dataCenter.merchantLog.displayName'), prop: 'display_name', minWidth: '220px' },
  { label: () => t('dataCenter.merchantLog.clickPv'), prop: 'click_pv', minWidth: '110px' },
  { label: () => t('dataCenter.merchantLog.clickUv'), prop: 'click_uv', minWidth: '110px' },
  { label: () => t('dataCenter.merchantLog.channelNames'), prop: 'channel_names', minWidth: '180px' },
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
    // 筛选项较多：默认收起，保留「展开 / 收起」按钮
    fold: true,
    foldButtonShow: true,
    defaultValue: {
      date_range: [today, today],
    },
    text: {
      searchBtn: () => t('crud.search'),
      resetBtn: () => t('crud.reset'),
      // 展开状态显示「收起」、收起状态显示「展开」（组件默认是「折叠 / 展开」）
      isFoldBtn: () => t('crud.searchFold'),
      notFoldBtn: () => t('crud.searchUnFold'),
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
