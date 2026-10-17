<script setup lang="ts">
import { Status } from '@/constants/status.ts'
import type { FormInstance, FormRules } from 'element-plus'
import type { MerchantOptions, MerchantVo } from '~/merchant/api/merchant'
import type { MerchantFieldConfig } from './data/fieldConfig'

import { LAYER_FIELDS, SHOW_FIELDS } from './data/fieldConfig'
import { create, save } from '~/merchant/api/merchant'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'merchant:merchant:form' })

const { formType = 'add', data = null, options } = defineProps<{
  formType?: 'add' | 'edit'
  data?: MerchantVo | null
  options: MerchantOptions
}>()

const t = useTrans().globalTrans
const formRef = ref<FormInstance>()
const model = ref<MerchantVo>({})

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('form.requiredInput', { msg: t('merchantInfo.name') }), trigger: 'blur' },
    { max: 50, message: t('form.maxLength', { msg: t('merchantInfo.name'), max: 50 }), trigger: 'blur' },
  ],
  category_type: [{ required: true, message: t('form.requiredSelect', { msg: t('merchantInfo.categoryType') }), trigger: 'change' }],
  show_type: [{ required: true, message: t('form.requiredSelect', { msg: t('merchantInfo.showType') }), trigger: 'change' }],
  category_area: [{ required: true, message: t('form.requiredSelect', { msg: t('merchantInfo.categoryArea') }), trigger: 'change' }],
  jump_url: [{ required: true, message: t('form.requiredInput', { msg: t('merchantInfo.jumpUrl') }), trigger: 'blur' }],
}))

/** 展示类型变化后，只保留同类型的区域；不同类型区域必须重新选择 */
const areaOptions = computed(() => {
  if (!model.value.show_type) {
    return []
  }
  return options.areas.filter(area => area.type === model.value.show_type)
})

const showFields = computed<MerchantFieldConfig[]>(() => SHOW_FIELDS[model.value.show_type ?? 0] ?? [])
const layerFields = computed<MerchantFieldConfig[]>(() => LAYER_FIELDS[model.value.layer_type ?? 1] ?? [])

function fieldRules(field: MerchantFieldConfig): FormRules[string] {
  if (!field.required) {
    return []
  }
  return [{
    required: true,
    message: t('form.requiredInput', { msg: t(field.labelKey) }),
    trigger: field.type === 'input' || field.type === 'textarea' ? 'blur' : 'change',
  }]
}

function getInfoValue(key: string): any {
  return model.value.show_info?.[key]
}

function getLayerValue(key: string): any {
  return model.value.layer_info?.[key]
}

function getTextValue(key: string): string {
  const value = getInfoValue(key)
  return value === null || value === undefined ? '' : String(value)
}

function getNumberValue(key: string): number {
  const value = getInfoValue(key)
  return value === null || value === undefined || value === '' ? 0 : Number(value)
}

function getLayerTextValue(key: string): string {
  const value = getLayerValue(key)
  return value === null || value === undefined ? '' : String(value)
}

/** 图片字段统一取 string / string[]，避免 undefined 传给 ma-upload-image */
function getImageValue(key: string, multiple = false): any {
  const value = getInfoValue(key)
  if (multiple) {
    return Array.isArray(value) ? value : []
  }
  return typeof value === 'string' ? value : ''
}

function getLayerImageValue(key: string): string {
  const value = getLayerValue(key)
  return typeof value === 'string' ? value : ''
}

function setShowInfo(key: string, value: string | string[] | Array<{ url: string, text: string }>): void {
  model.value.show_info = { ...(model.value.show_info ?? {}), [key]: value }
}

function setLayerInfo(key: string, value: string | string[]): void {
  model.value.layer_info = { ...(model.value.layer_info ?? {}), [key]: value }
}

/** 初始化：新增给默认值；编辑回填并把 ID / 数值字段规范成 number */
function initModel(): void {
  if (formType === 'edit' && data) {
    model.value = {
      ...data,
      category_area: Number(data.category_area ?? 0),
      category_type: Number(data.category_type ?? 0),
      show_type: Number(data.show_type ?? 0),
      layer_type: Number(data.layer_type ?? 1),
      weight: Number(data.weight ?? 0),
      status: Number(data.status ?? 1),
      show_info: { ...(data.show_info ?? {}) },
      layer_info: { ...(data.layer_info ?? {}) },
    }
    return
  }

  model.value = {
    name: '',
    category_area: undefined,
    category_type: undefined,
    show_type: undefined,
    jump_url: '',
    show_info: {},
    layer_type: 1,
    layer_info: {},
    weight: 0,
    status: Status.ENABLED,
    remark: '',
  }
}

initModel()

watch(() => model.value.show_type, (showType) => {
  if (!showType) {
    model.value.category_area = undefined
    model.value.show_info = {}
    return
  }

  const selectedArea = options.areas.find(area => area.id === model.value.category_area)
  if (selectedArea && selectedArea.type !== showType) {
    model.value.category_area = undefined
  }

  // 切换展示模板时清空展示信息，避免旧模板的字段值带入新模板（尤其 btn_text / app_icon 这类共用 key）
  model.value.show_info = {}
})

watch(() => model.value.layer_type, () => {
  // 切换弹窗模板时同理：清空弹窗信息，防止 down_icon / btn_text 等共用 key 串数据
  model.value.layer_info = {}
})

/** 只提交当前模板允许的字段，避免切换类型后把旧模板的脏字段写进 JSON */
function pickFields(fields: MerchantFieldConfig[], source: Record<string, any> | undefined): Record<string, any> {
  const result: Record<string, any> = {}
  for (const field of fields) {
    const value = source?.[field.key]
    if (field.type === 'images') {
      result[field.key] = Array.isArray(value) ? value : []
      continue
    }
    result[field.key] = value ?? ''
  }
  return result
}

function getSubmitData(): MerchantVo {
  const submitData: MerchantVo = JSON.parse(JSON.stringify(model.value ?? {}))
  submitData.show_info = pickFields(showFields.value, model.value.show_info)
  submitData.layer_info = pickFields(layerFields.value, model.value.layer_info)
  return submitData
}

function add(): Promise<any> {
  return new Promise((resolve, reject) => {
    create(getSubmitData()).then((res: any) => {
      res.code === ResultCode.SUCCESS ? resolve(res) : reject(res)
    }).catch(reject)
  })
}

function edit(): Promise<any> {
  return new Promise((resolve, reject) => {
    save(model.value.id as number, getSubmitData()).then((res: any) => {
      res.code === ResultCode.SUCCESS ? resolve(res) : reject(res)
    }).catch(reject)
  })
}

defineExpose({
  add,
  edit,
  getElFormRef: () => formRef.value,
})
</script>

<template>
  <el-form ref="formRef" class="merchant-form" :model="model" :rules="rules" label-width="100px" @submit.prevent>
    <div class="merchant-form__section-title">
      {{ t('merchantInfo.basicInfo') }}
    </div>
    <div class="merchant-form__grid">
      <el-form-item :label="t('merchantInfo.name')" prop="name">
        <el-input v-model="model.name" clearable :placeholder="t('merchantInfo.namePlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('merchantInfo.categoryType')" prop="category_type">
        <el-select v-model="model.category_type" clearable filterable :placeholder="t('merchantInfo.selectPlaceholder')" class="w-full">
          <el-option v-for="item in options.categoryTypes" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('merchantInfo.showType')" prop="show_type">
        <el-select v-model="model.show_type" clearable :placeholder="t('merchantInfo.selectPlaceholder')" class="w-full">
          <el-option v-for="item in options.showTypes" :key="item.value" :label="item.name" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('merchantInfo.categoryArea')" prop="category_area">
        <el-select
          v-model="model.category_area"
          clearable
          filterable
          :disabled="!model.show_type"
          :placeholder="model.show_type ? t('merchantInfo.selectArea') : t('merchantInfo.selectShowTypeFirst')"
          class="w-full"
        >
          <el-option v-for="item in areaOptions" :key="item.id" :label="item.internal_name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('merchantInfo.jumpUrl')" prop="jump_url">
        <el-input v-model="model.jump_url" clearable :placeholder="t('merchantInfo.jumpUrlPlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('merchantInfo.weight')" prop="weight">
        <el-input-number v-model="model.weight" :min="0" :max="999999" controls-position="right" class="w-full" />
        <div class="merchant-form__tip">
          {{ t('merchantInfo.weightTip') }}
        </div>
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
      <el-form-item :label="t('crud.remark')" prop="remark">
        <el-input v-model="model.remark" type="textarea" :rows="2" :placeholder="t('merchantInfo.remarkPlaceholder')" />
      </el-form-item>
    </div>

    <template v-if="showFields.length > 0">
      <div class="merchant-form__section-title">
        {{ t('merchantInfo.showInfoTitle') }}
      </div>
      <div class="merchant-form__grid">
        <el-form-item
          v-for="field in showFields"
          :key="`show-${field.key}`"
          :label="t(field.labelKey)"
          :prop="`show_info.${field.key}`"
          :rules="fieldRules(field)"
          :class="{ 'merchant-form__full': field.full }"
        >
          <el-input
            v-if="field.type === 'input'"
            :model-value="getTextValue(field.key)"
            clearable
            :placeholder="t('form.pleaseInput', { msg: t(field.labelKey) })"
            @update:model-value="(value: string) => setShowInfo(field.key, value)"
          />
          <el-input
            v-else-if="field.type === 'textarea'"
            :model-value="getTextValue(field.key)"
            type="textarea"
            :rows="3"
            :placeholder="t('form.pleaseInput', { msg: t(field.labelKey) })"
            @update:model-value="(value: string) => setShowInfo(field.key, value)"
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            :model-value="getNumberValue(field.key)"
            :min="0"
            controls-position="right"
            class="w-full"
            @update:model-value="(value: number | undefined) => setShowInfo(field.key, String(value ?? 0))"
          />
          <ma-upload-image
            v-else-if="field.type === 'image'"
            :model-value="getImageValue(field.key)"
            :size="88"
            :limit="1"
            @update:model-value="(value) => setShowInfo(field.key, String(value ?? ''))"
          />
          <ma-upload-image
            v-else
            :model-value="getImageValue(field.key, true)"
            :size="88"
            :limit="field.limit ?? 10"
            :multiple="true"
            :show-text-input="!!field.withText"
            :show-text-input-placeholder="field.textPlaceholderKey ? t(field.textPlaceholderKey) : ''"
            @update:model-value="(value) => setShowInfo(field.key, Array.isArray(value) ? value : [])"
          />
        </el-form-item>
      </div>
    </template>

    <div class="merchant-form__section-title">
      {{ t('merchantInfo.popupInfoTitle') }}
    </div>
    <el-form-item :label="t('merchantInfo.layerType')" prop="layer_type">
      <el-radio-group v-model="model.layer_type">
        <el-radio v-for="item in options.layerTypes" :key="item.value" :value="item.value">
          {{ item.name }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <div v-if="layerFields.length > 0" class="merchant-form__grid">
      <el-form-item
        v-for="field in layerFields"
        :key="`layer-${field.key}`"
        :label="t(field.labelKey)"
        :prop="`layer_info.${field.key}`"
        :class="{ 'merchant-form__full': field.full }"
      >
        <el-input
          v-if="field.type === 'input'"
          :model-value="getLayerTextValue(field.key)"
          clearable
          :placeholder="t('form.pleaseInput', { msg: t(field.labelKey) })"
          @update:model-value="(value: string) => setLayerInfo(field.key, value)"
        />
        <el-input
          v-else-if="field.type === 'textarea'"
          :model-value="getLayerTextValue(field.key)"
          type="textarea"
          :rows="3"
          :placeholder="t('form.pleaseInput', { msg: t(field.labelKey) })"
          @update:model-value="(value: string) => setLayerInfo(field.key, value)"
        />
        <ma-upload-image
          v-else
          :model-value="getLayerImageValue(field.key)"
          :size="88"
          :limit="1"
          @update:model-value="(value) => setLayerInfo(field.key, String(value ?? ''))"
        />
      </el-form-item>
    </div>
  </el-form>
</template>

<style scoped lang="scss">
.merchant-form {
  // 弹窗 1120px 时表单铺满会显得空旷、也不居中；稍微收窄居中。
  // 1000px 时两侧留白 44px 偏大，放到 1040（约 24px）
  max-width: 1040px;
  margin: 0 auto;
}

.merchant-form__section-title {
  // 分组标题做成「小标题 + 下划线」：分割线在标题下方（不是上方），段落之间靠 margin-top 拉开
  margin: 0 0 14px;
  padding: 0 0 8px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid var(--el-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.merchant-form__section-title:not(:first-child) {
  margin-top: 20px;
}

.merchant-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 48px;
  row-gap: 4px;

  // 图片上传字段比输入框高，默认的垂直居中会把同一行的输入框压到图片中部；
  // 统一顶部对齐，标签和输入框从同一条基线开始。
  :deep(.el-form-item) {
    align-items: flex-start;
  }

  :deep(.el-form-item__label) {
    line-height: 32px;
  }
}

.merchant-form__full {
  grid-column: 1 / -1;
}

.merchant-form__tip {
  width: 100%;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

@media (max-width: 900px) {
  .merchant-form__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
