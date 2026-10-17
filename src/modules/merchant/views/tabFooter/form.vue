<script setup lang="ts">
import { Status } from '@/constants/status.ts'
import type { FormInstance, FormRules } from 'element-plus'
import type { TabFooterVo } from '~/merchant/api/tabFooter'
import { create, save } from '~/merchant/api/tabFooter'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'merchant:tabFooter:form' })

const { formType = 'add', data = null } = defineProps<{
  formType?: 'add' | 'edit'
  data?: TabFooterVo | null
}>()

const t = useTrans().globalTrans
const formRef = ref<FormInstance>()
const model = ref<TabFooterVo>({})

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('form.requiredInput', { msg: t('tabFooter.name') }), trigger: 'blur' },
    { max: 50, message: t('form.maxLength', { msg: t('tabFooter.name'), max: 50 }), trigger: 'blur' },
  ],
  icon: [{ required: true, message: t('form.requiredInput', { msg: t('tabFooter.icon') }), trigger: 'change' }],
  icon_on: [{ required: true, message: t('form.requiredInput', { msg: t('tabFooter.iconOn') }), trigger: 'change' }],
  weight: [{ required: true, message: t('form.requiredInput', { msg: t('tabFooter.weight') }), trigger: 'change' }],
}))

function initModel(): void {
  if (formType === 'edit' && data) {
    model.value = {
      ...data,
      icon: data.icon ?? '',
      icon_on: data.icon_on ?? '',
      weight: Number(data.weight ?? 0),
      status: Number(data.status ?? 1),
      remark: data.remark ?? '',
    }
    return
  }

  model.value = {
    name: '',
    icon: '',
    icon_on: '',
    weight: 0,
    status: Status.ENABLED,
    remark: '',
  }
}

initModel()

function add(): Promise<any> {
  return new Promise((resolve, reject) => {
    create(model.value).then((res: any) => {
      res.code === ResultCode.SUCCESS ? resolve(res) : reject(res)
    }).catch(reject)
  })
}

function edit(): Promise<any> {
  return new Promise((resolve, reject) => {
    save(model.value.id as number, model.value).then((res: any) => {
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
  <el-form ref="formRef" :model="model" :rules="rules" label-width="96px" @submit.prevent>
    <el-form-item :label="t('tabFooter.name')" prop="name">
      <el-input v-model="model.name" clearable :placeholder="t('tabFooter.namePlaceholder')" />
    </el-form-item>

    <div class="merchant-upload-grid">
      <el-form-item :label="t('tabFooter.icon')" prop="icon">
        <ma-upload-image
          :model-value="model.icon ?? ''"
          :size="88"
          :limit="1"
          @update:model-value="(value) => model.icon = String(value)"
        />
      </el-form-item>
      <el-form-item :label="t('tabFooter.iconOn')" prop="icon_on">
        <ma-upload-image
          :model-value="model.icon_on ?? ''"
          :size="88"
          :limit="1"
          @update:model-value="(value) => model.icon_on = String(value)"
        />
      </el-form-item>
    </div>

    <el-form-item :label="t('tabFooter.weight')" prop="weight">
      <el-input-number v-model="model.weight" :min="0" :max="999999" controls-position="right" class="w-full" />
      <div class="merchant-form__tip">
        {{ t('tabFooter.weightTip') }}
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
      <el-input
        v-model="model.remark"
        type="textarea"
        :rows="4"
        :placeholder="t('tabFooter.remarkPlaceholder')"
      />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.merchant-upload-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
}

.merchant-form__tip {
  width: 100%;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .merchant-upload-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
