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
import type { BaoTaConfigVo } from '~/setting/api/baota.ts'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'

import { ElSwitch } from 'element-plus'
import { configDelete, configUpdateStatus } from '~/setting/api/baota.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

/**
 * API 配置列表列。
 *
 * 比参考站点多出的部分：状态做成列表开关可直接切换、批量勾选删除、展示创建时间与更新人。
 * 密钥一列刻意不存在——列表接口根本不返回密钥，只能看到配置是否可用（状态开关）。
 */
export default function getConfigTableColumns(
  dialog: UseDialogExpose,
  t: any,
  proTableRef?: Ref<MaProTableExpose>,
): MaProTableColumns[] {
  const msg = useMessage()
  // 正在切换状态的行 id，用于开关的 loading 态
  const statusLoading = ref<number>()

  /** 列表开关切换状态：成功后刷新列表，失败给提示并同样刷新以回滚显示 */
  function handleStatusChange(row: BaoTaConfigVo, status: number): void {
    statusLoading.value = row.id
    configUpdateStatus(row.id as number, status).then((response) => {
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
    { type: 'selection', showOverflowTooltip: false, label: () => t('crud.selection') },
    { label: () => t('ID'), prop: 'id', width: '70px' },
    { label: () => t('baota.configName'), prop: 'name', minWidth: '130px' },
    { label: () => t('baota.apiUrl'), prop: 'api_url', minWidth: '230px', showOverflowTooltip: true },
    {
      label: () => t('crud.status'),
      prop: 'status',
      width: '90px',
      cellRender: ({ row }) => (
        <ElSwitch
          modelValue={Number(row.status)}
          activeValue={1}
          inactiveValue={2}
          loading={statusLoading.value === row.id}
          disabled={!hasAuth('baota:save')}
          onChange={(value: string | number | boolean) => handleStatusChange(row, Number(value))}
        />
      ),
    },
    { label: () => t('baota.weight'), prop: 'weight', width: '80px' },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '170px' },
    { label: () => t('baota.updatedBy'), prop: 'updated_by_name', width: '110px' },
    {
      type: 'operation',
      label: () => t('crud.operation'),
      width: '150px',
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
                const response = await configDelete([row.id as number])
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
