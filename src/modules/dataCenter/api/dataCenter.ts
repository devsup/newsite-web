/**
 * 数据中心 API（对应后端 App\Http\Admin\Controller\Report\DataCenterController）.
 *
 * 全部是只读查询：列表统一返回 {list,total}，统计类额外带 summary。
 * 日期筛选统一用 Y-m-d 字符串（前端 DatePicker 的 valueFormat 固定为该格式）。
 */
import type { ResponseStruct } from '#/global'

/** 区间汇总（综合统计 / 渠道统计共用） */
export interface DataCenterSummary {
  channel_pv: number
  channel_uv: number
  land_pv: number
  land_uv: number
  navi_pv: number
  navi_uv: number
  install_num: number
  install_deducted: number
  download_pv: number
  download_uv: number
  merchant_pv: number
  merchant_uv: number
  /** 商户 UV（按渠道维度去重） */
  merchant_channel_uv?: number
  /** 商户跳转 PV（与商户点击 PV 同源） */
  jump_pv?: number
  install_ratio: number
  download_ratio: number
  merchant_click_ratio: number
  channel_count?: number
  merchant_count?: number
  click_pv?: number
  click_uv?: number
  click_rate?: number
}

/** 综合统计按天行 */
export interface DataCenterDailyVo {
  stat_date: string
  channel_pv: number
  channel_uv: number
  land_pv: number
  land_uv: number
  navi_pv: number
  navi_uv: number
  install_num: number
  install_deducted: number
  download_pv: number
  download_uv: number
  merchant_pv: number
  merchant_uv: number
  /** 商户 UV（按渠道维度去重） */
  merchant_channel_uv: number
  /** 商户跳转 PV */
  jump_pv: number
  install_ratio: number
  download_ratio: number
  merchant_click_ratio: number
}

/** 渠道日统计行 */
export interface DataCenterChannelVo {
  id: number
  channel_id: number
  channel_name?: string
  channel_code?: string
  stat_date: string
  channel_pv: number
  channel_uv: number
  land_pv: number
  land_uv: number
  navi_pv: number
  navi_uv: number
  install_num: number
  install_deducted: number
  download_pv: number
  download_uv: number
  install_ratio: number
  download_ratio: number
  /** 当天该渠道的商户点击 PV/UV 与比率（来源渠道明细用） */
  merchant_pv?: number
  merchant_uv?: number
  click_ratio?: string
}

/** 商户日统计行 */
export interface DataCenterMerchantVo {
  id: number
  merchant_id: number
  merchant_name?: string
  /** 该商户当天点击涉及的渠道名称（多个用「、」连接） */
  channel_names?: string
  /** 显示名称：#ID 商户名 · 应用名 */
  display_name?: string
  stat_date: string
  click_pv: number
  click_uv: number
  click_rate: number
}

/** 上报事件明细（渠道记录 / 商户记录 / 下载记录共用） */
export interface DataCenterEventVo {
  id: number
  request_id: string
  event_type: number
  channel_id: number
  channel_name?: string
  channel_code?: string
  merchant_id: number
  merchant_name?: string
  ip: string
  browser_id: string
  client_type: number
  server_type: number
  user_agent?: string
  is_deducted: number
  occurred_at: string
}

export interface DataCenterPage<T> {
  list: T[]
  total: number
  summary: Partial<DataCenterSummary>
}

export interface DataCenterEventPage<T> {
  list: T[]
  total: number
}

export interface DataCenterOption {
  value: number
  label: string
  code?: string
}

export interface DataCenterQuery {
  start_date?: string
  end_date?: string
  channel_id?: number
  merchant_id?: number
  code?: string
  name?: string
  event_type?: number | number[] | string
  ip?: string
  browser_id?: string
  client_type?: number
  page?: number
  page_size?: number
  [key: string]: any
}

/** GET /admin/data-center/overview - 综合统计（按天 + 区间汇总） */
export function overview(params: DataCenterQuery): Promise<ResponseStruct<{
  summary: DataCenterSummary
  list: DataCenterDailyVo[]
  total: number
}>> {
  return useHttp().get('/admin/data-center/overview', { params })
}

/** GET /admin/data-center/channel/list - 渠道日统计 */
export function channelPage(params: DataCenterQuery): Promise<ResponseStruct<DataCenterPage<DataCenterChannelVo>>> {
  return useHttp().get('/admin/data-center/channel/list', { params })
}

/** 渠道访问统计 - 每日明细 */
export interface DataCenterChannelSummaryDayVo {
  stat_date: string
  channel_pv: number
  channel_uv: number
  merchant_pv: number
  merchant_uv: number
  land_pv: number
  land_uv: number
  navi_pv: number
  navi_uv: number
  install_num: number
  install_deducted: number
  download_pv: number
  download_uv: number
  install_ratio: string
  click_ratio: string
}

/** 渠道访问统计 - 渠道行（区间汇总 + 每日明细） */
export interface DataCenterChannelSummaryVo extends Omit<DataCenterChannelSummaryDayVo, 'stat_date'> {
  id: number
  channel_id: number
  channel_name: string
  channel_code: string
  stat_days: number
  date_list: DataCenterChannelSummaryDayVo[]
}

/** GET /admin/data-center/channel/summary - 渠道访问统计（按渠道聚合 + 每日明细） */
export function channelSummary(params: DataCenterQuery): Promise<ResponseStruct<{ list: DataCenterChannelSummaryVo[], total: number }>> {
  return useHttp().get('/admin/data-center/channel/summary', { params })
}

/** 渠道商户跳转明细 - 单行 */
export interface DataCenterChannelMerchantVo {
  merchant_id: number
  merchant_name: string
  merchant_pv: number
  merchant_uv: number
}

/** 渠道商户跳转明细 - 汇总 */
export interface DataCenterChannelMerchantSummary {
  merchant_count: number
  merchant_pv: number
  merchant_uv: number
}

/** GET /admin/data-center/channel/merchants - 某渠道某天的商户跳转明细 */
export function channelMerchants(params: DataCenterQuery): Promise<ResponseStruct<{
  list: DataCenterChannelMerchantVo[]
  total: number
  summary: DataCenterChannelMerchantSummary
}>> {
  return useHttp().get('/admin/data-center/channel/merchants', { params })
}

/** GET /admin/data-center/merchant/list - 商户日统计 */
export function merchantPage(params: DataCenterQuery): Promise<ResponseStruct<DataCenterPage<DataCenterMerchantVo>>> {
  return useHttp().get('/admin/data-center/merchant/list', { params })
}

/** GET /admin/data-center/channel-record/list - 渠道访问记录（落地页 / 导航页 / 安装） */
export function channelRecordPage(params: DataCenterQuery): Promise<ResponseStruct<DataCenterEventPage<DataCenterEventVo>>> {
  return useHttp().get('/admin/data-center/channel-record/list', { params })
}

/** GET /admin/data-center/merchant-record/list - 商户点击记录 */
export function merchantRecordPage(params: DataCenterQuery): Promise<ResponseStruct<DataCenterEventPage<DataCenterEventVo>>> {
  return useHttp().get('/admin/data-center/merchant-record/list', { params })
}

/** 重复访问汇总（同一 IP 当天点击次数 ≥ repeat_count） */
export interface DataCenterRepeatVo {
  ip: string
  /** 访问次数 */
  visit_count: number
  /** 涉及的商户数 */
  merchant_count: number
  /** 涉及的渠道数 */
  channel_count: number
  first_visit_at: string
  last_visit_at: string
  /** 是否已在黑名单里 */
  is_blacklisted?: boolean
  /** 黑名单状态：0 未加入 / 1 已启用 / 2 未启用 */
  blacklist_status?: number
}

/** GET /admin/data-center/merchant-record/repeat - 商户点击记录（重复访问汇总） */
export function merchantRepeatPage(params: DataCenterQuery): Promise<ResponseStruct<DataCenterEventPage<DataCenterRepeatVo>>> {
  return useHttp().get('/admin/data-center/merchant-record/repeat', { params })
}

/** DELETE /admin/data-center/merchant-record/repeat - 删除指定 IP 当天的商户点击明细 */
export function merchantRepeatDelete(params: { date: string, ips: string[] }): Promise<ResponseStruct<{ deleted: number, ips: string[] }>> {
  return useHttp().delete('/admin/data-center/merchant-record/repeat', { data: params })
}

/** GET /admin/data-center/download-record/list - App 下载记录 */
export function downloadRecordPage(params: DataCenterQuery): Promise<ResponseStruct<DataCenterEventPage<DataCenterEventVo>>> {
  return useHttp().get('/admin/data-center/download-record/list', { params })
}

/** 渠道下拉统一格式：#ID · 渠道名称 · 渠道编码（没有编码时省略最后一段） */
export function formatChannelOptionLabel(item: { value: number | string, label: string, code?: string }): string {
  const parts = [`#${item.value}`, item.label]
  if (item.code) {
    parts.push(item.code)
  }

  return parts.join(' · ')
}

/** GET /admin/data-center/channel/options - 渠道下拉 */
export function channelOptions(): Promise<ResponseStruct<DataCenterOption[]>> {
  return useHttp().get('/admin/data-center/channel/options')
}

/** GET /admin/data-center/merchant/options - 商户下拉 */
export function merchantOptions(): Promise<ResponseStruct<DataCenterOption[]>> {
  return useHttp().get('/admin/data-center/merchant/options')
}

/** 商户 → 来源渠道明细 - 单行 */
export interface DataCenterMerchantChannelVo {
  channel_id: number
  channel_name: string
  channel_code: string
  merchant_pv: number
  merchant_uv: number
}

/** GET /admin/data-center/comprehensive/merchant-channels - 某商户某天的来源渠道明细 */
export function merchantChannels(params: DataCenterQuery): Promise<ResponseStruct<{
  list: DataCenterMerchantChannelVo[]
  total: number
  summary: { channel_count: number, merchant_pv: number, merchant_uv: number }
}>> {
  return useHttp().get('/admin/data-center/comprehensive/merchant-channels', { params })
}

/**
 * GET /admin/data-center/merchant/channels - 某商户某天的来源渠道明细（商户访问统计页入口）.
 *
 * 与 comprehensive/merchant-channels 返回结构一致，但鉴权用 dataCenter:merchantLog:index，
 * 避免只授了商户统计权限的角色在「查看渠道」时被综合统计权限拦住。
 */
export function merchantLogChannels(params: DataCenterQuery): Promise<ResponseStruct<{
  list: DataCenterMerchantChannelVo[]
  total: number
  summary: { channel_count: number, merchant_pv: number, merchant_uv: number }
}>> {
  return useHttp().get('/admin/data-center/merchant/channels', { params })
}

/** GET /admin/data-center/comprehensive/channel-merchants - 某渠道某天的商户明细（综合统计弹窗用） */
export function comprehensiveChannelMerchants(params: DataCenterQuery): Promise<ResponseStruct<{
  list: DataCenterChannelMerchantVo[]
  total: number
  summary: DataCenterChannelMerchantSummary
}>> {
  return useHttp().get('/admin/data-center/comprehensive/channel-merchants', { params })
}

/** GET /admin/data-center/channel/day - 某天渠道明细 */
export function channelOfDay(date: string, params: Record<string, any> = {}): Promise<ResponseStruct<DataCenterChannelVo[]>> {
  return useHttp().get('/admin/data-center/channel/day', { params: { ...params, date } })
}

/** GET /admin/data-center/merchant/day - 某天商户明细 */
export function merchantOfDay(date: string, params: Record<string, any> = {}): Promise<ResponseStruct<DataCenterMerchantVo[]>> {
  return useHttp().get('/admin/data-center/merchant/day', { params: { ...params, date } })
}
