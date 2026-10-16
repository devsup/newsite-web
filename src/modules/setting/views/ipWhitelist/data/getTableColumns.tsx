/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { MaProTableColumns, MaProTableExpose } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { IpWhitelistVo } from '~/setting/api/ipWhitelist.ts'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'

import { ElSwitch } from 'element-plus'
import { deleteByIds, updateStatus } from '~/setting/api/ipWhitelist.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

export default function getTableColumns(dialog: UseDialogExpose, t: any, proTableRef?: Ref<MaProTableExpose>): MaProTableColumns[] {
  const msg = useMessage()
  // 正在切换状态的行 id，用于开关的 loading 态
  const statusLoading = ref<number>()

  /**
   * 列表开关切换状态：成功后刷新列表（开关显示由数据驱动），失败给提示并同样刷新以回滚显示.
   */
  function handleStatusChange(row: IpWhitelistVo, status: number): void {
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

  return [
    // 多选列
    { type: 'selection', showOverflowTooltip: false, label: () => t('crud.selection') },
    // 普通列
    { label: () => t('ID'), prop: 'id', width: '80px' },
    { label: () => t('ipWhitelist.ip'), prop: 'ip', minWidth: '180px' },
    { label: () => t('ipWhitelist.remark'), prop: 'remark', minWidth: '200px' },
    {
      label: () => t('crud.status'),
      prop: 'status',
      width: '100px',
      cellRender: ({ row }) => (
        <ElSwitch
          modelValue={Number(row.status)}
          activeValue={1}
          inactiveValue={2}
          loading={statusLoading.value === row.id}
          disabled={!hasAuth('ipWhitelist:save')}
          onChange={(value: string | number | boolean) => handleStatusChange(row, Number(value))}
        />
      ),
    },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '180px' },
    { label: () => t('ipWhitelist.updatedBy'), prop: 'updated_by_name', width: '120px' },
    // 操作列
    {
      type: 'operation',
      label: () => t('crud.operation'),
      width: '180px',
      operationConfigure: {
        type: 'tile',
        actions: [
          {
            name: 'edit',
            icon: 'material-symbols:edit-outline-rounded',
            text: () => t('crud.edit'),
            onClick: ({ row }) => {
              dialog.setTitle(t('crud.edit'))
              dialog.open({ formType: 'edit', data: row })
            },
          },
          {
            name: 'del',
            icon: 'material-symbols:delete-outline-rounded',
            linkProps: { type: 'danger' },
            text: () => t('crud.delete'),
            onClick: ({ row }, proxy: MaProTableExpose) => {
              msg.delConfirm(t('crud.delDataMessage')).then(async () => {
                const response = await deleteByIds([row.id as number])
                if (response.code === ResultCode.SUCCESS) {
                  msg.success(t('crud.delSuccess'))
                  await proxy.refresh()
                }
              })
            },
          },
        ],
      },
    },
  ] as MaProTableColumns[]
}
