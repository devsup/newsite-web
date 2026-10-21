/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import '@/layouts/style/preview.scss'
import { useElementSize } from '@vueuse/core'
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import useHttp from '@/hooks/auto-imports/useHttp'
import { useMessage } from '@/hooks/useMessage'
import { copyText as writeClipboard } from '@/utils/clipboard'

type PreviewMode = 'app' | 'h5' | 'tablet' | 'pc'

type PreviewDevice = 'phone' | 'tablet' | 'desktop'

interface PreviewModeConfig {
  key: PreviewMode
  labelKey: string
  icon: string
  device: PreviewDevice
  /** 设备真实视口宽高（iframe 内部按该尺寸渲染，再整体缩放） */
  viewportWidth: number
  viewportHeight: number
  /** 弹窗宽度：手机模式收窄，平板 / PC 逐级放宽 */
  dialogWidth: number
}

interface PreviewState {
  visible: boolean
  loading: boolean
  loaded: boolean
  error: boolean
  previewUrl: string
  mode: PreviewMode
  reloadKey: number
  copied: boolean
}

/**
 * 预览模式配置。
 *
 * 注意这里给的是「设备真实视口」，不是显示尺寸：渲染时外层按可用空间整体缩放，
 * 这样 iframe 里的页面仍然按 375 / 1024 / 1440 的宽度排版，不会像直接改 iframe
 * 宽高那样把移动端页面挤成平板布局。
 */
const PREVIEW_MODES: PreviewModeConfig[] = [
  {
    key: 'app',
    labelKey: 'mineAdmin.preview.modeApp',
    icon: 'ep:iphone',
    device: 'phone',
    viewportWidth: 390,
    viewportHeight: 844,
    dialogWidth: 640,
  },
  {
    key: 'h5',
    labelKey: 'mineAdmin.preview.modeH5',
    icon: 'ep:cellphone',
    device: 'phone',
    viewportWidth: 375,
    viewportHeight: 812,
    dialogWidth: 640,
  },
  {
    key: 'tablet',
    labelKey: 'mineAdmin.preview.modeTablet',
    icon: 'mdi:tablet',
    device: 'tablet',
    viewportWidth: 1024,
    viewportHeight: 768,
    dialogWidth: 1000,
  },
  {
    key: 'pc',
    labelKey: 'mineAdmin.preview.modePc',
    icon: 'ep:monitor',
    device: 'desktop',
    viewportWidth: 1440,
    viewportHeight: 900,
    dialogWidth: 1280,
  },
]

/** iframe 最长等待时间：超过后撤掉 loading，避免被禁止嵌入的站点一直转圈 */
const IFRAME_LOAD_TIMEOUT = 8000

/**
 * 补全预览地址的协议。
 *
 * 系统设置里允许只填域名，直接塞进 iframe 会被当成后台站点的相对路径；
 * 本地地址补 http，其余补 https，已经是完整地址或相对路径的原样返回。
 */
function normalizePreviewUrl(raw: string): string {
  const value = raw.trim()
  if (!value) {
    return ''
  }
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
    return value
  }
  if (value.startsWith('//')) {
    return `${window.location.protocol}${value}`
  }
  const isLocalHost = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(value)
  return `${isLocalHost ? 'http' : 'https'}://${value}`
}

export default defineComponent({
  name: 'preview',
  setup() {
    const { globalTrans: t } = useTrans()
    const router = useRouter()
    const msg = useMessage()

    const state = reactive<PreviewState>({
      visible: false,
      loading: false,
      loaded: false,
      error: false,
      previewUrl: '',
      mode: 'h5',
      reloadKey: 0,
      copied: false,
    })

    const stageRef = ref<HTMLElement | null>(null)
    const { width: stageWidth, height: stageHeight } = useElementSize(stageRef)

    let iframeTimer: ReturnType<typeof setTimeout> | undefined
    let copiedTimer: ReturnType<typeof setTimeout> | undefined

    const currentMode = computed(() => {
      return PREVIEW_MODES.find(item => item.key === state.mode) ?? PREVIEW_MODES[1]
    })

    /** 设备整体缩放比：为设备边框和投影预留 56px，且不允许放大（避免低清） */
    const scale = computed(() => {
      const mode = currentMode.value
      const availableWidth = stageWidth.value - 56
      const availableHeight = stageHeight.value - 56
      if (availableWidth <= 0 || availableHeight <= 0) {
        return 0.6
      }
      return Math.min(
        availableWidth / mode.viewportWidth,
        availableHeight / mode.viewportHeight,
        1,
      )
    })

    /** 外层占位尺寸 = 真实视口 × 缩放比，保证设备框在舞台上居中 */
    const frameStyle = computed(() => ({
      width: `${Math.round(currentMode.value.viewportWidth * scale.value)}px`,
      height: `${Math.round(currentMode.value.viewportHeight * scale.value)}px`,
    }))

    const deviceStyle = computed(() => ({
      width: `${currentMode.value.viewportWidth}px`,
      height: `${currentMode.value.viewportHeight}px`,
      transform: `scale(${scale.value})`,
    }))

    const dialogWidth = computed(() => `${currentMode.value.dialogWidth}px`)

    const showIframeLoading = computed(() => {
      return Boolean(state.previewUrl) && !state.loaded && !state.error
    })

    function clearIframeTimer(): void {
      if (iframeTimer) {
        clearTimeout(iframeTimer)
        iframeTimer = undefined
      }
    }

    function clearCopiedTimer(): void {
      if (copiedTimer) {
        clearTimeout(copiedTimer)
        copiedTimer = undefined
      }
    }

    function startIframeTimer(): void {
      clearIframeTimer()
      iframeTimer = setTimeout(() => {
        // 目标站点可能通过 X-Frame-Options 禁止嵌入，此时 load 事件不可靠，
        // 到点后收起遮罩，页面底部会提示用「新窗口打开」
        state.loaded = true
      }, IFRAME_LOAD_TIMEOUT)
    }

    async function fetchPreviewUrl(): Promise<void> {
      state.loading = true
      state.error = false
      // 刷新时保留旧设备框，只盖一层 loading；首次打开没有地址时才走整块占位
      state.loaded = false
      try {
        const response = await useHttp().get('/admin/passport/get-preview')
        const data = response?.data
        // preview_url 是后端拼好的「导航域名 + 首个启用渠道编码」：导航页没有渠道参数会整页 404，
        // 不能直接用裸域名预览；一个启用渠道都没有时后端给空串，退回 navi_domain
        state.previewUrl = normalizePreviewUrl(String(data?.preview_url || data?.navi_domain || ''))
        state.reloadKey += 1
        if (state.previewUrl) {
          startIframeTimer()
        }
      }
      catch {
        state.previewUrl = ''
        state.error = true
        clearIframeTimer()
      }
      finally {
        state.loading = false
      }
    }

    function openPreview(): void {
      // 先开弹窗再取地址，避免接口慢时点击眼睛图标没有反馈
      state.visible = true
      state.loaded = false
      state.error = false
      void fetchPreviewUrl()
    }

    function closePreview(): void {
      state.visible = false
      clearIframeTimer()
      clearCopiedTimer()
      state.copied = false
    }

    function refreshPreview(): void {
      void fetchPreviewUrl()
    }

    function handleIframeLoad(): void {
      state.loaded = true
      clearIframeTimer()
    }

    function openInNewWindow(): void {
      if (!state.previewUrl) {
        return
      }
      window.open(state.previewUrl, '_blank', 'noopener,noreferrer')
    }

    async function copyPreviewUrl(): Promise<void> {
      if (!state.previewUrl) {
        return
      }

      try {
        const ok = await writeClipboard(state.previewUrl)
        if (!ok) {
          throw new Error('copy failed')
        }

        state.copied = true
        clearCopiedTimer()
        copiedTimer = setTimeout(() => {
          state.copied = false
        }, 1600)
      }
      catch {
        msg.error(t('mineAdmin.preview.copyFailed'))
      }
    }

    function goSetting(): void {
      closePreview()
      void router.push('/site/setting')
    }

    function renderModeSwitch() {
      return (
        <div class="site-preview__modes">
          {PREVIEW_MODES.map(mode => (
            <button
              type="button"
              class={{
                'site-preview__mode': true,
                'is-active': state.mode === mode.key,
              }}
              aria-pressed={state.mode === mode.key}
              onClick={() => {
                state.mode = mode.key
              }}
            >
              <ma-svg-icon name={mode.icon} size={14} />
              <span>{t(mode.labelKey)}</span>
            </button>
          ))}
        </div>
      )
    }

    function renderActions() {
      return (
        <div class="site-preview__actions">
          <el-tooltip content={t('mineAdmin.preview.refresh')} placement="bottom" show-after={300}>
            <button type="button" class="site-preview__action" disabled={state.loading} onClick={refreshPreview}>
              <ma-svg-icon name="ep:refresh-right" size={16} />
            </button>
          </el-tooltip>
          <el-tooltip
            content={state.copied ? t('mineAdmin.preview.copied') : t('mineAdmin.preview.copyLink')}
            placement="bottom"
            show-after={300}
          >
            <button
              type="button"
              class={{
                'site-preview__action': true,
                'is-copied': state.copied,
              }}
              disabled={!state.previewUrl}
              onClick={copyPreviewUrl}
            >
              <ma-svg-icon name={state.copied ? 'ep:check' : 'ep:copy-document'} size={16} />
            </button>
          </el-tooltip>
          <el-tooltip content={t('mineAdmin.preview.openNewWindow')} placement="bottom" show-after={300}>
            <button
              type="button"
              class="site-preview__action"
              disabled={!state.previewUrl}
              onClick={openInNewWindow}
            >
              <ma-svg-icon name="ep:top-right" size={16} />
            </button>
          </el-tooltip>
          <el-tooltip content={t('mineAdmin.preview.close')} placement="bottom" show-after={300}>
            <button type="button" class="site-preview__action is-danger" onClick={closePreview}>
              <ma-svg-icon name="ep:close" size={16} />
            </button>
          </el-tooltip>
        </div>
      )
    }

    function renderPlaceholder() {
      const isError = state.error
      return (
        <div class="site-preview__placeholder">
          <div class="site-preview__placeholder-icon">
            <ma-svg-icon name={isError ? 'ep:warning-filled' : 'ep:view'} size={28} />
          </div>
          <div class="site-preview__placeholder-title">
            {isError ? t('mineAdmin.preview.loadFailed') : t('mineAdmin.preview.empty')}
          </div>
          <div class="site-preview__placeholder-desc">
            {t('mineAdmin.preview.emptyHint')}
          </div>
          <div class="flex items-center gap-2">
            {isError && (
              <el-button size="small" onClick={refreshPreview}>
                {t('mineAdmin.preview.retry')}
              </el-button>
            )}
            <el-button size="small" type="primary" onClick={goSetting}>
              {t('mineAdmin.preview.goSetting')}
            </el-button>
          </div>
        </div>
      )
    }

    function renderStage() {
      if (state.loading && !state.previewUrl) {
        return (
          <div class="site-preview__placeholder">
            <div class="site-preview__placeholder-icon is-loading">
              <ma-svg-icon name="ep:loading" size={28} />
            </div>
            <div class="site-preview__placeholder-title">
              {t('mineAdmin.preview.loading')}
            </div>
          </div>
        )
      }

      if (!state.previewUrl || state.error) {
        return renderPlaceholder()
      }

      return (
        <div class="site-preview__frame" style={frameStyle.value}>
          <div
            class={[
              'site-preview__device',
              `site-preview__device--${currentMode.value.device}`,
            ]}
            style={deviceStyle.value}
          >
            <iframe
              key={state.reloadKey}
              src={state.previewUrl}
              title={t('mineAdmin.preview.title')}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerpolicy="no-referrer"
              onLoad={handleIframeLoad}
            />
            {showIframeLoading.value && (
              <div class="site-preview__loading">
                <ma-svg-icon name="ep:loading" size={24} class="site-preview__loading-icon" />
                <span>{t('mineAdmin.preview.loading')}</span>
              </div>
            )}
          </div>
        </div>
      )
    }

    onBeforeUnmount(() => {
      clearIframeTimer()
      clearCopiedTimer()
    })

    return () => (
      <>
        <m-tooltip
          text={t('mineAdmin.preview.title')}
          placement="bottom"
          class="site-preview-trigger"
        >
          <ma-svg-icon
            name="mdi:devices"
            class="tool-icon animate-ease-in"
            size={20}
            onClick={openPreview}
          />
        </m-tooltip>

        <el-dialog
          v-model={state.visible}
          title={t('mineAdmin.preview.title')}
          width={dialogWidth.value}
          append-to-body
          destroy-on-close
          align-center
          class="site-preview-dialog"
          close-on-click-modal={false}
          show-close={false}
          onClosed={() => {
            clearIframeTimer()
            state.copied = false
          }}
        >
          <div class="site-preview">
            <div class="site-preview__header">
              {renderModeSwitch()}
              <div class="site-preview__url" title={state.previewUrl}>
                <ma-svg-icon
                  name={state.previewUrl.startsWith('https://') ? 'ep:lock' : 'ep:link'}
                  size={13}
                  class="site-preview__url-lock"
                />
                <span class="site-preview__url-text">
                  {state.previewUrl || t('mineAdmin.preview.empty')}
                </span>
              </div>
              {renderActions()}
            </div>

            <div ref={stageRef} class="site-preview__stage">
              <div class="site-preview__grid" />
              {renderStage()}
            </div>

            <div class="site-preview__footer">
              <span class="site-preview__footer-item site-preview__footer-source">
                <ma-svg-icon name="ep:link" size={12} />
                {t('mineAdmin.preview.urlHint')}
              </span>
              <span class="site-preview__footer-item site-preview__footer-hint">
                <ma-svg-icon name="ep:info-filled" size={12} />
                {t('mineAdmin.preview.iframeHint')}
              </span>
            </div>
          </div>
        </el-dialog>
      </>
    )
  },
})
