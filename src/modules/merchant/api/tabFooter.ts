import type { PageList, ResponseStruct } from '#/global'

/** 底部Tab（对应后端 App\Schema\TabFooterSchema） */
export interface TabFooterVo {
  id?: number
  name?: string
  /** 默认图标地址（资源库返回） */
  icon?: string
  /** 选中图标地址 */
  icon_on?: string
  /** 排序值（越小越靠前） */
  weight?: number
  /** 状态：1 启用 / 2 禁用 */
  status?: number
  remark?: string
  /** 最后更新人用户名（列表接口补充） */
  updated_by_name?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface TabFooterSearchVo {
  id?: number
  name?: string
  status?: number
  [key: string]: any
}

/** GET /admin/tab-footer/list - 底部Tab分页列表 */
export function page(data: TabFooterSearchVo): Promise<ResponseStruct<PageList<TabFooterVo>>> {
  return useHttp().get('/admin/tab-footer/list', { params: data })
}

/** POST /admin/tab-footer - 新增底部Tab */
export function create(data: TabFooterVo): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/tab-footer', data)
}

/** PUT /admin/tab-footer/{id} - 更新底部Tab */
export function save(id: number, data: TabFooterVo): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/tab-footer/${id}`, data)
}

/** PUT /admin/tab-footer/{id}/status - 列表开关切换状态 */
export function updateStatus(id: number, status: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/tab-footer/${id}/status`, { status })
}

/** PUT /admin/tab-footer/{id}/weight - 列表行内修改排序值 */
export function updateWeight(id: number, weight: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/tab-footer/${id}/weight`, { weight })
}

/** DELETE /admin/tab-footer - 按 id 批量删除 */
export function deleteByIds(ids: number[]): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/tab-footer', { data: { ids } })
}
