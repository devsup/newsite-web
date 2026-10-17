<script setup lang="tsx">
import { Status } from '@/constants/status.ts'
import type { MaTableExpose } from '@mineadmin/table'
import type { TabFooterRelOptionVo, TabFooterRelVo } from '~/merchant/api/tabFooterRel'
import type { TabFooterVo } from '~/merchant/api/tabFooter'

import { useDebounceFn } from '@vueuse/core'
import { ElInputNumber, ElTag } from 'element-plus'
import { bind, list, options, remove, updateWeight } from '~/merchant/api/tabFooterRel'
import { useMessage } from '@/hooks/useMessage.ts'
import useTable from '@/hooks/useTable.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

defineOptions({ name: 'merchant:tabFooter:bindCategory' })

const { data = null } = defineProps<{
  data?: TabFooterVo | null
}>()

const emit = defineEmits<{
  changed: []
}>()

const t = useTrans().globalTrans
const msg = useMessage()
const footerId = computed(() => Number(data?.id ?? 0))

// 模板 ref 名必须与变量同名，ma-table 才会被绑定
const bindTable = ref<MaTableExpose>()
let tableInstance: MaTableExpose | undefined

const loading = ref(false)
const binding = ref(false)
const boundRows = ref<TabFooterRelVo[]>([])
const categoryOptions = ref<TabFooterRelOptionVo[]>([])
const selectedCategoryIds = ref<number[]>([])
const weightLoading = ref<number>()

/** 可选项：排除已绑定的；服务端 options 已经只返回启用的顶部Tab */
const availableOptions = computed(() => categoryOptions.value.filter(item => !item.bound))

async function loadAll(): Promise<void> {
  if (footerId.value <= 0) {
    return
  }

  loading.value = true
  try {
    const [listResponse, optionsResponse] = await Promise.all([
      list(footerId.value),
      options(footerId.value),
    ])

    if (listResponse.code === ResultCode.SUCCESS) {
      boundRows.value = listResponse.data?.list ?? []
      ;(bindTable.value ?? tableInstance)?.setData([...boundRows.value])
    }
    else {
      msg.error(listResponse.message)
    }

    if (optionsResponse.code === ResultCode.SUCCESS) {
      categoryOptions.value = optionsResponse.data ?? []
    }
    else {
      msg.error(optionsResponse.message)
    }
  }
  finally {
    loading.value = false
  }
}

/** 兼容弹窗首次挂载 / data 异步到位：footerId 一旦有效就主动加载，避免只依赖 useTable 回调的时序 */
watch(footerId, (id) => {
  if (id > 0) {
    void loadAll()
  }
}, { immediate: true })

/** 批量绑定：只提交新选的、尚未绑定的顶部Tab */
async function handleBind(): Promise<void> {
  if (selectedCategoryIds.value.length === 0 || binding.value) {
    return
  }

  binding.value = true
  try {
    const response = await bind(footerId.value, selectedCategoryIds.value)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('tabFooter.bindSuccess', { count: response.data?.bound ?? 0 }))
      selectedCategoryIds.value = []
      await loadAll()
      emit('changed')
    }
    else {
      msg.error(response.message)
    }
  }
  finally {
    binding.value = false
  }
}

/** 400ms 防抖：连续输入只发最后一次请求 */
const saveWeight = useDebounceFn((row: TabFooterRelVo, weight: number) => {
  if (weight === row.weight) {
    return
  }

  weightLoading.value = row.id
  updateWeight(row.id as number, weight).then(async (response) => {
    if (response.code === ResultCode.SUCCESS) {
      row.weight = weight
      msg.success(t('tabFooter.weightSaved'))
    }
    else {
      msg.error(response.message)
    }
    await loadAll()
  }).finally(() => {
    weightLoading.value = undefined
  })
}, 400)

function handleUnbind(row: TabFooterRelVo): void {
  msg.delConfirm(t('tabFooter.unbindConfirm', { name: row.category_name ?? '' })).then(async () => {
    const response = await remove(row.id as number)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('tabFooter.unbindSuccess'))
      await loadAll()
      emit('changed')
    }
    else {
      msg.error(response.message)
    }
  })
}

useTable('bindTable').then((table: MaTableExpose) => {
  tableInstance = table
  table.setOptions({
    stripe: true,
    border: true,
    // 弹窗里不用按视口自适应高度，固定最大高度让表格自己滚
    adaption: false,
    maxHeight: 360,
  })

  table.setColumns([
    { label: () => t('ID'), prop: 'id', width: '70px' },
    { label: () => t('tabFooter.bindCategory'), prop: 'category_name', minWidth: '150px' },
    {
      label: () => t('tabFooter.weight'),
      prop: 'weight',
      width: '130px',
      cellRender: ({ row }): any => (
        <div class="flex-center">
          <ElInputNumber
            modelValue={Number(row.weight ?? 0)}
            min={0}
            max={999999}
            size="small"
            controlsPosition="right"
            disabled={!hasAuth('tabFooter:save') || weightLoading.value === row.id}
            onChange={(value: number | undefined) => saveWeight(row as TabFooterRelVo, Number(value ?? 0))}
          />
        </div>
      ),
    },
    {
      label: () => t('crud.status'),
      prop: 'category_status',
      width: '90px',
      cellRender: ({ row }): any => (
        <div class="flex-center">
          <ElTag type={Number(row.category_status) === Status.ENABLED ? 'success' : 'info'} size="small">
            {Number(row.category_status) === Status.ENABLED
              ? t('dictionary.system.statusEnabled')
              : t('dictionary.system.statusDisabled')}
          </ElTag>
        </div>
      ),
    },
    {
      label: () => t('crud.operation'),
      width: '100px',
      cellRender: ({ row }): any => (
        <el-button
          link
          type="danger"
          disabled={!hasAuth('tabFooter:delete')}
          onClick={() => handleUnbind(row as TabFooterRelVo)}
        >
          {t('tabFooter.unbind')}
        </el-button>
      ),
    },
  ])

  loadAll()
})
</script>

<template>
  <div class="merchant-bind">
    <div class="merchant-bind__toolbar">
      <el-select
        v-model="selectedCategoryIds"
        multiple
        filterable
        clearable
        collapse-tags
        collapse-tags-tooltip
        :disabled="!hasAuth('tabFooter:save')"
        :placeholder="availableOptions.length > 0 ? t('tabFooter.bindPlaceholder') : t('tabFooter.noAvailable')"
        class="merchant-bind__select"
      >
        <el-option
          v-for="item in availableOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-button
        type="primary"
        :loading="binding"
        :disabled="selectedCategoryIds.length === 0 || !hasAuth('tabFooter:save')"
        @click="handleBind"
      >
        {{ t('tabFooter.bindAction') }}
      </el-button>
    </div>

    <ma-table ref="bindTable" v-loading="loading" />
  </div>
</template>

<style scoped lang="scss">
.merchant-bind__toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.merchant-bind__select {
  flex: 1;
  min-width: 0;
}
</style>
