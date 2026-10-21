<script setup lang="ts">
import type { DataCenterMerchantChannelVo } from '~/dataCenter/api/dataCenter'
import MaRemoteSelect from '@/components/ma-remote-select/index.vue'
import {
  channelOptions,
  formatChannelOptionLabel,
  merchantChannels,
} from '~/dataCenter/api/dataCenter'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

/**
 * 综合统计 → 跳转商户明细 → 「查看渠道」弹窗.
 *
 * 与参考站点一致：顶部渠道数量 / PV / UV 汇总，下面可按渠道筛选的明细（渠道ID / 名称 / 编码 / 商户PV / UV）。
 */
const props = withDefaults(defineProps<{
  merchantId: number
  merchantName: string
  statDate: string
  /** 明细接口：商户访问统计页用 merchantLog 权限的接口，默认走综合统计的接口 */
  api?: (params: any) => Promise<any>
}>(), {
  api: undefined,
})

const t = useTrans().globalTrans
const loading = ref(false)
const list = ref<DataCenterMerchantChannelVo[]>([])
const total = ref(0)
const summary = ref({ channel_count: 0, merchant_pv: 0, merchant_uv: 0 })
const page = ref(1)
const pageSize = ref(10)
const channelId = ref<number>()

// MaRemoteSelect 的 api 泛型签名较宽，这里按组件期望的形态透传
const channelApi: any = channelOptions

async function load(): Promise<void> {
  loading.value = true
  try {
    const response = await (props.api ?? merchantChannels)({
      merchant_id: props.merchantId,
      stat_date: props.statDate,
      channel_id: channelId.value || undefined,
      page: page.value,
      page_size: pageSize.value,
    })
    if (response.code === ResultCode.SUCCESS && response.data) {
      list.value = response.data.list || []
      total.value = Number(response.data.total || 0)
      summary.value = response.data.summary || { channel_count: 0, merchant_pv: 0, merchant_uv: 0 }
    }
  }
  finally {
    loading.value = false
  }
}

/** 数字加千分位，指标更好读 */
function formatNumber(value: number | string): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

function search(): void {
  page.value = 1
  load()
}

watch(() => [props.merchantId, props.statDate], () => {
  page.value = 1
  channelId.value = undefined
  load()
}, { immediate: true })

watch([page, pageSize], () => {
  load()
})
</script>

<template>
  <div class="merchant-channel-dialog">
    <div class="merchant-channel-dialog__toolbar">
      <div class="merchant-channel-dialog__stats">
        <span class="stat-pill stat-pill--red">{{ t('dataCenter.comprehensive.channelCountLabel') }}: {{ formatNumber(summary.channel_count) }}</span>
        <span class="stat-pill stat-pill--purple">PV: {{ formatNumber(summary.merchant_pv) }}</span>
        <span class="stat-pill stat-pill--blue">UV: {{ formatNumber(summary.merchant_uv) }}</span>
      </div>
      <MaRemoteSelect
        v-if="hasAuth('dataCenter:options')"
        v-model="channelId"
        :api="channelApi"
        :data-handle="(response: any) => (response.data || []).map((item: any) => ({
          label: formatChannelOptionLabel(item),
          value: item.value,
        }))"
        clearable
        filterable
        class="merchant-channel-dialog__select"
        :placeholder="t('dataCenter.comprehensive.channelNamePlaceholder')"
        @change="search"
      />
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      border
      class="w-full"
      :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--el-text-color-primary)' }"
    >
      <el-table-column :label="t('dataCenter.columns.channelId')" prop="channel_id" align="center" />
      <el-table-column :label="t('dataCenter.columns.channelName')" prop="channel_name" show-overflow-tooltip />
      <el-table-column :label="t('dataCenter.channelCode')" prop="channel_code" align="center" />
      <el-table-column :label="t('dataCenter.channelLog.merchantPv')" prop="merchant_pv" align="center" />
      <el-table-column :label="t('dataCenter.channelLog.merchantUv')" prop="merchant_uv" align="center" />
    </el-table>

    <div class="merchant-channel-dialog__pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 30, 50]"
        layout="total, prev, pager, next, sizes"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.merchant-channel-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.merchant-channel-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.merchant-channel-dialog__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stat-pill {
  padding: 1px 8px;
  font-size: 12px;
  line-height: 20px;
  white-space: nowrap;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}

.stat-pill--red {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.stat-pill--purple {
  color: #9254de;
  background: #f9f0ff;
}

.stat-pill--blue {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.merchant-channel-dialog__select {
  flex: 0 0 auto;
  width: 280px;
}

.merchant-channel-dialog__pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
