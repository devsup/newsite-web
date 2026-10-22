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
import type { VNode } from 'vue'
import type { MaProTableOptions, MaProTableSchema } from '@mineadmin/pro-table'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { DataCenterChannelSummaryDayVo, DataCenterChannelSummaryVo } from '~/dataCenter/api/dataCenter'

import { ElButton, ElTable, ElTableColumn } from 'element-plus'
import MaSvgIcon from '@/components/ma-svg-icon/index.vue'
import MaRemoteSelect from '@/components/ma-remote-select/index.vue'
import useDialog from '@/hooks/useDialog.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'
import { channelOptions, channelSummary, formatChannelOptionLabel } from '~/dataCenter/api/dataCenter'

import ChannelMerchantDialog from './components/ChannelMerchantDialog.vue'

defineOptions({ name: 'dataCenter:channelLog' })

const t = useTrans().globalTrans
const today = useDayjs().format('YYYY-MM-DD')

/**
 * 渠道访问统计（与参考站点一致）.
 *
 * 主表一个渠道一行，展示区间汇总；展开行是该渠道每天的指标，
 * 每天带「跳转商户」操作，打开该渠道当天的商户点击明细。
 * date_list 由后端一次带回（最多 90 天），展开时不再发请求。
 */

const merchantDialog: UseDialogExpose = useDialog({ width: '860px', footer: false })

function openMerchants(channel: DataCenterChannelSummaryVo, day: DataCenterChannelSummaryDayVo): void {
  merchantDialog.setTitle(t('dataCenter.channelLog.merchantDialogTitle', {
    channel: channel.channel_name,
    date: day.stat_date,
  }))
  merchantDialog.open({
    channelId: channel.channel_id,
    channelName: channel.channel_name,
    statDate: day.stat_date,
  })
}

const searchItems: any[] = [
  {
    label: () => t('dataCenter.dateRange'),
    prop: 'date_range',
    render: 'DatePicker',
    span: 2,
    renderProps: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD',
      // Element Plus 的 range 控件 name 必须是数组（两个内部 input 各一个）
      name: ['date_range_start', 'date_range_end'],
      startPlaceholder: t('dataCenter.startDate'),
      endPlaceholder: t('dataCenter.endDate'),
      clearable: true,
    },
  },
  // 渠道下拉走 dataCenter:options 接口：没有该按钮权限时不渲染，避免下拉请求 403
  ...(hasAuth('dataCenter:options')
    ? [{
        label: () => t('dataCenter.channel'),
        prop: 'channel_id',
        render: () => MaRemoteSelect,
        renderProps: {
          clearable: true,
          filterable: true,
          placeholder: t('dataCenter.selectedChannel'),
          api: channelOptions,
          dataHandle: (response: any) => (response.data || []).map((item: any) => ({
            label: formatChannelOptionLabel(item),
            value: item.value,
          })),
        },
      }]
    : []),
  {
    label: () => t('dataCenter.channelCode'),
    prop: 'code',
    render: 'input',
  },
]

/** 展开行：该渠道每天的明细，列与参考站点保持一致（含「操作」） */
function renderDayTable(channel: DataCenterChannelSummaryVo): VNode {
  return (
    <div class="box-border w-full overflow-x-auto pl-12 pr-4">
      <ElTable data={channel.date_list} size="small" border class="w-full">
        <ElTableColumn prop="stat_date" min-width="120" label={t('dataCenter.statDate')} />
        <ElTableColumn prop="channel_uv" min-width="100" label={t('dataCenter.channelLog.channelUv')} />
        <ElTableColumn prop="merchant_pv" min-width="100" label={t('dataCenter.channelLog.merchantPv')} />
        <ElTableColumn prop="merchant_uv_by_channel" min-width="100" label={t('dataCenter.channelLog.merchantUv')} />
        <ElTableColumn prop="land_pv" min-width="100" label={t('dataCenter.channelLog.landPv')} />
        <ElTableColumn prop="land_uv" min-width="100" label={t('dataCenter.channelLog.landUv')} />
        <ElTableColumn prop="navi_pv" min-width="100" label={t('dataCenter.channelLog.naviPv')} />
        <ElTableColumn prop="navi_uv" min-width="100" label={t('dataCenter.channelLog.naviUv')} />
        <ElTableColumn prop="download_pv" min-width="100" label={t('dataCenter.channelLog.downloadPv')} />
        <ElTableColumn prop="download_uv" min-width="100" label={t('dataCenter.channelLog.downloadUv')} />
        <ElTableColumn prop="install_num" min-width="120" label={t('dataCenter.channelLog.installNum')} />
        <ElTableColumn prop="install_deducted" min-width="120" label={t('dataCenter.channelLog.installDeducted')} />
        <ElTableColumn prop="click_ratio" min-width="135" label={t('dataCenter.channelLog.clickRatio')} />
        <ElTableColumn prop="install_ratio" min-width="135" label={t('dataCenter.channelLog.installRatio')} />
        <ElTableColumn
          label={t('crud.operation')}
          width="140"
          fixed="right"
          v-slots={{
            default: ({ row: day }: { row: DataCenterChannelSummaryDayVo }) => (
              <ElButton
                size="small"
                class="dc-row-action dc-row-action--merchant"
                onClick={() => openMerchants(channel, day)}
              >
                <MaSvgIcon name="material-symbols:storefront-outline" size={15} class="mr-1" />
                {t('dataCenter.channelLog.jumpMerchant')}
              </ElButton>
            ),
          }}
        />
      </ElTable>
    </div>
  )
}

const tableColumns: any[] = [
  {
    type: 'expand',
    width: '48px',
    cellRender: ({ row }: { row: DataCenterChannelSummaryVo }) => renderDayTable(row),
  },
  { label: () => t('ID'), prop: 'id', width: '80px' },
  { label: () => t('dataCenter.columns.channelName'), prop: 'channel_name', width: '200px', showOverflowTooltip: true },
  { label: () => t('dataCenter.channelCode'), prop: 'channel_code', width: '120px' },
  { label: () => t('dataCenter.channelLog.statDays'), prop: 'stat_days', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.channelUv'), prop: 'channel_uv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.merchantPv'), prop: 'merchant_pv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.merchantUv'), prop: 'merchant_uv_by_channel', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.landPv'), prop: 'land_pv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.landUv'), prop: 'land_uv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.naviPv'), prop: 'navi_pv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.naviUv'), prop: 'navi_uv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.installNum'), prop: 'install_num', minWidth: '120px' },
  { label: () => t('dataCenter.channelLog.installDeducted'), prop: 'install_deducted', minWidth: '120px' },
  { label: () => t('dataCenter.channelLog.downloadPv'), prop: 'download_pv', minWidth: '100px' },
  { label: () => t('dataCenter.channelLog.downloadUv'), prop: 'download_uv', minWidth: '100px' },
  {
    label: () => t('dataCenter.channelLog.clickRatio'),
    prop: 'click_ratio',
    minWidth: '135px',
    cellRender: ({ row }: { row: DataCenterChannelSummaryVo }) => row.click_ratio || '0.00%',
  },
  {
    label: () => t('dataCenter.channelLog.installRatio'),
    prop: 'install_ratio',
    minWidth: '135px',
    cellRender: ({ row }: { row: DataCenterChannelSummaryVo }) => row.install_ratio || '0.00%',
  },
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
    rowKey: 'id',
    // 不固定表头：关闭高度自适应，让表格跟随页面整体滚动
    adaption: false,
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
      return channelSummary(query)
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

    <component :is="merchantDialog.Dialog">
      <template #default="{ channelId, channelName, statDate }">
        <ChannelMerchantDialog
          v-if="statDate"
          :channel-id="channelId"
          :channel-name="channelName"
          :stat-date="statDate"
        />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
:global(.dc-row-action.el-button) {
  gap: 2px;
  padding: 4px 10px;
  font-size: 12px;
  white-space: nowrap;
  border: 0;
  border-radius: 6px;
}

:global(.dc-row-action--merchant.el-button) {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

:global(.dc-row-action--merchant.el-button:hover) {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-8);
}
</style>
