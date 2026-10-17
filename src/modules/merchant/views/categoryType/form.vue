<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { CategoryTypeVo } from '~/merchant/api/categoryType'
import { create, save } from '~/merchant/api/categoryType'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'merchant:categoryType:form' })

const { formType = 'add', data = null } = defineProps<{
  formType?: 'add' | 'edit'
  data?: CategoryTypeVo | null
}>()

const t = useTrans().globalTrans
const formRef = ref<FormInstance>()
const model = ref<CategoryTypeVo>({})

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('form.requiredInput', { msg: t('categoryType.name') }), trigger: 'blur' },
    { max: 100, message: t('form.maxLength', { msg: t('categoryType.name'), max: 100 }), trigger: 'blur' },
  ],
  weight: [
    { required: true, message: t('form.requiredInput', { msg: t('categoryType.weight') }), trigger: 'change' },
  ],
}))

function initModel(): void {
  if (formType === 'edit' && data) {
    model.value = {
      ...data,
      weight: Number(data.weight ?? 0),
      status: Number(data.status ?? 1),
      remark: data.remark ?? '',
    }
    return
  }

  model.value = {
    name: '',
    weight: 0,
    status: 1,
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
  <el-form ref="formRef" :model="model" :rules="rules" label-width="90px" @submit.prevent>
    <el-form-item :label="t('categoryType.name')" prop="name">
      <el-input v-model="model.name" clearable :placeholder="t('categoryType.namePlaceholder')" />
    </el-form-item>
    <el-form-item :label="t('categoryType.weight')" prop="weight">
      <el-input-number v-model="model.weight" :min="0" :max="999999" controls-position="right" class="w-full" />
      <div class="merchant-form__tip">
        {{ t('categoryType.weightTip') }}
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
        :placeholder="t('categoryType.remarkPlaceholder')"
      />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.merchant-form__tip {
  width: 100%;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
</style>
