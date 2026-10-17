/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import useCache from '@/hooks/useCache.ts'
import type { ResponseStruct } from '#/global'
import useThemeColor from '@/hooks/useThemeColor.ts'
import useHttp from '@/hooks/auto-imports/useHttp.ts'
import * as PermissionApi from '~/base/api/permission.ts'
import type { MenuVo, RoleVo } from '~/base/api/permission.ts'
import type { CurrentUserDepartmentVo, CurrentUserInfo, CurrentUserPositionVo, CurrentUserRoleVo } from '~/base/api/user.ts'
import { recursionGetKey } from '@/utils/recursionGetKey.ts'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  access_token: string
  expire_at: number
  refresh_token: string
  /** 是否已绑定 TOTP（有 totp_secret 即 true） */
  totp_enabled?: boolean
}

/** 密码正确但需要第二步动态码时，后端返回的 challenge */
export interface TotpChallenge {
  require: 'totp_verify'
  challenge: string
  totp_enabled: boolean
}

/** 绑定 TOTP 时后端返回的密钥信息 */
export interface TotpSetupResult {
  challenge: string
  secret: string
  otpauth_uri: string
}

export type UserDepartmentInfo = CurrentUserDepartmentVo
export type UserPositionInfo = CurrentUserPositionVo
export type UserRoleInfo = CurrentUserRoleVo
export type UserInfo = CurrentUserInfo

function getInfo(): Promise<ResponseStruct<UserInfo>> {
  return useHttp().get('/admin/passport/getInfo')
}

/**
 * Passport login
 * @param data
 */
function loginApi(data: LoginParams): Promise<ResponseStruct<LoginResult | TotpChallenge>> {
  return useHttp().post('/admin/passport/login', data)
}

/** POST /admin/passport/totp/verify - 登录第二步：校验动态码并签发 token */
function verifyTotpApi(data: { challenge: string, code: string }): Promise<ResponseStruct<LoginResult>> {
  return useHttp().post('/admin/passport/totp/verify', data)
}

/** POST /admin/passport/totp/setup - 已登录用户生成绑定密钥（二维码链接） */
function setupTotpApi(): Promise<ResponseStruct<TotpSetupResult>> {
  return useHttp().post('/admin/passport/totp/setup')
}

/** POST /admin/passport/totp/enable - 已登录用户确认绑定 */
function enableTotpApi(data: { challenge: string, code: string }): Promise<ResponseStruct<null>> {
  return useHttp().post('/admin/passport/totp/enable', data)
}

/** DELETE /admin/passport/totp - 关闭 TOTP（清空 totp_secret） */
function disableTotpApi(): Promise<ResponseStruct<null>> {
  return useHttp().delete('/admin/passport/totp')
}

const useUserStore = defineStore(
  'useUserStore',
  () => {
    const cache = useCache()
    const router = useRouter()
    const setting = useSettingStore()
    const token = ref<string | null>(cache.get('token', null))
    const locales = ref<any[]>([])
    const language = ref(cache.get('language', 'zh_CN'))
    const isLogin = computed(() => !!token.value)
    const userInfo = ref<UserInfo | null>(null)
    const menu = ref<MenuVo[]>([])
    const permissions = ref<string[]>([])
    const roles = ref<string[]>([])
    const dropdownMenuState = ref<{
      shortcuts: boolean
    }>({
      shortcuts: false,
    })

    function getDropdownMenu() {
      return dropdownMenuState.value
    }

    function setDropdownMenuState(key: string, state: boolean) {
      if (dropdownMenuState.value[key] !== undefined) {
        dropdownMenuState.value[key] = state
      }
    }

    function getMenu() {
      return menu.value
    }

    function setMenu(list: MenuVo[]) {
      menu.value = list
    }

    function getDropdownMenuState(key: string) {
      return dropdownMenuState.value[key] !== undefined ? dropdownMenuState.value[key] : undefined
    }

    async function refreshRole() {
      const res = await PermissionApi.getRoles()
      setRoles(res.data)
    }

    async function refreshMenu() {
      const res = await PermissionApi.getMenus()
      setMenu(res.data)
    }

    /** 保存登录态（密码直登 / 动态码验证成功共用） */
    async function applyLogin(data: LoginResult, username = ''): Promise<void> {
      token.value = data.access_token
      cache.set('token', data.access_token)
      cache.set('expire', useDayjs().unix() + data.expire_at, { exp: data.expire_at })
      cache.set('refresh_token', data.refresh_token)
      await usePluginStore().callHooks('login', { username, ...data })
    }

    /**
     * 第一步：提交账号密码。
     * - 未绑定 TOTP：直接登录，返回 { loggedIn: true, totp_enabled }
     * - 已绑定：返回 { require: 'totp_verify', challenge }，前端弹动态码输入框
     */
    async function login(data: { username: string, password: string, code: string, [key: string]: any }): Promise<{ loggedIn: true, totp_enabled: boolean } | TotpChallenge> {
      await usePluginStore().callHooks('loginBefore', data)
      const res = await loginApi(data)
      const result = res.data

      if ('access_token' in result && result.access_token) {
        await applyLogin(result, data.username)
        return { loggedIn: true, totp_enabled: !!result.totp_enabled }
      }

      return result as TotpChallenge
    }

    /** 第二步：校验动态码并保存登录态 */
    async function verifyTotp(challenge: string, code: string, username = ''): Promise<LoginResult> {
      const res = await verifyTotpApi({ challenge, code })
      await applyLogin(res.data, username)
      return res.data
    }

    /** 已登录用户生成绑定密钥（用于个人中心二维码） */
    async function setupTotp(): Promise<TotpSetupResult> {
      const res = await setupTotpApi()
      return res.data
    }

    /** 已登录用户确认绑定 */
    async function enableTotp(challenge: string, code: string): Promise<void> {
      await enableTotpApi({ challenge, code })
    }

    /** 已登录用户关闭 TOTP */
    async function disableTotp(): Promise<void> {
      await disableTotpApi()
    }
    async function requestUserInfo(): Promise<void> {
      try {
        const routeStore = useRouteStore()
        const { data } = await getInfo()
        setUserInfo(data)
        if ((setting.getSettings('app')?.loadUserSetting ?? true) && data.backend_setting) {
          const raw = data?.backend_setting
          const normalized = raw && !Array.isArray(raw) ? raw : null
          await setUserSetting(normalized)
        }
        await refreshMenu()
        await refreshRole()
        await routeStore.initRoutes(router, getMenu())
        const codes: string[] = recursionGetKey(getMenu(), 'name')
        getRoles().includes('SuperAdmin') && codes.unshift('*')
        setPermissions(codes)
        await usePluginStore().callHooks('getUserInfo', data)
      }
      // eslint-disable-next-line unused-imports/no-unused-vars
      catch (e) {
        await logout()
      }
    }

    async function logout(redirect = router.currentRoute.value.fullPath) {
      await usePluginStore().callHooks('logout')
      useTabStore().clearTab()
      clearInfo()
      await router.push({
        name: 'login',
        query: {
          ...(router.currentRoute.value.name !== 'login' && { redirect }),
        },
      })
    }

    function setLanguage(langName: string) {
      if (!langName || typeof langName !== 'string' || !langName.trim()) {
        return false
      }
      language.value = langName.trim()
      cache.set('language', language.value)
      return true
    }

    function getLanguage() {
      return language.value
    }

    function getLocales(): any[] {
      return locales.value
    }

    function setLocales(localeArray: any[]): boolean {
      locales.value = localeArray
      return true
    }

    function getUserInfo(): UserInfo | null {
      return userInfo.value
    }

    function setUserInfo(data: UserInfo): boolean {
      userInfo.value = data
      return true
    }

    function getUserDepartments(): UserDepartmentInfo[] {
      return userInfo.value?.departments ?? []
    }

    function getUserPositions(): UserPositionInfo[] {
      return userInfo.value?.positions ?? []
    }

    function getUserRoleList(): UserRoleInfo[] {
      return userInfo.value?.roles ?? []
    }

    function getPermissions(): string[] {
      return permissions.value
    }

    function setPermissions(permissionArray: string[]): boolean {
      permissions.value = permissionArray
      return true
    }

    function getRoles(): string[] {
      return roles.value
    }

    function setRoles(roleArray: RoleVo[]): boolean {
      roles.value = roleArray.map(item => item.code) as string[]
      return true
    }

    async function setUserSetting(settings: any) {
      settings && setting.setSettings(settings)
      setting.initColorMode()

      await nextTick()
      useThemeColor().initThemeColor()
      const cacheLanguage = cache.get('language', '')?.trim?.() || ''
      const settingsLanguage = settings?.app?.useLocale?.trim?.() || ''
      const locale = cacheLanguage || settingsLanguage || 'zh_CN'
      const appSettings = setting.getSettings('app')
      if (appSettings) {
        appSettings.useLocale = locale
      }
      setLanguage(locale)
    }

    function saveSettingToSever() {
      const backend_setting = setting.getSettings()
      return useHttp().post('/admin/permission/update', { backend_setting }).then(() => {
        cache.set('sys_settings', backend_setting)
      }).catch((error) => {
        console.log(error)
        return Promise.reject(error)
      })
    }

    async function clearCache() {
      // await useHttp().post('/mock/system/clearCache')
    }

    function clearInfo() {
      cache.remove('token')
      cache.remove('refresh_token')
      cache.remove('language')
      cache.remove('expire')
      token.value = null
      language.value = ''
      userInfo.value = null
      permissions.value = []
      roles.value = []
    }

    return {
      token,
      isLogin,
      login,
      verifyTotp,
      setupTotp,
      enableTotp,
      disableTotp,
      logout,
      getDropdownMenu,
      getDropdownMenuState,
      setDropdownMenuState,
      clearCache,
      setLanguage,
      getLanguage,
      requestUserInfo,
      getUserInfo,
      getUserDepartments,
      getUserPositions,
      getUserRoleList,
      setPermissions,
      getPermissions,
      getRoles,
      getLocales,
      setLocales,
      saveSettingToSever,
      getMenu,
    }
  },
)

export default useUserStore
