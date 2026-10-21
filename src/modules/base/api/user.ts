/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { PageList, ResponseStruct } from '#/global'

export interface CurrentUserDepartmentVo {
  id: number
  name: string
}

export interface CurrentUserPositionVo {
  id: number
  dept_id: number
  name: string
}

export interface CurrentUserRoleVo {
  id: number
  code: string
  name: string
}

export interface CurrentUserInfo {
  id: number
  username: string
  nickname: string
  avatar?: string | null
  phone?: string | null
  email?: string | null
  signed?: string | null
  dashboard?: string
  backend_setting?: Record<string, any> | any[] | null
  /** 是否已绑定 TOTP（有 totp_secret 即 true） */
  totp_enabled?: boolean
  departments: CurrentUserDepartmentVo[]
  positions: CurrentUserPositionVo[]
  roles: CurrentUserRoleVo[]
}

export interface UserVo {
  id?: number
  username?: string
  user_type?: number
  nickname?: string
  phone?: string
  email?: string
  avatar?: string
  signed?: string
  dashboard?: string
  status?: 1 | 2
  login_ip?: string
  login_time?: string
  backend_setting?: Record<string, any> | any[] | null
  /** 是否已绑定 TOTP（后端按 totp_secret 计算） */
  totp_enabled?: boolean
  remark?: string
  password?: string
  policy?: any
  department?: Array<CurrentUserDepartmentVo | number>
  position?: Array<CurrentUserPositionVo | number>
  departments?: CurrentUserDepartmentVo[]
  positions?: CurrentUserPositionVo[]
  roles?: CurrentUserRoleVo[]
}

export interface UserSearchVo {
  username?: string
  nickname?: string
  phone?: string
  email?: string
  status?: number
}

export function page(data: UserSearchVo): Promise<ResponseStruct<PageList<UserVo>>> {
  return useHttp().get('/admin/user/list', { params: data })
}

export function create(data: UserVo): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/user', data)
}

export function save(id: number, data: UserVo): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/user/${id}`, data)
}

export function deleteByIds(ids: number[]): Promise<ResponseStruct<null>> {
  return useHttp().delete('/admin/user', { data: ids })
}

export function resetPassword(id: number): Promise<ResponseStruct<null>> {
  return useHttp().put('/admin/user/password', { id })
}

/** DELETE /admin/user/{id}/totp - 重置用户 TOTP（清空 totp_secret，超管可重置所有用户） */
export function resetTotp(id: number): Promise<ResponseStruct<null>> {
  return useHttp().delete(`/admin/user/${id}/totp`)
}

/** PUT /admin/user - 更新当前登录用户信息（后端 UserController::updateInfo） */
export function updateInfo(data: UserVo): Promise<ResponseStruct<null>> {
  return useHttp().put('/admin/user', data)
}

export function getUserRole(id: number): Promise<ResponseStruct<any[]>> {
  return useHttp().get(`/admin/user/${id}/roles`)
}

export function setUserRole(id: number, role_codes: string[]): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/user/${id}/roles`, { role_codes })
}
