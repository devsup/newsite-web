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
import { batchUpdate } from '~/merchant/api/merchant'

interface BatchPayload {
  ids?: number[]
  field?: 'name' | 'jump_url'
}

const props = defineProps<{ data?: BatchPayload }>()

const t = useTrans().globalTrans
const formRef = ref<FormInstance>()
const model = ref<{ value: string }>({ value: '' })
/** 提交中：防止连点「确定」重复提交同一次批量修改 */
const submitting = ref(false)

/** 只有名称 / 跳转链接需要弹窗输入；状态切换走确认框，不进这个组件 */
const field = computed(() => (props.data?.field === 'jump_url' ? 'jump_url' : 'name'))
const count = computed(() => props.data?.ids?.length ?? 0)
const maxLength = computed(() => (field.value === 'name' ? 50 : 500))

const rules = computed(() => ({
  value: [
    { required: true, message: t('form.requiredInput', { msg: t(`merchantInfo.${field.value === 'name' ? 'name' : 'jumpUrl'}`) }), trigger: 'blur' },
    { max: maxLength.value, message: t('merchantInfo.batchValueTooLong', { max: maxLength.value }), trigger: 'blur' },
  ],
}))

/**
 * 提交批量修改.
 *
 * 由 useDialog 的 ok 回调调用；先本地校验，再走统一批量接口，
 * 校验不通过时 reject，调用方只需处理 error 分支即可（不弹接口错误）。
 */
function submit(): Promise<any> {
  return new Promise((resolve, reject) => {
    formRef.value?.validate().then(() => {
      if (submitting.value) {
        reject(new Error('submitting'))
        return
      }
      submitting.value = true
      batchUpdate(props.data?.ids ?? [], field.value, model.value.value.trim())
        .then(resolve)
        .catch(reject)
        .finally(() => {
          submitting.value = false
        })
    }).catch(reject)
  })
}

defineExpose({
  submit,
  getElFormRef: () => formRef.value,
})
</script>

<template>
  <el-alert
    type="warning"
    :closable="false"
    show-icon
    class="mb-4"
    :title="t('merchantInfo.batchHint', { count })"
  />
  <el-form ref="formRef" :model="model" :rules="rules" label-width="96px" @submit.prevent>
    <el-form-item :label="field === 'name' ? t('merchantInfo.name') : t('merchantInfo.jumpUrl')" prop="value">
      <el-input
        v-model="model.value"
        clearable
        :maxlength="maxLength"
        show-word-limit
        :placeholder="field === 'name' ? t('merchantInfo.batchNamePlaceholder') : t('merchantInfo.batchJumpUrlPlaceholder')"
      />
    </el-form-item>
  </el-form>
</template>
