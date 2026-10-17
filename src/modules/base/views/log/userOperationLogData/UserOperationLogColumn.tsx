/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { MaProTableColumns } from '@mineadmin/pro-table'
import { ElButton } from 'element-plus'

/**
 * 操作日志列表列.
 *
 * 日志只读：没有多选列、也没有删除操作（后端接口与按钮权限已一并移除）。
 *
 * @param t 全局翻译函数
 * @param openParams 打开「请求参数」弹窗的回调（参数 JSON 太长，列表里只给入口）
 */
export default function getColumns(t: any, openParams: (row: any) => void): MaProTableColumns[] {
  return [
    // 索引序号列
    { type: 'index' },
    // 普通列
    { label: () => t('baseOperationLog.username'), prop: 'username' },
    { label: () => t('baseOperationLog.method'), prop: 'method' },
    { label: () => t('baseOperationLog.router'), prop: 'router', minWidth: 220 },
    { label: () => t('baseOperationLog.service_name'), prop: 'service_name' },
    { label: () => t('baseOperationLog.ip'), prop: 'ip' },
    {
      // 参数键名可能很多，列表里只给「N 项 · 查看」，点击后用 JSON 查看器展示完整内容
      label: () => t('baseOperationLog.request_data'),
      prop: 'request_data',
      minWidth: 130,
      showOverflowTooltip: false,
      cellRender: ({ row }) => {
        const data = row?.request_data
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
          return <span class="text-[var(--el-text-color-placeholder)]">-</span>
        }
        return (
          <ElButton link type="primary" onClick={() => openParams(row)}>
            {t('baseOperationLog.viewParams', { count: Object.keys(data).length })}
          </ElButton>
        )
      },
    },
    { label: () => t('baseOperationLog.created_at'), prop: 'created_at', minWidth: 170 },
  ]
}
