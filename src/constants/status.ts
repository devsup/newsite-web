/**
 * 全站启停状态（与后端 `App\Model\Enums\Status` 一一对应）.
 *
 * 业务代码里不要再写裸的 `1` / `2`：
 * - 开关：`<el-switch :active-value="Status.ENABLED" :inactive-value="Status.DISABLED" />`
 * - 表单默认值：`status: Status.ENABLED`
 * - 判断：`row.status === Status.ENABLED`
 *
 * 展示文案仍走字典 `system-status`（`dictStore.t('system-status', value, 'i18n')`），
 * 这里只统一「值」。
 */
export const Status = {
  /** 启用 */
  ENABLED: 1,
  /** 禁用 */
  DISABLED: 2,
} as const

export type StatusValue = typeof Status[keyof typeof Status]
