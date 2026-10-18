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
  title: System Settings
  groupInput: Text Input
  groupTextarea: Multi-line Text
  groupSelect: Select
  groupRadio: Radio
  groupCheckbox: Checkbox
  groupSwitch: Switch
  groupImage: Image Upload
  groupOther: Other Settings
  subtitle: Edit values in the form directly; add or modify a setting with the buttons above
  goChannel: Go to Channel →
  landingRebuildTip: Changing the landing background, package URLs or download switches does not refresh the generated landing pages — go to Channel, click Rebuild Landings, then purge the landing domain cache on your CDN
  save: Save
  create: Add setting
  edit: Edit
  remove: Remove
  createTitle: Add setting
  editTitle: Edit setting
  removeConfirm: Are you sure to remove this setting?
  name: Name
  key: Key
  inputType: Control
  options: Options
  sort: Sort
  remark: Remark
  nameRequired: Name is required
  keyRequired: Key is required
  inputPlaceholder: 'Enter {name}'
  selectPlaceholder: 'Select {name}'
  type:
    input: Text
    textarea: Textarea
    select: Select
    radio: Radio
    checkbox: Checkbox
    switch: Switch
    imageUpload: Image
zh_CN:
  title: 系统设置
  groupInput: 文本输入
  groupTextarea: 多行文本
  groupSelect: 下拉选择
  groupRadio: 单选
  groupCheckbox: 多选
  groupSwitch: 开关
  groupImage: 图片上传
  groupOther: 其他配置
  subtitle: 直接在表单里修改配置值，新增或修改配置项请用上方按钮
  goChannel: 去渠道管理 →
  landingRebuildTip: 改动「落地页背景图 / 苹果包 / 安卓包 / 下载开关」后，已生成的渠道落地页不会自动更新：需到「渠道管理」点「重建落地页」，再到 CDN 平台刷新落地页域名的缓存
  save: 保存
  create: 新增配置项
  edit: 编辑
  remove: 删除
  createTitle: 新增配置项
  editTitle: 编辑配置项
  removeConfirm: 确定要删除该配置项吗？
  name: 名称
  key: 键名
  inputType: 控件类型
  options: 可选项
  sort: 排序
  remark: 备注
  nameRequired: 名称不能为空
  keyRequired: 键名不能为空
  inputPlaceholder: 请输入{name}
  selectPlaceholder: 请选择{name}
  type:
    input: 单行文本
    textarea: 多行文本
    select: 下拉选择
    radio: 单选
    checkbox: 多选
    switch: 开关
    imageUpload: 图片
zh_TW:
  title: 系統設置
  groupInput: 文字輸入
  groupTextarea: 多行文字
  groupSelect: 下拉選擇
  groupRadio: 單選
  groupCheckbox: 多選
  groupSwitch: 開關
  groupImage: 圖片上傳
  groupOther: 其他設定
  subtitle: 直接在表單裡修改配置值，新增或修改配置項請用上方按鈕
  goChannel: 去通路管理 →
  landingRebuildTip: 改動「落地頁背景圖 / 蘋果包 / 安卓包 / 下載開關」後，已生成的通路落地頁不會自動更新：需到「通路管理」點「重建落地頁」，再到 CDN 平台刷新落地頁網域的快取
  save: 保存
  create: 新增配置項
  edit: 編輯
  remove: 刪除
  createTitle: 新增配置項
  editTitle: 編輯配置項
  removeConfirm: 確定要刪除該配置項嗎？
  name: 名稱
  key: 鍵名
  inputType: 控件類型
  options: 可選項
  sort: 排序
  remark: 備註
  nameRequired: 名稱不能為空
  keyRequired: 鍵名不能為空
  inputPlaceholder: 請輸入{name}
  selectPlaceholder: 請選擇{name}
  type:
    input: 單行文本
    textarea: 多行文本
    select: 下拉選擇
    radio: 單選
    checkbox: 多選
    switch: 開關
    imageUpload: 圖片
</i18n>

<script setup lang="ts">
import { useSiteStore } from '@/store/modules/useSiteStore.ts'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { SettingItemVo, SettingOption } from '~/setting/api/setting.ts'
import { useEventListener } from '@vueuse/core'
import { deleteByIds, index as fetchSettings, save as saveSettingRows } from '~/setting/api/setting.ts'
import MaKeyValue from '@/components/ma-key-value/index.vue'
import useDialog from '@/hooks/useDialog.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'setting' })

const msg = useMessage()
const router = useRouter()

/** 一键直达「渠道管理」：提示条上的快捷入口，省得用户自己到左侧菜单里翻 */
function goChannel(): void {
  router.push('/channel')
}
const { globalTrans, localTrans: t } = useTrans()

const loading = ref(false)
const saving = ref(false)
const items = ref<SettingItemVo[]>([])

/**
 * 配置项分组：**按控件类型**归组.
 *
 * 同一个网格里混排会很难看——输入框 32px、图片 120px、开关 24px、单选 32px，高度全不一样，
 * 行高被图片撑起来后其它控件都悬在中间。按控件类型分组后，每组内控件高度一致、排布整齐。
 * 组标题样式与渠道/商户表单的分组一致（主色左边条 + 下划线）。
 */
const GROUP_DEFS: Array<{ title: string, types: string[] }> = [
  { title: 'groupInput', types: ['input', ''] },
  { title: 'groupTextarea', types: ['textarea'] },
  { title: 'groupSelect', types: ['select'] },
  { title: 'groupRadio', types: ['radio'] },
  // 「开关」紧跟「单选」：两者都很窄，排在同一行刚好互补（见 isWideGroup 的说明）
  { title: 'groupSwitch', types: ['switch'] },
  { title: 'groupCheckbox', types: ['checkbox'] },
  { title: 'groupImage', types: ['imageUpload'] },
]

/** 每组「最多」几列；实际项数不足时按实际数量平分（1 项占整行、2 项各一半…） */
const MAX_COLUMNS: Record<string, number> = {
  imageUpload: 5,
  switch: 3,
}
const DEFAULT_MAX_COLUMNS = 3

/**
 * 每种控件一列的最小宽度（决定同一组里最多塞几列）.
 *
 * 单选/多选/多行文本的控件本身较宽（三个选项并排、文本域要有宽度），
 * 挤成两三列会截断或换行，所以给更大的下限、通常只排一列。
 */
const MIN_COL_WIDTH: Record<string, number> = {
  imageUpload: 260,
  switch: 260,
  select: 320,
  textarea: 520,
  radio: 560,
  checkbox: 560,
}
const DEFAULT_MIN_COL_WIDTH = 420

/** 分组容器的实际可用宽度：列数要跟着屏幕走，不能写死 */
const sectionsRef = ref<HTMLElement>()
const containerWidth = ref(0)

onMounted(() => {
  const el = sectionsRef.value
  if (!el) {
    return
  }
  const observer = new ResizeObserver((entries) => {
    containerWidth.value = entries[0]?.contentRect.width ?? 0
  })
  observer.observe(el)
  onBeforeUnmount(() => observer.disconnect())
})

/**
 * 哪些分组跨整行：项数多的、图片（与模板里的 class 判断保持同一套逻辑）.
 *
 * 开关组不再跨整行——开关本身很窄，只有两三个，单独占一行会空掉一大片，
 * 所以让它和相邻的小组（如「单选」）并排各占一半。
 */
function isWideGroup(group: { items: SettingItemVo[] }): boolean {
  const type = group.items[0]?.input_type ?? 'input'
  return group.items.length > 6 || type === 'imageUpload'
}

/** 按 GROUP_DEFS 的控件类型归组；后端以后新增的类型收进「其他配置」，空组不渲染 */
const groupedItems = computed(() => {
  const groups = GROUP_DEFS
    .map(def => ({
      title: t(def.title),
      items: items.value.filter(item => def.types.includes(item.input_type ?? '')),
    }))
    .filter(group => group.items.length > 0)

  const known = new Set(GROUP_DEFS.flatMap(def => def.types))
  const others = items.value.filter(item => !known.has(item.input_type ?? ''))
  if (others.length > 0) {
    groups.push({ title: t('groupOther'), items: others })
  }

  return groups
})

/**
 * 半行组（不跨整行的组）数量为奇数时，把最后一个提成整行.
 *
 * 两个半行组并排刚好铺满一行，剩一个孤零零占左半、右侧空一大块；
 * 让它跨整行后，组内列数也按整行重新算，视觉上才闭合。
 */
const lastOddHalfGroupTitle = computed(() => {
  const half = groupedItems.value.filter(group => !isWideGroup(group))
  return half.length % 2 === 1 ? (half[half.length - 1]?.title ?? null) : null
})

/**
 * 给某个分组算 grid 列数.
 *
 * 取三者最小值：
 * 1. 实际项数（项数不足时平分占位，1 项占整行、2 项各一半）
 * 2. 该类型的上限（图片最多 5、开关最多 3、其它最多 3）
 * 3. **这个组自己**的宽度放得下的列数——注意不是整个容器的宽度：
 *    不跨行的组只占一半宽（如「多行文本」3 项），按容器宽度算会算出 3 列把文本域压成竖条。
 */
function groupColumns(group: { title: string, items: SettingItemVo[] }): number {
  const type = group.items[0]?.input_type ?? 'input'
  const max = MAX_COLUMNS[type] ?? DEFAULT_MAX_COLUMNS
  const min = MIN_COL_WIDTH[type] ?? DEFAULT_MIN_COL_WIDTH
  const gap = type === 'imageUpload' ? 20 : 40
  const totalWidth = containerWidth.value || 1200
  // 不跨行的组占「容器宽 - 24 列间距」的一半
  const isFullRow = isWideGroup(group) || group.title === lastOddHalfGroupTitle.value
  const width = isFullRow ? totalWidth : (totalWidth - 24) / 2
  const fit = Math.max(1, Math.floor((width + gap) / (min + gap)))

  return Math.max(1, Math.min(group.items.length, max, fit))
}

/** 新增 / 编辑配置项：居中弹窗（不是侧边抽屉） */
const editingIndex = ref(-1)
const draft = ref<SettingItemVo>(createEmptyDraft())

const inputTypes = computed(() => [
  { label: t('type.input'), value: 'input' },
  { label: t('type.textarea'), value: 'textarea' },
  { label: t('type.select'), value: 'select' },
  { label: t('type.radio'), value: 'radio' },
  { label: t('type.checkbox'), value: 'checkbox' },
  { label: t('type.switch'), value: 'switch' },
  { label: t('type.imageUpload'), value: 'imageUpload' },
])

const hasOptions = computed(() => ['select', 'radio', 'checkbox', 'switch'].includes(draft.value.input_type ?? ''))

const maDialog: UseDialogExpose = useDialog({
  // 直接指定 width（会覆盖 MaDialog 内部的响应式宽度；MaDialog 的断点只覆盖到 1920px，超宽屏会退回 55%）
  width: '600px',
  alignCenter: true,
  ok: (_args: any, okLoadingState: (state: boolean) => void) => {
    okLoadingState(false)
    applyDraft()
  },
})

function createEmptyDraft(): SettingItemVo {
  return {
    key: '',
    name: '',
    value: '',
    input_type: 'input',
    config_select_data: [],
    sort: 0,
    remark: '',
  }
}

function optionsOf(item: SettingItemVo): SettingOption[] {
  return Array.isArray(item.config_select_data) ? item.config_select_data : []
}

function openCreate(): void {
  draft.value = createEmptyDraft()
  editingIndex.value = -1
  maDialog.setTitle(t('createTitle'))
  maDialog.open({ formType: 'add' })
}

function openEdit(item: SettingItemVo, index: number): void {
  draft.value = {
    ...item,
    config_select_data: Array.isArray(item.config_select_data) ? item.config_select_data.map(opt => ({ ...opt })) : [],
  }
  editingIndex.value = index
  maDialog.setTitle(t('editTitle'))
  maDialog.open({ formType: 'edit' })
}

/** 校验通过后写回列表（真正入库在保存时统一提交） */
function applyDraft(): void {
  if (!draft.value.name) {
    msg.warning(t('nameRequired'))
    return
  }
  if (!draft.value.key) {
    msg.warning(t('keyRequired'))
    return
  }

  if (editingIndex.value >= 0) {
    items.value[editingIndex.value] = { ...draft.value }
  }
  else {
    items.value.unshift({ ...draft.value })
  }

  editingIndex.value = -1
  maDialog.close()
}

function removeItem(item: SettingItemVo, index: number): void {
  // 还没入库的直接移除
  if (!item.id) {
    items.value.splice(index, 1)
    return
  }

  msg.confirm(t('removeConfirm')).then(async () => {
    const response = await deleteByIds([item.id as number])
    if (response.code === ResultCode.SUCCESS) {
      msg.success(globalTrans('crud.delSuccess'))
      await loadSettings()
    }
    else {
      msg.error(response.message)
    }
  })
}

async function loadSettings(): Promise<void> {
  loading.value = true
  try {
    const response = await fetchSettings()
    if (response.code !== ResultCode.SUCCESS) {
      msg.error(response.message)
      return
    }

    items.value = (response.data ?? []).map((item: SettingItemVo) => {
      const options = Array.isArray(item.config_select_data) ? item.config_select_data : []
      let value: any = item.value ?? ''

      if (item.input_type === 'checkbox') {
        // checkbox 存的是逗号分隔字符串，编辑时转成数组
        value = String(item.value ?? '').split(',').filter(Boolean)
      }
      else if (item.input_type === 'switch' && (value === '' || value === null)) {
        // 空值要让开关落在 inactive-value 上，否则 element-plus 会告警 model-value must be active-value or inactive-value
        value = options[1]?.value ?? '0'
      }

      return { ...item, value, config_select_data: options }
    })
  }
  finally {
    loading.value = false
  }
}

async function handleSave(): Promise<void> {
  saving.value = true
  try {
    const response = await saveSettingRows(items.value)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(globalTrans('crud.updateSuccess'))
      await loadSettings()
      // 站点名称 / 图标可能刚被改过：强制刷新一次，左上角 logo 立即生效（不用刷新页面）
      useSiteStore().load(true)
    }
    else {
      msg.error(response.message)
    }
  }
  finally {
    saving.value = false
  }
}

/** 页面根节点：用于动态测算卡片可用高度，让滚动只发生在卡片 body 内 */
const pageRef = ref<HTMLElement>()

/**
 * 把卡片高度锁进 `.mine-main` 的可视区域：
 * 用实测的「页面根顶部偏移 + 下方其它占位」计算，避免整页 / 内容区跟着滚。
 */
function syncCardHeight(): void {
  const main = document.querySelector<HTMLElement>('.mine-main')
  const root = pageRef.value
  if (!main || !root) {
    return
  }

  const mainRect = main.getBoundingClientRect()
  const rootTop = root.getBoundingClientRect().top - mainRect.top + main.scrollTop

  // `.mine-main` 里排在页面之后的兄弟节点（如底部占位）也要扣掉
  let bottomExtras = 0
  let passedRoot = false
  for (const child of Array.from(main.children)) {
    if (child.contains(root)) {
      passedRoot = true
      continue
    }
    if (passedRoot) {
      bottomExtras += (child as HTMLElement).getBoundingClientRect().height
    }
  }

  // 12 = pt-3 上边距，24 = 卡片下边距
  const available = main.clientHeight - rootTop - bottomExtras - 12 - 24
  root.style.setProperty('--setting-card-height', `${Math.max(320, Math.floor(available))}px`)
}

onMounted(() => {
  void loadSettings()
  nextTick(syncCardHeight)
})

onActivated(syncCardHeight)

useEventListener(window, 'resize', syncCardHeight)
</script>

<template>
  <div ref="pageRef" class="mine-layout pt-3">
    <el-card v-loading="loading" class="site-setting__card" shadow="never">
      <template #header>
        <!-- 与 MaProTable 的表头保持一致：主标题 16px、副标题 14px 且同一行，右侧放操作按钮 -->
        <div class="flex items-center justify-between">
          <div class="min-w-0 flex items-center gap-x-4">
            <span class="shrink-0 text-[16px]">
              {{ t('title') }}
            </span>
            <span class="min-w-0 truncate text-[14px] text-[var(--el-text-color-regular)]">
              {{ t('subtitle') }}
            </span>
          </div>
          <div class="flex shrink-0 items-center gap-x-2">
            <el-button v-auth="['setting:save']" @click="openCreate">
              {{ t('create') }}
            </el-button>
            <el-button v-auth="['setting:save']" type="primary" :loading="saving" @click="handleSave">
              {{ t('save') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 落地页是静态文件：这些配置改完不会自动反映到已生成的渠道落地页上，所以常驻一条紧凑提示 -->
      <div class="landing-tip">
        <ma-svg-icon name="material-symbols:info-outline-rounded" :size="16" class="landing-tip__icon" />
        <span class="landing-tip__text">{{ t('landingRebuildTip') }}</span>
        <el-button link type="primary" class="landing-tip__action" @click="goChannel">
          {{ t('goChannel') }}
        </el-button>
      </div>

      <el-form class="site-setting__form" label-width="150px">
        <div ref="sectionsRef" class="site-setting__sections">
          <div
            v-for="group in groupedItems"
            :key="group.title"
            class="site-setting__section"
            :class="{
              'site-setting__section--wide': isWideGroup(group) || group.title === lastOddHalfGroupTitle,
              'site-setting__section--images': group.items[0]?.input_type === 'imageUpload',
            }"
          >
            <div class="site-setting__section-title">
              {{ group.title }}
            </div>
            <div
              class="site-setting__grid"
              :style="{ gridTemplateColumns: `repeat(${groupColumns(group)}, minmax(0, 1fr))` }"
            >
              <el-form-item v-for="item in group.items" :key="item.key">
                <template #label>
                  <span>{{ item.name }}</span>
                </template>

                <!-- 图片、开关、单选/多选这类控件尺寸固定，容器不用占满 420px，否则图标会离控件很远 -->
                <div class="w-full flex items-start gap-x-2">
                  <div
                    class="site-setting__control min-w-0"
                    :class="{
                      'site-setting__control--auto': ['switch', 'radio', 'checkbox'].includes(item.input_type ?? ''),
                      'site-setting__control--image': item.input_type === 'imageUpload',
                    }"
                  >
                    <el-input
                      v-if="item.input_type === 'input'"
                      v-model="item.value"
                      clearable
                      :placeholder="t('inputPlaceholder', { name: item.name })"
                    />

                    <el-input
                      v-else-if="item.input_type === 'textarea'"
                      v-model="item.value"
                      type="textarea"
                      :rows="3"
                      :placeholder="t('inputPlaceholder', { name: item.name })"
                    />

                    <el-select
                      v-else-if="item.input_type === 'select'"
                      v-model="item.value"
                      clearable
                      :placeholder="t('selectPlaceholder', { name: item.name })"
                    >
                      <el-option v-for="opt in optionsOf(item)" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>

                    <el-radio-group v-else-if="item.input_type === 'radio'" v-model="item.value">
                      <el-radio v-for="opt in optionsOf(item)" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </el-radio>
                    </el-radio-group>

                    <el-checkbox-group v-else-if="item.input_type === 'checkbox'" v-model="item.value">
                      <el-checkbox v-for="opt in optionsOf(item)" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </el-checkbox>
                    </el-checkbox-group>

                    <el-switch
                      v-else-if="item.input_type === 'switch'"
                      v-model="item.value"
                      :active-value="optionsOf(item)[0]?.value ?? '1'"
                      :inactive-value="optionsOf(item)[1]?.value ?? '0'"
                    />

                    <!-- 图片：走资源库选择 / 上传，不允许手填地址 -->
                    <ma-upload-image
                      v-else-if="item.input_type === 'imageUpload'"
                      v-model="item.value"
                      :size="96"
                    />

                    <el-input v-else v-model="item.value" clearable />
                  </div>

                  <div class="site-setting__actions flex shrink-0 items-center" style="min-height: 32px;">
                    <el-button
                      v-auth="['setting:save']"
                      link
                      type="primary"
                      :title="t('edit')"
                      @click="openEdit(item, items.indexOf(item))"
                    >
                      <ma-svg-icon name="material-symbols:edit-outline-rounded" :size="18" />
                    </el-button>
                    <el-button
                      v-auth="['setting:delete']"
                      link
                      type="danger"
                      :title="t('remove')"
                      @click="removeItem(item, items.indexOf(item))"
                    >
                      <ma-svg-icon name="material-symbols:delete-outline-rounded" :size="18" />
                    </el-button>
                  </div>
                </div>
              </el-form-item>
            </div>
          </div>
        </div>
      </el-form>

      <!-- 配置项多时要滚到底部，这里再放一个保存，省得再滚回顶部；
           上方加一条分隔线与表单隔开，按钮居中 -->
      <div class="site-setting__footer">
        <el-button v-auth="['setting:save']" type="primary" :loading="saving" @click="handleSave">
          {{ t('save') }}
        </el-button>
      </div>
    </el-card>

    <!-- 新增 / 编辑配置项：居中弹窗 -->
    <component :is="maDialog.Dialog">
      <template #default>
        <el-form label-width="110px" @submit.prevent>
          <el-form-item :label="t('name')">
            <el-input v-model="draft.name" clearable :placeholder="t('name')" />
          </el-form-item>
          <el-form-item :label="t('key')">
            <el-input v-model="draft.key" clearable placeholder="config_key" />
          </el-form-item>
          <el-form-item :label="t('inputType')">
            <el-select v-model="draft.input_type">
              <el-option
                v-for="opt in inputTypes"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="hasOptions" :label="t('options')">
            <MaKeyValue v-model="draft.config_select_data" />
          </el-form-item>
          <el-form-item :label="t('sort')">
            <el-input-number v-model="draft.sort" :min="0" controls-position="right" />
          </el-form-item>
          <el-form-item :label="t('remark')">
            <el-input v-model="draft.remark" clearable :placeholder="t('remark')" />
          </el-form-item>
        </el-form>
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
.site-setting__card {
  // 高度由 syncCardHeight() 实测后写入 CSS 变量，兜底值用于首帧测量前，
  // 目的：滚动只发生在这个卡片的 body 里，而不是整个 .mine-main 内容区
  height: var(--setting-card-height, calc(100vh - 183px));
  min-height: 0;
  margin: 0 24px 24px;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}

// 表单铺满卡片宽度，不做居中约束（居中会让两列挤在中间、两侧空一大片）
/* 控件固定宽度：输入框被 flex-1 拉满时，右侧的编辑/删除图标会被顶到列尾、离字段很远；
   固定 420px 后图标紧跟在控件后面，图片类字段也不会拖出一条长空白 */
.site-setting__control {
  width: 420px;
  max-width: 100%;
}

/* 开关 / 单选 / 多选这类控件本身很窄，容器占 420px 会把图标顶得很远 */
.site-setting__control--auto {
  width: auto;
}

/* 图片字段：固定 120px（缩略图 96 + 内边距）。不能写 `width: auto`——flex 子项会塌缩到最小宽度，
   图片会溢出容器、把右侧的编辑/删除图标压到图片上 */
.site-setting__control--image {
  width: 120px;
  flex: none;
}

/* label 用常规文字色（默认是主文字色，长配置名看起来偏重） */
.site-setting__form :deep(.el-form-item__label) {
  color: var(--el-text-color-regular);
}

/* 分组标题：主色小色块 + 文字，放在浅灰容器顶部 */
.site-setting__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.site-setting__section-title::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--el-color-primary);
}

.site-setting__form {
  max-width: none;
}

// 两列布局：列间距（左右）96px、行间距 12px；窄屏自动退成一列。
// 用 grid 而不是 el-row/el-col + gutter——gutter 走负 margin，gutter 一大就会把内容顶出卡片、出现横向滚动。
.site-setting__grid {
  display: grid;
  // 组内单列：一行只放一个配置项（分组本身已经两列排布，再套两列就太挤）
  grid-template-columns: minmax(0, 1fr);
  row-gap: 6px;
  align-items: start;
}

/* 分组两列排布：每个分组是一块浅灰底的容器（不用再套一层卡片边框），
   组内字段照常「label + 控件 + 图标」，视觉上分组清楚、也不会像纯标题那样零碎 */
.site-setting__sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 24px;
  align-items: start;
  // 铺满卡片内容区，不要再留左右边距
  width: 100%;
}

.site-setting__section {
  padding: 16px 20px 6px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

/* 项数多的组（如「文本输入」15 项）跨整行、组内两列：
   否则它单独占一列会拉到一整屏高，另一列只剩几个小组、下面空一大片 */
.site-setting__section--wide {
  grid-column: 1 / -1;
}

.site-setting__section--wide .site-setting__grid {
  column-gap: 40px;
}

/* 图片组：跨整行后横向铺开 */
.site-setting__section--images .site-setting__grid {
  column-gap: 20px;
  align-items: center;
}

/* 图片行高（96px）远大于输入行，图标跟着顶部对齐会贴在图片上边缘 */
.site-setting__section--images :deep(.el-form-item__content > div) {
  align-items: center;
}

/* 图片组的 label 只有「站点图标」这类短名，用不上 150px；
   收窄到 104px（「APP默认图标」刚好放得下）后一列 ≈ label + 96 缩略图 + 图标 */
.site-setting__section--images :deep(.el-form-item__label) {
  width: 104px !important;
}

/* 图片控件容器固定 120px：写 width:auto 时 flex 子项会塌缩、图片溢出把图标压到图片上 */
.site-setting__section--images .site-setting__control {
  width: 120px;
  flex: none;
}

@media (max-width: 1200px) {
  .site-setting__sections {
    grid-template-columns: minmax(0, 1fr);
  }
}

// element-plus 会给相邻按钮补 12px 左外边距，这里压掉，让「编辑 / 删除」挨在一起
.site-setting__actions :deep(.el-button + .el-button) {
  margin-left: 2px;
}

// 配置名一律单行显示：宽度不够时省略，不要折行（如「落地页App自动下载」）
.site-setting__form :deep(.el-form-item__label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 落地页「重建」提示条：比 el-alert 紧凑（12px、单行、细边框），不把表单顶部撑得臃肿
.landing-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 9px 12px;
  // 浅底 + 细边框放在白色表单里太"平"，改成更深一档的底色 + 左侧 3px 实心橙条，一眼能看到
  border: 1px solid var(--el-color-warning-light-5);
  border-left: 4px solid var(--el-color-warning);
  border-radius: 6px;
  background: var(--el-color-warning-light-8);
  font-weight: 500;
  // 与 el-alert 标题字号保持一致。
  // 注意 `--el-alert-title-font-size` 是 element-plus 定义在 `.el-alert` 作用域里的（14px），
  // 这个 div 不在 .el-alert 内部、取不到它，所以要带一个全局变量兜底，否则会退回默认的 16px。
  font-size: var(--el-alert-title-font-size, var(--el-font-size-base));
  line-height: 1.6;
  color: var(--el-color-warning-dark-2);

  &__icon {
    flex: none;
    color: var(--el-color-warning);
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__action {
    flex: none;
  }
}
.site-setting__footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
