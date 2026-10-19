import type { PageList, ResponseStruct } from '#/global'

/**
 * 商户类目（对应后端 App\Schema\CategoryTypeSchema）。
 *
 * 统计字段当前没有后端来源，列表统一显示 --；
 * 后续数据中心接入后再补 merchant_number / merchant_pv / merchant_uv / click_rate 等字段.
 */
export interface CategoryTypeVo {
  id?: number
  name?: string
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

export interface CategoryTypeSearchVo {
  id?: number
  name?: string
  status?: number
  [key: string]: any
}

/** GET /admin/category-type/list - 类目分页列表 */
export function page(data: CategoryTypeSearchVo): Promise<ResponseStruct<PageList<CategoryTypeVo>>> {
  return useHttp().get('/admin/category-type/list', { params: data })
}

/** POST /admin/category-type - 新增类目 */
export function create(data: CategoryTypeVo): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/category-type', data)
}

/** PUT /admin/category-type/{id} - 更新类目 */
export function save(id: number, data: CategoryTypeVo): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/category-type/${id}`, data)
}

/** PUT /admin/category-type/{id}/status - 列表开关切换状态 */
export function updateStatus(id: number, status: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/category-type/${id}/status`, { status })
}

/** PUT /admin/category-type/{id}/weight - 列表行内修改排序值 */
export function updateWeight(id: number, weight: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/category-type/${id}/weight`, { weight })
}

/** DELETE /admin/category-type - 按 id 批量删除 */
export function deleteByIds(ids: number[]): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/category-type', { data: { ids } })
}
