/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { MaProTableColumns, MaProTableExpose } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { ChannelVo } from '~/channel/api/channel.ts'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'

import { useDebounceFn } from '@vueuse/core'
import { ElInputNumber, ElSwitch, ElTag, ElTooltip } from 'element-plus'
import { deleteByIds, rebuildLanding, updateStatus, updateWeight } from '~/channel/api/channel.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

export default function getTableColumns(dialog: UseDialogExpose, t: any, proTableRef?: Ref<MaProTableExpose>): MaProTableColumns[] {
  const msg = useMessage()
  // 正在切换状态的行 id，用于开关的 loading 态
  const statusLoading = ref<number>()
  // 正在保存排序值的行 id，用于数字输入框的 loading 态
  const weightLoading = ref<number>()
  // 行内「重建」防重复：同一行请求未返回前再次点击直接忽略
  const rebuildingIds = new Set<number>()

  /** 打开方式 1 自适应（跟随系统运行模式）/ 2 落地页 / 3 导航页 → 展示文案与标签色 */
  const openModeMap: Record<number, { label: string, type: 'primary' | 'success' | 'info' }> = {
    1: { label: t('channel.modeAuto'), type: 'info' },
    2: { label: t('channel.modeLand'), type: 'primary' },
    3: { label: t('channel.modeNavi'), type: 'success' },
  }

  /**
   * 列表开关切换状态：成功后刷新列表（开关显示由数据驱动），失败给提示并同样刷新以回滚显示.
   */
  function handleStatusChange(row: ChannelVo, status: number): void {
    statusLoading.value = row.id
    updateStatus(row.id as number, status).then((response) => {
      if (response.code === ResultCode.SUCCESS) {
        // 状态与落地页同步：禁用会把文件删掉（推广链接随即 404），提示里说清楚
        msg.success(status === 2 ? t('channel.statusDisabledTip') : t('crud.updateSuccess'))
        if (status === 1 && response.data?.landing === false) {
          msg.error(t('channel.landingFailed'))
        }
      }
      else {
        msg.error(response.message)
      }
      proTableRef?.value?.refresh()
    }).finally(() => {
      statusLoading.value = undefined
    })
  }

  /**
   * 行内修改排序值：用 400ms 防抖合并连续点击/输入，避免每敲一位就发一次请求；
   * 保存失败时把列表刷新回原值（服务端值才是准的）。
   */
  const saveWeight = useDebounceFn((row: ChannelVo, weight: number) => {
    if (weight === row.weight) {
      return
    }
    weightLoading.value = row.id
    updateWeight(row.id as number, weight).then((response) => {
      if (response.code === ResultCode.SUCCESS) {
        row.weight = weight
        msg.success(t('channel.weightSaved'))
      }
      else {
        msg.error(response.message)
      }
      proTableRef?.value?.refresh()
    }).finally(() => {
      weightLoading.value = undefined
    })
  }, 400)

  /**
   * 复制推广链接：优先用 Clipboard API（localhost / HTTPS 下可用），
   * 失败（如非安全上下文）时退化到临时 textarea + execCommand，仍失败才提示手动复制。
   */
  function copyUrl(url?: string): void {
    if (!url) {
      return
    }

    const done = (ok: boolean): void => {
      ok ? msg.success(t('channel.copySuccess')) : msg.error(t('channel.copyFail'))
    }

    const fallback = (): boolean => {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => done(true))
        .catch(() => done(fallback()))
      return
    }

    done(fallback())
  }

  /**
   * 链接信息列：三行「落地页 / 导航页 / 自动跳转」，点链接即复制。
   *
   * 链接由后端按渠道编码 + 站点设置的域名拼出；域名没配时后端返回的是半截地址
   *（如 `/A70001.html`），这里用红色 + 悬浮提示引导去系统设置补配置。
   * 链接较长，单行截断（`truncate`）+ 悬浮显示完整地址，避免换行把行高撑得乱七八糟。
   */
  function renderLinks(row: ChannelVo) {
    const items = [
      { key: 'land', label: t('channel.landUrl'), url: row.land_url },
      { key: 'navi', label: t('channel.naviUrl'), url: row.navi_url },
      { key: 'auto', label: t('channel.autoUrl'), url: row.auto_url },
    ]

    return (
      <div class="flex flex-col" style={{ gap: '2px' }}>
        {items.map((item) => {
          const configured = Boolean(item.url?.startsWith('http'))
          return (
            <div key={item.key} class="flex items-center" style={{ gap: '4px', minWidth: 0 }}>
              <span class="text-xs" style={{ color: 'var(--el-text-color-secondary)', flex: 'none' }}>
                {item.label}
                ：
              </span>
              {item.url
                ? (
                    <ElTooltip content={configured ? item.url : t('channel.urlEmptyTip')} placement="top" showAfter={100}>
                      <span
                        class="truncate text-xs"
                        style={{
                          color: configured ? 'var(--el-color-primary)' : 'var(--el-color-danger)',
                          cursor: 'pointer',
                          maxWidth: '100%',
                        }}
                        onClick={() => copyUrl(item.url)}
                      >
                        {item.url}
                      </span>
                    </ElTooltip>
                  )
                : <span class="text-xs">{t('channel.urlEmpty')}</span>}
            </div>
          )
        })}
      </div>
    )
  }

  return [
    // 多选列
    { type: 'selection', showOverflowTooltip: false, label: () => t('crud.selection') },
    // 普通列：ID / 名称 / 编码 / 扣量信息 / 状态 / 打开方式 / 排序值 / 链接信息 / 备注 / 创建时间 / 更新人
    { label: () => t('ID'), prop: 'id', width: '90px' },
    { label: () => t('channel.name'), prop: 'name', minWidth: '140px' },
    { label: () => t('channel.code'), prop: 'code', minWidth: '110px' },
    {
      label: () => t('channel.klInfo'),
      minWidth: '150px',
      cellRender: ({ row }) => (
        <div class="flex flex-col items-center" style={{ gap: '4px' }}>
          <ElTag type="primary" size="small">{`${t('channel.klStart')}: ${(row as ChannelVo).kl_start ?? 0}`}</ElTag>
          <ElTag type="success" size="small">{`${t('channel.klRatio')}: ${Number((row as ChannelVo).kl_ratio ?? 0).toFixed(2)}`}</ElTag>
        </div>
      ),
    },
    {
      label: () => t('crud.status'),
      prop: 'status',
      width: '100px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          <ElSwitch
            modelValue={Number(row.status)}
            activeValue={1}
            inactiveValue={2}
            loading={statusLoading.value === row.id}
            disabled={!hasAuth('channel:save')}
            onChange={(value: string | number | boolean) => handleStatusChange(row as ChannelVo, Number(value))}
          />
        </div>
      ),
    },
    {
      label: () => t('channel.openMode'),
      prop: 'open_mode',
      width: '110px',
      cellRender: ({ row }) => {
        const mode = openModeMap[Number((row as ChannelVo).open_mode)] ?? { label: '—', type: 'info' as const }
        return <div class="flex-center"><ElTag type={mode.type} size="small">{mode.label}</ElTag></div>
      },
    },
    {
      label: () => t('channel.botLinkType'),
      prop: 'bot_link_type',
      width: '110px',
      cellRender: ({ row }) => {
        const value = Number((row as ChannelVo).bot_link_type)
        // 0 是「禁用」（只有推送类型才有），1~3 与「打开方式」共用同一套文案与颜色
        const item = value === 0
          ? { label: t('channel.pushDisabled'), type: 'info' as const }
          : (openModeMap[value] ?? { label: '—', type: 'info' as const })
        return <div class="flex-center"><ElTag type={item.type} size="small">{item.label}</ElTag></div>
      },
    },
    {
      label: () => t('channel.weight'),
      prop: 'weight',
      width: '130px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          <ElInputNumber
            modelValue={Number((row as ChannelVo).weight ?? 0)}
            min={0}
            max={999999}
            step={1}
            size="small"
            controlsPosition="right"
            disabled={!hasAuth('channel:save') || weightLoading.value === row.id}
            onChange={(value: number | undefined) => saveWeight(row as ChannelVo, Number(value ?? 0))}
          />
        </div>
      ),
    },
    {
      // 链接较长，列宽可拖：默认 360px，显示不下的部分单行截断、点击复制完整地址
      // 必须关掉表格自带的列 tooltip：它会把「落地页 / 导航页 / 自动跳转」三行内容拼成一个超长气泡，
      // 叠在每行自己的 URL 气泡上面，又长又挡视线（只保留下面 renderLinks 里那个单条 URL 的短气泡）
      label: () => t('channel.linkInfo'),
      minWidth: '360px',
      showOverflowTooltip: false,
      cellRender: ({ row }) => renderLinks(row as ChannelVo),
    },
    { label: () => t('crud.remark'), prop: 'remark', minWidth: '140px', showOverflowTooltip: true },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '170px' },
    { label: () => t('channel.updatedBy'), prop: 'updated_by_name', width: '110px' },
    // 操作列
    {
      type: 'operation',
      label: () => t('crud.operation'),
      // 三个动作（重建 / 编辑 / 删除）：图标 + 文字，200px 会把「删除」挤到贴边，给到 260px
      width: '260px',
      operationConfigure: {
        type: 'tile',
        actions: [
          {
            name: 'rebuild',
            icon: 'material-symbols:sync-rounded',
            text: () => t('channel.rebuildLandingOne'),
            onClick: ({ row }) => {
              // 禁用渠道本来就没有落地页（后端也会把文件删掉），这里直接拦掉：
              // 否则请求回来 generated=0，前端会误报成「生成失败，请检查目录权限」
              if (Number((row as ChannelVo).status) !== 1) {
                msg.warning(t('channel.rebuildLandingDisabled'))
                return
              }
              // 单个重建是幂等操作、无副作用，不做二次确认；失败时把原因提示出来
              const id = row.id as number
              if (rebuildingIds.has(id)) {
                return
              }
              rebuildingIds.add(id)
              rebuildLanding([id]).then((response) => {
                if (response.code !== ResultCode.SUCCESS) {
                  msg.error(response.message)
                  return
                }
                if (response.data?.busy) {
                  msg.warning(t('channel.rebuildLandingBusy'))
                  return
                }
                response.data?.generated
                  ? msg.success(t('channel.rebuildLandingOneSuccess'))
                  : msg.error(t('channel.rebuildLandingOneFailed'))
              }).finally(() => rebuildingIds.delete(id))
            },
          },
          {
            name: 'edit',
            icon: 'material-symbols:edit-outline-rounded',
            text: () => t('crud.edit'),
            onClick: ({ row }) => {
              dialog.setTitle(t('crud.edit'))
              dialog.open({ formType: 'edit', data: row })
            },
          },
          {
            name: 'del',
            icon: 'material-symbols:delete-outline-rounded',
            linkProps: { type: 'danger' },
            text: () => t('crud.delete'),
            onClick: ({ row }, proxy: MaProTableExpose) => {
              msg.delConfirm(t('crud.delDataMessage')).then(async () => {
                const response = await deleteByIds([row.id as number])
                if (response.code === ResultCode.SUCCESS) {
                  msg.success(t('crud.delSuccess'))
                  await proxy.refresh()
                }
              })
            },
          },
        ],
      },
    },
  ] as MaProTableColumns[]
}
