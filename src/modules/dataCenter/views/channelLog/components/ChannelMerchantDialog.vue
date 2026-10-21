<!--
 - MineAdmin is committed to providing solutions for quickly building web applications
 - Please view the LICENSE file that was distributed with this source code,
 - For the full copyright and license information.
 - Thank you very much for using MineAdmin.
 -
 - @Author X.Mo<root@imoi.cn>
 - @Link   https://github.com/mineadmin
-->
<script setup lang="ts">
import type { DataCenterChannelMerchantVo } from '~/dataCenter/api/dataCenter'
import MaRemoteSelect from '@/components/ma-remote-select/index.vue'
import { channelMerchants, merchantOptions } from '~/dataCenter/api/dataCenter'
import { ResultCode } from '@/utils/ResultCode.ts'

/**
 * 渠道访问统计 → 展开行「跳转商户」弹窗.
 *
 * 展示某渠道某一天的商户点击明细（与参考站点一致）：
 * 顶部商户数量 / PV / UV 汇总，下面是商户名称 + PV/UV 分页列表。
 */
const props = withDefaults(defineProps<{
  channelId: number
  channelName: string
  statDate: string
  /** 明细接口：综合统计弹窗用 comprehensive 权限的接口，默认走渠道统计页的接口 */
  api?: (params: any) => Promise<any>
}>(), {
  api: undefined,
})

const t = useTrans().globalTrans
const loading = ref(false)
const list = ref<DataCenterChannelMerchantVo[]>([])
const total = ref(0)
const summary = ref({ merchant_count: 0, merchant_pv: 0, merchant_uv: 0 })
const page = ref(1)
const pageSize = ref(10)
// MaRemoteSelect 的 api 泛型签名较宽，这里按组件期望的形态透传
const merchantApi: any = merchantOptions
const merchantId = ref<number>()

async function load(): Promise<void> {
  loading.value = true
  try {
    const response = await (props.api ?? channelMerchants)({
      channel_id: props.channelId,
      stat_date: props.statDate,
      merchant_id: merchantId.value || undefined,
      page: page.value,
      page_size: pageSize.value,
    })
    if (response.code === ResultCode.SUCCESS && response.data) {
      list.value = response.data.list || []
      total.value = Number(response.data.total || 0)
      summary.value = response.data.summary || { merchant_count: 0, merchant_pv: 0, merchant_uv: 0 }
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

watch(() => [props.channelId, props.statDate], () => {
  // 弹窗是复用的同一个组件实例：切换渠道/日期时要重置页码与筛选并重新请求
  page.value = 1
  merchantId.value = undefined
  load()
}, { immediate: true })

watch([page, pageSize], () => {
  load()
})
</script>

<template>
  <div class="channel-merchant-dialog">
    <div class="channel-merchant-dialog__toolbar">
      <div class="channel-merchant-dialog__stats">
        <span class="stat-pill stat-pill--red">{{ t('dataCenter.channelLog.merchantCount') }}: {{ formatNumber(summary.merchant_count) }}</span>
        <span class="stat-pill stat-pill--purple">PV: {{ formatNumber(summary.merchant_pv) }}</span>
        <span class="stat-pill stat-pill--blue">UV: {{ formatNumber(summary.merchant_uv) }}</span>
      </div>
      <MaRemoteSelect
        v-model="merchantId"
        :api="merchantApi"
        :data-handle="(response: any) => response.data || []"
        clearable
        filterable
        class="channel-merchant-dialog__select"
        :placeholder="t('dataCenter.channelLog.selectMerchantName')"
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
      <el-table-column
        :label="t('dataCenter.channelLog.merchantName')"
        prop="merchant_name"
        show-overflow-tooltip
      />
      <el-table-column :label="t('dataCenter.channelLog.merchantPv')" prop="merchant_pv" align="center" />
      <el-table-column :label="t('dataCenter.channelLog.merchantUv')" prop="merchant_uv" align="center" />
    </el-table>

    <div class="channel-merchant-dialog__pagination">
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
.channel-merchant-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 指标：三等分铺满，不用背景与竖线，只留底部细分隔线 */
/* 顶部一行：左侧三个彩色小标签（与参考站点一致），右侧商户筛选 */
.channel-merchant-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.channel-merchant-dialog__stats {
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

.channel-merchant-dialog__select {
  flex: 0 0 auto;
  width: 280px;
}

.channel-merchant-dialog__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
