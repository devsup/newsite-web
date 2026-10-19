/**
 * 商户「弹窗类型」取值（与后端 App\Model\Enums\Merchant\LayerType 一致）.
 *
 * 展示类型（show_type 1~11）的字段定义在 views/merchant/data/fieldConfig.ts，
 * 那里按类型分组维护，不需要再单独抽常量。
 */
export const LAYER_TYPE = {
  /** 直接跳转 */
  DIRECT_JUMP: 1,
  /** 全屏图文 */
  FULL_SCREEN_GRAPHIC: 2,
  /** 应用图文 */
  APPLICATION_GRAPHIC: 3,
  /** 标题文案 */
  TITLE_COPY: 4,
} as const

export type LayerTypeValue = typeof LAYER_TYPE[keyof typeof LAYER_TYPE]

/**
 * 商户列表「商户类型」标签配色（show_type 1~11）.
 *
 * 只用于展示层，不参与业务判断；每种模板给一个固定色相，便于在长列表里快速区分。
 * 值使用 6 位hex，渲染时追加透明度生成浅底、边框和文字色。
 */
export const SHOW_TYPE_COLORS: Record<number, string> = {
  1: '#409eff', // 轮播图
  2: '#06b6d4', // 纯按钮
  3: '#f59e0b', // 商城模版
  4: '#ef4444', // 直播模版
  5: '#8b5cf6', // 图标一列模版
  6: '#6366f1', // 图标两列模版
  7: '#10b981', // 图标五列模版
  8: '#f97316', // 图文详情模版
  9: '#14b8a6', // 视频图文模版
  10: '#ec4899', // 浮窗广告模版
  11: '#84cc16', // 落地页广告模版
}
