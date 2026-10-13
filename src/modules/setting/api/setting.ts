import type { ResponseStruct } from '#/global'

export interface SettingOption {
  label: string
  value: number | string
}

export interface SettingItemVo {
  id?: number
  key: string
  name: string
  value?: any
  input_type?: string
  config_select_data?: null | SettingOption[]
  sort?: number
  remark?: string
}

/** 站点设置 - 全部配置项 */
export function index(): Promise<ResponseStruct<SettingItemVo[]>> {
  return useHttp().get('/admin/setting/index')
}

/** 站点设置 - 批量保存（带 id 的更新，不带 id 的新增） */
export function save(rows: SettingItemVo[]): Promise<ResponseStruct<{ saved: number }>> {
  return useHttp().put('/admin/setting/save', { rows })
}

/** 站点设置 - 按 id 删除 */
export function deleteByIds(ids: number[]): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/setting', { data: { ids } })
}
