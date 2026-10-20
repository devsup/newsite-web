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
const props = defineProps<{
  channelId: number
  channelName: string
  statDate: string
}>()

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
    const response = await channelMerchants({
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
    <div class="channel-merchant-dialog__summary">
      <span>{{ t('dataCenter.channelLog.merchantCount') }}：<b>{{ summary.merchant_count }}</b></span>
      <span>PV：<b>{{ summary.merchant_pv }}</b></span>
      <span>UV：<b>{{ summary.merchant_uv }}</b></span>
    </div>

    <div class="channel-merchant-dialog__filters">
      <MaRemoteSelect
        v-model="merchantId"
        :api="merchantApi"
        :data-handle="(response: any) => response.data || []"
        clearable
        filterable
        :placeholder="t('dataCenter.channelLog.selectMerchantName')"
        @change="search"
      />
    </div>

    <el-table v-loading="loading" :data="list" stripe border class="w-full">
      <el-table-column
        :label="t('dataCenter.channelLog.merchantName')"
        prop="merchant_name"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column label="PV" prop="merchant_pv" width="120" align="center" />
      <el-table-column label="UV" prop="merchant_uv" width="120" align="center" />
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
.channel-merchant-dialog__summary {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);

  b {
    font-size: 15px;
    color: var(--el-text-color-primary);
  }
}

.channel-merchant-dialog__filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.channel-merchant-dialog__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
