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
import type { DataCenterChannelVo, DataCenterDailyVo, DataCenterEventVo } from '~/dataCenter/api/dataCenter'

import { channelOfDay, channelRecordPage, overview } from '~/dataCenter/api/dataCenter'
import { themeMode, useEcharts } from '@/hooks/useEcharts.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'welcome' })

const t = useTrans().globalTrans
const router = useRouter()
const userInfo = useUserStore().getUserInfo()

/**
 * 工作台是登录后的默认首页，所有登录用户都能看到；
 * 数据类卡片依赖数据中心权限，没有权限时整块隐藏，避免 403 弹窗打扰。
 */
const canViewStats = computed(() => hasAuth('dataCenter:comprehensive:index'))
const canViewRecords = computed(() => hasAuth('dataCenter:channelRecord:index'))
const canViewChannelLog = computed(() => hasAuth('dataCenter:channelLog:index'))

const loading = ref(false)
const lastUpdated = ref('')
const trendDays = ref(7)
/** 近 N 天按天统计：今日 / 昨日对比与趋势图都用这一次请求，避免重复调用 */
const dailyRows = ref<DataCenterDailyVo[]>([])
/** 今日各渠道明细，用于「今日渠道 TOP 5」 */
const todayChannels = ref<DataCenterChannelVo[]>([])
/** 最近访问动态 */
const recentRecords = ref<DataCenterEventVo[]>([])

/** 空行兜底：接口未返回或今天还没有数据时，指标卡显示 0 而不是空白 */
const EMPTY_ROW: DataCenterDailyVo = {
  stat_date: '',
  channel_pv: 0,
  channel_uv: 0,
  land_pv: 0,
  land_uv: 0,
  navi_pv: 0,
  navi_uv: 0,
  install_num: 0,
  install_deducted: 0,
  download_pv: 0,
  download_uv: 0,
  merchant_pv: 0,
  merchant_uv: 0,
  merchant_channel_uv: 0,
  jump_pv: 0,
  install_ratio: 0,
  download_ratio: 0,
  merchant_click_ratio: 0,
}

const today = useDayjs().format('YYYY-MM-DD')
const yesterday = useDayjs().subtract(1, 'day').format('YYYY-MM-DD')

/**
 * 综合统计接口按「日期倒序」返回（今天在最前），而趋势图需要从左到右由旧到新；
 * 指标卡也按 stat_date 精确取值，避免依赖数组顺序。
 */
const ascRows = computed(() => [...dailyRows.value].sort((a, b) => a.stat_date.localeCompare(b.stat_date)))
const summaryToday = computed(() => dailyRows.value.find(row => row.stat_date === today) ?? EMPTY_ROW)
const summaryYesterday = computed(() => dailyRows.value.find(row => row.stat_date === yesterday) ?? null)

/** 按小时给出问候语 */
const greeting = computed(() => {
  const hour = useDayjs().hour()
  if (hour < 6 || hour >= 22) {
    return t('workbench.greetingEvening')
  }
  if (hour < 9) {
    return t('workbench.greetingMorning')
  }
  if (hour < 12) {
    return t('workbench.greetingForenoon')
  }
  if (hour < 14) {
    return t('workbench.greetingNoon')
  }
  if (hour < 18) {
    return t('workbench.greetingAfternoon')
  }
  return t('workbench.greetingEvening')
})

const displayName = computed(() => userInfo?.nickname || userInfo?.username || '-')
const avatarText = computed(() => (userInfo?.nickname || userInfo?.username || '?').charAt(0).toUpperCase())

/** 角色与部门信息：可能有多个，展示成「角色：超管 · 部门：技术部」 */
const userMeta = computed(() => {
  const roles = (userInfo?.roles ?? []).map(item => item.name).filter(Boolean)
  const departments = (userInfo?.departments ?? []).map(item => item.name).filter(Boolean)
  return [
    { label: t('workbench.role'), value: roles.length > 0 ? roles.join('、') : '-' },
    { label: t('workbench.department'), value: departments.length > 0 ? departments.join('、') : '-' },
  ]
})

const todayText = useDayjs().format('YYYY-MM-DD')

function formatNumber(value?: number): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatTime(value?: string): string {
  return value ? useDayjs(value).format('MM-DD HH:mm') : '-'
}

/** 较昨日增减：昨日为 0 时不给百分比，避免出现「+Infinity%」 */
interface DeltaResult { value: string, direction: 'up' | 'down' | 'flat' }

function delta(current: number, previous: number): DeltaResult {
  if (!previous) {
    return current > 0
      ? { value: '+100%', direction: 'up' }
      : { value: '—', direction: 'flat' }
  }
  const rate = ((current - previous) / previous) * 100
  if (Math.abs(rate) < 0.05) {
    return { value: '0%', direction: 'flat' }
  }
  return {
    value: `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`,
    direction: rate > 0 ? 'up' : 'down',
  }
}

/** 指标卡：今日值 + 较昨日变化 */
const metricCards = computed(() => {
  const current = summaryToday.value
  const previous = summaryYesterday.value
  const build = (key: 'channel_pv' | 'channel_uv' | 'land_pv' | 'navi_pv' | 'install_num' | 'merchant_pv') => ({
    key,
    value: Number(current[key] || 0),
    delta: delta(Number(current[key] || 0), Number(previous?.[key] || 0)),
  })

  return [
    { ...build('channel_pv'), label: t('workbench.metrics.channelPv'), unit: 'PV', icon: 'material-symbols:visibility-outline', color: '#2563EB' },
    { ...build('channel_uv'), label: t('workbench.metrics.channelUv'), unit: 'UV', icon: 'material-symbols:group-outline', color: '#0891B2' },
    { ...build('land_pv'), label: t('workbench.metrics.landPv'), unit: 'PV', icon: 'material-symbols:phone-iphone', color: '#6366F1' },
    { ...build('navi_pv'), label: t('workbench.metrics.naviPv'), unit: 'PV', icon: 'material-symbols:explore-outline', color: '#8B5CF6' },
    { ...build('install_num'), label: t('workbench.metrics.installNum'), unit: '', icon: 'material-symbols:download-done', color: '#10B981' },
    { ...build('merchant_pv'), label: t('workbench.metrics.merchantClick'), unit: 'PV', icon: 'material-symbols:touch-app-outline', color: '#F59E0B' },
  ]
})

/** 窄屏用的 HTML 图例，颜色与图表 series 保持一致 */
const trendLegend = computed(() => [
  { label: t('workbench.trendPv'), color: '#2563EB' },
  { label: t('workbench.trendUv'), color: '#10B981' },
  { label: t('workbench.trendMerchant'), color: '#F59E0B' },
])

/** 今日渠道 TOP 10（接口已按 PV 倒序，这里再排一次保证口径，同时展示 PV 与 UV） */
const topChannels = computed(() => (
  [...todayChannels.value]
    .sort((a, b) => Number(b.channel_pv) - Number(a.channel_pv))
    .slice(0, 10)
))

const topChannelMax = computed(() => Math.max(...topChannels.value.map(item => Number(item.channel_pv) || 0), 1))

function topChannelWidth(pv: number): string {
  return `${Math.max(4, Math.round((Number(pv) || 0) / topChannelMax.value * 100))}%`
}

/** 渠道访问记录只包含落地页 / 导航页 / 安装三类事件 */
const EVENT_META: Record<number, { key: string, tag: 'primary' | 'success' | 'danger' }> = {
  1: { key: 'landing', tag: 'primary' },
  2: { key: 'navigation', tag: 'success' },
  5: { key: 'install', tag: 'danger' },
}

function eventMeta(type: number): { label: string, tag: 'primary' | 'success' | 'danger' } {
  const meta = EVENT_META[type]
  return {
    label: meta ? t(`workbench.eventTypes.${meta.key}`) : t('workbench.eventTypes.other'),
    tag: meta?.tag ?? 'primary',
  }
}

/**
 * 快捷入口暂时隐藏（产品要求），代码保留：
 * 恢复时把这个常量改成 true 即可，入口清单与权限过滤都不需要动。
 */
const SHOW_QUICK_ENTRY = false

/** 快捷入口：按权限过滤，无权限的入口直接不渲染 */
const quickEntries = computed(() => [
  { title: t('workbench.entries.channel'), desc: t('workbench.entries.channelDesc'), icon: 'material-symbols:conversion-path', path: '/channel', auth: 'channel:index' },
  { title: t('workbench.entries.merchant'), desc: t('workbench.entries.merchantDesc'), icon: 'material-symbols:storefront-outline', path: '/merchantConfig/merchant', auth: 'merchant:index' },
  { title: t('workbench.entries.category'), desc: t('workbench.entries.categoryDesc'), icon: 'material-symbols:tab', path: '/merchantConfig/category', auth: 'category:index' },
  { title: t('workbench.entries.tabFooter'), desc: t('workbench.entries.tabFooterDesc'), icon: 'material-symbols:view-agenda-outline', path: '/merchantConfig/tabFooter', auth: 'tabFooter:index' },
  { title: t('workbench.entries.dataCenter'), desc: t('workbench.entries.dataCenterDesc'), icon: 'material-symbols:bar-chart-outline', path: '/dataCenter/comprehensive', auth: 'dataCenter:comprehensive:index' },
  { title: t('workbench.entries.themes'), desc: t('workbench.entries.themesDesc'), icon: 'material-symbols:palette-outline', path: '/site/themes', auth: 'themes:index' },
  { title: t('workbench.entries.setting'), desc: t('workbench.entries.settingDesc'), icon: 'ant-design:setting-outlined', path: '/site/setting', auth: 'setting:index' },
  { title: t('workbench.entries.attachment'), desc: t('workbench.entries.attachmentDesc'), icon: 'ri:attachment-line', path: '/dataCenter/attachment', auth: 'dataCenter:attachment:list' },
].filter(entry => hasAuth(entry.auth)))

function go(path: string): void {
  router.push(path)
}

/**
 * 加载工作台数据。
 *
 * 三个接口独立失败互不影响：overview 是趋势与指标，channel/day 是今日渠道排行，
 * channel-record/list 是最近动态；某个接口 403 或无数据时对应区块显示空态即可。
 */
async function loadAll(): Promise<void> {
  if (loading.value) {
    return
  }
  if (!canViewStats.value && !canViewRecords.value) {
    return
  }

  loading.value = true
  const tasks: Promise<void>[] = []
  try {
    if (canViewStats.value) {
      tasks.push(loadOverview())
      tasks.push(loadTodayChannels())
    }
    if (canViewRecords.value) {
      tasks.push(loadRecentRecords())
    }
    await Promise.allSettled(tasks)
    lastUpdated.value = useDayjs().format('HH:mm:ss')
  }
  finally {
    loading.value = false
  }
}

async function loadOverview(): Promise<void> {
  const startDate = useDayjs().subtract(trendDays.value - 1, 'day').format('YYYY-MM-DD')
  const response = await overview({ start_date: startDate, end_date: today })
  if (response.code === ResultCode.SUCCESS && Array.isArray(response.data?.list)) {
    dailyRows.value = response.data.list
  }
}

async function loadTodayChannels(): Promise<void> {
  // 只取当天各渠道的汇总；后端已按 channel_pv 倒序，前端再截前 10 条
  const response = await channelOfDay(today)
  if (response.code === ResultCode.SUCCESS && Array.isArray(response.data)) {
    todayChannels.value = response.data
  }
}

async function loadRecentRecords(): Promise<void> {
  const response = await channelRecordPage({ page: 1, page_size: 10 })
  if (response.code === ResultCode.SUCCESS && Array.isArray(response.data?.list)) {
    recentRecords.value = response.data.list
  }
}

/** 切换趋势区间重新请求 overview；接口始终返回区间内每一天，今日 / 昨日对比值不受影响 */
function changeTrendDays(days: number): void {
  if (trendDays.value === days) {
    return
  }
  trendDays.value = days
  loadOverview().catch(() => {})
}

// ---------------------------------- 趋势图 ----------------------------------

const chartEl = ref<HTMLElement>()
const chart = useEcharts(chartEl, { theme: themeMode() })

const chartOption = computed<any>(() => {
  const rows = ascRows.value
  return {
    color: ['#2563EB', '#10B981', '#F59E0B'],
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 14,
      textStyle: { fontSize: 12 },
      data: [t('workbench.trendPv'), t('workbench.trendUv'), t('workbench.trendMerchant')],
    },
    grid: { left: 8, right: 24, top: 36, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisTick: { show: false },
      data: rows.map(row => useDayjs(row.stat_date).format('MM-DD')),
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    // 窄屏下 echarts 的图例会竖排压住坐标轴，直接关掉，改用图表上方的 HTML 图例
    media: [
      {
        query: { maxWidth: 560 },
        option: {
          legend: { show: false },
          grid: { top: 8, bottom: 8, left: 4, right: 8 },
          yAxis: { splitNumber: 3 },
        },
      },
    ],
    series: [
      {
        name: t('workbench.trendPv'),
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: 0.12 },
        data: rows.map(row => Number(row.channel_pv || 0)),
      },
      {
        name: t('workbench.trendUv'),
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rows.map(row => Number(row.channel_uv || 0)),
      },
      {
        name: t('workbench.trendMerchant'),
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rows.map(row => Number(row.merchant_pv || 0)),
      },
    ],
  }
})

let chartObserver: ResizeObserver | null = null

// useEcharts 在 onMounted 里 nextTick 后才初始化实例，这里等一个 tick 再灌数据
onMounted(async () => {
  await nextTick()
  chart.setOption(chartOption.value)
  chart.resize()

  // useEcharts 只在 window resize 时重算，容器自身变宽（侧边栏折叠、卡片重排）不会触发；
  // 不加这个观察者，移动端首次渲染会按一个更窄的宽度定格，右侧数据点被裁掉。
  if (chartEl.value && typeof ResizeObserver !== 'undefined') {
    chartObserver = new ResizeObserver(() => chart.resize())
    chartObserver.observe(chartEl.value)
  }
})

onBeforeUnmount(() => {
  chartObserver?.disconnect()
  chartObserver = null
})

watch(chartOption, option => chart.setOption(option))

// 首次进入与切回标签页都刷新一次；首次两个钩子都会触发，用 loading 去重
let activated = false
onMounted(async () => {
  await loadAll()
  activated = true
})

onActivated(() => {
  if (activated) {
    loadAll().catch(() => {})
  }
})
</script>

<template>
  <div class="mine-layout workbench pt-3">
    <!-- 欢迎条：账号信息 + 常用入口 -->
    <section class="workbench-hero">
      <div class="workbench-hero__profile">
        <el-avatar :size="64" :src="userInfo?.avatar || undefined" class="workbench-hero__avatar">
          <span class="workbench-hero__avatar-text">{{ avatarText }}</span>
        </el-avatar>
        <div class="workbench-hero__intro">
          <div class="workbench-hero__greeting">
            {{ greeting }}，{{ displayName }}
          </div>
          <div class="workbench-hero__meta">
            <span v-for="item in userMeta" :key="item.label" class="workbench-hero__meta-item">
              <span class="workbench-hero__meta-label">{{ item.label }}</span>{{ item.value }}
            </span>
            <span class="workbench-hero__meta-item">{{ todayText }}</span>
          </div>
        </div>
      </div>

      <div class="workbench-hero__actions">
        <el-button v-auth="'channel:index'" type="primary" @click="go('/channel')">
          <ma-svg-icon name="material-symbols:conversion-path" :size="16" />
          <span class="ml-1">{{ t('workbench.entries.channel') }}</span>
        </el-button>
        <el-button v-auth="'merchant:index'" @click="go('/merchantConfig/merchant')">
          <ma-svg-icon name="material-symbols:storefront-outline" :size="16" />
          <span class="ml-1">{{ t('workbench.entries.merchant') }}</span>
        </el-button>
        <el-button
          v-if="canViewStats"
          :loading="loading"
          @click="loadAll"
        >
          <ma-svg-icon name="material-symbols:refresh" :size="16" />
          <span class="ml-1">{{ t('workbench.refresh') }}</span>
        </el-button>
      </div>
    </section>

    <!-- 今日概览 -->
    <template v-if="canViewStats">
      <div class="workbench-section-head">
        <div>
          <div class="workbench-section-head__title">
            {{ t('workbench.overviewTitle') }}
          </div>
          <div class="workbench-section-head__sub">
            {{ t('workbench.overviewSubtitle') }}
            <span v-if="lastUpdated" class="workbench-section-head__time">
              {{ t('workbench.updatedAt', { time: lastUpdated }) }}
            </span>
          </div>
        </div>
      </div>

      <div v-loading="loading" class="workbench-metrics">
        <el-card
          v-for="metric in metricCards"
          :key="metric.key"
          class="workbench-metric"
          shadow="never"
        >
          <div class="workbench-metric__head">
            <span
              class="workbench-metric__icon"
              :style="{ color: metric.color, backgroundColor: `${metric.color}1a` }"
            >
              <ma-svg-icon :name="metric.icon" :size="18" />
            </span>
            <span class="workbench-metric__label">{{ metric.label }}</span>
          </div>
          <div class="workbench-metric__value">
            {{ formatNumber(metric.value) }}
            <span v-if="metric.unit" class="workbench-metric__unit">{{ metric.unit }}</span>
          </div>
          <div class="workbench-metric__foot">
            <span class="workbench-metric__compare">{{ t('workbench.compareYesterday') }}</span>
            <span class="workbench-metric__delta" :class="`is-${metric.delta.direction}`">
              <ma-svg-icon
                v-if="metric.delta.direction !== 'flat'"
                :name="metric.delta.direction === 'up' ? 'material-symbols:arrow-upward' : 'material-symbols:arrow-downward'"
                :size="11"
              />
              {{ metric.delta.value }}
            </span>
          </div>
        </el-card>
      </div>

      <div class="workbench-grid">
        <!-- 趋势 -->
        <el-card class="workbench-card workbench-card--trend" shadow="never">
          <template #header>
            <div class="workbench-card__head">
              <div>
                <div class="workbench-card__title">
                  {{ t('workbench.trendTitle') }}
                </div>
                <div class="workbench-card__sub">
                  {{ t('workbench.trendSubtitle', { days: trendDays }) }}
                </div>
              </div>
              <el-radio-group
                :model-value="trendDays"
                size="small"
                @change="(value: any) => changeTrendDays(Number(value))"
              >
                <el-radio-button :value="7">
                  {{ t('workbench.trendDays7') }}
                </el-radio-button>
                <el-radio-button :value="14">
                  {{ t('workbench.trendDays14') }}
                </el-radio-button>
                <el-radio-button :value="30">
                  {{ t('workbench.trendDays30') }}
                </el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="workbench-trend__legend">
            <span v-for="item in trendLegend" :key="item.label" class="workbench-trend__legend-item">
              <i :style="{ backgroundColor: item.color }" />{{ item.label }}
            </span>
          </div>
          <div ref="chartEl" class="workbench-trend__chart" />
        </el-card>

        <!-- 今日渠道 TOP 5 -->
        <el-card class="workbench-card workbench-card--top" shadow="never">
          <template #header>
            <div class="workbench-card__head">
              <div>
                <div class="workbench-card__title">
                  {{ t('workbench.topChannelTitle') }}
                </div>
                <div class="workbench-card__sub">
                  {{ t('workbench.topChannelSubtitle') }}
                </div>
              </div>
              <el-button
                v-if="canViewChannelLog"
                link
                type="primary"
                @click="go('/dataCenter/channelLog')"
              >
                {{ t('workbench.viewAll') }}
              </el-button>
            </div>
          </template>

          <div v-if="topChannels.length > 0" class="workbench-top">
            <div v-for="(item, index) in topChannels" :key="item.channel_id" class="workbench-top__item">
              <span class="workbench-top__rank" :class="{ 'is-top': index < 3 }">{{ index + 1 }}</span>
              <div class="workbench-top__main">
                <div class="workbench-top__row">
                  <span class="workbench-top__name">{{ item.channel_name || item.channel_code || `#${item.channel_id}` }}</span>
                  <span class="workbench-top__stats">
                    <span class="workbench-top__stat">
                      <b>{{ formatNumber(item.channel_pv) }}</b>PV
                    </span>
                    <span class="workbench-top__stat is-uv">
                      <b>{{ formatNumber(item.channel_uv) }}</b>UV
                    </span>
                  </span>
                </div>
                <div class="workbench-top__bar">
                  <span class="workbench-top__bar-inner" :style="{ width: topChannelWidth(item.channel_pv) }" />
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else :description="t('workbench.topChannelEmpty')" :image-size="72" />
        </el-card>
      </div>
    </template>

    <!-- 无数据权限时的提示，避免整页看起来像坏了 -->
    <el-card v-else class="workbench-card workbench-tip" shadow="never">
      <el-empty :description="t('workbench.noDataPermission')" :image-size="80" />
    </el-card>

    <!-- 快捷入口 -->
    <el-card v-if="SHOW_QUICK_ENTRY && quickEntries.length > 0" class="workbench-card" shadow="never">
      <template #header>
        <div class="workbench-card__head">
          <div>
            <div class="workbench-card__title">
              {{ t('workbench.quickEntryTitle') }}
            </div>
            <div class="workbench-card__sub">
              {{ t('workbench.quickEntrySubtitle') }}
            </div>
          </div>
        </div>
      </template>

      <div class="workbench-entries">
        <button
          v-for="entry in quickEntries"
          :key="entry.path"
          type="button"
          class="workbench-entry"
          @click="go(entry.path)"
        >
          <span class="workbench-entry__icon">
            <ma-svg-icon :name="entry.icon" :size="20" />
          </span>
          <span class="workbench-entry__text">
            <span class="workbench-entry__title">{{ entry.title }}</span>
            <span class="workbench-entry__desc">{{ entry.desc }}</span>
          </span>
          <ma-svg-icon name="material-symbols:chevron-right" :size="16" class="workbench-entry__arrow" />
        </button>
      </div>
    </el-card>

    <!-- 最近访问动态 -->
    <el-card v-if="canViewRecords" class="workbench-card" shadow="never">
      <template #header>
        <div class="workbench-card__head">
          <div>
            <div class="workbench-card__title">
              {{ t('workbench.recentTitle') }}
            </div>
            <div class="workbench-card__sub">
              {{ t('workbench.recentSubtitle') }}
            </div>
          </div>
          <el-button
            v-if="canViewRecords"
            link
            type="primary"
            @click="go('/dataCenter/channelRecord')"
          >
            {{ t('workbench.viewAll') }}
          </el-button>
        </div>
      </template>

      <ul v-if="recentRecords.length > 0" class="workbench-recent">
        <li v-for="(item, index) in recentRecords" :key="item.id" class="workbench-recent__item">
          <span class="workbench-recent__index">{{ index + 1 }}</span>
          <el-tag size="small" :type="eventMeta(item.event_type).tag">
            {{ eventMeta(item.event_type).label }}
          </el-tag>
          <span class="workbench-recent__channel">
            {{ item.channel_name || item.channel_code || '-' }}
          </span>
          <span class="workbench-recent__ip">{{ item.ip }}</span>
          <span class="workbench-recent__time">{{ formatTime(item.occurred_at) }}</span>
        </li>
      </ul>
      <el-empty v-else :description="t('workbench.recentEmpty')" :image-size="72" />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.workbench {
  padding-bottom: 24px;
}

/* 欢迎条 */
.workbench-hero {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin: 0 12px 12px;
  padding: 20px 24px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  /* 用主色叠加透明渐变而不是 primary-light-9：深色主题下 light-9 偏浅，整条背景会发白、文字看不清 */
  background:
    radial-gradient(circle at 8% -30%, color-mix(in srgb, var(--el-color-primary) 18%, transparent), transparent 58%),
    var(--el-fill-color-blank);
}

.workbench-hero__profile {
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 0;
}

.workbench-hero__avatar {
  flex: 0 0 auto;
  background: var(--el-color-primary);
}

.workbench-hero__avatar-text {
  font-size: 26px;
  font-weight: 600;
  color: #fff;
}

.workbench-hero__intro {
  min-width: 0;
}

.workbench-hero__greeting {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.workbench-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.workbench-hero__meta-label {
  margin-right: 4px;
  color: var(--el-text-color-secondary);
}

.workbench-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* 区块标题 */
.workbench-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin: 0 12px 10px;
}

.workbench-section-head__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.workbench-section-head__sub {
  margin-top: 4px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.workbench-section-head__time {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 指标卡 */
.workbench-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
  margin: 0 12px 12px;
}

.workbench-metric {
  border-radius: 8px;

  :deep(.el-card__body) {
    padding: 14px 16px;
  }
}

.workbench-metric__head {
  display: flex;
  gap: 8px;
  align-items: center;
}

.workbench-metric__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.workbench-metric__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.workbench-metric__value {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

.workbench-metric__unit {
  margin-left: 3px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}

.workbench-metric__foot {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.workbench-metric__delta {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  font-weight: 600;

  &.is-up {
    color: var(--el-color-danger);
  }

  &.is-down {
    color: var(--el-color-success);
  }

  &.is-flat {
    color: var(--el-text-color-placeholder);
  }
}

/* 趋势 + TOP 渠道 */
.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 12px;
  margin: 0 12px 12px;
}

@media (max-width: 1200px) {
  .workbench-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.workbench-card {
  margin: 0 12px 12px;
  border-radius: 8px;

  .workbench-grid > & {
    margin: 0;
  }
}

.workbench-card__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.workbench-card__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.workbench-card__sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .workbench-hero {
    padding: 16px;
  }

  .workbench-hero__greeting {
    font-size: 18px;
  }

  /* 趋势卡的标题与区间切换在窄屏下互相挤压，改为纵向堆叠；其它卡片允许换行即可 */
  .workbench-card__head {
    flex-wrap: wrap;
  }

  .workbench-card--trend .workbench-card__head {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .workbench-trend__chart {
    min-height: 240px;
  }
}

/* 趋势卡跟随右侧卡片等高，图表用剩余空间填满，避免下方留白 */
.workbench-card--trend {
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
}

.workbench-trend__chart {
  flex: 1;
  min-height: 300px;
}

/* 只在小屏显示：宽屏的图例由 echarts 自己画在右上角 */
.workbench-trend__legend {
  display: none;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.workbench-trend__legend-item {
  display: inline-flex;
  gap: 5px;
  align-items: center;

  i {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
}

@media (max-width: 560px) {
  .workbench-trend__legend {
    display: flex;
  }
}

.workbench-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 2px;
}

.workbench-top__item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.workbench-top__rank {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 6px;

  &.is-top {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  }
}

.workbench-top__main {
  flex: 1;
  min-width: 0;
}

.workbench-top__row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.workbench-top__name {
  overflow: hidden;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-top__stats {
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  align-items: baseline;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.workbench-top__stat {
  display: inline-flex;
  gap: 3px;
  align-items: baseline;

  b {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &.is-uv b {
    color: var(--el-color-success);
  }
}

.workbench-top__bar {
  height: 5px;
  margin-top: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.workbench-top__bar-inner {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--el-color-primary-light-3), var(--el-color-primary));
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* 快捷入口 */
.workbench-entries {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.workbench-entry {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  background: var(--el-fill-color-lighter);
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-fill-color-lighter));
    border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
  }
}

.workbench-entry__icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-radius: 8px;
}

.workbench-entry__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.workbench-entry__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.workbench-entry__desc {
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-entry__arrow {
  flex: 0 0 auto;
  color: var(--el-text-color-placeholder);
}

/* 最近动态：两列并排，条目用浅灰块分隔（条数不固定，避免用下边框时奇偶行对不齐） */
.workbench-recent {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.workbench-recent__item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 12px;
  font-size: 13px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

@media (max-width: 768px) {
  .workbench-recent {
    grid-template-columns: minmax(0, 1fr);
  }
}

.workbench-recent__index {
  flex: 0 0 auto;
  width: 18px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.workbench-recent__channel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-recent__ip {
  flex: 0 0 auto;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.workbench-recent__time {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 无权限提示 */
.workbench-tip {
  :deep(.el-card__body) {
    padding: 24px;
  }
}
</style>
