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
}

/** 商户日统计行 */
export interface DataCenterMerchantVo {
  id: number
  merchant_id: number
  merchant_name?: string
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

/** GET /admin/data-center/download-record/list - App 下载记录 */
export function downloadRecordPage(params: DataCenterQuery): Promise<ResponseStruct<DataCenterEventPage<DataCenterEventVo>>> {
  return useHttp().get('/admin/data-center/download-record/list', { params })
}

/** GET /admin/data-center/channel/options - 渠道下拉 */
export function channelOptions(): Promise<ResponseStruct<DataCenterOption[]>> {
  return useHttp().get('/admin/data-center/channel/options')
}

/** GET /admin/data-center/merchant/options - 商户下拉 */
export function merchantOptions(): Promise<ResponseStruct<DataCenterOption[]>> {
  return useHttp().get('/admin/data-center/merchant/options')
}

/** GET /admin/data-center/channel/day - 某天渠道明细 */
export function channelOfDay(date: string): Promise<ResponseStruct<DataCenterChannelVo[]>> {
  return useHttp().get('/admin/data-center/channel/day', { params: { date } })
}

/** GET /admin/data-center/merchant/day - 某天商户明细 */
export function merchantOfDay(date: string): Promise<ResponseStruct<DataCenterMerchantVo[]>> {
  return useHttp().get('/admin/data-center/merchant/day', { params: { date } })
}
