/**
 * 主题的 16 个颜色字段元数据：字段名 / 分组 / i18n key / 默认色.
 *
 * - 列表的「配色预览」列、表单的分组与颜色选择器、「套用示例配色」都基于这份定义生成，
 *   以后加字段只改这里（前端）与后端 ThemesSaveRequest::COLOR_FIELDS 两处。
 * - default 就是「套用示例配色」与「新增时的初始值」用的那套预设，当前为紫罗兰渐变配色
 *   （主视觉用鲜明渐变、辅助区用同色系浅渐变，正文压深保证可读性）。
 */

/** 单个颜色字段的定义 */
export interface ThemeColorField {
  /** 数据表 / 接口字段名（须与后端 ThemesSaveRequest::COLOR_FIELDS 一致） */
  key: string
  /** i18n key（storage/languages/{zh_CN,zh_TW,en}/theme.php 里的同名键） */
  label: string
  /** 所属分组，表单按组渲染 */
  group: ThemeColorGroupKey
  /** 参考站点的默认色，用于「套用示例配色」 */
  default: string
}

export type ThemeColorGroupKey = 'basic' | 'header' | 'tabbar' | 'card' | 'button' | 'column'

/** 表单里的分组顺序与标题 */
export const THEME_GROUPS: Array<{ key: ThemeColorGroupKey, label: string }> = [
  { key: 'basic', label: 'theme.groupBasic' },
  { key: 'header', label: 'theme.groupHeader' },
  { key: 'tabbar', label: 'theme.groupTabbar' },
  { key: 'card', label: 'theme.groupCard' },
  { key: 'button', label: 'theme.groupButton' },
  { key: 'column', label: 'theme.groupColumn' },
]

/** 16 个颜色字段（顺序即列表色板的展示顺序）；default 即「套用示例配色」的预设值 */
export const THEME_COLOR_FIELDS: ThemeColorField[] = [
  { key: 'text_color', label: 'theme.text_color', group: 'basic', default: '#1f2937' },
  { key: 'bg_color', label: 'theme.bg_color', group: 'basic', default: '#f5f7fb' },
  { key: 'header_bg_color', label: 'theme.header_bg_color', group: 'header', default: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)' },
  { key: 'header_text_color', label: 'theme.header_text_color', group: 'header', default: '#ffffff' },
  { key: 'text_selected_color', label: 'theme.text_selected_color', group: 'header', default: '#8b5cf6' },
  { key: 'bottom_menu_bg', label: 'theme.bottom_menu_bg', group: 'tabbar', default: '#ffffff' },
  { key: 'bottom_menu_text', label: 'theme.bottom_menu_text', group: 'tabbar', default: '#94a3b8' },
  { key: 'bottom_menu_selected_color', label: 'theme.bottom_menu_selected_color', group: 'tabbar', default: '#6366f1' },
  { key: 'card_bg_color', label: 'theme.card_bg_color', group: 'card', default: '#ffffff' },
  { key: 'card_border_color', label: 'theme.card_border_color', group: 'card', default: '#e8ecf4' },
  { key: 'card_title_text_color', label: 'theme.card_title_text_color', group: 'card', default: '#1f2937' },
  { key: 'card_title_bg_color', label: 'theme.card_title_bg_color', group: 'card', default: 'linear-gradient(90deg, #eef2ff 0%, #faf5ff 100%)' },
  { key: 'button_bg_color', label: 'theme.button_bg_color', group: 'button', default: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' },
  { key: 'button_text_color', label: 'theme.button_text_color', group: 'button', default: '#ffffff' },
  { key: 'double_column_title_text_color', label: 'theme.double_column_title_text_color', group: 'column', default: '#4338ca' },
  { key: 'double_column_bg_color', label: 'theme.double_column_bg_color', group: 'column', default: 'linear-gradient(135deg, #f0f4ff 0%, #f6f0ff 100%)' },
]

/** 「套用示例配色」与「新增初始值」用的那套预设（紫罗兰渐变系） */
export function defaultThemeColors(): Record<string, string> {
  return Object.fromEntries(THEME_COLOR_FIELDS.map(field => [field.key, field.default]))
}

/**
 * 颜色为空时给一个兜底色，避免预览里出现「透明块」看不出效果.
 */
export function colorOr(value: unknown, fallback: string): string {
  const color = String(value ?? '').trim()
  return color === '' ? fallback : color
}
