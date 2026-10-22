<script setup lang="ts">
import type { MaTableExpose } from '@mineadmin/table'
import type { PageList, ResponseStruct } from '#/global'

import { ref, watch } from 'vue'
import useTable from '@/hooks/useTable.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import { useMessage } from '@/hooks/useMessage.ts'

/** 日统计行（类目 / 顶部Tab 共用同一份结构） */
interface DailyStatRow {
  /** 统计日期（Y-m-d） */
  created_date?: string
  /** 商户点击 PV */
  merchant_pv?: number
  /** 商户点击 UV */
  merchant_uv?: number
  /** 点击率（百分比数值） */
  click_rate?: number
  [key: string]: any
}

const { name, targetId, fetchApi } = defineProps<{
  /** 类目 / 顶部Tab 名称，用于工具栏展示 */
  name?: string
  /** 当前统计的类目 / 顶部Tab ID，变化时重新拉取 */
  targetId?: number
  /** 拉取日统计的接口（类目与顶部Tab 各有一套端点） */
  fetchApi: (params: Record<string, any>) => Promise<ResponseStruct<PageList<DailyStatRow>>>
}>()

const t = useTrans().globalTrans
const msg = useMessage()

const tableRef = ref<MaTableExpose>()
let tableInstance: MaTableExpose | undefined

const loading = ref(false)
const page = ref(1)
const pageSize = ref(30)
const total = ref(0)
/** 查询区间，默认最近 10 天（与参考站点的默认口径一致） */
const range = ref<[string, string]>([
  useDayjs().subtract(9, 'day').format('YYYY-MM-DD'),
  useDayjs().format('YYYY-MM-DD'),
])

/** 拉取当前对象所选区间的日统计 */
async function loadList(): Promise<void> {
  if (!targetId) {
    return
  }

  loading.value = true
  try {
    const response = await fetchApi({
      start_date: range.value?.[0],
      end_date: range.value?.[1],
      page: page.value,
      page_size: pageSize.value,
    })
    if (response.code === ResultCode.SUCCESS) {
      const data = response.data
      ;(tableRef.value ?? tableInstance)?.setData([...(data.list || [])])
      total.value = data.total || 0
    }
    else {
      msg.error(response.message)
    }
  }
  finally {
    loading.value = false
  }
}

/** 切换区间后回到第一页 */
function handleRangeChange(): void {
  page.value = 1
  loadList()
}

function handlePageChange(value: number): void {
  page.value = value
  loadList()
}

function handleSizeChange(value: number): void {
  pageSize.value = value
  page.value = 1
  loadList()
}

useTable('tableRef').then((table: MaTableExpose) => {
  tableInstance = table
  table.setOptions({
    stripe: true,
    border: true,
    adaption: false,
    // 一屏放下 10 行（默认区间 10 天）不出现截断；更多行时表格内部滚动
    maxHeight: 480,
  })
  table.setColumns([
    { label: () => t('categoryType.statDate'), prop: 'created_date', minWidth: '120px' },
    { label: () => t('categoryType.merchantPv'), prop: 'merchant_pv', minWidth: '100px' },
    { label: () => t('categoryType.merchantUv'), prop: 'merchant_uv', minWidth: '100px' },
    {
      label: () => t('categoryType.clickRate'),
      prop: 'click_rate',
      minWidth: '100px',
      // 后端返回百分比数值，展示时统一补 % 与两位小数
      cellRender: ({ row }) => `${Number((row as DailyStatRow)?.click_rate ?? 0).toFixed(2)}%`,
    },
  ])
})

// 弹窗复用同一个组件实例，切换类目 / 顶部Tab 时 onMounted 不会再次触发，必须监听 id 重新请求
watch(() => targetId, () => {
  page.value = 1
  loadList()
}, { immediate: true })
</script>

<template>
  <div class="daily-stats">
    <div class="daily-stats__toolbar">
      <span class="daily-stats__name">
        {{ name || '-' }}
      </span>
      <el-date-picker
        v-model="range"
        type="daterange"
        value-format="YYYY-MM-DD"
        :start-placeholder="t('categoryType.startDate')"
        :end-placeholder="t('categoryType.endDate')"
        :clearable="false"
        @change="handleRangeChange"
      />
    </div>

    <ma-table ref="tableRef" v-loading="loading" />

    <div class="daily-stats__footer">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 30, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.daily-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.daily-stats__toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.daily-stats__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.daily-stats__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
