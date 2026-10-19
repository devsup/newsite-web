/**
 * 渠道的「打开方式」与「推送类型」取值.
 *
 * 与后端 App\Model\Channel\Channel 里的常量一一对应，别在页面里写裸数字：
 * open_mode：1 自适应（跟随系统设置的运行模式）/ 2 落地页 / 3 导航页
 * bot_link_type：0 禁用 / 1 自适应 / 2 落地页 / 3 导航页（1~3 与 open_mode 同构）
 */
export const OPEN_MODE = {
  /** 自适应（跟随系统设置 → 运行模式；渠道设置优先） */
  AUTO: 1,
  /** 落地页 */
  LAND: 2,
  /** 导航页 */
  NAVI: 3,
} as const

export const PUSH_TYPE = {
  /** 禁用推送 */
  DISABLED: 0,
  /** 自适应 */
  AUTO: 1,
  /** 落地页 */
  LAND: 2,
  /** 导航页 */
  NAVI: 3,
} as const

export type OpenModeValue = typeof OPEN_MODE[keyof typeof OPEN_MODE]
export type PushTypeValue = typeof PUSH_TYPE[keyof typeof PUSH_TYPE]
