/**
 * 字典名常量（与后端 storage/languages/* 及字典接口里的 key 对应）.
 *
 * 页面里直接写字符串容易拼错，而且拼错时下拉只是「空选项」、不报错，很难发现。
 */
/** 系统状态字典：1 启用 / 2 禁用（对应 App\Model\Enums\Status） */
export const DICT_SYSTEM_STATUS = 'system-status'

/** 登录状态字典：1 成功 / 2 失败（对应 App\Model\Enums\User\Status） */
export const DICT_SYSTEM_STATE = 'system-state'
