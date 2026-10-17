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
import type { ThemeVo } from '~/setting/api/theme.ts'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'

import { ElSwitch, ElTooltip } from 'element-plus'
import { deleteByIds, updateStatus } from '~/setting/api/theme.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'
import { colorOr, THEME_COLOR_FIELDS } from './colorFields.ts'
import { Status } from '@/constants/status.ts'

export default function getTableColumns(dialog: UseDialogExpose, t: any, proTableRef?: Ref<MaProTableExpose>): MaProTableColumns[] {
  const msg = useMessage()
  // 正在切换状态的行 id，用于开关的 loading 态
  const statusLoading = ref<number>()

  /**
   * 列表开关切换状态：成功后刷新列表（开关显示由数据驱动），失败给提示并同样刷新以回滚显示.
   */
  function handleStatusChange(row: ThemeVo, status: number): void {
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

  /**
   * 配色预览列：把 16 个颜色渲染成一行色点，鼠标悬停用气泡显示「字段名：色值」。
   *
   * 参考站点把 16 个颜色平铺成 16 列裸 hex，横向拉得极长且看不出效果；
   * 这里收成一列色板，既能看到配色关系，也不用横向滚很久。
   */
  function renderPalette(row: ThemeVo) {
    return (
      <div class="flex flex-wrap items-center" style={{ gap: '4px', maxWidth: '280px' }}>
        {THEME_COLOR_FIELDS.map(field => (
          <ElTooltip
            key={field.key}
            content={`${t(field.label)}：${row[field.key] || '—'}`}
            placement="top"
            showAfter={100}
          >
            <span
              style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                background: colorOr(row[field.key], '#ffffff'),
              }}
            />
          </ElTooltip>
        ))}
      </div>
    )
  }

  return [
    // 多选列
    { type: 'selection', showOverflowTooltip: false, label: () => t('crud.selection') },
    // 普通列：ID / 名称 / 配色预览 / 启用 / 权重 / 备注 / 创建时间 / 更新人
    { label: () => t('ID'), prop: 'id', width: '80px' },
    { label: () => t('theme.name'), prop: 'name', minWidth: '140px' },
    { label: () => t('theme.palette'), prop: 'name', width: '300px', cellRender: ({ row }) => renderPalette(row as ThemeVo) },
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
          disabled={!hasAuth('theme:save')}
          onChange={(value: string | number | boolean) => handleStatusChange(row as ThemeVo, Number(value))}
        />
      ),
    },
    { label: () => t('theme.weight'), prop: 'weight', width: '90px' },
    { label: () => t('crud.remark'), prop: 'remark', minWidth: '140px' },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '180px' },
    { label: () => t('theme.updatedBy'), prop: 'updated_by_name', width: '120px' },
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
