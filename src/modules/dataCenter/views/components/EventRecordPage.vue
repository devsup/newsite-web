<!--
 - MineAdmin is committed to providing solutions for quickly building web applications
 - Please view the LICENSE file that was distributed with this source code,
 - For the full copyright and license information.
 - Thank you very much for using MineAdmin.
 -
 - @Author X.Mo<root@imoi.cn>
 - @Link   https://github.com/mineadmin
-->
<script setup lang="tsx">
import type { MaTableExpose } from '@mineadmin/table'
import type { MaProTableExpose, MaProTableOptions, MaProTableSchema } from '@mineadmin/pro-table'
import type { DataCenterEventVo, DataCenterRepeatVo } from '~/dataCenter/api/dataCenter'

import { ElButton, ElMessageBox, ElTag, ElTooltip } from 'element-plus'
import MaBatchActions from '@/components/ma-batch-actions/index.vue'
import MaSvgIcon from '@/components/ma-svg-icon/index.vue'
import MaRemoteSelect from '@/components/ma-remote-select/index.vue'
import useDialog from '@/hooks/useDialog.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { channelOptions, formatChannelOptionLabel, merchantOptions, merchantRepeatDelete, merchantRepeatPage } from '~/dataCenter/api/dataCenter'
import { createBatch as createIpBlacklistBatch } from '~/setting/api/ipBlacklist'
import hasAuth from '@/utils/permission/hasAuth.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

/**
 * 上报事件明细的通用页面.
 *
 * 渠道访问记录 / 商户点击记录 / 下载记录三张表结构完全一致，只是「允许的事件类型」和
 * 要展示的列不同；抽成一个组件，避免三份重复代码。各路由页只传接口函数与文案 key。
 */
const props = withDefaults(defineProps<{
  /** 该页面自己的列表接口（渠道记录 / 商户记录 / 下载记录） */
  endpoint: (params: any) => Promise<any>
  /** 页面标题 / 副标题的 i18n key */
  titleKey: string
  subtitleKey: string
  /** 该页面允许展示的事件类型（1落地页 2导航页 3商户点击 4下载 5安装） */
  eventTypes: number[]
  /**
   * 页面类型：决定表格列集合与顺序（渠道 / 商户 / 下载三张表按参考站点各自排布）。
   */
  variant: 'channel' | 'merchant' | 'download'
}>(), {})

const t = useTrans().globalTrans
const today = useDayjs().format('YYYY-MM-DD')

/** 事件类型 → 文案 key / 标签颜色 */
const EVENT_TYPE_META: Record<number, { key: string, tag: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
  1: { key: 'landing', tag: 'primary' },
  2: { key: 'navigation', tag: 'success' },
  3: { key: 'merchantClick', tag: 'warning' },
  4: { key: 'download', tag: 'info' },
  5: { key: 'install', tag: 'danger' },
  6: { key: 'jump', tag: 'info' },
}

const CLIENT_TYPE_KEYS: Record<number, string> = {
  1: 'android',
  2: 'ios',
  3: 'windows',
  4: 'mac',
  5: 'other',
}

function eventTypeText(type: number): string {
  const meta = EVENT_TYPE_META[type]
  return meta ? t(`dataCenter.eventTypes.${meta.key}`) : String(type)
}

function clientTypeText(type: number): string {
  const key = CLIENT_TYPE_KEYS[type]
  return key ? t(`dataCenter.clientTypes.${key}`) : '-'
}

/** 事件类型下拉只展示当前页面允许的类型 */
const eventTypeOptions = props.eventTypes.map(type => ({
  value: type,
  label: eventTypeText(type),
}))

/** 客户端 / 服务端识别共用同一套类型 */
const clientTypeOptions = Object.entries(CLIENT_TYPE_KEYS).map(([value, key]) => ({
  value: Number(value),
  label: t(`dataCenter.clientTypes.${key}`),
}))

const deductedOptions = [
  { value: 1, label: t('dataCenter.yes') },
  { value: 0, label: t('dataCenter.no') },
]

const searchItems: any[] = []

// 时间筛选放第一项：三个记录页都按参考站点以「查询日期」为主筛选
searchItems.push({
  label: () => t('dataCenter.queryDate'),
  prop: 'date',
  render: 'DatePicker',
  renderProps: {
    type: 'date',
    valueFormat: 'YYYY-MM-DD',
    placeholder: t('dataCenter.queryDate'),
    clearable: false,
  },
})

if (props.eventTypes.length > 1) {
  searchItems.push({
    label: () => t('dataCenter.eventType'),
    prop: 'event_type',
    render: 'select',
    renderProps: {
      clearable: true,
      options: eventTypeOptions,
    },
  })
}

searchItems.push({
  label: () => t('dataCenter.channel'),
  prop: 'channel_id',
  render: () => MaRemoteSelect,
  renderProps: {
    clearable: true,
    filterable: true,
    placeholder: t('dataCenter.selectedChannel'),
    api: channelOptions,
    dataHandle: (response: any) => (response.data || []).map((item: any) => ({
      label: formatChannelOptionLabel(item),
      value: item.value,
    })),
  },
})

if (props.variant === 'merchant') {
  searchItems.push({
    label: () => t('dataCenter.merchant'),
    prop: 'merchant_id',
    render: () => MaRemoteSelect,
    renderProps: {
      clearable: true,
      filterable: true,
      placeholder: t('dataCenter.selectedMerchant'),
      api: merchantOptions,
      dataHandle: (response: any) => response.data || [],
    },
  })
}

searchItems.push(
  {
    label: () => t('dataCenter.ip'),
    prop: 'ip',
    render: 'input',
  },
  {
    label: () => t('dataCenter.clientType'),
    prop: 'client_type',
    render: 'select',
    renderProps: {
      clearable: true,
      options: clientTypeOptions,
    },
  },
  {
    label: () => t('dataCenter.serverType'),
    prop: 'server_type',
    render: 'select',
    renderProps: {
      clearable: true,
      options: clientTypeOptions,
    },
  },
  {
    label: () => t('dataCenter.deducted'),
    prop: 'is_deducted',
    render: 'select',
    renderProps: {
      clearable: true,
      options: deductedOptions,
    },
  },
  {
    label: () => t('dataCenter.browserId'),
    prop: 'browser_id',
    render: 'input',
  },
  {
    label: () => t('dataCenter.requestId'),
    prop: 'request_id',
    render: 'input',
  },
  {
    label: () => t('dataCenter.userAgent'),
    prop: 'user_agent',
    render: 'input',
  },
)

/** 列表实例：重复次数筛选要跟随页面上当前选中的「查询日期」 */
const proTableRef = ref<MaProTableExpose>()
const msg = useMessage()

/**
 * 「筛选重复次数」（仅商户记录）.
 *
 * 与参考站点一致：输入重复次数（≥2）后，按 IP 汇总当天点击次数达到阈值的记录，
 * 用于排查刷量；结果放在弹窗里，不打断主列表的筛选状态。
 */
const repeatDialog = useDialog({ width: '900px', footer: false })
const repeatTableRef = ref<MaTableExpose>()
const repeatRows = ref<DataCenterRepeatVo[]>([])
const repeatPage = ref(1)
const repeatPageSize = ref(10)
const repeatTotal = ref(0)
const repeatLoading = ref(false)
const repeatCount = ref(2)
const repeatDate = ref(today)
/** 当前勾选的 IP（批量加入黑名单 / 批量删除用） */
const repeatSelected = ref<string[]>([])
/** 黑名单提交中（下拉里的「加入黑名单」据此禁用） */
const blacklistSubmitting = ref(false)

// 加入黑名单复用 IP 黑名单模块的保存权限；删除明细用数据中心自己的删除权限
const canAddBlacklist = computed(() => hasAuth('ipBlacklist:save'))
const canDeleteRepeat = computed(() => hasAuth('dataCenter:merchantRecord:delete'))

/** 批量操作下拉（与项目其它列表一致：ma-batch-actions 按权限自动过滤菜单项） */
const repeatActions = computed(() => [
  {
    command: 'blacklist',
    label: () => t('dataCenter.repeat.addBlacklist'),
    icon: 'material-symbols:block',
    auth: ['ipBlacklist:save'],
    disabled: blacklistSubmitting.value,
  },
  {
    command: 'delete',
    label: () => t('dataCenter.repeat.deleteIp'),
    icon: 'material-symbols:delete-outline',
    auth: ['dataCenter:merchantRecord:delete'],
    danger: true,
    divided: true,
  },
])

/** 批量操作分发：从 el-table 当前勾选取 IP */
function handleRepeatCommand(command: string): void {
  const ips = getSelectedIps()
  if (command === 'blacklist') {
    addToBlacklist(ips)
    return
  }

  if (command === 'delete') {
    removeIps(ips)
  }
}

/** 重复访问汇总的列（与参考站点的重复IP弹窗一致：含黑名单状态与行操作） */
const REPEAT_COLUMNS: any[] = [
  { type: 'selection', width: '48px' },
  { label: () => t('dataCenter.columns.userIp'), prop: 'ip', minWidth: '140px' },
  { label: () => t('dataCenter.repeat.visitCount'), prop: 'visit_count', width: '100px' },
  { label: () => t('dataCenter.repeat.merchantCount'), prop: 'merchant_count', width: '110px' },
  { label: () => t('dataCenter.repeat.channelCount'), prop: 'channel_count', width: '110px' },
  { label: () => t('dataCenter.repeat.firstVisit'), prop: 'first_visit_at', width: '170px' },
  { label: () => t('dataCenter.repeat.lastVisit'), prop: 'last_visit_at', width: '170px' },
  {
    label: () => t('dataCenter.repeat.blacklistStatus'),
    prop: 'blacklist_status',
    width: '110px',
    cellRender: ({ row }: { row: DataCenterRepeatVo }) => {
      const status = Number(row.blacklist_status || 0)
      const text = status === 1
        ? t('dataCenter.repeat.blacklisted')
        : status === 2 ? t('dataCenter.repeat.blacklistDisabled') : t('dataCenter.repeat.notBlacklisted')

      return <ElTag type={status === 1 ? 'success' : status === 2 ? 'warning' : 'info'}>{text}</ElTag>
    },
  },
  {
    label: () => t('crud.operation'),
    width: '230px',
    cellRender: ({ row }: { row: DataCenterRepeatVo }) => (
      <div class="flex-center gap-2">
        {canAddBlacklist.value && (
          <ElButton
            size="small"
            class="dc-row-action dc-row-action--merchant"
            disabled={Number(row.blacklist_status || 0) > 0}
            onClick={() => addToBlacklist([row.ip])}
          >
            <MaSvgIcon name="material-symbols:block" size={15} class="mr-1" />
            {t('dataCenter.repeat.addBlacklist')}
          </ElButton>
        )}
        {canDeleteRepeat.value && (
          <ElButton
            size="small"
            class="dc-row-action dc-row-action--danger"
            onClick={() => removeIps([row.ip])}
          >
            <MaSvgIcon name="material-symbols:delete-outline" size={15} class="mr-1" />
            {t('dataCenter.repeat.deleteIp')}
          </ElButton>
        )}
      </div>
    ),
  },
]

async function loadRepeatList(): Promise<void> {
  repeatLoading.value = true
  try {
    const response = await merchantRepeatPage({
      date: repeatDate.value,
      repeat_count: repeatCount.value,
      page: repeatPage.value,
      page_size: repeatPageSize.value,
    })
    if (response.code !== ResultCode.SUCCESS) {
      msg.error(response.message)
      return
    }

    repeatRows.value = (response.data?.list || []) as DataCenterRepeatVo[]
    repeatTotal.value = response.data?.total || 0
    repeatSelected.value = []
    repeatTableRef.value?.setData([...repeatRows.value])
  }
  finally {
    repeatLoading.value = false
  }
}

/** 勾选变化（ma-table 透传 el-table 的 selection-change） */
function onRepeatSelectionChange(rows: DataCenterRepeatVo[]): void {
  repeatSelected.value = rows.map(row => row.ip).filter(Boolean)
}

/** 批量操作取勾选 IP：优先读 el-table 当前勾选，事件没同步时退回本地缓存 */
function getSelectedIps(): string[] {
  const elTable = repeatTableRef.value?.getElTableRef?.() as any
  const rows = (elTable?.value?.getSelectionRows?.() ?? elTable?.getSelectionRows?.() ?? []) as DataCenterRepeatVo[]
  const ips = rows.map(row => row.ip).filter(Boolean)

  return ips.length > 0 ? ips : repeatSelected.value
}

/**
 * 加入黑名单用的封禁原因 / 备注（放在重复弹窗顶部，行内与批量共用）.
 *
 * 与参考站点一致：两个输入框直接摆在工具栏上，点「批量加入黑名单」时一起提交；
 * 封禁原因必填（IP 黑名单表要求留理由），备注可空。
 */
const blacklistInput = ref({ ban_reason: '', remark: '' })

/** 行内 / 批量加入黑名单：用工具栏里填的原因与备注 */
async function addToBlacklist(ips: string[]): Promise<void> {
  if (ips.length === 0) {
    msg.warning(t('dataCenter.repeat.selectFirst'))
    return
  }

  const banReason = blacklistInput.value.ban_reason.trim()
  if (!banReason) {
    msg.warning(t('dataCenter.repeat.banReasonRequired'))
    return
  }

  blacklistSubmitting.value = true
  try {
    const response = await createIpBlacklistBatch({
      ips,
      ban_reason: banReason,
      remark: blacklistInput.value.remark.trim(),
      status: 1,
    })

    if (response.code !== ResultCode.SUCCESS) {
      msg.error(response.message)
      return
    }

    msg.success(t('dataCenter.repeat.blacklistSuccess', {
      created: response.data?.created ?? 0,
      skipped: response.data?.skipped?.length ?? 0,
    }))
    blacklistInput.value = { ban_reason: '', remark: '' }
    await loadRepeatList()
  }
  finally {
    blacklistSubmitting.value = false
  }
}

/** 删除重复 IP 当天的商户点击明细（同时扣减商户日统计） */
async function removeIps(ips: string[]): Promise<void> {
  if (ips.length === 0) {
    msg.warning(t('dataCenter.repeat.selectFirst'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('dataCenter.repeat.deleteConfirm', { count: ips.length, date: repeatDate.value }),
      t('dataCenter.repeat.promptTitle'),
      { type: 'error', confirmButtonText: t('crud.ok'), cancelButtonText: t('crud.cancel') },
    )
  }
  catch {
    return
  }

  const response = await merchantRepeatDelete({ date: repeatDate.value, ips })
  if (response.code !== ResultCode.SUCCESS) {
    msg.error(response.message)
    return
  }

  msg.success(t('dataCenter.repeat.deleteSuccess', { deleted: response.data?.deleted ?? 0 }))
  repeatSelected.value = []
  await loadRepeatList()
  // 明细已删除，主列表同步刷新
  await proTableRef.value?.refresh?.()
}

function changeRepeatPage(page: number): void {
  repeatPage.value = page
  loadRepeatList()
}

function changeRepeatPageSize(size: number): void {
  repeatPageSize.value = size
  repeatPage.value = 1
  loadRepeatList()
}

async function openRepeatFilter(): Promise<void> {
  try {
    const { value } = await ElMessageBox.prompt(
      t('dataCenter.repeat.prompt'),
      t('dataCenter.repeat.promptTitle'),
      {
        inputPattern: /^\d+$/,
        inputValidator: (val: string) => Number(val) >= 2 ? true : t('dataCenter.repeat.min'),
        inputValue: String(repeatCount.value),
        confirmButtonText: t('crud.ok'),
        cancelButtonText: t('crud.cancel'),
      },
    )
    repeatCount.value = Math.max(2, Number(value))
  }
  catch {
    // 用户取消弹窗：不做任何提示
    return
  }

  const form = proTableRef.value?.getSearchForm?.() ?? {}
  repeatDate.value = String(form.date || today)
  repeatPage.value = 1
  // 每次打开重置封禁原因 / 备注，避免带上一次的值
  blacklistInput.value = { ban_reason: '', remark: '' }

  repeatDialog.setTitle(t('dataCenter.repeat.title', {
    date: repeatDate.value,
    count: repeatCount.value,
  }))
  repeatDialog.open()
  await nextTick()

  // 弹窗是 destroyOnClose，每次打开都要重新设置列
  const table = repeatTableRef.value
  if (table) {
    table.setOptions({ stripe: true, border: true, adaption: false, maxHeight: 420 })
    table.setColumns(REPEAT_COLUMNS)
  }

  await loadRepeatList()
}

/**
 * 表格列：三张记录表的列集合与顺序都按参考站点排布。
 *
 * 参考站点各表列序：
 * 渠道记录：编号 / 记录类型 / 客户端 / 服务端 / 是否扣量 / 渠道名称 / 渠道编码 / 用户IP / 唯一标识 / UserAgent / 访问时间
 * 商户记录：编号 / 商户ID / 跳转商户 / 来源渠道 / 渠道编码 / 用户IP / 唯一标识 / 客户端 / 服务端 / UserAgent / 跳转时间
 * 下载记录：编号 / 客户端 / 渠道名称 / 渠道编码 / 用户IP / 唯一标识 / UserAgent / 下载时间
 * 请求 ID 是本站多出来的排查字段，统一放在时间列之前。
 */
const tableColumns: any[] = [
  { type: 'index', width: '70px', label: () => t('dataCenter.columns.serial') },
]

const userAgentColumn: any = {
  // UA 可能很长：单行截断 + 悬浮看全，避免把行高顶成两三倍
  label: () => t('dataCenter.userAgent'),
  prop: 'user_agent',
  minWidth: '260px',
  showOverflowTooltip: false,
  cellRender: ({ row }: { row: DataCenterEventVo }) => {
    const ua = row.user_agent || '-'
    return (
      <ElTooltip content={ua} placement="top" showAfter={300}>
        <span class="block max-w-[280px] truncate">{ua}</span>
      </ElTooltip>
    )
  },
}

const requestIdColumn: any = {
  label: () => t('dataCenter.requestId'),
  prop: 'request_id',
  minWidth: '220px',
  showOverflowTooltip: true,
}

function channelNameColumn(label: string): any {
  return {
    label: () => t(label),
    prop: 'channel_name',
    minWidth: '150px',
    showOverflowTooltip: true,
    cellRender: ({ row }: { row: DataCenterEventVo }) => row.channel_name || '-',
  }
}

const channelCodeColumn: any = { label: () => t('dataCenter.channelCode'), prop: 'channel_code', width: '120px' }
const ipColumn: any = { label: () => t('dataCenter.columns.userIp'), prop: 'ip', minWidth: '130px' }
const browserIdColumn: any = {
  label: () => t('dataCenter.columns.uniqueId'),
  prop: 'browser_id',
  minWidth: '170px',
  showOverflowTooltip: true,
}
const clientColumn: any = {
  label: () => t('dataCenter.columns.client'),
  prop: 'client_type',
  width: '110px',
  cellRender: ({ row }: { row: DataCenterEventVo }) => clientTypeText(row.client_type),
}
const serverColumn: any = {
  label: () => t('dataCenter.columns.server'),
  prop: 'server_type',
  width: '110px',
  cellRender: ({ row }: { row: DataCenterEventVo }) => clientTypeText(row.server_type),
}

if (props.variant === 'channel') {
  tableColumns.push(
    {
      label: () => t('dataCenter.eventType'),
      prop: 'event_type',
      width: '110px',
      cellRender: ({ row }: { row: DataCenterEventVo }) => {
        const meta = EVENT_TYPE_META[row.event_type]
        return <ElTag type={meta?.tag || 'info'}>{eventTypeText(row.event_type)}</ElTag>
      },
    },
    clientColumn,
    serverColumn,
    {
      label: () => t('dataCenter.columns.deducted'),
      prop: 'is_deducted',
      width: '100px',
      cellRender: ({ row }: { row: DataCenterEventVo }) => (
        <ElTag type={row.is_deducted === 1 ? 'danger' : 'info'}>
          {row.is_deducted === 1 ? t('dataCenter.yes') : t('dataCenter.no')}
        </ElTag>
      ),
    },
    channelNameColumn('dataCenter.columns.channelName'),
    channelCodeColumn,
    ipColumn,
    browserIdColumn,
    userAgentColumn,
    requestIdColumn,
    { label: () => t('dataCenter.columns.visitTime'), prop: 'occurred_at', width: '170px' },
  )
}
else if (props.variant === 'merchant') {
  tableColumns.push(
    { label: () => t('dataCenter.merchantId'), prop: 'merchant_id', width: '90px' },
    {
      label: () => t('dataCenter.columns.merchantJump'),
      prop: 'merchant_name',
      minWidth: '170px',
      showOverflowTooltip: true,
      cellRender: ({ row }: { row: DataCenterEventVo }) => row.merchant_name || '-',
    },
    channelNameColumn('dataCenter.columns.sourceChannel'),
    channelCodeColumn,
    ipColumn,
    browserIdColumn,
    clientColumn,
    serverColumn,
    userAgentColumn,
    requestIdColumn,
    { label: () => t('dataCenter.columns.jumpTime'), prop: 'occurred_at', width: '170px' },
  )
}
else {
  tableColumns.push(
    clientColumn,
    channelNameColumn('dataCenter.columns.channelName'),
    channelCodeColumn,
    ipColumn,
    browserIdColumn,
    userAgentColumn,
    requestIdColumn,
    { label: () => t('dataCenter.columns.downloadTime'), prop: 'occurred_at', width: '170px' },
  )
}

const options = ref<MaProTableOptions>({
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t(props.titleKey),
    subTitle: () => t(props.subtitleKey),
  },
  tableOptions: {
    stripe: true,
    border: true,
  },
  searchOptions: {
    // 筛选项较多：默认收起，保留「展开 / 收起」按钮
    fold: true,
    foldButtonShow: true,
    defaultValue: {
      date: today,
    },
    text: {
      searchBtn: () => t('crud.search'),
      resetBtn: () => t('crud.reset'),
      // 展开状态显示「收起」、收起状态显示「展开」（组件默认是「折叠 / 展开」）
      isFoldBtn: () => t('crud.searchFold'),
      notFoldBtn: () => t('crud.searchUnFold'),
    },
  },
  searchFormOptions: { labelWidth: '100px' },
  requestOptions: {
    // 单日查询：后端只查 date 当天那一张日表（参考站点同样只有「查询日期」）
    api: (params: any) => props.endpoint({ ...params }),
  },
})

const schema = ref<MaProTableSchema>({
  searchItems,
  tableColumns,
})
</script>

<template>
  <div class="mine-layout pt-3">
    <MaProTable ref="proTableRef" :options="options" :schema="schema">
      <template v-if="variant === 'merchant'" #toolbarLeft>
        <ElButton type="warning" plain @click="openRepeatFilter">
          {{ t('dataCenter.repeat.filter') }}
        </ElButton>
      </template>
    </MaProTable>

    <component :is="repeatDialog.Dialog" v-if="variant === 'merchant'">
      <div v-loading="repeatLoading" class="repeat-panel">
        <div class="repeat-panel__hint">
          <span class="repeat-panel__threshold">{{ t('dataCenter.repeat.threshold') }}: {{ repeatCount }}</span>
          <span>{{ t('dataCenter.repeat.hint') }}</span>
        </div>
        <div class="repeat-panel__actions">
          <MaBatchActions
            :count="repeatSelected.length"
            :actions="repeatActions"
            @command="handleRepeatCommand"
          />
          <el-input
            v-model="blacklistInput.ban_reason"
            class="repeat-panel__input"
            maxlength="255"
            clearable
            :placeholder="t('dataCenter.repeat.banReasonPlaceholder')"
          />
          <el-input
            v-model="blacklistInput.remark"
            class="repeat-panel__input repeat-panel__input--wide"
            maxlength="255"
            clearable
            :placeholder="t('dataCenter.repeat.banRemarkPlaceholder')"
          />
        </div>
        <ma-table ref="repeatTableRef" @selection-change="onRepeatSelectionChange" />
        <div class="repeat-panel__pagination">
          <el-pagination
            :current-page="repeatPage"
            :page-size="repeatPageSize"
            background
            layout="total, sizes, prev, pager, next"
            :total="repeatTotal"
            :page-sizes="[10, 20, 30, 50]"
            @current-change="changeRepeatPage"
            @size-change="changeRepeatPageSize"
          />
        </div>
      </div>
    </component>
  </div>
</template>

<style scoped lang="scss">
/* 行内操作：浅色底 + 彩色文字的小按钮，与其它页面统一 */
:global(.dc-row-action.el-button) {
  gap: 2px;
  padding: 4px 10px;
  font-size: 12px;
  white-space: nowrap;
  border: 0;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

:global(.dc-row-action--merchant.el-button) {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

:global(.dc-row-action--merchant.el-button:hover) {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-8);
}

:global(.dc-row-action--danger.el-button) {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

:global(.dc-row-action--danger.el-button:hover) {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-8);
}

/* 已加入黑名单等禁用态：底色与文字一起变灰 */
:global(.dc-row-action.el-button.is-disabled) {
  color: var(--el-text-color-disabled);
  background: var(--el-fill-color-light);
}
.repeat-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.repeat-panel__pagination {
  display: flex;
  justify-content: flex-end;
  /* 与表格拉开一点距离，避免分页紧贴表格底边 */
  margin-top: 12px;
}

.repeat-panel__hint {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-regular);
}

.repeat-panel__threshold {
  color: var(--el-color-danger);
  font-weight: 600;
}

.repeat-panel__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.repeat-panel__input {
  width: 220px;
}

.repeat-panel__input--wide {
  width: 280px;
}
</style>
