import type { PageList, ResponseStruct } from '#/global'

/** 渠道记录（对应后端 App\Schema\ChannelSchema）：一条 = 一个推广渠道 */
export interface ChannelVo {
  /** 主键 */
  id?: number
  /** 渠道名称 */
  name?: string
  /** 渠道编码（唯一，创建后不可修改，用于拼推广链接） */
  code?: string
  /** 渠道后台登陆账户 */
  login_name?: string
  /** 登陆密码：只在提交时传，后端不回显（编辑留空表示不修改） */
  password?: string
  /** 扣量基数：有效点击超过该值后开始扣量 */
  kl_start?: number
  /** 扣量系数：0~1，1 代表 100% 扣量 */
  kl_ratio?: number
  /** 状态：1 启用 / 2 禁用 */
  status?: number
  /** 排序值（越小越靠前） */
  weight?: number
  /** 渠道自定义 JS 代码 */
  js_code?: string
  /** 机器人推送链接类型：0 禁用 / 1 自适应 / 2 落地页 / 3 导航页（与打开方式同构，「自动跳转」即自适应） */
  bot_link_type?: number
  /** 打开方式：1 自适应（跟随系统设置的运行模式）/ 2 落地页 / 3 导航页 */
  open_mode?: number
  /** 渠道备注 */
  remark?: string
  /** 落地页链接（后端按渠道编码 + 站点设置的落地域名拼出） */
  land_url?: string
  /** 导航页链接 */
  navi_url?: string
  /** 自动跳转链接 */
  auto_url?: string
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
export interface ChannelSearchVo {
  /** 主键，精确匹配 */
  id?: number
  /** 渠道名称，模糊匹配 */
  name?: string
  /** 渠道编码，模糊匹配 */
  code?: string
  /** 状态：1 启用 / 2 禁用 */
  status?: number
  [key: string]: any
}

/** GET /admin/channel/list - 分页列表（含后端拼出的三条推广链接） */
export function page(data: ChannelSearchVo): Promise<ResponseStruct<PageList<ChannelVo>>> {
  return useHttp().get('/admin/channel/list', { params: data })
}

/** GET /admin/channel/options - 下拉用精简列表（id + 名称） */
export function options(): Promise<ResponseStruct<Array<{ id: number, name: string }>>> {
  return useHttp().get('/admin/channel/options')
}

/** POST /admin/channel - 新增（返回 landing = 落地页静态文件是否生成成功） */
export function create(data: ChannelVo): Promise<ResponseStruct<{ landing: boolean }>> {
  return useHttp().post('/admin/channel', data)
}

/** PUT /admin/channel/{id} - 更新（password 留空则不改密码；返回同上） */
export function save(id: number, data: ChannelVo): Promise<ResponseStruct<{ landing: boolean }>> {
  return useHttp().put(`/admin/channel/${id}`, data)
}

/**
 * POST /admin/channel/rebuild-landing - 按当前系统设置重建落地页静态文件
 *
 * 不传 `ids` 重建全部；传 `ids` 只重建这些渠道（列表顶部「批量重建」）。
 */
/**
 * POST /admin/channel/rebuild-landing - 重建全部/选中渠道的落地页
 *
 * 全量重建 1000 个渠道可能持续几分钟，必须覆盖全局默认 5s 超时，
 * 否则前端会在后端还没生成完时提前释放按钮锁。
 */
export function rebuildLanding(ids?: number[]): Promise<ResponseStruct<{ total: number, generated: number, busy?: boolean }>> {
  return useHttp().post('/admin/channel/rebuild-landing', ids ? { ids } : {}, {
    timeout: 10 * 60 * 1000,
  })
}

/**
 * PUT /admin/channel/{id}/status - 切换状态（列表开关）
 *
 * 后端会同步落地页：启用即生成文件、禁用即删文件。
 * 返回 `landing`：`true` 已生成 / `false` 生成失败 / `null` 禁用（无需落地页）。
 */
export function updateStatus(id: number, status: number): Promise<ResponseStruct<{ landing: boolean | null }>> {
  return useHttp().put(`/admin/channel/${id}/status`, { status })
}

/** PUT /admin/channel/{id}/weight - 修改排序值（列表行内编辑，只改 weight） */
export function updateWeight(id: number, weight: number): Promise<ResponseStruct<null>> {
  return useHttp().put(`/admin/channel/${id}/weight`, { weight })
}

/** DELETE /admin/channel - 按 id 批量删除 */
export function deleteByIds(ids: number[]): Promise<ResponseStruct<{ deleted: number }>> {
  return useHttp().delete('/admin/channel', { data: { ids } })
}
