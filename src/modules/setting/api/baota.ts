import type { PageList, ResponseStruct } from '#/global'

/** 宝塔面板 API 配置（对应后端 App\Schema\BaoTaConfigSchema） */
export interface BaoTaConfigVo {
  /** 主键 */
  id?: number
  /** 配置名称 */
  name?: string
  /** 面板 API 地址，如 https://1.2.3.4:8888/ */
  api_url?: string
  /** 面板 API 密钥（列表接口不回显；编辑时留空表示不修改） */
  api_key?: string
  /** 状态：1 启用 / 2 禁用 */
  status?: number
  /** 权重（越小越靠前） */
  weight?: number
  /** 备注 */
  remark?: string
  /** 创建者用户 ID */
  created_by?: number
  /** 最后更新者用户 ID */
  updated_by?: number
  /** 最后更新者用户名（列表接口由后端 handleItem 补充） */
  updated_by_name?: string
  /** 创建时间 */
  created_at?: string
  /** 更新时间 */
  updated_at?: string
}

/** 启用中的配置选项（页面顶部下拉用） */
export interface BaoTaConfigOption {
  label?: string
  value?: number
  name?: string
  api_url?: string
}

/** 面板网站（后端 BaoTaService::normalizeSites 归一化后的结构；不含站点根目录，后端不返回） */
export interface BaoTaSiteVo {
  id?: number
  /** 站点主域名 */
  name?: string
  /** 站点备注 */
  ps?: string
  /** 绑定域名数量 */
  domain_count?: number
  /** 状态：1 运行中 / 0 已停止 */
  status?: number
  /** 站点 PHP 版本（如「静态」「74」） */
  php_version?: string
  /** 项目类型（PHP / 静态 等） */
  project_type?: string
  /** 创建时间 */
  addtime?: string
  /** 到期时间（0000-00-00 表示永久） */
  edate?: string
  /** 证书签发机构 */
  ssl_issuer?: string
  /** 证书到期日 */
  ssl_not_after?: string
  /** 证书剩余天数（后端由面板 ssl.endtime 取得） */
  ssl_endtime?: number | null
}

/** 站点域名 */
export interface BaoTaDomainVo {
  id?: number
  /** 所属站点 ID */
  pid?: number
  /** 域名（后端已把域名里的端口拆到 port） */
  name?: string
  /** 端口 */
  port?: number
  /** 添加时间 */
  addtime?: string
}

/** 面板连接测试结果 */
export interface BaoTaConnectionVo {
  system?: string
  version?: string
  cpu_used?: string
  cpu_num?: string
  memory_used?: string
  memory_total?: string
  uptime?: string
}

/** 通用查询入参 */
export interface BaoTaQuery {
  config_id?: number
  search?: string
  site_id?: number
  webname?: string
  [key: string]: any
}

/** API 配置列表查询条件 */
export interface BaoTaConfigSearch {
  name?: string
  api_url?: string
  status?: number
  page?: number
  page_size?: number
}

/** GET /admin/baota/list - API 配置分页列表 */
export function configPage(data: BaoTaConfigSearch): Promise<ResponseStruct<PageList<BaoTaConfigVo>>> {
  return useHttp().get('/admin/baota/list', { params: data })
}

/** GET /admin/baota/options - 启用中的配置下拉选项 */
export function configOptions(): Promise<ResponseStruct<BaoTaConfigOption[]>> {
  return useHttp().get('/admin/baota/options')
}

/** POST /admin/baota - 新增配置 */
export function configSave(data: BaoTaConfigVo): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/baota', data)
}

/** PUT /admin/baota/{id} - 更新配置（api_key 留空表示不修改） */
export function configUpdate(id: number, data: BaoTaConfigVo): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/baota/${id}`, data)
}

/** PUT /admin/baota/{id}/status - 切换配置状态 */
export function configUpdateStatus(id: number, status: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/baota/${id}/status`, { status })
}

/** DELETE /admin/baota - 批量删除配置 */
export function configDelete(ids: number[]): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/baota', { data: { ids } })
}

/**
 * POST /admin/baota/test - 测试面板连接
 *
 * 两种用法：传 id（用库里已存的密钥）或传 api_url + api_key（新增配置时试连通）。
 */
export function configTest(data: { id?: number, api_url?: string, api_key?: string }): Promise<ResponseStruct<BaoTaConnectionVo>> {
  return useHttp().post('/admin/baota/test', data)
}

/** GET /admin/baota/sites - 网站列表（后端按页返回，数据源为面板全量站点） */
export function siteList(data: BaoTaQuery): Promise<ResponseStruct<PageList<BaoTaSiteVo>>> {
  return useHttp().get('/admin/baota/sites', { params: data })
}

/** GET /admin/baota/domains - 站点域名列表 */
export function domainList(data: BaoTaQuery): Promise<ResponseStruct<BaoTaDomainVo[]>> {
  return useHttp().get('/admin/baota/domains', { params: data })
}

/** 批量添加域名的结果：成功数、失败明细（面板逐域名返回）、面板附加提示 */
export interface BaoTaDomainAddResult {
  added: number
  failed: Array<{ name: string, msg: string }>
  tip: string
}

/** POST /admin/baota/domains - 添加域名（domains 支持换行 / 逗号 / 空格分隔批量） */
export function domainAdd(data: BaoTaQuery): Promise<ResponseStruct<BaoTaDomainAddResult>> {
  return useHttp().post('/admin/baota/domains', data)
}

/** DELETE /admin/baota/domains - 删除域名 */
export function domainDelete(data: BaoTaQuery): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/baota/domains', { data })
}

/** GET /admin/baota/ssl - SSL 状态与证书信息（私钥已由后端脱敏） */
export function sslInfo(data: BaoTaQuery): Promise<ResponseStruct<Record<string, any>>> {
  return useHttp().get('/admin/baota/ssl', { params: data })
}

/**
 * GET /admin/baota/ssl/certificate - 取当前站点证书内容（私钥 + 证书全文）
 *
 * 与 sslInfo 分开：状态查询返回体不含私钥，只有证书编辑表单回显时才调这个接口。
 */
export function sslCertificate(data: BaoTaQuery): Promise<ResponseStruct<{ key: string, csr: string }>> {
  return useHttp().get('/admin/baota/ssl/certificate', { params: data })
}

/** POST /admin/baota/ssl - 部署手动粘贴的证书 */
export function sslDeploy(data: BaoTaQuery): Promise<ResponseStruct<{ updated: boolean }>> {
  return useHttp().post('/admin/baota/ssl', data)
}

/** POST /admin/baota/ssl/force-https - 开启 / 关闭强制 HTTPS */
export function sslForceHttps(data: BaoTaQuery & { enable: boolean }): Promise<ResponseStruct<Record<string, any>>> {
  return useHttp().post('/admin/baota/ssl/force-https', data)
}

/** POST /admin/baota/ssl/close - 关闭 SSL */
export function sslClose(data: BaoTaQuery): Promise<ResponseStruct<Record<string, any>>> {
  return useHttp().post('/admin/baota/ssl/close', data)
}

/**
 * POST /admin/baota/ssl/apply - 一键申请并部署 Let's Encrypt 证书
 *
 * 单独放宽超时：申请要走 ACME 文件校验（面板实测 7s 以上），
 * 用全局默认的 5s 会被前端直接取消（表现为「点了没反应」）。
 */
export function sslApply(data: BaoTaQuery): Promise<ResponseStruct<{ applied: boolean }>> {
  return useHttp().post('/admin/baota/ssl/apply', data, { timeout: 120000 })
}

/** POST /admin/baota/ssl/renew - 续签证书（同样要走 ACME 交互，放宽超时） */
export function sslRenew(data: BaoTaQuery): Promise<ResponseStruct<Record<string, any>>> {
  return useHttp().post('/admin/baota/ssl/renew', data, { timeout: 120000 })
}
