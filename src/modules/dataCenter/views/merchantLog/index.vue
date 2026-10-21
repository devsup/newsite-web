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
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { DataCenterMerchantVo } from '~/dataCenter/api/dataCenter'

import { ElButton } from 'element-plus'
import MaSvgIcon from '@/components/ma-svg-icon/index.vue'
import MaRemoteSelect from '@/components/ma-remote-select/index.vue'
import useDialog from '@/hooks/useDialog.ts'
import { merchantOptions, merchantPage } from '~/dataCenter/api/dataCenter'
import MerchantChannelDialog from '~/dataCenter/views/comprehensive/components/MerchantChannelDialog.vue'

defineOptions({ name: 'dataCenter:merchantLog' })

const t = useTrans().globalTrans
const today = useDayjs().format('YYYY-MM-DD')

// 「来源渠道」列打开该商户当天的渠道明细弹窗（参考站点同款入口）
const channelDialog: UseDialogExpose = useDialog({ width: '660px', footer: false, class: 'dc-nested-dialog' })
const nestedMerchant = ref({ id: 0, name: '', date: '' })

function openChannels(row: DataCenterMerchantVo): void {
  nestedMerchant.value = {
    id: Number(row.merchant_id),
    name: String(row.merchant_name || ''),
    date: String(row.stat_date || today),
  }
  channelDialog.setTitle(t('dataCenter.comprehensive.merchantChannelTitle', {
    merchant: row.merchant_name,
    date: row.stat_date,
  }))
  channelDialog.open()
}

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
  {
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

    <component :is="channelDialog.Dialog">
      <MerchantChannelDialog
        v-if="nestedMerchant.id"
        :merchant-id="nestedMerchant.id"
        :merchant-name="nestedMerchant.name"
        :stat-date="nestedMerchant.date"
      />
    </component>
  </div>
</template>

<style scoped lang="scss">
/* 行内「查看渠道」：浅色底 + 彩色文字的小按钮 */
:global(.dc-row-action.el-button) {
  gap: 2px;
  padding: 4px 10px;
  font-size: 12px;
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
</style>
