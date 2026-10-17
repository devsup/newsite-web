<script setup lang="tsx">
import { Status } from '@/constants/status.ts'
import type { MaTableExpose } from '@mineadmin/table'
import type { CategoryAreaVo } from '~/merchant/api/categoryArea'
import type { MerchantVo } from '~/merchant/api/merchant'

import { nextTick, onBeforeUnmount, ref } from 'vue'
import Sortable from 'sortablejs'
import { ElTag } from 'element-plus'
import { merchantPage, merchantSortList, sortMerchants } from '~/merchant/api/categoryArea'
import { useMessage } from '@/hooks/useMessage.ts'
import useTable from '@/hooks/useTable.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'merchant:categoryArea:merchants' })

const { area } = defineProps<{
  area: CategoryAreaVo
}>()

const emit = defineEmits<{
  close: []
}>()

const t = useTrans().globalTrans
const msg = useMessage()

const tableRef = ref<MaTableExpose>()
let tableInstance: MaTableExpose | undefined

const loading = ref(false)
const page = ref(1)
const pageSize = ref(30)
const total = ref(0)
const sorting = ref(false)
const sortLoading = ref(false)
const saving = ref(false)
const sortRows = ref<MerchantVo[]>([])
const sortContainer = ref<HTMLElement>()
let sortable: Sortable | null = null

function destroySortable(): void {
  sortable?.destroy()
  sortable = null
}

async function loadList(): Promise<void> {
  if (!area.id) {
    return
  }

  loading.value = true
  try {
    const response = await merchantPage(area.id, {
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

function handlePageChange(value: number): void {
  page.value = value
  loadList()
}

function handleSizeChange(value: number): void {
  pageSize.value = value
  page.value = 1
  loadList()
}

async function openSort(): Promise<void> {
  if (!area.id) {
    return
  }
  sortLoading.value = true
  try {
    const response = await merchantSortList(area.id)
    if (response.code !== ResultCode.SUCCESS) {
      msg.error(response.message)
      return
    }
    sortRows.value = response.data?.list ?? []
    sorting.value = true
    await nextTick()

    if (sortContainer.value) {
      sortable = Sortable.create(sortContainer.value, {
        animation: 200,
        // 整张卡片都是拖拽目标，不再限制必须按手柄
        draggable: '.area-merchant-sort',
        ghostClass: 'area-merchant-sort--ghost',
        onEnd: (event) => {
          const { oldIndex, newIndex } = event
          if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
            return
          }
          const list = [...sortRows.value]
          const [moved] = list.splice(oldIndex, 1)
          if (!moved) {
            return
          }
          list.splice(newIndex, 0, moved)
          sortRows.value = list
        },
      })
    }
  }
  finally {
    sortLoading.value = false
  }
}

function closeSort(): void {
  destroySortable()
  sorting.value = false
}

async function saveSort(): Promise<void> {
  if (!area.id || saving.value) {
    return
  }
  saving.value = true
  try {
    const ids = sortRows.value.map(item => Number(item.id)).filter(Boolean)
    const response = await sortMerchants(area.id, ids)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.updateSuccess'))
      closeSort()
      await loadList()
    }
    else {
      msg.error(response.message)
    }
  }
  finally {
    saving.value = false
  }
}

/** 从展示信息里取一张封面：不同模板的图片字段不同，视频图文兼容对象/字符串 */
function getMerchantImage(row: MerchantVo): string {
  const info = row.show_info ?? {}
  const firstVideo = Array.isArray(info.video_image_list) ? info.video_image_list[0] : null
  const videoImage = typeof firstVideo === 'string' ? firstVideo : firstVideo?.url

  return info.carousel_image
    || info.product_image
    || info.live_image
    || info.app_icon
    || info.graphic_image
    || videoImage
    || info.ad_image
    || ''
}

/** 排序卡片列数：图标五列 5 列，图标两列/直播/商城 2 列，其余 1 列 */
function getSortColumns(showType?: number): number {
  const type = Number(showType)
  if (type === 7) {
    return 5
  }
  if ([3, 4, 6].includes(type)) {
    return 2
  }
  return 1
}

function getSortItemStyle(item: MerchantVo): Record<string, string> {
  return {
    '--area-merchant-columns': String(getSortColumns(item.show_type)),
  }
}

function isCompactSortCard(item: MerchantVo): boolean {
  return getSortColumns(item.show_type) >= 5
}

useTable('tableRef').then((table: MaTableExpose) => {
  tableInstance = table
  table.setOptions({
    stripe: true,
    border: true,
    adaption: false,
    maxHeight: 430,
  })
  table.setColumns([
    { label: () => t('merchantInfo.id'), prop: 'id', width: '70px' },
    { label: () => t('merchantInfo.name'), prop: 'name', minWidth: '150px', showOverflowTooltip: true },
    { label: () => t('merchantInfo.showName'), prop: 'show_name', minWidth: '150px', showOverflowTooltip: true },
    { label: () => t('merchantInfo.showType'), prop: 'show_type_name', width: '120px' },
    { label: () => t('merchantInfo.weight'), prop: 'weight', width: '90px' },
    {
      label: () => t('merchantInfo.jumpLink'),
      prop: 'jump_url',
      minWidth: '220px',
      showOverflowTooltip: true,
    },
    {
      label: () => t('crud.status'),
      prop: 'status',
      width: '90px',
      cellRender: ({ row }): any => (
        <div class="flex-center">
          <ElTag type={Number(row.status) === Status.ENABLED ? 'success' : 'info'} size="small">
            {Number(row.status) === Status.ENABLED
              ? t('dictionary.system.statusEnabled')
              : t('dictionary.system.statusDisabled')}
          </ElTag>
        </div>
      ),
    },
  ])
  loadList()
})

onBeforeUnmount(destroySortable)
</script>

<template>
  <div class="area-merchant-manager">
    <div v-loading="loading || sortLoading" class="area-merchant-manager__body">
      <div v-show="!sorting" class="area-merchant-manager__list">
        <ma-table ref="tableRef" />
        <div class="area-merchant-manager__pagination">
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            background
            layout="total, sizes, prev, pager, next"
            :total="total"
            :page-sizes="[10, 20, 30, 50]"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>

      <div v-show="sorting" class="area-merchant-manager__sort">
        <div class="area-merchant-manager__sort-tip">
          {{ t('merchantInfo.sortTip') }}
        </div>
        <div ref="sortContainer" class="area-merchant-manager__sort-list">
          <div
            v-for="item in sortRows"
            :key="item.id"
            class="area-merchant-sort"
            :class="{ 'area-merchant-sort--compact': isCompactSortCard(item) }"
            :style="getSortItemStyle(item)"
            draggable="true"
          >
            <ElTag class="area-merchant-sort__id" type="info" size="small">
              #{{ item.id }}
            </ElTag>
            <img
              v-if="getMerchantImage(item)"
              :src="getMerchantImage(item)"
              :alt="item.name || ''"
              class="area-merchant-sort__image"
              draggable="false"
              loading="lazy"
            >
            <div v-else class="area-merchant-sort__image area-merchant-sort__image--empty">
              <ma-svg-icon name="mdi:image-off-outline" :size="20" />
            </div>
            <div class="area-merchant-sort__main">
              <div class="area-merchant-sort__name">
                {{ item.name || '-' }}
              </div>
              <div class="area-merchant-sort__meta">
                <span>{{ item.show_name || '-' }}</span>
                <span>{{ item.show_type_name || '-' }}</span>
                <span>{{ t('merchantInfo.weight') }}: {{ item.weight ?? 0 }}</span>
              </div>
            </div>
          </div>
          <el-empty v-if="sortRows.length === 0" :description="t('merchantInfo.noMerchant')" />
        </div>
      </div>
    </div>

    <div class="area-merchant-manager__footer">
      <template v-if="!sorting">
        <el-button type="primary" :disabled="total < 1" @click="openSort">
          {{ t('merchantInfo.dragSort') }}
        </el-button>
        <el-button @click="emit('close')">
          {{ t('crud.close') }}
        </el-button>
      </template>
      <template v-else>
        <el-button @click="closeSort">
          {{ t('merchantInfo.backList') }}
        </el-button>
        <el-button type="primary" :loading="saving" :disabled="saving" @click="saveSort">
          {{ t('merchantInfo.saveSort') }}
        </el-button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
:global(.area-merchant-dialog .el-dialog__footer) {
  display: none;
}

.area-merchant-manager {
  display: flex;
  flex-direction: column;
}

.area-merchant-manager__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.area-merchant-manager__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.area-merchant-manager__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.area-merchant-manager__sort-tip {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  background: var(--el-fill-color-light);
}

.area-merchant-manager__sort-list {
  overflow-y: auto;
  max-height: 520px;
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 12px;
  padding-right: 4px;
}

.area-merchant-sort {
  grid-column: span calc(10 / var(--area-merchant-columns, 1));
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  cursor: grab;
  user-select: none;
}

.area-merchant-sort:active {
  cursor: grabbing;
}

.area-merchant-sort__id {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.area-merchant-sort__image {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 8px;
  object-fit: cover;
}

.area-merchant-sort__image--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
}

.area-merchant-sort__main {
  flex: 1;
  min-width: 0;
}

.area-merchant-sort__name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.area-merchant-sort__meta {
  display: flex;
  gap: 12px;
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.area-merchant-sort--compact {
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  text-align: center;
}

.area-merchant-sort--compact .area-merchant-sort__image {
  width: 60px;
  height: 60px;
}

.area-merchant-sort--compact .area-merchant-sort__main {
  align-items: center;
  width: 100%;
  gap: 4px;
}

.area-merchant-sort--compact .area-merchant-sort__name {
  width: 100%;
  font-size: 12px;
}

.area-merchant-sort--compact .area-merchant-sort__meta {
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  font-size: 11px;
}

.area-merchant-sort--ghost {
  opacity: 0.5;
}

@media (max-width: 768px) {
  .area-merchant-manager__sort-list {
    grid-template-columns: 1fr;
  }

  .area-merchant-sort {
    grid-column: span 1;
  }
}
</style>
