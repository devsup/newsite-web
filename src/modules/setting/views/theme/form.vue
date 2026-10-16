<!--
 - MineAdmin is committed to providing solutions for quickly building web applications
 - Please view the LICENSE file that was distributed with this source code,
 - For the full copyright and license information.
 - Thank you very much for using MineAdmin.
 -
 - @Author X.Mo<root@imoi.cn>
 - @Link   https://github.com/mineadmin
-->
<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { ThemeVo } from '~/setting/api/theme'
import { create, save } from '~/setting/api/theme'
import { defaultThemeColors, THEME_COLOR_FIELDS, THEME_GROUPS } from './data/colorFields.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import ThemePreview from './components/ThemePreview.vue'
import GradientColorPicker from './components/GradientColorPicker.vue'

defineOptions({ name: 'setting:theme:form' })

const { formType = 'add', data = null } = defineProps<{
  formType: 'add' | 'edit'
  data?: ThemeVo | null
}>()

const t = useTrans().globalTrans
const msg = useMessage()
const formRef = ref<FormInstance>()
const model = ref<ThemeVo>({})

/** 与后端 ThemeSaveRequest 保持一致的颜色格式校验（可为空，支持纯色与渐变） */
const COLOR_PATTERN = /^(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|(?:linear|radial)-gradient\(.+\))$/

const rules = {
  name: [{ required: true, message: t('form.requiredInput', { msg: t('theme.name') }), trigger: 'blur' }],
  weight: [{ required: true, message: t('form.requiredInput', { msg: t('theme.weight') }), trigger: 'blur' }],
}

/** 表单初始化：新增时套用示例配色当前默认值，编辑时回填该行数据 */
function initModel(): void {
  if (formType === 'edit' && data) {
    model.value = { ...data }
    return
  }

  model.value = {
    ...defaultThemeColors(),
    name: '',
    weight: 0,
    status: 1,
    remark: '',
  } as ThemeVo
}

initModel()

/** 一键套用参考站点的示例配色（只覆盖 16 个颜色，不动名称/权重/备注） */
function applyPreset(): void {
  Object.assign(model.value, defaultThemeColors())
  msg.success(t('theme.presetApplied'))
}

/** 颜色项是否填了非法值（用于给输入框标红） */
function isInvalidColor(key: string): boolean {
  const value = String(model.value[key] ?? '').trim()
  return value !== '' && !COLOR_PATTERN.test(value)
}

function add(): Promise<any> {
  return new Promise((resolve, reject) => {
    create(model.value).then((res: any) => {
      res.code === ResultCode.SUCCESS ? resolve(res) : reject(res)
    }).catch((err) => {
      reject(err)
    })
  })
}

function edit(): Promise<any> {
  return new Promise((resolve, reject) => {
    save(model.value.id as number, model.value).then((res: any) => {
      res.code === ResultCode.SUCCESS ? resolve(res) : reject(res)
    }).catch((err) => {
      reject(err)
    })
  })
}

/** 供父组件在弹窗「确定」时做整体校验 */
defineExpose({
  add,
  edit,
  getElFormRef: () => formRef.value,
})
</script>

<template>
  <div class="theme-form">
    <!-- 左：配置 -->
    <div class="theme-form__main">
      <el-form ref="formRef" :model="model" :rules="rules" label-width="96px" @submit.prevent>
        <el-form-item :label="t('theme.name')" prop="name">
          <el-input v-model="model.name" clearable :placeholder="t('theme.namePlaceholder')" />
        </el-form-item>

        <div class="theme-form__meta">
          <el-form-item :label="t('theme.weight')" prop="weight">
            <el-input-number v-model="model.weight" :min="0" :max="9999" controls-position="right" class="w-full" />
          </el-form-item>
          <el-form-item :label="t('crud.status')" prop="status">
            <el-radio-group v-model="model.status">
              <el-radio :value="1">
                {{ t('dictionary.system.statusEnabled') }}
              </el-radio>
              <el-radio :value="2">
                {{ t('dictionary.system.statusDisabled') }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <el-form-item :label="t('crud.remark')" prop="remark">
          <el-input v-model="model.remark" clearable :placeholder="t('form.pleaseInput', { msg: t('crud.remark') })" />
        </el-form-item>

        <!-- 16 个颜色：按用途分组，每组一行标题 -->
        <div class="theme-form__colors-header">
          <span class="text-sm text-[var(--el-text-color-secondary)]">{{ t('theme.colorsHint') }}</span>
          <el-button link type="primary" @click="applyPreset">
            <ma-svg-icon name="material-symbols:auto-awesome-outline" :size="16" class="mr-1" />
            {{ t('theme.applyPreset') }}
          </el-button>
        </div>

        <template v-for="group in THEME_GROUPS" :key="group.key">
          <div class="theme-form__group-title">
            {{ t(group.label) }}
          </div>
          <div class="theme-form__grid">
            <div
              v-for="field in THEME_COLOR_FIELDS.filter(item => item.group === group.key)"
              :key="field.key"
              class="theme-form__color"
            >
              <span class="theme-form__color-label" :title="t(field.label)">{{ t(field.label) }}</span>
              <GradientColorPicker v-model="model[field.key]" />
              <el-input
                v-model="model[field.key]"
                class="theme-form__color-input"
                :class="{ 'is-error': isInvalidColor(field.key) }"
                placeholder="#rrggbb 或 linear-gradient(...)"
              />
            </div>
          </div>
        </template>
      </el-form>
    </div>

    <!-- 右：实时预览（只有样式样张，不再带标题与提示文案） -->
    <div class="theme-form__preview">
      <div class="theme-form__preview-body">
        <ThemePreview :colors="model" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.theme-form {
  display: flex;
  gap: 24px;
  // 用 stretch（而非 flex-start）：让右侧预览区跟左侧表单一样高，
  // 否则表单很长、预览区只有样张那么高，右下会空一大块显得「上下太短」。
  align-items: stretch;
}

.theme-form__main {
  flex: 1;
  min-width: 0;
}

.theme-form__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
}

.theme-form__colors-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 8px;
}

.theme-form__group-title {
  // 分组之间留点呼吸：上 16px 把上一组内容隔开，下 10px 与组内第一行颜色项分开
  margin: 16px 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.theme-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
  row-gap: 8px;
  margin-bottom: 6px;
}

.theme-form__color {
  display: grid;
  // 三列：标签 / 色块 / 输入框。标签用固定列宽（而非 flex 压缩），
  // 保证「两列标题文字颜色」这类较长的名称能完整显示、各行的色块也对齐。
  // 注意第二列要给足 52px——色块组件本身宽 52px，列宽小于它就会溢出、压到输入框上
  //（之前给 32px，实测色块与输入框重叠 -10px，看着就是「挤在一起」）。
  grid-template-columns: 112px 52px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.theme-form__color-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.theme-form__color-input {
  flex: 1;
  min-width: 0;

  &.is-error :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-color-danger) inset;
  }
}

.theme-form__preview {
  flex: 0 0 420px;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.theme-form__preview-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 460px;
}

// 窄屏（≤1200px）退成单列，预览放到表单下方
@media (max-width: 1200px) {
  .theme-form {
    flex-direction: column;
  }

  .theme-form__preview {
    flex: none;
    width: 100%;
  }

  // 竖排时不需要跟表单等高，给个适中的固定高度即可
  .theme-form__preview-body {
    min-height: 380px;
  }

  .theme-form__grid,
  .theme-form__meta {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
