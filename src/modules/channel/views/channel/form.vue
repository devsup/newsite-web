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
import type { FormInstance, FormRules } from 'element-plus'
import type { ChannelVo } from '~/channel/api/channel'
import { create, save } from '~/channel/api/channel'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'channel:channel:form' })

const { formType = 'add', data = null } = defineProps<{
  formType: 'add' | 'edit'
  data?: ChannelVo | null
}>()

const t = useTrans().globalTrans
const formRef = ref<FormInstance>()
const model = ref<ChannelVo>({})

/** 渠道编码：只允许字母、数字（编码会拼进 URL，出现非法字符会拼出畸形链接） */
const CODE_PATTERN = /^[A-Z0-9]+$/i

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('form.requiredInput', { msg: t('channel.name') }), trigger: 'blur' },
    { max: 50, message: t('form.maxLength', { msg: t('channel.name'), max: 50 }), trigger: 'blur' },
  ],
  code: [
    { required: true, message: t('form.requiredInput', { msg: t('channel.code') }), trigger: 'blur' },
    { max: 10, message: t('form.maxLength', { msg: t('channel.code'), max: 10 }), trigger: 'blur' },
    { pattern: CODE_PATTERN, message: t('channel.codePlaceholder'), trigger: 'blur' },
  ],
  login_name: [
    { required: true, message: t('form.requiredInput', { msg: t('channel.loginName') }), trigger: 'blur' },
    { max: 20, message: t('form.maxLength', { msg: t('channel.loginName'), max: 20 }), trigger: 'blur' },
  ],
  // 密码只在新增时必填：编辑态后端不回显旧密码，留空即「不修改」
  password: formType === 'add'
    ? [
        { required: true, message: t('form.requiredInput', { msg: t('channel.password') }), trigger: 'blur' },
        { min: 6, max: 20, message: t('channel.passwordPlaceholder'), trigger: 'blur' },
      ]
    : [
        { min: 6, max: 20, message: t('channel.passwordPlaceholder'), trigger: 'blur' },
      ],
  kl_start: [{ required: true, message: t('form.requiredInput', { msg: t('channel.klStart') }), trigger: 'change' }],
  kl_ratio: [{ required: true, message: t('form.requiredInput', { msg: t('channel.klRatio') }), trigger: 'change' }],
}))

/** 表单初始化：新增给一套合理默认值（与后端 Channel 模型的默认值一致），编辑回填该行数据 */
function initModel(): void {
  if (formType === 'edit' && data) {
    // 密码不回显：留空提交后端会跳过更新；
    // 数值字段统一转 number——接口里的 decimal 字段可能以字符串下发（如 kl_ratio 的 "0.80"），
    // 直接喂给 el-input-number 会报「Expected Number | Null, got String」的类型校验警告。
    model.value = {
      ...data,
      password: '',
      kl_start: Number(data.kl_start ?? 0),
      kl_ratio: Number(data.kl_ratio ?? 0),
      weight: Number(data.weight ?? 0),
      status: Number(data.status ?? 1),
      bot_link_type: Number(data.bot_link_type ?? 0),
      open_mode: Number(data.open_mode ?? 1),
    }
    return
  }

  model.value = {
    name: '',
    code: '',
    login_name: '',
    password: '',
    kl_start: 0,
    kl_ratio: 0,
    status: 1,
    weight: 0,
    bot_link_type: 0,
    open_mode: 1,
    js_code: '',
    remark: '',
  }
}

initModel()

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
  <div class="channel-form">
    <el-form ref="formRef" :model="model" :rules="rules" label-width="96px" @submit.prevent>
      <div class="channel-form__group-title">
        {{ t('channel.groupBasic') }}
      </div>
      <div class="channel-form__grid">
        <el-form-item :label="t('channel.name')" prop="name">
          <el-input v-model="model.name" clearable :placeholder="t('channel.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('channel.code')" prop="code">
          <!-- 编码是三条推广链接的一部分，创建后不可修改（后端也用 unique 兜底） -->
          <el-input
            v-model="model.code"
            clearable
            :disabled="formType === 'edit'"
            :placeholder="formType === 'edit' ? t('channel.codeLocked') : t('channel.codePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('channel.loginName')" prop="login_name">
          <el-input v-model="model.login_name" clearable :placeholder="t('channel.loginNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('channel.password')" prop="password">
          <el-input
            v-model="model.password"
            type="password"
            show-password
            clearable
            :placeholder="formType === 'edit' ? t('channel.passwordEditPlaceholder') : t('channel.passwordPlaceholder')"
          />
        </el-form-item>
      </div>

      <div class="channel-form__group-title">
        {{ t('channel.groupDeduct') }}
      </div>
      <div class="channel-form__grid">
        <el-form-item :label="t('channel.klStart')" prop="kl_start">
          <el-input-number v-model="model.kl_start" :min="0" :max="999999" controls-position="right" class="w-full" />
          <div class="channel-form__tip">
            {{ t('channel.klStartTip') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('channel.klRatio')" prop="kl_ratio">
          <el-input-number v-model="model.kl_ratio" :min="0" :max="1" :step="0.1" :precision="2" controls-position="right" class="w-full" />
          <div class="channel-form__tip">
            {{ t('channel.klRatioTip') }}
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
        <el-form-item :label="t('channel.weight')" prop="weight">
          <el-input-number v-model="model.weight" :min="0" :max="999999" controls-position="right" class="w-full" />
          <div class="channel-form__tip">
            {{ t('channel.weightTip') }}
          </div>
        </el-form-item>
      </div>

      <div class="channel-form__group-title">
        {{ t('channel.groupExtend') }}
      </div>
      <div class="channel-form__grid">
        <el-form-item :label="t('channel.botLinkType')" prop="bot_link_type">
          <!-- 取值与「打开方式」同构：0 禁用 / 1 自适应 / 2 落地页 / 3 导航页（推送的「自动跳转」就是自适应），所以共用同一套文案 -->
          <el-radio-group v-model="model.bot_link_type" class="channel-form__radios">
            <el-radio :value="0">
              {{ t('channel.pushDisabled') }}
            </el-radio>
            <el-radio :value="1">
              {{ t('channel.modeAuto') }}
            </el-radio>
            <el-radio :value="2">
              {{ t('channel.modeLand') }}
            </el-radio>
            <el-radio :value="3">
              {{ t('channel.modeNavi') }}
            </el-radio>
          </el-radio-group>
          <div class="channel-form__tip">
            {{ t('channel.botLinkTypeTip') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('channel.openMode')" prop="open_mode">
          <!-- 自适应放在第一位：取值与系统设置的「运行模式」同构（1 自适应 / 2 落地页 / 3 导航页），渠道上的设置优先 -->
          <el-radio-group v-model="model.open_mode" class="channel-form__radios">
            <el-radio :value="1">
              {{ t('channel.modeAuto') }}
            </el-radio>
            <el-radio :value="2">
              {{ t('channel.modeLand') }}
            </el-radio>
            <el-radio :value="3">
              {{ t('channel.modeNavi') }}
            </el-radio>
          </el-radio-group>
          <div class="channel-form__tip">
            {{ t('channel.openModeTip') }}
          </div>
        </el-form-item>
      </div>

      <el-form-item :label="t('channel.jsCode')" prop="js_code">
        <el-input
          v-model="model.js_code"
          type="textarea"
          :rows="4"
          :placeholder="t('channel.jsCodePlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('channel.remark')" prop="remark">
        <!-- 与「JS代码」保持同高，两个多行输入框并排看着才齐 -->
        <el-input
          v-model="model.remark"
          type="textarea"
          :rows="4"
          :placeholder="t('channel.remarkPlaceholder')"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.channel-form__group-title {
  margin: 4px 0 14px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.channel-form__grid {
  display: grid;
  // 两列铺满卡片（不用 el-row 的 gutter——它是负 margin 实现的，会把内容顶出弹窗）
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 72px;
  row-gap: 4px;
}

.channel-form__radios {
  display: flex;
  flex-wrap: wrap;
}

.channel-form__tip {
  width: 100%;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  // 换行时让两行长度均衡（Chrome 114+ / Safari 17.5+），避免末行只剩一两个字
  text-wrap: balance;
}

// 窄屏（≤1200px）退成单列
@media (max-width: 1200px) {
  .channel-form__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
