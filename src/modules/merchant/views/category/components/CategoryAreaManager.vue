<script setup lang="tsx">
import { Status } from '@/constants/status.ts'
import type { FormInstance, FormRules } from 'element-plus'
import type { MaTableExpose } from '@mineadmin/table'
import type { CategoryAreaVo } from '~/merchant/api/categoryArea'
import type { CategoryVo } from '~/merchant/api/category'

import { computed, ref } from 'vue'
import { ElInputNumber, ElSwitch } from 'element-plus'
import { create, list, remove, save, updateStatus, updateWeight } from '~/merchant/api/categoryArea'
import { useMessage } from '@/hooks/useMessage.ts'
import useDialog from '@/hooks/useDialog.ts'
import useTable from '@/hooks/useTable.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'
import AreaMerchantManager from './AreaMerchantManager.vue'

defineOptions({ name: 'merchant:categoryArea:manager' })

const { category } = defineProps<{
  category: CategoryVo
}>()

const emit = defineEmits<{
  changed: []
}>()

const t = useTrans().globalTrans
const msg = useMessage()

const areaTable = ref<MaTableExpose>()
let tableInstance: MaTableExpose | undefined

const loading = ref(false)
const areas = ref<CategoryAreaVo[]>([])
const showTypes = ref<Array<{ name: string, value: number }>>([])
const statusLoading = ref<number>()
const weightLoading = ref<number>()
const currentArea = ref<CategoryAreaVo | null>(null)
const areaFormRef = ref<FormInstance>()
const areaFormType = ref<'add' | 'edit'>('add')
const areaModel = ref<CategoryAreaVo>({})

const typeNameMap = computed<Record<number, string>>(() => {
  return Object.fromEntries(showTypes.value.map(item => [item.value, item.name]))
})

const rules = computed<FormRules>(() => ({
  type: [{ required: true, message: t('form.requiredSelect', { msg: t('merchantInfo.areaType') }), trigger: 'change' }],
  internal_name: [{ required: true, message: t('form.requiredInput', { msg: t('merchantInfo.internalName') }), trigger: 'blur' }],
  explicit_name: [{ required: true, message: t('form.requiredInput', { msg: t('merchantInfo.explicitName') }), trigger: 'blur' }],
}))

/** 区域表单弹窗（在区域列表弹窗内部再开一层） */
const areaDialog = useDialog({
  width: '820px',
  ok: (_payload: any, okLoadingState: (state: boolean) => void) => {
    okLoadingState(true)
    areaFormRef.value?.validate().then(async () => {
      const response = areaFormType.value === 'edit'
        ? await save(areaModel.value.id as number, areaModel.value)
        : await create(areaModel.value)

      if (response.code === ResultCode.SUCCESS) {
        msg.success(areaFormType.value === 'edit' ? t('crud.updateSuccess') : t('crud.createSuccess'))
        areaDialog.close()
        await loadAreas()
        emit('changed')
      }
      else {
        msg.error(response.message)
      }
      okLoadingState(false)
    }).catch(() => {
      okLoadingState(false)
    })
  },
})

/** 商户列表 / 排序弹窗 */
const merchantDialog = useDialog({
  width: '1080px',
  class: 'area-merchant-dialog',
  // 商户列表 / 排序的操作按钮放到内容底部（关闭 / 返回列表 / 保存排序），不再使用默认弹窗 footer
  footer: false,
})

async function loadAreas(): Promise<void> {
  if (!category.id) {
    return
  }

  loading.value = true
  try {
    const response = await list(category.id)
    if (response.code !== ResultCode.SUCCESS) {
      msg.error(response.message)
      return
    }
    areas.value = response.data.list || []
    showTypes.value = response.data.showTypes || []
    ;(areaTable.value ?? tableInstance)?.setData([...areas.value])
  }
  finally {
    loading.value = false
  }
}

function openAdd(): void {
  areaFormType.value = 'add'
  areaModel.value = {
    category_id: category.id,
    type: showTypes.value[0]?.value ?? 1,
    internal_name: '',
    explicit_name: '',
    weight: 0,
    status: Status.ENABLED,
  }
  areaDialog.setTitle(t('merchantInfo.areaAdd'))
  areaDialog.open({})
}

function openEdit(row: CategoryAreaVo): void {
  areaFormType.value = 'edit'
  areaModel.value = {
    ...row,
    category_id: category.id,
    type: Number(row.type ?? 1),
    weight: Number(row.weight ?? 0),
    status: Number(row.status ?? Status.ENABLED),
  }
  areaDialog.setTitle(t('merchantInfo.areaEdit'))
  areaDialog.open({})
}

function openMerchants(row: CategoryAreaVo): void {
  currentArea.value = row
  merchantDialog.setTitle(t('merchantInfo.areaMerchantTitle', { name: row.internal_name || '-' }))
  merchantDialog.open({})
}

function handleDelete(row: CategoryAreaVo): void {
  msg.delConfirm(t('crud.delDataMessage')).then(async () => {
    const response = await remove(row.id as number)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.delSuccess'))
      await loadAreas()
      emit('changed')
    }
    else {
      msg.error(response.message)
    }
  })
}

function handleStatusChange(row: CategoryAreaVo, value: number): void {
  statusLoading.value = row.id
  updateStatus(row.id as number, value).then(async (response) => {
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.updateSuccess'))
    }
    else {
      msg.error(response.message)
    }
    await loadAreas()
  }).finally(() => {
    statusLoading.value = undefined
  })
}

function handleWeightChange(row: CategoryAreaVo, value: number): void {
  weightLoading.value = row.id
  updateWeight(row.id as number, value).then(async (response) => {
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('merchantInfo.weightSaved'))
    }
    else {
      msg.error(response.message)
    }
    await loadAreas()
  }).finally(() => {
    weightLoading.value = undefined
  })
}

useTable('areaTable').then((table: MaTableExpose) => {
  tableInstance = table
  table.setOptions({
    stripe: true,
    border: true,
    adaption: false,
    maxHeight: 430,
  })

  table.setColumns([
    { label: () => t('merchantInfo.id'), prop: 'id', width: '70px' },
    {
      label: () => t('merchantInfo.areaType'),
      prop: 'type',
      width: '130px',
      cellRender: ({ row }): any => <span>{typeNameMap.value[Number(row.type)] ?? row.type_name ?? '--'}</span>,
    },
    { label: () => t('merchantInfo.internalName'), prop: 'internal_name', minWidth: '180px', showOverflowTooltip: true },
    { label: () => t('merchantInfo.explicitName'), prop: 'explicit_name', minWidth: '220px', showOverflowTooltip: true },
    {
      label: () => t('merchantInfo.weight'),
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
            disabled={!hasAuth('category:save') || weightLoading.value === row.id}
            onChange={(value: number | undefined) => handleWeightChange(row as CategoryAreaVo, Number(value ?? 0))}
          />
        </div>
      ),
    },
    {
      label: () => t('crud.status'),
      prop: 'status',
      width: '90px',
      cellRender: ({ row }): any => (
        <div class="flex-center">
          <ElSwitch
            modelValue={Number(row.status)}
            activeValue={Status.ENABLED}
            inactiveValue={Status.DISABLED}
            loading={statusLoading.value === row.id}
            disabled={!hasAuth('category:save')}
            onChange={(value: string | number | boolean) => handleStatusChange(row as CategoryAreaVo, Number(value))}
          />
        </div>
      ),
    },
    {
      label: () => t('merchantInfo.merchantCount'),
      prop: 'merchantCount',
      width: '120px',
      cellRender: ({ row }): any => (
        <el-button size="small" type="primary" onClick={() => openMerchants(row as CategoryAreaVo)}>
          {`${row.merchantCount || 0} ${t('merchantInfo.config')}`}
        </el-button>
      ),
    },
    {
      label: () => t('crud.operation'),
      width: '150px',
      cellRender: ({ row }): any => (
        <div class="flex items-center">
          <el-button
            link
            type="primary"
            disabled={!hasAuth('category:save')}
            onClick={() => openEdit(row as CategoryAreaVo)}
          >
            {t('crud.edit')}
          </el-button>
          <el-button
            link
            type="danger"
            disabled={!hasAuth('category:delete')}
            onClick={() => handleDelete(row as CategoryAreaVo)}
          >
            {t('crud.delete')}
          </el-button>
        </div>
      ),
    },
  ])

  loadAreas()
})
</script>

<template>
  <div class="area-manager">
    <div class="area-manager__toolbar">
      <el-button v-auth="['category:save']" type="primary" @click="openAdd">
        {{ t('crud.add') }}
      </el-button>
    </div>

    <ma-table ref="areaTable" v-loading="loading" />

    <component :is="areaDialog.Dialog">
      <el-form ref="areaFormRef" :model="areaModel" :rules="rules" label-width="100px" @submit.prevent>
        <el-form-item :label="t('merchantInfo.areaType')" prop="type">
          <el-select v-model="areaModel.type" class="w-full">
            <el-option v-for="item in showTypes" :key="item.value" :label="item.name" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('merchantInfo.internalName')" prop="internal_name">
          <el-input v-model="areaModel.internal_name" clearable />
        </el-form-item>
        <el-form-item :label="t('merchantInfo.explicitName')" prop="explicit_name">
          <el-input v-model="areaModel.explicit_name" clearable />
        </el-form-item>
        <el-form-item :label="t('merchantInfo.weight')" prop="weight">
          <ElInputNumber v-model="areaModel.weight" :min="0" :max="999999" controls-position="right" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('crud.status')" prop="status">
          <el-radio-group v-model="areaModel.status">
            <el-radio :value="1">
              {{ t('dictionary.system.statusEnabled') }}
            </el-radio>
            <el-radio :value="2">
              {{ t('dictionary.system.statusDisabled') }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </component>

    <component :is="merchantDialog.Dialog">
      <AreaMerchantManager v-if="currentArea" :area="currentArea" @close="merchantDialog.close()" />
    </component>
  </div>
</template>

<style scoped lang="scss">
.area-manager__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>
