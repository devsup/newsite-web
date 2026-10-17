import type { MaProTableColumns, MaProTableExpose } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { MerchantOptions, MerchantVo } from '~/merchant/api/merchant'

import { useDebounceFn } from '@vueuse/core'
import { ElInputNumber, ElSwitch, ElTag, ElTooltip } from 'element-plus'
import { deleteByIds, updateStatus, updateWeight } from '~/merchant/api/merchant'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

export default function getTableColumns(
  dialog: UseDialogExpose,
  t: any,
  proTableRef: Ref<MaProTableExpose>,
  options: MerchantOptions,
): MaProTableColumns[] {
  const msg = useMessage()
  const statusLoading = ref<number>()
  const weightLoading = ref<number>()

  const showTypeNameMap: Record<number, string> = Object.fromEntries(
    options.showTypes.map(item => [item.value, item.name]),
  )

  function handleStatusChange(row: MerchantVo, status: number): void {
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

  const saveWeight = useDebounceFn((row: MerchantVo, weight: number) => {
    if (weight === row.weight) {
      return
    }
    weightLoading.value = row.id
    updateWeight(row.id as number, weight).then((response) => {
      if (response.code === ResultCode.SUCCESS) {
        row.weight = weight
        msg.success(t('merchantInfo.weightSaved'))
      }
      else {
        msg.error(response.message)
      }
      proTableRef.value?.refresh()
    }).finally(() => {
      weightLoading.value = undefined
    })
  }, 400)

  /** 统计列占位：数据中心统一接入前不展示伪 0 */
  function renderStatsPlaceholder() {
    return (
      <div class="flex-center">
        <ElTooltip content={t('merchantInfo.statsPlaceholder')} placement="top" showAfter={100}>
          <span style={{ color: 'var(--el-text-color-placeholder)', cursor: 'help' }}>--</span>
        </ElTooltip>
      </div>
    )
  }

  function copyLink(url?: string): void {
    if (!url) {
      return
    }
    const fallback = (): boolean => {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    }
    const done = (ok: boolean): void => {
      ok ? msg.success(t('merchantInfo.copySuccess')) : msg.error(t('merchantInfo.copyFail'))
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => done(true)).catch(() => done(fallback()))
      return
    }
    done(fallback())
  }

  return [
    { type: 'selection', showOverflowTooltip: false, label: () => t('crud.selection') },
    { label: () => t('merchantInfo.id'), prop: 'id', width: '80px' },
    { label: () => t('merchantInfo.name'), prop: 'name', minWidth: '140px' },
    { label: () => t('merchantInfo.showName'), prop: 'show_name', minWidth: '140px', showOverflowTooltip: true },
    {
      label: () => t('merchantInfo.merchantPv'),
      prop: 'merchant_pv',
      width: '100px',
      cellRender: () => renderStatsPlaceholder(),
    },
    {
      label: () => t('merchantInfo.merchantUv'),
      prop: 'merchant_uv',
      width: '100px',
      cellRender: () => renderStatsPlaceholder(),
    },
    {
      label: () => t('merchantInfo.showType'),
      prop: 'show_type',
      width: '130px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          <ElTag type="info" size="small">{showTypeNameMap[Number((row as MerchantVo).show_type)] ?? '--'}</ElTag>
        </div>
      ),
    },
    { label: () => t('merchantInfo.categoryArea'), prop: 'category_area_name', minWidth: '170px', showOverflowTooltip: true },
    { label: () => t('merchantInfo.categoryType'), prop: 'category_type_name', width: '120px' },
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
            disabled={!hasAuth('merchant:save')}
            onChange={(value: string | number | boolean) => handleStatusChange(row as MerchantVo, Number(value))}
          />
        </div>
      ),
    },
    {
      label: () => t('merchantInfo.weight'),
      prop: 'weight',
      width: '140px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          <ElInputNumber
            modelValue={Number((row as MerchantVo).weight ?? 0)}
            min={0}
            max={999999}
            size="small"
            controlsPosition="right"
            disabled={!hasAuth('merchant:save') || weightLoading.value === row.id}
            onChange={(value: number | undefined) => saveWeight(row as MerchantVo, Number(value ?? 0))}
          />
        </div>
      ),
    },
    {
      label: () => t('merchantInfo.jumpLink'),
      minWidth: '240px',
      showOverflowTooltip: false,
      cellRender: ({ row }) => {
        const url = (row as MerchantVo).jump_url
        if (!url) {
          return <span style={{ color: 'var(--el-text-color-placeholder)' }}>--</span>
        }
        return (
          <ElTooltip content={url} placement="top" showAfter={100}>
            <span
              class="truncate"
              style={{ color: 'var(--el-color-primary)', cursor: 'pointer', maxWidth: '100%' }}
              onClick={() => copyLink(url)}
            >
              {url}
            </span>
          </ElTooltip>
        )
      },
    },
    { label: () => t('crud.remark'), prop: 'remark', minWidth: '150px', showOverflowTooltip: true },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '170px' },
    { label: () => t('merchantInfo.updatedBy'), prop: 'updated_by_name', width: '110px' },
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
            disabled: () => !hasAuth('merchant:save'),
            onClick: ({ row }) => {
              dialog.setTitle(t('crud.edit'))
              dialog.open({ formType: 'edit', data: row })
            },
          },
          {
            name: 'delete',
            icon: 'mdi:delete',
            text: () => t('crud.delete'),
            disabled: () => !hasAuth('merchant:delete'),
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
