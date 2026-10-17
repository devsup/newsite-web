import type { MaProTableColumns, MaProTableExpose } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { CategoryTypeVo } from '~/merchant/api/categoryType'

import { useDebounceFn } from '@vueuse/core'
import { ElInputNumber, ElSwitch, ElTooltip } from 'element-plus'
import { deleteByIds, updateStatus, updateWeight } from '~/merchant/api/categoryType'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'
import { Status } from '@/constants/status.ts'

/**
 * 统计列统一显示占位符：后端当前不返回统计值。
 *
 * 这里刻意不显示 0——0 会被误读成「真实统计为 0」，
 * 用 `--` + 悬浮说明表示「数据中心接入后展示」更准确。
 */
function renderStatsPlaceholder(t: any) {
  return (
    <div class="flex-center">
      <ElTooltip content={t('categoryType.statsPlaceholder')} placement="top" showAfter={100}>
        <span style={{ color: 'var(--el-text-color-placeholder)', cursor: 'help' }}>--</span>
      </ElTooltip>
    </div>
  )
}

export default function getTableColumns(
  dialog: UseDialogExpose,
  t: any,
  proTableRef?: Ref<MaProTableExpose>,
): MaProTableColumns[] {
  const msg = useMessage()
  const statusLoading = ref<number>()
  const weightLoading = ref<number>()

  function handleStatusChange(row: CategoryTypeVo, status: number): void {
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

  const saveWeight = useDebounceFn((row: CategoryTypeVo, weight: number) => {
    if (weight === row.weight) {
      return
    }
    weightLoading.value = row.id
    updateWeight(row.id as number, weight).then((response) => {
      if (response.code === ResultCode.SUCCESS) {
        row.weight = weight
        msg.success(t('categoryType.weightSaved'))
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
    { label: () => t('categoryType.name'), prop: 'name', minWidth: '150px' },
    {
      label: () => t('categoryType.merchantNumber'),
      prop: 'merchant_number',
      width: '100px',
      cellRender: () => renderStatsPlaceholder(t),
    },
    {
      label: () => t('categoryType.merchantPv'),
      prop: 'merchant_pv',
      width: '100px',
      cellRender: () => renderStatsPlaceholder(t),
    },
    {
      label: () => t('categoryType.merchantUv'),
      prop: 'merchant_uv',
      width: '100px',
      cellRender: () => renderStatsPlaceholder(t),
    },
    {
      label: () => t('categoryType.clickRate'),
      prop: 'click_rate',
      width: '100px',
      cellRender: () => renderStatsPlaceholder(t),
    },
    {
      label: () => t('crud.status'),
      prop: 'status',
      width: '100px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          <ElSwitch
            modelValue={Number(row.status)}
            activeValue={Status.ENABLED}
            inactiveValue={Status.DISABLED}
            loading={statusLoading.value === row.id}
            disabled={!hasAuth('categoryType:save')}
            onChange={(value: string | number | boolean) => handleStatusChange(row as CategoryTypeVo, Number(value))}
          />
        </div>
      ),
    },
    {
      label: () => t('categoryType.weight'),
      prop: 'weight',
      width: '140px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          <ElInputNumber
            modelValue={Number((row as CategoryTypeVo).weight ?? 0)}
            min={0}
            max={999999}
            step={1}
            size="small"
            controlsPosition="right"
            disabled={!hasAuth('categoryType:save') || weightLoading.value === row.id}
            onChange={(value: number | undefined) => saveWeight(row as CategoryTypeVo, Number(value ?? 0))}
          />
        </div>
      ),
    },
    { label: () => t('crud.remark'), prop: 'remark', minWidth: '150px', showOverflowTooltip: true },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '170px' },
    { label: () => t('categoryType.updatedBy'), prop: 'updated_by_name', width: '110px' },
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
            disabled: () => !hasAuth('categoryType:save'),
            onClick: ({ row }) => {
              dialog.setTitle(t('crud.edit'))
              dialog.open({ formType: 'edit', data: row })
            },
          },
          {
            name: 'delete',
            icon: 'mdi:delete',
            linkProps: { type: 'danger' },
            text: () => t('crud.delete'),
            disabled: () => !hasAuth('categoryType:delete'),
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
