import type { ResponseStruct } from '#/global'

/** 底部Tab与顶部Tab的绑定关系（对应后端 App\Schema\TabFooterRelSchema） */
export interface TabFooterRelVo {
  id?: number
  footer_id?: number
  category_id?: number
  /** 顶部Tab名称（列表接口补充） */
  category_name?: string
  /** 顶部Tab状态：1 启用 / 2 禁用 */
  category_status?: number
  weight?: number
  created_at?: string
  [key: string]: any
}

/** 可绑定的顶部Tab选项 */
export interface TabFooterRelOptionVo {
  id: number
  name: string
  status: number
  /** 当前底部Tab是否已绑定 */
  bound: boolean
}

/** GET /admin/tab-footer/rel/list - 已绑定的顶部Tab列表 */
export function list(footerId: number): Promise<ResponseStruct<{ list: TabFooterRelVo[], total: number }>> {
  return useHttp().get('/admin/tab-footer/rel/list', { params: { footer_id: footerId } })
}

/** GET /admin/tab-footer/rel/options - 可绑定的顶部Tab选项 */
export function options(footerId: number): Promise<ResponseStruct<TabFooterRelOptionVo[]>> {
  return useHttp().get('/admin/tab-footer/rel/options', { params: { footer_id: footerId } })
}

/** POST /admin/tab-footer/rel/bind - 批量绑定顶部Tab */
export function bind(footerId: number, categoryIds: number[]): Promise<ResponseStruct<{ bound: number }>> {
  return useHttp().post('/admin/tab-footer/rel/bind', {
    footer_id: footerId,
    category_ids: categoryIds,
  })
}

/** PUT /admin/tab-footer/rel/{id}/weight - 修改绑定排序值 */
export function updateWeight(id: number, weight: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/tab-footer/rel/${id}/weight`, { weight })
}

/** DELETE /admin/tab-footer/rel/{id} - 解绑 */
export function remove(id: number): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete(`/admin/tab-footer/rel/${id}`)
}
