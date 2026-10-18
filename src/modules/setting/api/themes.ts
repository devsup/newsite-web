import type { PageList, ResponseStruct } from '#/global'

/** 主题记录（对应后端 App\Schema\ThemesSchema）：一条 = 一套配色方案 */
export interface ThemesVo {
  /** 主键 */
  id?: number
  /** 主题名称 */
  name?: string
  /** 16 个颜色字段（键与后端 ThemesSaveRequest::COLOR_FIELDS 一致） */
  text_color?: string
  bg_color?: string
  header_bg_color?: string
  header_text_color?: string
  text_selected_color?: string
  bottom_menu_bg?: string
  bottom_menu_text?: string
  bottom_menu_selected_color?: string
  card_bg_color?: string
  card_border_color?: string
  card_title_text_color?: string
  card_title_bg_color?: string
  button_bg_color?: string
  button_text_color?: string
  double_column_title_text_color?: string
  double_column_bg_color?: string
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
  /** 最后更新者用户名（列表接口由后端 handleItems 补充） */
  updated_by_name?: string
  /** 创建时间 */
  created_at?: string
  /** 更新时间 */
  updated_at?: string
  [key: string]: any
}

/** 列表查询条件 */
export interface ThemesSearchVo {
  /** 主键，精确匹配 */
  id?: number
  /** 主题名称，模糊匹配 */
  name?: string
  /** 状态：1 启用 / 2 禁用 */
  status?: number
  [key: string]: any
}

/** GET /admin/themes/list - 分页列表（按权重升序，数值越小越靠前） */
export function page(data: ThemesSearchVo): Promise<ResponseStruct<PageList<ThemesVo>>> {
  return useHttp().get('/admin/themes/list', { params: data })
}

/** POST /admin/themes - 新增 */
export function create(data: ThemesVo): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/themes', data)
}

/** PUT /admin/themes/{id} - 更新 */
export function save(id: number, data: ThemesVo): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/themes/${id}`, data)
}

/** PUT /admin/themes/{id}/status - 切换状态（列表开关，只改 status） */
export function updateStatus(id: number, status: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/themes/${id}/status`, { status })
}

/** DELETE /admin/themes - 按 id 批量删除 */
export function deleteByIds(ids: number[]): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/themes', { data: { ids } })
}
