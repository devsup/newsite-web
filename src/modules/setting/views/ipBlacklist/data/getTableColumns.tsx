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
import type { IpBlacklistVo } from '~/setting/api/ipBlacklist.ts'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'

import { ElSwitch } from 'element-plus'
import { deleteByIds, updateStatus } from '~/setting/api/ipBlacklist.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'
import { Status } from '@/constants/status.ts'

export default function getTableColumns(dialog: UseDialogExpose, t: any, proTableRef?: Ref<MaProTableExpose>): MaProTableColumns[] {
  const msg = useMessage()
  // 正在切换状态的行 id，用于开关的 loading 态
  const statusLoading = ref<number>()

  /**
   * 列表开关切换状态：成功后刷新列表（开关显示由数据驱动），失败给提示并同样刷新以回滚显示.
   */
  function handleStatusChange(row: IpBlacklistVo, status: number): void {
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
    // 普通列：ID / IP / 封禁原因 / 状态（开关）/ 备注 / 创建时间 / 更新人
    { label: () => t('ID'), prop: 'id', width: '80px' },
    { label: () => t('ipBlacklist.ip'), prop: 'ip', minWidth: '170px' },
    { label: () => t('ipBlacklist.banReason'), prop: 'ban_reason', minWidth: '170px' },
    {
      label: () => t('crud.status'),
      prop: 'status',
      width: '100px',
      cellRender: ({ row }) => (
        <ElSwitch
          modelValue={Number(row.status)}
          activeValue={Status.ENABLED}
          inactiveValue={Status.DISABLED}
          loading={statusLoading.value === row.id}
          disabled={!hasAuth('ipBlacklist:save')}
          onChange={(value: string | number | boolean) => handleStatusChange(row, Number(value))}
        />
      ),
    },
    { label: () => t('crud.remark'), prop: 'remark', minWidth: '150px' },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '180px' },
    { label: () => t('ipBlacklist.updatedBy'), prop: 'updated_by_name', width: '120px' },
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
