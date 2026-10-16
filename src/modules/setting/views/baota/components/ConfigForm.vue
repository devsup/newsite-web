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
import type { MaFormExpose } from '@mineadmin/form'
import type { BaoTaConfigVo } from '~/setting/api/baota.ts'

import { configSave, configTest, configUpdate } from '~/setting/api/baota.ts'
import getConfigFormItems from './configFormItems.tsx'
import { useMessage } from '@/hooks/useMessage.ts'
import useForm from '@/hooks/useForm.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'setting:baota:configForm' })

const { formType = 'add', data = null } = defineProps<{
  formType: 'add' | 'edit'
  data?: BaoTaConfigVo | null
}>()

const t = useTrans().globalTrans
const msg = useMessage()
const configForm = ref<MaFormExpose>()
const model = ref<BaoTaConfigVo>({})
const testing = ref(false)
// 连通性测试的内联结果：成功显示「连接正常」，失败直接把面板/网络的错误摆出来
const testResult = ref<{ ok: boolean, text: string } | null>(null)

/**
 * ma-form 挂载后初始化：编辑时把传入的行数据灌进 model。
 *
 * api_key 刻意不灌：接口从不返回密钥明文，留空即表示「保持原密钥」。
 */
useForm('configForm').then((form: MaFormExpose) => {
  if (data) {
    Object.keys(data).forEach((key: string) => {
      if (key === 'api_key') {
        return
      }
      model.value[key] = data[key]
    })
  }
  form.setItems(getConfigFormItems(formType, t, model.value))
  form.setOptions({
    labelWidth: '100px',
  })
})

/** 新增：提交整表（成功 / 失败都由父组件弹窗回调统一提示） */
function add(): Promise<any> {
  return new Promise((resolve, reject) => {
    configSave(model.value).then((res: any) => {
      res.code === ResultCode.SUCCESS ? resolve(res) : reject(res)
    }).catch((err) => {
      reject(err)
    })
  })
}

/** 编辑：整表提交，密钥留空时后端会保留原值 */
function edit(): Promise<any> {
  return new Promise((resolve, reject) => {
    configUpdate(model.value.id as number, model.value).then((res: any) => {
      res.code === ResultCode.SUCCESS ? resolve(res) : reject(res)
    }).catch((err) => {
      reject(err)
    })
  })
}

/**
 * 测试面板连接。
 *
 * 密钥框为空时传 id，后端会用库里已存的那份密钥去测；地址始终以表单当前值为准，
 * 这样「改了地址、没改密钥」也能直接验证新地址是否通。
 * 结果除了 toast 之外还在按钮右侧内联显示，避免弹窗一多就看不到提示。
 */
async function testConnection(): Promise<void> {
  if (!model.value.api_url) {
    msg.error(t('form.requiredInput', { msg: t('baota.apiUrl') }))
    return
  }

  testing.value = true
  testResult.value = null
  try {
    const res = await configTest({
      id: model.value.id,
      api_url: model.value.api_url,
      api_key: model.value.api_key,
    })
    if (res.code === ResultCode.SUCCESS) {
      testResult.value = { ok: true, text: t('baota.testOk') }
      msg.success(t('baota.testSuccess', {
        system: res.data?.system || '-',
        version: res.data?.version || '-',
      }))
    }
    else {
      testResult.value = { ok: false, text: res.message }
      msg.error(res.message)
    }
  }
  finally {
    testing.value = false
  }
}

defineExpose({
  add,
  edit,
  maForm: configForm,
})
</script>

<template>
  <div class="config-form">
    <ma-form ref="configForm" v-model="model" />

    <!-- 与上面的字段左对齐（ma-form 的 labelWidth 是 100px），不再孤零零挂在最左边 -->
    <div class="config-form__actions">
      <el-button type="primary" plain :loading="testing" @click="testConnection">
        <ma-svg-icon name="material-symbols:lan-outline" :size="16" class="mr-1" />
        {{ t('baota.testConnection') }}
      </el-button>

      <span
        v-if="testResult"
        class="config-form__result"
        :class="testResult.ok ? 'is-ok' : 'is-fail'"
      >
        {{ testResult.text }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.config-form {
  &__actions {
    display: flex;
    gap: 12px;
    align-items: center;
    // 与 ma-form 的 labelWidth 保持一致，让按钮和上方输入框左对齐
    padding-left: 100px;
  }

  &__result {
    font-size: 12px;

    &.is-ok {
      color: var(--el-color-success);
    }

    &.is-fail {
      color: var(--el-color-danger);
    }
  }
}
</style>
