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
import type { MaTableExpose } from '@mineadmin/table'
import type { DataCenterChannelVo, DataCenterMerchantVo } from '~/dataCenter/api/dataCenter'

import { channelOfDay, merchantOfDay } from '~/dataCenter/api/dataCenter'
import useTable from '@/hooks/useTable.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

/**
 * 综合统计某一天的渠道 / 商户明细弹窗.
 *
 * 只读、不分页：当天有数据的渠道 / 商户数量有限，一次取回后用 ma-table 限额滚动。
 * 弹窗里的表格禁用 MaProTable（它按视口算高度，放弹窗里会溢出）。
 */
const props = defineProps<{
  mode: 'channel' | 'merchant'
  date: string
}>()

const t = useTrans().globalTrans
const msg = useMessage()
const loading = ref(false)
const rows = ref<Array<DataCenterChannelVo | DataCenterMerchantVo>>([])

// 模板 ref 名必须与变量同名，ma-table 才会绑定；useTable 异步，额外留实例兜底
const detailTable = ref<MaTableExpose>()
let tableInstance: MaTableExpose | undefined

function applyColumns(): void {
  const table = detailTable.value ?? tableInstance
  if (!table) {
    return
  }

  if (props.mode === 'channel') {
    table.setColumns([
      { label: () => t('dataCenter.channel'), prop: 'channel_name', minWidth: '150px' },
      { label: () => t('dataCenter.channelCode'), prop: 'channel_code', minWidth: '110px' },
      { label: () => t('dataCenter.channelLog.channelPv'), prop: 'channel_pv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.channelUv'), prop: 'channel_uv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.landPv'), prop: 'land_pv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.landUv'), prop: 'land_uv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.naviPv'), prop: 'navi_pv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.naviUv'), prop: 'navi_uv', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.installNum'), prop: 'install_num', minWidth: '90px' },
      { label: () => t('dataCenter.channelLog.downloadPv'), prop: 'download_pv', minWidth: '90px' },
    ])
    return
  }

  table.setColumns([
    { label: () => t('dataCenter.merchantId'), prop: 'merchant_id', width: '90px' },
    { label: () => t('dataCenter.merchant'), prop: 'merchant_name', minWidth: '220px' },
    { label: () => t('dataCenter.merchantLog.clickPv'), prop: 'click_pv', minWidth: '100px' },
    { label: () => t('dataCenter.merchantLog.clickUv'), prop: 'click_uv', minWidth: '100px' },
  ])
}

async function refresh(): Promise<void> {
  loading.value = true
  try {
    const response = props.mode === 'channel'
      ? await channelOfDay(props.date)
      : await merchantOfDay(props.date)

    if (response.code === ResultCode.SUCCESS) {
      rows.value = response.data || []
      ;(detailTable.value ?? tableInstance)?.setData([...rows.value])
    }
    else {
      msg.error(response.message)
    }
  }
  finally {
    loading.value = false
  }
}

useTable('detailTable').then((table: MaTableExpose) => {
  tableInstance = table
  applyColumns()
  table.setData([...rows.value])
})

onMounted(() => {
  refresh()
})

watch(() => [props.mode, props.date], () => {
  applyColumns()
  refresh()
})
</script>

<template>
  <div class="day-detail">
    <div class="mb-2 text-xs text-[var(--el-text-color-secondary)]">
      {{ date }}
    </div>
    <ma-table ref="detailTable" v-loading="loading" max-height="420" />
  </div>
</template>

<style scoped lang="scss">
.day-detail {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
