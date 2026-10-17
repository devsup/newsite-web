import type { MaProTableColumns, MaProTableExpose } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { TabFooterVo } from '~/merchant/api/tabFooter'

import { useDebounceFn } from '@vueuse/core'
import { ElAvatar, ElInputNumber, ElSwitch } from 'element-plus'
import { deleteByIds, updateStatus, updateWeight } from '~/merchant/api/tabFooter'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

export default function getTableColumns(
  dialog: UseDialogExpose,
  t: any,
  proTableRef: Ref<MaProTableExpose>,
  openBind: (row: TabFooterVo) => void,
): MaProTableColumns[] {
  const msg = useMessage()
  const statusLoading = ref<number>()
  const weightLoading = ref<number>()

  function handleStatusChange(row: TabFooterVo, status: number): void {
    statusLoading.value = row.id
    updateStatus(row.id as number, status).then((response) => {
      if (response.code === ResultCode.SUCCESS) {
        msg.success(t('crud.updateSuccess'))
      }
      else {
        msg.error(response.message)
      }
      proTableRef.value?.refresh()
    }).finally(() => {
      statusLoading.value = undefined
    })
  }

  const saveWeight = useDebounceFn((row: TabFooterVo, weight: number) => {
    if (weight === row.weight) {
      return
    }
    weightLoading.value = row.id
    updateWeight(row.id as number, weight).then((response) => {
      if (response.code === ResultCode.SUCCESS) {
        row.weight = weight
        msg.success(t('tabFooter.weightSaved'))
      }
      else {
        msg.error(response.message)
      }
      proTableRef.value?.refresh()
    }).finally(() => {
      weightLoading.value = undefined
    })
  }, 400)

  /** 图标列：资源库返回的是图片地址，空值显示 `--` */
  function renderIcon(url?: string, name?: string) {
    if (!url) {
      return <span style={{ color: 'var(--el-text-color-placeholder)' }}>--</span>
    }
    return <ElAvatar shape="square" size={32} src={url} alt={name ?? ''} />
  }

  return [
    { type: 'selection', showOverflowTooltip: false, label: () => t('crud.selection') },
    { label: () => t('ID'), prop: 'id', width: '90px' },
    { label: () => t('tabFooter.name'), prop: 'name', minWidth: '140px' },
    {
      label: () => t('tabFooter.icon'),
      prop: 'icon',
      width: '90px',
      cellRender: ({ row }) => <div class="flex-center">{renderIcon((row as TabFooterVo).icon, (row as TabFooterVo).name)}</div>,
    },
    {
      label: () => t('tabFooter.iconOn'),
      prop: 'icon_on',
      width: '100px',
      cellRender: ({ row }) => <div class="flex-center">{renderIcon((row as TabFooterVo).icon_on, (row as TabFooterVo).name)}</div>,
    },
    {
      label: () => t('tabFooter.weight'),
      prop: 'weight',
      width: '140px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          <ElInputNumber
            modelValue={Number((row as TabFooterVo).weight ?? 0)}
            min={0}
            max={999999}
            step={1}
            size="small"
            controlsPosition="right"
            disabled={!hasAuth('tabFooter:save') || weightLoading.value === row.id}
            onChange={(value: number | undefined) => saveWeight(row as TabFooterVo, Number(value ?? 0))}
          />
        </div>
      ),
    },
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
            disabled={!hasAuth('tabFooter:save')}
            onChange={(value: string | number | boolean) => handleStatusChange(row as TabFooterVo, Number(value))}
          />
        </div>
      ),
    },
    { label: () => t('crud.remark'), prop: 'remark', minWidth: '150px', showOverflowTooltip: true },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '170px' },
    { label: () => t('tabFooter.updatedBy'), prop: 'updated_by_name', width: '110px' },
    {
      type: 'operation',
      label: () => t('crud.operation'),
      fixed: 'right',
      width: '260px',
      operationConfigure: {
        type: 'tile',
        actions: [
          {
            name: 'bind',
            icon: 'i-ep:connection',
            text: () => t('tabFooter.bindTop'),
            disabled: () => !hasAuth('tabFooter:save'),
            onClick: ({ row }) => openBind(row as TabFooterVo),
          },
          {
            name: 'edit',
            icon: 'material-symbols:person-edit',
            text: () => t('crud.edit'),
            disabled: () => !hasAuth('tabFooter:save'),
            onClick: ({ row }) => {
              dialog.setTitle(t('crud.edit'))
              dialog.open({ formType: 'edit', data: row })
            },
          },
          {
            name: 'delete',
            icon: 'mdi:delete',
            text: () => t('crud.delete'),
            disabled: () => !hasAuth('tabFooter:delete'),
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
