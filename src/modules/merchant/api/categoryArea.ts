import type { PageList, ResponseStruct } from '#/global'
import type { MerchantVo } from './merchant'

/** 顶部Tab区域（对应后端 category_area） */
export interface CategoryAreaVo {
  id?: number
  category_id?: number
  /** 展示类型：1~11，与商户 show_type 同值 */
  type?: number
  internal_name?: string
  explicit_name?: string
  weight?: number
  status?: number
  /** 区域下商户数（列表接口补充） */
  merchantCount?: number
  /** 展示类型名称（列表接口补充） */
  type_name?: string
  [key: string]: any
}

export interface CategoryAreaSearchVo {
  category_id?: number
}

/** GET /admin/category-area/list - 某个顶部Tab下的区域列表 */
export function list(categoryId: number): Promise<ResponseStruct<{ list: CategoryAreaVo[], showTypes: Array<{ name: string, value: number }> }>> {
  return useHttp().get('/admin/category-area/list', { params: { category_id: categoryId } })
}

/** POST /admin/category-area - 新增区域 */
export function create(data: CategoryAreaVo): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/category-area', data)
}

/** PUT /admin/category-area/{id} - 更新区域 */
export function save(id: number, data: CategoryAreaVo): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/category-area/${id}`, data)
}

/** PUT /admin/category-area/{id}/status - 列表开关切换状态 */
export function updateStatus(id: number, status: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/category-area/${id}/status`, { status })
}

/** PUT /admin/category-area/{id}/weight - 列表行内修改排序值 */
export function updateWeight(id: number, weight: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/category-area/${id}/weight`, { weight })
}

/** DELETE /admin/category-area/{id} - 删除区域 */
export function remove(id: number): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete(`/admin/category-area/${id}`)
}

/** GET /admin/category-area/{id}/merchants - 区域商户分页 */
export function merchantPage(id: number, data: { page?: number, page_size?: number }): Promise<ResponseStruct<PageList<MerchantVo>>> {
  return useHttp().get(`/admin/category-area/${id}/merchants`, { params: data })
}

/** GET /admin/category-area/{id}/merchant-sort - 区域商户排序列表 */
export function merchantSortList(id: number): Promise<ResponseStruct<{ list: MerchantVo[] }>> {
  return useHttp().get(`/admin/category-area/${id}/merchant-sort`)
}

/** POST /admin/category-area/{id}/merchant-sort - 保存区域商户排序 */
export function sortMerchants(id: number, merchantIds: number[]): Promise<ResponseStruct<null>> {
  return useHttp().post(`/admin/category-area/${id}/merchant-sort`, { merchant_ids: merchantIds })
}
