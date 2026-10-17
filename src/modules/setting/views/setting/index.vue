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
  subtitle: Edit values in the form directly; add or modify a setting with the buttons above
  goChannel: Go to Channel →
  landingRebuildTip: Changing the landing background, package URLs or download switches does not refresh the generated landing pages — go to Channel and click Rebuild Landings
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
  subtitle: 直接在表单里修改配置值，新增或修改配置项请用上方按钮
  goChannel: 去渠道管理 →
  landingRebuildTip: 改动「落地页背景图 / 苹果包 / 安卓包 / 下载开关」后，已生成的渠道落地页不会自动更新，需到「渠道管理」点「重建落地页」重新生成
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
  subtitle: 直接在表單裡修改配置值，新增或修改配置項請用上方按鈕
  goChannel: 去通路管理 →
  landingRebuildTip: 改動「落地頁背景圖 / 蘋果包 / 安卓包 / 下載開關」後，已生成的通路落地頁不會自動更新，需到「通路管理」點「重建落地頁」重新生成
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
        <div class="flex items-center justify-between">
          <div>
            <div class="text-base font-medium">
              {{ t('title') }}
            </div>
            <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
              {{ t('subtitle') }}
            </div>
          </div>
          <div class="flex items-center gap-x-2">
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
        <div class="site-setting__grid">
          <el-form-item v-for="(item, index) in items" :key="item.key || index">
            <template #label>
              <span>{{ item.name }}</span>
            </template>

            <div class="w-full flex items-center gap-x-4">
              <div class="min-w-0 flex-1">
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
                  :size="120"
                />

                <el-input v-else v-model="item.value" clearable />
              </div>

              <div class="site-setting__actions flex shrink-0 items-center">
                <el-button
                  v-auth="['setting:save']"
                  link
                  type="primary"
                  :title="t('edit')"
                  @click="openEdit(item, index)"
                >
                  <ma-svg-icon name="material-symbols:edit-outline-rounded" :size="18" />
                </el-button>
                <el-button
                  v-auth="['setting:delete']"
                  link
                  type="danger"
                  :title="t('remove')"
                  @click="removeItem(item, index)"
                >
                  <ma-svg-icon name="material-symbols:delete-outline-rounded" :size="18" />
                </el-button>
              </div>
            </div>
          </el-form-item>
        </div>
      </el-form>

      <div class="mt-4 text-center">
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
.site-setting__form {
  max-width: none;
}

// 两列布局：列间距（左右）96px、行间距 12px；窄屏自动退成一列。
// 用 grid 而不是 el-row/el-col + gutter——gutter 走负 margin，gutter 一大就会把内容顶出卡片、出现横向滚动。
.site-setting__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 96px;
  row-gap: 12px;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 12px;
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
</style>
