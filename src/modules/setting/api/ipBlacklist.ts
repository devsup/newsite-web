import type { PageList, ResponseStruct } from '#/global'

/** IP 黑名单记录（对应后端 App\Schema\IpBlacklistSchema） */
export interface IpBlacklistVo {
  /** 主键 */
  id?: number
  /** 单 IP 或 CIDR 网段 */
  ip?: string
  /** 封禁原因（必填，便于追溯为什么封） */
  ban_reason?: string
  /** 备注（补充说明，可空） */
  remark?: string
  /** 状态：1 启用（封禁生效）/ 2 禁用（已解封） */
  status?: number
  /** 创建者用户 ID */
  created_by?: number
  /** 最后更新者用户 ID */
  updated_by?: number
  /** 最后更新者用户名（列表接口由后端 handleItems 补充） */
  updated_by_name?: string
  /** 创建时间 */
  created_at?: string
  /** 更新时间 */
  updated_at?: string
}

/** 列表查询条件 */
export interface IpBlacklistSearchVo {
  /** IP / 网段，模糊匹配 */
  ip?: string
  /** 封禁原因，模糊匹配 */
  ban_reason?: string
  /** 备注，模糊匹配 */
  remark?: string
  /** 状态：1 启用 / 2 禁用 */
  status?: number
  [key: string]: any
}

/** GET /admin/ip-blacklist/list - 分页列表 */
export function page(data: IpBlacklistSearchVo): Promise<ResponseStruct<PageList<IpBlacklistVo>>> {
  return useHttp().get('/admin/ip-blacklist/list', { params: data })
}

/** GET /admin/ip-blacklist/current-ip - 当前请求的客户端 IP（页面右上角展示） */
export function currentIp(): Promise<ResponseStruct<{ ip: string }>> {
  return useHttp().get('/admin/ip-blacklist/current-ip')
}

/** POST /admin/ip-blacklist - 新增单条 */
export function create(data: IpBlacklistVo): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/ip-blacklist', data)
}

/** POST /admin/ip-blacklist/batch - 批量新增（一次提交多个 IP / 网段，返回创建与跳过明细） */
export function createBatch(data: { ips: string[], ban_reason: string, remark?: string, status?: number }): Promise<ResponseStruct<{ created: number, skipped: string[] }>> {
  return useHttp().post('/admin/ip-blacklist/batch', data)
}

/** PUT /admin/ip-blacklist/{id} - 更新单条 */
export function save(id: number, data: IpBlacklistVo): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/ip-blacklist/${id}`, data)
}

/** PUT /admin/ip-blacklist/{id}/status - 切换状态（列表开关，只改 status） */
export function updateStatus(id: number, status: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/ip-blacklist/${id}/status`, { status })
}

/** DELETE /admin/ip-blacklist - 按 id 批量删除 */
export function deleteByIds(ids: number[]): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/ip-blacklist', { data: { ids } })
}
