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
import Message from 'vue-m-message'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import useUserStore from '@/store/modules/useUserStore.ts'
import useSettingStore from '@/store/modules/useSettingStore.ts'

const { t } = useI18n()
const isProduction: boolean = import.meta.env.MODE === 'production'
const userStore = useUserStore()
const settingStore = useSettingStore()
const router = useRouter()
const isFormSubmit = ref(false)
const isValidState = ref(true)
const codeRef = ref()

/** TOTP 第二步验证弹窗 */
const totpVisible = ref(false)
const totpChallenge = ref('')
const totpCode = ref('')
const totpErrorText = ref('')
const totpInputRef = ref()

const form = reactive<{
  username: string
  password: string
  code: string
}>({
  username: isProduction ? '' : 'sysadmin',
  password: isProduction ? '' : '123456',
  code: isProduction ? '' : '1234',
})

function easyValidate(event: Event) {
  const dom = event?.target as HTMLInputElement
  if (form[dom.name] === undefined || form[dom.name] === '') {
    dom.classList.add('!ring-red-5')
    Message.error(t(`loginForm.${dom.name}Placeholder`))
    isValidState.value = false
  }
  else {
    dom.classList.remove('!ring-red-5')
    isValidState.value = true
  }
}

async function submit() {
  Object.keys(form).forEach((key) => {
    if (form[key] === undefined || form[key] === '') {
      Message.error(t(`loginForm.${key}Placeholder`))
      isValidState.value = false
    }
  })
  if (!isValidState.value) {
    return false
  }

  if (isProduction && !codeRef.value.checkResult(form.code)) {
    form.code = ''
    return false
  }

  isFormSubmit.value = true
  try {
    const result = await userStore.login(form)

    // 已绑定 TOTP：不签发 token，进入第二步动态码验证
    if ('require' in result && result.require === 'totp_verify') {
      totpChallenge.value = result.challenge
      totpCode.value = ''
      totpErrorText.value = ''
      totpVisible.value = true
      return
    }

    // 未启用 TOTP：登录成功，提示尽快启用（不阻塞跳转）
    if (!result.totp_enabled) {
      showTotpHint()
    }
    await goHome()
  }
  catch (error: any) {
    Message.error(error?.message ?? t('loginForm.loginFailed'))
  }
  finally {
    isFormSubmit.value = false
  }
}

async function goHome() {
  const welcomePath = settingStore.getSettings('welcomePage').path ?? null
  const redirect = router.currentRoute.value.query?.redirect ?? undefined
  await router.push({ path: redirect ?? welcomePath ?? '/' })
}

/** 未启用 TOTP 时的安全提示（参考站点样式，红色警示） */
function showTotpHint() {
  ElMessageBox.alert(
    `<div class="totp-tip">
      <div class="totp-tip__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3l7 3v5.5c0 4.3-2.9 7.4-7 8.5-4.1-1.1-7-4.2-7-8.5V6l7-3Z"/>
          <path d="M12 8v4.5"/>
          <path d="M12 16h.01"/>
        </svg>
      </div>
      <div class="totp-tip__desc">
        <div class="totp-tip__line">${t('loginForm.totpHintMessage')}</div>
        <a class="totp-tip__path" href="javascript:void(0)" role="button" tabindex="0">${t('loginForm.totpHintMessage2')}</a>
      </div>
    </div>`,
    t('loginForm.totpHintTitle'),
    {
      confirmButtonText: t('loginForm.totpKnow'),
      showClose: true,
      closeOnClickModal: true,
      dangerouslyUseHTMLString: true,
      customClass: 'totp-hint-box',
    },
  ).catch(() => {})

  // 路径文字点击直达个人中心的「账号设置」tab
  nextTick(() => {
    setTimeout(() => {
      document.querySelector('.totp-hint-box .totp-tip__path')?.addEventListener('click', () => {
        ElMessageBox.close()
        router.push({ path: '/uc/index', query: { tab: 'setting' } })
      }, { once: true })
    }, 50)
  })
}

/** 只保留数字，最多 6 位 */
function onTotpInput(value: string): void {
  totpCode.value = value.replace(/\D/g, '').slice(0, 6)
  totpErrorText.value = ''
}

function focusTotpInput(): void {
  nextTick(() => {
    totpInputRef.value?.focus()
  })
}

/** 第二步：提交 6 位动态码 */
async function submitTotp() {
  const code = totpCode.value.replace(/\D/g, '')
  if (code.length !== 6) {
    totpErrorText.value = t('loginForm.totpPlaceholder')
    return
  }

  isFormSubmit.value = true
  totpErrorText.value = ''
  try {
    await userStore.verifyTotp(totpChallenge.value, code, form.username)
    totpVisible.value = false
    await goHome()
  }
  catch (error: any) {
    // 错误信息显示在弹窗内，不再弹全局 toast，避免输入框和报错分散
    totpErrorText.value = error?.message ?? t('loginForm.totpError')
    totpCode.value = ''
    focusTotpInput()
  }
  finally {
    isFormSubmit.value = false
  }
}

function closeTotp() {
  totpVisible.value = false
  totpChallenge.value = ''
  totpCode.value = ''
  totpErrorText.value = ''
}
</script>

<template>
  <form class="mine-login-form" @submit.prevent="submit">
    <div class="mine-login-form-item">
      <div class="mine-login-form-item-title">
        {{ t('loginForm.usernameLabel') }}
      </div>
      <m-input
        v-model="form.username"
        class="!bg-white !text-black !ring-gray-2 !focus-ring-[rgb(var(--ui-primary))] !placeholder-stone-4"
        name="username"
        :placeholder="t('loginForm.usernamePlaceholder')"
        @blur="easyValidate"
      />
    </div>
    <div class="mine-login-form-item">
      <div class="mine-login-form-item-title">
        {{ t('loginForm.passwordLabel') }}
      </div>
      <m-input
        v-model="form.password"
        class="!bg-white !text-black !ring-gray-2 !focus-ring-[rgb(var(--ui-primary))] !placeholder-stone-4"
        name="password"
        type="password"
        :placeholder="t('loginForm.passwordPlaceholder')"
        @blur="easyValidate"
      />
    </div>
    <div v-if="isProduction" class="mine-login-form-item">
      <div class="mine-login-form-item-title">
        {{ t('loginForm.codeLabel') }}
      </div>
      <m-input
        v-model="form.code"
        class="!bg-white !text-black !ring-gray-2 !focus-ring-[rgb(var(--ui-primary))] !placeholder-stone-4"
        name="code"
        :placeholder="t('loginForm.codePlaceholder')"
        @blur="easyValidate"
      >
        <template #suffix>
          <div class="ml-0.5 w-30 flex items-center justify-center text-sm">
            <ma-verify-code ref="codeRef" />
          </div>
        </template>
      </m-input>
    </div>
    <div class="mine-login-form-item mt-2">
      <m-button
        type="submit"
        class="!bg-[rgb(var(--ui-primary))] !text-gray-1 !active-bg-[rgb(var(--ui-primary))] !hover-bg-[rgb(var(--ui-primary)/.75)]"
        :class="{
          // 'py-3': userStore.getLanguage() === 'en',
          loading: isFormSubmit,
        }"
      >
        <ma-svg-icon name="formkit:submit" /> {{ t('loginForm.loginButton') }}
      </m-button>
    </div>
  </form>

  <!-- 已绑定 TOTP 的第二步验证：challenge 由密码登录接口下发，5 分钟内有效 -->
  <el-dialog
    v-model="totpVisible"
    width="420px"
    align-center
    :show-close="false"
    :close-on-click-modal="false"
    class="totp-verify-dialog"
    @opened="focusTotpInput"
    @closed="closeTotp"
  >
    <template #header>
      <div class="totp-verify__header">
        <div class="totp-verify__icon">
          <ma-svg-icon name="material-symbols:shield-lock-outline-rounded" :size="22" />
        </div>
        <div class="totp-verify__heading">
          <h3>{{ t('loginForm.totpVerifyTitle') }}</h3>
          <p>{{ t('loginForm.totpVerifyDesc') }}</p>
        </div>
      </div>
    </template>

    <div class="totp-verify">
      <div class="totp-verify__row">
        <el-input
          ref="totpInputRef"
          v-model="totpCode"
          class="totp-verify__input"
          maxlength="6"
          inputmode="numeric"
          autocomplete="one-time-code"
          :placeholder="t('loginForm.totpCodeHint')"
          @input="onTotpInput"
          @keyup.enter="submitTotp"
        />
        <el-button
          type="primary"
          class="totp-verify__submit"
          :loading="isFormSubmit"
          @click="submitTotp"
        >
          {{ t('loginForm.totpSubmitButton') }}
        </el-button>
      </div>
      <p v-if="totpErrorText" class="totp-verify__error">
        {{ totpErrorText }}
      </p>
      <el-button link class="totp-verify__cancel" @click="closeTotp">
        {{ t('loginForm.totpCancel') }}
      </el-button>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.loading {
  @apply cursor-wait;

  background-color: rgb(var(--ui-primary) / 45%) !important;
}

.totp-verify__header {
  @apply flex items-center gap-3;
}

.totp-verify__icon {
  @apply h-12 w-12 flex flex-none items-center justify-center rounded-full;

  background: rgb(var(--ui-primary) / 10%);
  color: rgb(var(--ui-primary));
}

.totp-verify__heading {
  @apply min-w-0;

  h3 {
    @apply m-0 text-base font-600 text-gray-9 dark:text-gray-1;
  }

  p {
    @apply m-0 mt-1 text-xs leading-relaxed text-gray-5;
  }
}

.totp-verify {
  @apply flex flex-col gap-3;
}

.totp-verify__row {
  @apply flex items-stretch gap-2.5;
}

.totp-verify__input {
  @apply min-w-0 flex-1;

  :deep(.el-input__wrapper) {
    @apply rounded-lg;
  }

  :deep(.el-input__inner) {
    text-align: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 18px;
    letter-spacing: 0.3em;
    text-indent: 0.3em;
  }

  :deep(.el-input__inner::placeholder) {
    font-family: inherit;
    font-size: 13px;
    letter-spacing: normal;
    text-indent: 0;
  }
}

.totp-verify__submit {
  @apply w-20 flex-none rounded-lg;
}

.totp-verify__error {
  @apply m-0 text-center text-xs text-red-5;
}

.totp-verify__cancel {
  @apply self-center text-xs text-gray-5;

  margin-top: 4px;
}
:global(.totp-hint-box) {
  width: 420px;
  max-width: 92vw;
  padding-bottom: 0;
  border-radius: 16px;
}

:global(.totp-hint-box .el-message-box__header) {
  padding: 22px 24px 0;
  text-align: center;
}

:global(.totp-hint-box .el-message-box__title) {
  color: var(--el-text-color-primary);
  font-size: 17px;
  font-weight: 700;
  text-align: center;
}

:global(.totp-hint-box .el-message-box__content) {
  display: block;
  padding: 20px 24px 4px;
}

:global(.totp-hint-box .el-message-box__message) {
  display: block;
  width: 100%;
  padding-left: 0;
  color: var(--el-text-color-regular);
  text-align: center;
}

:global(.totp-hint-box .el-message-box__message p) {
  display: block;
  width: 100%;
  margin: 0;
}

:global(.totp-hint-box .el-message-box__btns) {
  display: flex;
  justify-content: center;
  padding: 16px 24px 22px;
}

:global(.totp-hint-box .el-button--primary) {
  height: 34px;
  padding: 0 18px;
  border-color: #f56c6c;
  border-radius: 8px;
  background: #f56c6c;
  font-size: 13px;
  font-weight: 600;
}

:global(.totp-hint-box .el-button--primary:hover),
:global(.totp-hint-box .el-button--primary:focus) {
  border-color: #f78989;
  background: #f78989;
}

:global(.totp-tip) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: center;
}

:global(.totp-tip__icon) {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fef0f0, #fde2e2);
  color: #f56c6c;
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
}

:global(.totp-tip__icon svg) {
  width: 24px;
  height: 24px;
}

:global(.totp-tip__desc) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: center;
}

:global(.totp-tip__line) {
  width: 100%;
  color: #f56c6c;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.6;
  text-align: center;
}

:global(.totp-tip__path) {
  width: 100%;
  color: rgb(var(--ui-primary));
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

:global(.totp-tip__path:hover) {
  color: rgb(var(--ui-primary) / 80%);
  text-decoration: underline;
}
</style>
