<!--
 - MineAdmin is committed to providing solutions for quickly building web applications
 - Please view the LICENSE file that was distributed with this source code,
 - For the full copyright and license information.
 - Thank you very much for using MineAdmin.
 -
 - @Author X.Mo<root@imoi.cn>
 - @Link   https://github.com/mineadmin
-->
<i18n lang="yaml">
en:
  searchPlaceholder: Search resources in this category
  tips: Are you sure you want to delete this data?
  cancelMessage: Deletion operation has been canceled
  errorMessage: An error occurred during the deletion process
  all: All
  image: Image
  video: Video
  audio: Audio
  document: Document
  maxSelect: You can select up to {limit} items.
  select: Select
  deselect: Deselect
  singleSelect: Select only this item
  view: View
  copyAbsolutePath: Copy absolute path
  copyRelativePath: Copy relative path
  copySuccess: Path copied
  copyFail: Copy failed, please copy manually
  delete: Delete
  cancel: Cancel
  confirm: Confirm
  imageUpload: Upload image
  fileUpload: Upload file
  videoPreview: Preview video
zh_CN:
  searchPlaceholder: 搜索此分类下的资源
  tips: 你确定要删除这条数据吗？
  cancelMessage: 删除操作已取消
  errorMessage: 删除过程中发生了错误
  all: 所有
  image: 图片
  video: 视频
  audio: 音频
  document: 文档
  maxSelect: 最多选择{limit}个
  select: 选中
  deselect: 取消选中
  singleSelect: 独选此项
  view: 查看
  copyAbsolutePath: 复制绝对路径
  copyRelativePath: 复制相对路径
  copySuccess: 路径已复制
  copyFail: 复制失败，请手动复制
  delete: 删除
  cancel: 取消
  confirm: 确认
  imageUpload: 上传图片
  fileUpload: 上传文件
  videoPreview: 预览视频

zh_TW:
  searchPlaceholder: 搜索此分類下的資源
  tips: 你確定要刪除這條資料嗎？
  cancelMessage: 刪除操作已取消
  errorMessage: 刪除過程中發生了錯誤
  all: 所有
  image: 圖片
  video: 視頻
  audio: 音頻
  document: 文件
  maxSelect: 最多選擇{limit}個
  select: 選中
  deselect: 取消選中
  singleSelect: 獨選此項
  view: 查看
  copyAbsolutePath: 複製絕對路徑
  copyRelativePath: 複製相對路徑
  copySuccess: 路徑已複製
  copyFail: 複製失敗，請手動複製
  delete: 刪除
  cancel: 取消
  confirm: 確認
  imageUpload: 上載圖片
  fileUpload: 上載文件
  videoPreview: 預覽視頻
</i18n>

<script setup lang="ts">
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
import ContextMenu from '@imengyu/vue3-context-menu'
import type { FileType, Resource, ResourcePanelProps } from './type.ts'
import { deleteById } from '~/base/api/attachment.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

import { useImageViewer } from '@/hooks/useImageViewer.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import type { Resources } from '#/global'

defineOptions({ name: 'MaResourcePanel' })

const props = withDefaults(defineProps<ResourcePanelProps>(), {
  multiple: false,
  limit: undefined,
  showAction: true,
  pageSize: 100,
  dbClickConfirm: false,
})
const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', value: any[]): void
}>()
const { localTrans: t } = useTrans()

const msg = useMessage()
const resourceStore = useResourceStore()

const modelValue = defineModel<string | string[] | undefined>()

const fileTypeSelected = ref(props.defaultFileType ?? '')
const returnType = 'url'

const fileTypes = ref<FileType[]>([
  { label: () => t('all'), value: '', icon: 'ri:gallery-view-2', suffix: '' },
  { label: () => t('image'), value: 'image', icon: 'ri:image-line', suffix: 'png,jpg,jpeg,gif,bmp' },
  { label: () => t('video'), value: 'video', icon: 'ri:folder-video-line', suffix: 'mp4,avi,wmv,mov,flv,mkv,webm' },
  { label: () => t('audio'), value: 'audio', icon: 'ri:file-music-line', suffix: 'mp3,wav,ogg,wma,aac,flac,ape,wavpack' },
  { label: () => t('document'), value: 'document', icon: 'ri:file-text-line', suffix: 'doc,docx,xls,xlsx,ppt,pptx,pdf' },
])

/**
 * 加载状态
 */
const loading = ref(false)

/**
 * 当前资源列表
 */
const resources = ref<Resource[]>([])

/**
 * 图片域名（系统设置「图片域名」）.
 *
 * 附件列表接口一并返回，右键「复制绝对路径」用它拼相对地址；
 * 不额外请求设置接口，避免没有 `setting:index` 权限的账号拿不到域名。
 */
const imageDomain = ref('')

/**
 * 资源总数
 */
const total = ref<number>(0)

/**
 * 选中资源的key列表,该数据可用做直接返回
 */
const selectedKeys = ref<Array<string | number>>([])

const selected = ref<Resource[]>([])

/**
 * 查询参数
 */
const queryParams = ref<Record<string, any>>({
  page: 1,
  page_size: props.pageSize,
  origin_name: '',
  suffix: [],
})

/** 视频预览地址（空串表示弹窗关闭） */
const videoPreviewUrl = ref('')

/** 是否视频（视频没有封面，展示播放按钮、支持预览播放） */
function isVideo(resource: Resource): boolean {
  return !!resource?.mime_type?.startsWith('video')
}

function openVideoPreview(resource: Resource): void {
  videoPreviewUrl.value = resource.url || ''
}

async function getResourceList(params: Resource = {}) {
  loading.value = true
  const { data } = await useHttp().get(
    '/admin/attachment/list',
    { params: Object.assign({ page_size: queryParams.value.page_size, page: queryParams.value.page }, params) },
  )
  total.value = data.total
  resources.value = data.list
  // 图片域名随列表一起下发，用于「复制绝对路径」拼完整地址
  imageDomain.value = String(data.image_domain ?? '')
  loading.value = false
}

// 监听v-model变化，更新selectedKeys
watch(() => modelValue.value, (newValue) => {
  selectedKeys.value = Array.isArray(newValue) ? newValue : newValue ? [newValue] : []
}, { deep: true })

// 监听selectedKeys变化，更新v-model
watch(() => selectedKeys.value, (newKeys) => {
  const newValue = props.multiple ? newKeys : newKeys[0]
  // 同样，只有在modelValue真正改变时才更新
  if (modelValue.value && modelValue.value !== newValue) {
    modelValue.value = newValue as string | string[]
  }
}, { deep: true })

/**
 * 加载占位符数量
 */
const skeletonNum = computed(() => {
  return loading.value ? queryParams.value.page_size : 100
})

function onfileTypesChange(value: any) {
  fileTypeSelected.value = value
  queryParams.value.suffix = (fileTypes.value.find(i => i.value === value)?.suffix || []) as string[]
  getResourceList(queryParams.value)
}

function getFileTypeIcon(item: unknown): string {
  return typeof item === 'object' && item !== null && 'icon' in item
    ? String((item as FileType).icon ?? '')
    : ''
}

function getFileTypeLabel(item: unknown): string {
  if (typeof item === 'string') {
    return item
  }
  if (typeof item === 'object' && item !== null && 'label' in item) {
    const label = (item as FileType).label
    return typeof label === 'function' ? label() : String(label ?? '')
  }
  return ''
}

/**
 * 资源库上传按钮的文案映射。
 *
 * store 里的按钮 label 是中文兜底（插件/外部也可能读取），面板展示时按 name 走本文件的多语言，
 * 否则资源管理页底部上传按钮的 tooltip 始终是中文。
 */
const buttonI18nKeys: Record<string, string> = {
  'local-image-upload': 'imageUpload',
  'local-file-upload': 'fileUpload',
}

function getButtonLabel(btn: Resources.Button): string {
  const key = buttonI18nKeys[btn.name]

  return key ? t(key) : btn.label
}

/**
 * 获取封面
 * @param resource
 */
function getCover(resource: Resource): string | undefined {
  if (resource?.mime_type?.startsWith('image')) {
    return resource.url
  }
  // 视频有首帧缩略图就显示封面（没有则退回显示文件名 + 播放按钮）
  if (resource?.mime_type?.startsWith('video')) {
    return resource.thumb_url || undefined
  }
  return undefined
}

/**
 * 判断是否被选中
 * @param resource
 */
function isSelected(resource: Resource) {
  const key = resource[returnType] as string
  return selectedKeys.value.includes(key)
}

/**
 * 判断是否能预览
 * @param resource
 */
function canPreview(resource: Resource) {
  return resource?.mime_type?.startsWith('image')
}

/**
 * 选中资源
 */
function select(resource: Resource) {
  const key = resource[returnType] as string
  // 单选
  if (props.multiple) {
    // 判断是否上限
    if (props.limit && selectedKeys.value.length >= props.limit) {
      return msg.warning(t('maxSelect', { limit: props.limit }))
    }
    selectedKeys.value.push(key)
    if (!selected.value.find(i => i[returnType] === key)) {
      selected.value.push(resource)
    }
  }
  else {
    selected.value = [resource]
    selectedKeys.value = [key]
  }
}

/**
 * 取消选中
 */
function unSelect(resource: Resource) {
  const key = resource[returnType] as string
  selectedKeys.value = selectedKeys.value.filter(i => i !== key)
  selected.value = selected.value.filter(i => i[returnType] !== key)
}

/**
 * 清空选中
 */
function clearSelected() {
  selectedKeys.value = []
  selected.value = []
}

function cancel() {
  emit('cancel')
}

function confirm() {
  emit('confirm', selected.value)
}

/**
 * 处理点击资源事件
 */
function handleClick(resource: Resource) {
  isSelected(resource) ? unSelect(resource) : select(resource)
}

/**
 * 处理双击资源事件
 */
function handleDbClick(resource: Resource) {
  // 双击确认选中单个元素
  clearSelected()
  select(resource)
  confirm()
}

/**
 * 删除选中
 */
async function onDel(id: number): Promise<void> {
  try {
    // 弹出删除确认框
    const confirmed = await msg.confirm(t('tips'))

    if (confirmed) {
      // 如果用户确认删除，进行删除操作
      const res = await deleteById(id)// 异步删除操作
      if (res.code !== ResultCode.SUCCESS) {
        msg.error(res.message)// 删除失败提示
        return
      }
      msg.success(res.message)// 删除成功提示
      await getResourceList()// 更新资源列表
    }
    else {
      // 用户取消删除操作
      msg.info(t('cancelMessage'))
    }
  }
  catch (error) {
    // 异常处理，捕获任何错误
    if (error === 'cancel') {
      msg.info(t('cancelMessage'))
    }
    else {
      msg.error(t('errorMessage'))
    }
  }
}

/**
 * 取资源在桶里的相对路径（OBS / CDN 地址 = 图片域名 + 该路径）.
 *
 * 优先用 `storage_key`（上传时记录的桶内完整对象键，如 `2026-10-18/uuid.gif`）：
 * 只有它才是 OBS / CDN 上真实存在的路径，`url` 是后端解密接口地址（`/attachment/uuid`），
 * 不能拿去拼图片域名。历史本地存储的附件没有 `storage_key`，退回解析 `url`。
 */
function getRelativePath(resource: Resource): string {
  const key = String(resource?.storage_key ?? '').replace(/^\/+/, '')
  if (key) {
    return `/${key}`
  }

  const url = resource?.url
  if (!url) {
    return ''
  }

  try {
    const parsed = new URL(url, window.location.origin)

    return `${parsed.pathname}${parsed.search}`
  }
  catch {
    // 不是合法 URL（例如库里的脏数据）时退回原值，至少让用户能复制到东西
    return url
  }
}

/**
 * 组装绝对路径：后台配置的「图片域名」+ 桶内相对路径.
 *
 * 图片域名取自系统设置（`image_domain`），既可以是 OBS 桶地址，也可以是套在前面的 CDN 域名，
 * 换域名只改配置、不用动代码。以下情况退回后端返回的 `url`，避免拼出无效地址：
 * - 没有 `storage_key`（历史本地存储等非 OBS 附件）；
 * - 图片域名没配；
 * - 库里的地址本身已经是外链 / data URI（历史数据）。
 */
function getAbsolutePath(resource: Resource): string {
  const relative = getRelativePath(resource)
  const domain = imageDomain.value.replace(/\/+$/, '')

  if (resource?.storage_key && domain) {
    return `${domain}/${relative.replace(/^\/+/, '')}`
  }

  return resource?.url || relative
}

/**
 * 复制文本到剪贴板.
 *
 * 优先 Clipboard API（HTTPS / localhost 可用），失败或不可用时退化到临时 textarea + execCommand；
 * 内网 http 地址属于非安全上下文，`navigator.clipboard` 直接不可用，必须有兜底。
 * 与渠道 / 商户列表里的复制逻辑保持一致。
 */
function copyText(text: string): void {
  if (!text) {
    msg.error(t('copyFail'))

    return
  }

  const done = (ok: boolean): void => {
    ok ? msg.success(t('copySuccess')) : msg.error(t('copyFail'))
  }

  const fallback = (): boolean => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)

    return ok
  }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => done(true))
      .catch(() => done(fallback()))

    return
  }

  done(fallback())
}

/**
 * 右键菜单
 */
function executeContextmenu(e: MouseEvent, resource: Resource) {
  e.preventDefault()
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    zIndex: 9999,
    iconFontClass: '',
    customClass: 'mine-contextmenu',
    items: [
      {
        label: t('select'),
        hidden: isSelected(resource),
        icon: 'i-ri:check-fill',
        onClick: () => {
          select(resource)
        },
      },
      {
        label: t('deselect'),
        hidden: !isSelected(resource),
        icon: 'i-ri:close-fill',
        onClick: () => {
          unSelect(resource)
        },
      },
      // 独选此项
      {
        label: t('singleSelect'),
        icon: 'i-ri:checkbox-circle-line',
        divided: true,
        onClick: () => {
          clearSelected()
          select(resource)
        },
      },
      {
        label: t('view'),
        icon: 'i-ri:search-eye-line',
        disabled: !canPreview(resource),
        onClick: () => {
          useImageViewer([resource?.url ?? ''])
        },
      },
      // 复制路径：绝对路径 = 后台配置的「图片域名」+ 桶内对象键；相对路径 = 桶内对象键
      {
        label: t('copyAbsolutePath'),
        icon: 'i-ri:file-copy-line',
        // `divided: 'up'` 才是「在该项上方画分隔线」；`true` 是 `'down'`，会把两条复制操作拆开
        divided: 'up',
        onClick: () => {
          copyText(getAbsolutePath(resource))
        },
      },
      {
        label: t('copyRelativePath'),
        icon: 'i-ri:link',
        onClick: () => {
          copyText(getRelativePath(resource))
        },
      },
      {
        label: t('delete'),
        icon: 'i-material-symbols:delete-outline',
        divided: 'up',
        onClick: () => {
          if (resource?.id !== undefined) {
            onDel(resource.id)
          }
        },
      },
    ],
  })
}

function handleFile(ev: Event, btn: Resources.Button) {
  const input = ev.target as HTMLInputElement | null
  if (input?.files) {
    btn.upload?.(input.files, { btn, getResourceList })
  }
}

/** 顶部上传按钮：先执行按钮自身的 click 逻辑，再打开同卡片里的文件选择框 */
function handleUploadButton(btn: Resources.Button, event: MouseEvent): void {
  btn.click?.(btn, selected.value)
  const input = (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input[type="file"]')
  input?.click()
}

onMounted(async () => {
  await getResourceList()
})
</script>

<template>
  <div class="ma-resource-panel h-full flex flex-col">
    <div class="flex flex-col justify-between gap-y-1 md:flex-row">
      <div>
        <el-segmented
          v-model="fileTypeSelected"
          :options="fileTypes as any" size="default"
          block
          @change="onfileTypesChange"
        >
          <template #default="{ item }">
            <div class="flex items-center justify-center">
              <ma-svg-icon
                v-if="getFileTypeIcon(item)" :name="getFileTypeIcon(item)" :size="17"
                class="mr-1 flex items-center justify-center"
              />
              <span>{{ getFileTypeLabel(item) }}</span>
            </div>
          </template>
        </el-segmented>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <div class="ma-resource-dock">
          <div
            v-for="btn in resourceStore.getAllButton()"
            :key="btn.name"
            class="res-app"
            :class="btn.name === 'local-image-upload' ? 'res-app--image' : 'res-app--file'"
            @click="handleUploadButton(btn, $event)"
          >
            <input
              type="file"
              :name="btn.name"
              class="hidden"
              v-bind="btn?.uploadConfig ?? {}"
              @change="handleFile($event, btn)"
              @click.stop="() => {}"
            >
            <ma-svg-icon :name="btn.icon" class="res-app-icon" :size="17" />
            <span class="res-app-label">{{ getButtonLabel(btn) }}</span>
          </div>
        </div>
        <el-input
          v-model="queryParams.origin_name" :placeholder="t('searchPlaceholder')" clearable class="w-full md:w-[180px]" @input="() => {
            getResourceList(queryParams)
          }"
        >
          <template #suffix>
            <ma-svg-icon name="i-material-symbols:search-rounded" :size="20" />
          </template>
        </el-input>
      </div>
    </div>
    <div class="mt-2 min-h-0 flex-1">
      <OverlayScrollbarsComponent
        v-if="loading || resources.length" class="max-h-full"
        :options="{ scrollbars: { autoHide: 'leave', autoHideDelay: 100 } }"
      >
        <div class="flex flex-wrap px-[2px] pt-[2px]">
          <el-space fill wrap :fill-ratio="9">
            <template v-for="resource in resources" :key="resource.id">
              <div
                class="resource-item" :class="{ active: isSelected(resource) }" @click="handleClick(resource)"
                @dblclick="handleDbClick(resource)" @contextmenu="(e: MouseEvent) => executeContextmenu(e, resource)"
              >
                <div class="resource-item__cover">
                  <template v-if="getCover(resource)">
                    <!--
                      用原生 img 而不是 el-image：
                      ① el-image 的 lazy 依赖 IntersectionObserver 认滚动容器，在 OverlayScrollbars 内层失效、图片请求根本不发（列表一片空白）；
                      ② 原生 loading="lazy" 由浏览器实现，无论外层谁滚动都按视口加载，一页 100 张时只请求可见的那些。
                    -->
                    <img
                      :src="getCover(resource)"
                      class="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      alt=""
                      @error="($event.target as HTMLImageElement).style.display = 'none'"
                    >
                  </template>
                  <template v-else>
                    <div
                      class="relative m-[8px] h-[calc(100%-16px)] w-[calc(100%-16px)] flex items-center justify-center overflow-hidden"
                    >
                      <div class="cursor-default overflow-hidden text-ellipsis whitespace-pre-wrap">
                        {{ resource.origin_name }}
                      </div>
                    </div>
                  </template>
                </div>
                <div v-if="getCover(resource)" class="resource-item__name cursor-default">
                  {{ resource.origin_name }}
                </div>
                <!-- 视频始终显示播放按钮，便于快速和图片区分；点按钮预览播放 -->
                <button
                  v-if="isVideo(resource)"
                  class="resource-item__play"
                  type="button"
                  :title="t('videoPreview')"
                  @click.stop="openVideoPreview(resource)"
                >
                  <ma-svg-icon name="ph:play-fill" :size="34" />
                </button>
                <div class="resource-item__selected">
                  <ma-svg-icon class="resource-item__selected-icon" name="gravity-ui:circle-check-fill" :size="18" />
                </div>
              </div>
            </template>
            <template v-if="resources.length === 0">
              <el-skeleton v-for="i in skeletonNum" :key="i" class="resource-skeleton relative" animated>
                <template #template>
                  <el-skeleton-item class="absolute h-full w-full" variant="rect" />
                </template>
              </el-skeleton>
            </template>
            <div v-for="i in 10" :key="i" class="resource-placeholder" />
          </el-space>
        </div>
      </OverlayScrollbarsComponent>
      <div v-else class="h-full w-full flex flex-1 items-center justify-center">
        <el-empty />
      </div>
    </div>
    <div class="ma-resource-panel__footer flex justify-between pt-2">
      <div class="flex items-center">
        <el-tag
          v-if="props.multiple && props.limit" size="large" class="mr-2"
          :class="{ 'color-[var(--el-color-danger)]': props.limit && selectedKeys.length >= props.limit }"
        >
          {{ selectedKeys.length }}
          <template v-if="props.multiple && props.limit">
            /{{ props.limit }}
          </template>
        </el-tag>
        <el-pagination
          v-model:current-page="queryParams.page" :disabled="loading" :total="total"
          :page-size="queryParams.page_size" background layout="prev, pager, next" :pager-count="5"
          @change="(p: number) => {
            queryParams.page = p
            getResourceList(queryParams)
          }"
        />
      </div>
      <div v-if="props.showAction">
        <slot name="actions">
          <el-button @click="cancel">
            {{ t('cancel') }}
          </el-button>
          <el-button type="primary" @click="confirm">
            {{ t('confirm') }}
          </el-button>
        </slot>
      </div>
    </div>

    <!-- 视频预览：直接播放，不走下载 -->
    <el-dialog
      :model-value="!!videoPreviewUrl"
      :title="t('videoPreview')"
      width="720px"
      destroy-on-close
      @close="videoPreviewUrl = ''"
    >
      <video
        v-if="videoPreviewUrl"
        :src="videoPreviewUrl"
        class="w-full rounded"
        controls
        autoplay
        playsinline
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.ma-resource-panel{
  @apply relative;
  --resource-item-size:120px;

  .ma-resource-dock {
    @apply flex items-center gap-2;
    flex-shrink: 0;
  }

  .res-app {
    @apply inline-flex h-32px cursor-pointer items-center gap-1.5 rounded-md border border-solid px-3 text-13px font-500 transition-colors duration-200;
  }

  .res-app--image {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .res-app--file {
    border-color: var(--el-color-success-light-5);
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .res-app--image:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-white);
    background: var(--el-color-primary);
  }

  .res-app--file:hover {
    border-color: var(--el-color-success);
    color: var(--el-color-white);
    background: var(--el-color-success);
  }

  .res-app-icon {
    @apply flex items-center justify-center;
    width: 17px;
    height: 17px;
  }

  .res-app-label {
    @apply whitespace-nowrap;
  }
}
.resource-item{
  animation: fadeIn 0.38s ease-out forwards;
  --un-bg-opacity: 0.3;
  @apply relative min-w-[var(--resource-item-size)] pb-[100%] rounded overflow-hidden border-box bg-gray-1  dark-bg-dark-3;
}
.resource-item__cover{
  @apply absolute bottom-0 left-0 h-full w-full;
}
.resource-item__name{
  @apply absolute bottom-0 left-0 h-24px w-[calc(100%-20px)] overflow-hidden bg-gray:60 px-10px text-12px leading-24px whitespace-nowrap text-ellipsis c-white;

}
.resource-item__selected{
  @apply absolute top--30px right--30px w-40px h-40px;
  //transition: all 0.1s ease-in-out;
  background-image: linear-gradient(to top right, transparent 50%, rgb(var(--ui-primary)) 50%);
}
.resource-item__play{
  /* 常显的播放标记：一眼区分视频/图片。
     不要圆底——黑半透明圆压在封面图上显得脏、也挡内容；改成纯白三角 + 投影，最经典也最干净。
     只占居中 40×40，卡片其它区域仍留给「选中」（inset:0 铺满会把单击全吃掉） */
  @apply absolute left-50% top-50% flex h-40px w-40px items-center justify-center border-0 bg-transparent text-white transition-transform duration-200;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  /* 双层投影：浅色封面（白底图）上白三角也要立得住 */
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .95)) drop-shadow(0 0 8px rgba(0, 0, 0, .5));
}

.resource-item:hover .resource-item__play{
  transform: translate(-50%, -50%) scale(1.12);
}

.resource-item__selected-icon{
  @apply absolute top-0 right-0 p-2px c-white;
}
.resource-item.active .resource-item__selected{
  @apply top-0 right-0;
}

.resource-placeholder{
  @apply min-w-[var(--resource-item-size)] h-0 pointer-events-none p-0;
}
.resource-skeleton{
  @apply min-w-[var(--resource-item-size)] pb-[100%];
}

.resource-item:hover,
.resource-item.active {
  @apply ring-2 ring-[rgb(var(--ui-primary))];
}
</style>
