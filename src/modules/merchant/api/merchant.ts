import type { PageList, ResponseStruct } from '#/global'

/** 商户信息（对应后端 App\Schema\MerchantSchema） */
export interface MerchantVo {
  id?: number
  name?: string
  /** 所属顶部Tab（后端按区域反推） */
  category_id?: number
  /** 区域ID */
  category_area?: number
  /** 区域名称（列表接口补充） */
  category_area_name?: string
  /** 类目ID */
  category_type?: number
  /** 类目名称（列表接口补充） */
  category_type_name?: string
  /** 展示类型：1~11，字段随类型动态变化 */
  show_type?: number
  /** 展示名称（列表接口从 show_info 提取） */
  show_name?: string
  /** 展示类型名称（列表接口补充） */
  show_type_name?: string
  jump_url?: string
  /** 展示信息 JSON */
  show_info?: Record<string, any>
  /** 弹窗类型：1~4 */
  layer_type?: number
  /** 弹窗信息 JSON */
  layer_info?: Record<string, any>
  /** 排序值（越小越靠前） */
  weight?: number
  /** 状态：1 启用 / 2 禁用 */
  status?: number
  remark?: string
  updated_by_name?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface MerchantSearchVo {
  id?: number
  name?: string
  show_type?: number
  category_area?: number
  category_type?: number
  status?: number
  jump_url?: string
  /** 创建时间范围 ['开始', '结束']，后端按 created_at 做 between */
  created_at?: string[]
  [key: string]: any
}

/** 区域（顶部Tab下的展示区域，type = 展示类型） */
export interface MerchantAreaOption {
  id: number
  category_id: number
  type: number
  internal_name: string
  explicit_name: string
}

export interface MerchantOptions {
  categoryTypes: Array<{ id: number, name: string }>
  areas: MerchantAreaOption[]
  showTypes: Array<{ name: string, value: number }>
  layerTypes: Array<{ name: string, value: number }>
}

/** GET /admin/merchant/list - 商户分页列表 */
export function page(data: MerchantSearchVo): Promise<ResponseStruct<PageList<MerchantVo>>> {
  return useHttp().get('/admin/merchant/list', { params: data })
}

/** GET /admin/merchant/options - 表单与搜索元数据 */
export function options(): Promise<ResponseStruct<MerchantOptions>> {
  return useHttp().get('/admin/merchant/options')
}

/** POST /admin/merchant - 新增商户 */
export function create(data: MerchantVo): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/merchant', data)
}

/** PUT /admin/merchant/{id} - 更新商户 */
export function save(id: number, data: MerchantVo): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/merchant/${id}`, data)
}

/** PUT /admin/merchant/{id}/status - 列表开关切换状态 */
export function updateStatus(id: number, status: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/merchant/${id}/status`, { status })
}

/** PUT /admin/merchant/{id}/weight - 列表行内修改排序值 */
export function updateWeight(id: number, weight: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/merchant/${id}/weight`, { weight })
}

/**
 * 批量修改字段用的字段白名单.
 *
 * 与后端 `MerchantBatchUpdateRequest` / `MerchantService::BATCH_UPDATE_FIELDS` 一一对应，
 * 新增可批量修改的字段时三处一起改。
 */
export type MerchantBatchField = 'status' | 'name' | 'jump_url'

/**
 * POST /admin/merchant/batch/update - 批量修改选中商户的某个字段.
 *
 * 三个批量操作（启用/禁用、改名称、改跳转链接）共用这一个接口：
 * 后端按 field 走白名单并套用对应校验，一次 SQL 更新全部选中行。
 *
 * @param ids 选中的商户 ID
 * @param field 修改的字段（status 传 1/2，其余传字符串）
 * @param value 目标值
 */
export function batchUpdate(
  ids: number[],
  field: MerchantBatchField,
  value: number | string,
): Promise<ResponseStruct<{ updated: number }>> {
  return useHttp().post('/admin/merchant/batch/update', { ids, field, value })
}

/** DELETE /admin/merchant - 按 id 批量删除 */
export function deleteByIds(ids: number[]): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/merchant', { data: { ids } })
}
