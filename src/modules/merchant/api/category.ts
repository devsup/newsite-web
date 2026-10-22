import type { PageList, ResponseStruct } from '#/global'

/** 顶部Tab（对应后端 App\Schema\CategorySchema） */
export interface CategoryVo {
  id?: number
  name?: string
  /** 排序值（越小越靠前） */
  weight?: number
  /** 状态：1 启用 / 2 禁用 */
  status?: number
  remark?: string
  /** 区域数量（列表接口补充） */
  area_count?: number
  /** 最后更新人用户名（列表接口补充） */
  updated_by_name?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface CategorySearchVo {
  id?: number
  name?: string
  status?: number
  [key: string]: any
}

/** 顶部Tab按天统计行 */
export interface CategoryDailyVo {
  /** 统计日期（Y-m-d） */
  created_date?: string
  /** 该 Tab 当天商户点击 PV */
  merchant_pv?: number
  /** 该 Tab 当天商户点击 UV */
  merchant_uv?: number
  /** 点击率（百分比数值） */
  click_rate?: number
  [key: string]: any
}

/** GET /admin/category/daily-stats - 顶部Tab按天统计 */
export function dailyStats(categoryId: number, params: Record<string, any> = {}): Promise<ResponseStruct<PageList<CategoryDailyVo>>> {
  return useHttp().get('/admin/category/daily-stats', { params: { ...params, category_id: categoryId } })
}

/** GET /admin/category/list - 顶部Tab分页列表 */
export function page(data: CategorySearchVo): Promise<ResponseStruct<PageList<CategoryVo>>> {
  return useHttp().get('/admin/category/list', { params: data })
}

/** POST /admin/category - 新增顶部Tab */
export function create(data: CategoryVo): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/category', data)
}

/** PUT /admin/category/{id} - 更新顶部Tab */
export function save(id: number, data: CategoryVo): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/category/${id}`, data)
}

/** PUT /admin/category/{id}/status - 列表开关切换状态 */
export function updateStatus(id: number, status: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/category/${id}/status`, { status })
}

/** PUT /admin/category/{id}/weight - 列表行内修改排序值 */
export function updateWeight(id: number, weight: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/category/${id}/weight`, { weight })
}

/** DELETE /admin/category - 按 id 批量删除 */
export function deleteByIds(ids: number[]): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/category', { data: { ids } })
}
