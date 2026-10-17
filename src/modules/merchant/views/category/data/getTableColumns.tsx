import type { MaProTableColumns, MaProTableExpose } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { CategoryVo } from '~/merchant/api/category'

import { useDebounceFn } from '@vueuse/core'
import { ElInputNumber, ElSwitch } from 'element-plus'
import { deleteByIds, updateStatus, updateWeight } from '~/merchant/api/category'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

export default function getTableColumns(
  dialog: UseDialogExpose,
  t: any,
  proTableRef?: Ref<MaProTableExpose>,
): MaProTableColumns[] {
  const msg = useMessage()
  const statusLoading = ref<number>()
  const weightLoading = ref<number>()

  function handleStatusChange(row: CategoryVo, status: number): void {
    statusLoading.value = row.id
    updateStatus(row.id as number, status).then((response) => {
      if (response.code === ResultCode.SUCCESS) {
        msg.success(t('crud.updateSuccess'))
      }
      else {
        msg.error(response.message)
      }
      proTableRef?.value?.refresh()
    }).finally(() => {
      statusLoading.value = undefined
    })
  }

  /** 400ms 防抖：连续输入只发最后一次请求 */
  const saveWeight = useDebounceFn((row: CategoryVo, weight: number) => {
    if (weight === row.weight) {
      return
    }
    weightLoading.value = row.id
    updateWeight(row.id as number, weight).then((response) => {
      if (response.code === ResultCode.SUCCESS) {
        row.weight = weight
        msg.success(t('category.weightSaved'))
      }
      else {
        msg.error(response.message)
      }
      proTableRef?.value?.refresh()
    }).finally(() => {
      weightLoading.value = undefined
    })
  }, 400)

  return [
    { type: 'selection', showOverflowTooltip: false, label: () => t('crud.selection') },
    { label: () => t('ID'), prop: 'id', width: '90px' },
    { label: () => t('category.name'), prop: 'name', minWidth: '160px' },
    {
      label: () => t('crud.status'),
      prop: 'status',
      width: '100px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          <ElSwitch
            modelValue={Number(row.status)}
            activeValue={1}
            inactiveValue={2}
            loading={statusLoading.value === row.id}
            disabled={!hasAuth('category:save')}
            onChange={(value: string | number | boolean) => handleStatusChange(row as CategoryVo, Number(value))}
          />
        </div>
      ),
    },
    {
      label: () => t('category.weight'),
      prop: 'weight',
      width: '140px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          <ElInputNumber
            modelValue={Number((row as CategoryVo).weight ?? 0)}
            min={0}
            max={999999}
            step={1}
            size="small"
            controlsPosition="right"
            disabled={!hasAuth('category:save') || weightLoading.value === row.id}
            onChange={(value: number | undefined) => saveWeight(row as CategoryVo, Number(value ?? 0))}
          />
        </div>
      ),
    },
    { label: () => t('crud.remark'), prop: 'remark', minWidth: '160px', showOverflowTooltip: true },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '170px' },
    { label: () => t('category.updatedBy'), prop: 'updated_by_name', width: '110px' },
    {
      type: 'operation',
      label: () => t('crud.operation'),
      fixed: 'right',
      width: '180px',
      operationConfigure: {
        type: 'tile',
        actions: [
          {
            name: 'edit',
            icon: 'material-symbols:person-edit',
            text: () => t('crud.edit'),
            disabled: () => !hasAuth('category:save'),
            onClick: ({ row }) => {
              dialog.setTitle(t('crud.edit'))
              dialog.open({ formType: 'edit', data: row })
            },
          },
          {
            name: 'delete',
            icon: 'mdi:delete',
            text: () => t('crud.delete'),
            disabled: () => !hasAuth('category:delete'),
            onClick: ({ row }, proxy: MaProTableExpose) => {
              msg.delConfirm(t('crud.delDataMessage')).then(async () => {
                const response = await deleteByIds([row.id as number])
                if (response.code === ResultCode.SUCCESS) {
                  msg.success(t('crud.delSuccess'))
                  await proxy.refresh()
                }
                else {
                  msg.error(response.message)
                }
              })
            },
          },
        ],
      },
    },
  ]
}
