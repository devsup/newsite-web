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
  profile: Profile
  setting: Account setting
  changeAvatar: Change avatar
  removeAvatar: Remove avatar
  changeProfileOrPassword: Modify profile or password
  explain: Explain
  action: Action
  whetherReceiveMsg: Whether receive message
  whetherMultiDeviceLogin: Whether multi-device login
  userinfo:
    nickname: Nick name
    username: Account
    avatar: Avatar
    signed: Signed
    email: Email
    phone: Phone
    loginIp: Login ip
    loginTime: Login Datetime
  totp:
    label: Two-factor authentication
    enabled: Enabled
    disabled: Not enabled
    enable: Enable
    disable: Disable
    setupTitle: Bind authenticator
    setupDesc: Scan the QR code with Google / Microsoft Authenticator
    secretTip: Enter this key manually if you cannot scan
    copy: Copy
    copied: Secret copied
    copiedShort: Copied
    copyFailed: Copy failed
    codeHint: Enter the code (up to 6 digits)
    confirm: Confirm
    enableSuccess: Two-factor authentication enabled
    disableConfirm: After disabling, the next login will not ask for a code. Continue?
    disableSuccess: Two-factor authentication disabled
    loadFailed: Failed to load TOTP settings
zh_CN:
  profile: 个人资料
  setting: 账号设置
  changeAvatar: 修改头像
  removeAvatar: 移除头像
  changeProfileOrPassword: 修改个人信息或密码
  explain: 说明
  action: 动作
  whetherReceiveMsg: 是否接收消息
  whetherMultiDeviceLogin: 是否多设备登录
  userinfo:
    nickname: 昵称
    username: 账号
    avatar: 头像
    signed: 个人签名
    email: 邮箱
    phone: 手机
    loginIp: 登录IP
    loginTime: 登录时间
  totp:
    label: 双因素认证
    enabled: 已启用
    disabled: 未启用
    enable: 启用
    disable: 关闭
    setupTitle: 绑定身份验证器
    setupDesc: 使用 Google / Microsoft Authenticator 等 App 扫描下方二维码
    secretTip: 无法扫码时手动输入密钥
    copy: 复制
    copied: 已复制密钥
    copiedShort: 已复制
    copyFailed: 复制失败
    codeHint: 请输入动态验证码（最多 6 位）
    confirm: 确认启用
    enableSuccess: 双因素认证已启用
    disableConfirm: 关闭后下次登录不再要求动态验证码，确定关闭吗？
    disableSuccess: 双因素认证已关闭
    loadFailed: 获取绑定信息失败
zh_TW:
  profile: 個人資料
  setting: 賬號設置
  changeAvatar: 修改頭像
  removeAvatar: 移除頭像
  changeProfileOrPassword: 修改個人資料或密碼
  explain: 説明
  action: 動作
  whetherReceiveMsg: 是否接受消息
  whetherMultiDeviceLogin: 是否多設備登錄
  userinfo:
    nickname: 昵稱
    username: 賬號
    avatar: 頭像
    signed: 個人簽名
    email: 郵箱
    phone: 手機
    loginIp: 登錄IP
    loginTime: 登錄時間
  totp:
    label: 雙因素認證
    enabled: 已啟用
    disabled: 未啟用
    enable: 啟用
    disable: 關閉
    setupTitle: 綁定身份驗證器
    setupDesc: 使用 Google / Microsoft Authenticator 等 App 掃描下方二維碼
    secretTip: 無法掃碼時手動輸入密鑰
    copy: 複製
    copied: 已複製密鑰
    copiedShort: 已複製
    copyFailed: 複製失敗
    codeHint: 請輸入動態驗證碼（最多 6 位）
    confirm: 確認啟用
    enableSuccess: 雙因素認證已啟用
    disableConfirm: 關閉後下次登入不再要求動態驗證碼，確定關閉嗎？
    disableSuccess: 雙因素認證已關閉
    loadFailed: 獲取綁定資訊失敗
</i18n>

<script setup lang="ts">
import UcContainer from './components/container.vue'
import UcModifyInfo from './components/modify-info.vue'
import UcTitle from './components/title.vue'
import QRCode from 'qrcode'
import { useMessage } from '@/hooks/useMessage.ts'

const modalRef = ref()
const route = useRoute()
const selected = ref(route.query.tab === 'setting' ? 'setting' : 'profile')
const userStore = useUserStore()
const { globalTrans, localTrans: t } = useTrans()
const tabOptions = reactive([
  { label: t('profile'), value: 'profile' },
  { label: t('setting'), value: 'setting' },
])

// 从登录提示的「个人中心 → 账号设置 → 双因素认证」直接跳过来时，切换到账号设置 tab
watch(() => route.query.tab, (tab) => {
  if (tab === 'profile' || tab === 'setting') {
    selected.value = tab
  }
})

const msg = useMessage()

/** 双因素认证：以是否绑定 totp_secret 判断，后端返回计算后的 totp_enabled */
const totpDialog = ref(false)
const totpChallenge = ref('')
const totpSecret = ref('')
const totpQr = ref('')
const totpCode = ref('')
const totpLoading = ref(false)
const totpCopied = ref(false)
let totpCopiedTimer: ReturnType<typeof setTimeout> | undefined
const totpEnabled = computed(() => !!userStore.getUserInfo()?.totp_enabled)

// 动态码只允许数字，最多 6 位（粘贴/输入法都可能带非数字）
watch(totpCode, (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 6)
  if (value !== digits) {
    totpCode.value = digits
  }
})

/** 生成新的 secret + 二维码；确认动态码后才真正落库 */
async function openTotpSetup(): Promise<void> {
  try {
    const data = await userStore.setupTotp()
    totpChallenge.value = data.challenge
    totpSecret.value = data.secret
    totpCode.value = ''
    totpQr.value = await QRCode.toDataURL(data.otpauth_uri, {
      width: 220,
      margin: 1,
      color: { dark: '#1f2937', light: '#ffffff' },
    })
    totpDialog.value = true
  }
  catch (error: any) {
    msg.error(error?.message ?? t('totp.loadFailed'))
  }
}

async function submitTotp(): Promise<void> {
  if (!/^\d{6}$/.test(totpCode.value)) {
    msg.warning(t('totp.codeHint'))
    return
  }

  totpLoading.value = true
  try {
    await userStore.enableTotp(totpChallenge.value, totpCode.value)
    const user = userStore.getUserInfo()
    if (user) {
      user.totp_enabled = true
    }
    msg.success(t('totp.enableSuccess'))
    totpDialog.value = false
  }
  catch (error: any) {
    msg.error(error?.message ?? t('totp.loadFailed'))
  }
  finally {
    totpLoading.value = false
  }
}

async function disableTotp(): Promise<void> {
  try {
    await msg.confirm(t('totp.disableConfirm'))
  }
  catch {
    return
  }

  try {
    await userStore.disableTotp()
    const user = userStore.getUserInfo()
    if (user) {
      user.totp_enabled = false
    }
    msg.success(t('totp.disableSuccess'))
  }
  catch (error: any) {
    msg.error(error?.message ?? t('totp.loadFailed'))
  }
}

async function copyTotpSecret(): Promise<void> {
  try {
    await navigator.clipboard.writeText(totpSecret.value)
    // 弹窗里的局部「已复制」状态，避免全局 toast 被弹窗层级盖住
    totpCopied.value = true
    if (totpCopiedTimer) {
      clearTimeout(totpCopiedTimer)
    }
    totpCopiedTimer = setTimeout(() => {
      totpCopied.value = false
    }, 1800)
  }
  catch {
    msg.error(t('totp.copyFailed'))
  }
}

function resetTotpDialog(): void {
  totpChallenge.value = ''
  totpSecret.value = ''
  totpQr.value = ''
  totpCode.value = ''
  totpCopied.value = false
  if (totpCopiedTimer) {
    clearTimeout(totpCopiedTimer)
    totpCopiedTimer = undefined
  }
}

const displayUserInfo = computed(() => userStore.getUserInfo() ?? {})
const avatar = ref<string>(userStore.getUserInfo()?.avatar ?? '')

const showFields = reactive({
  nickname: t('userinfo.nickname'),
  username: t('userinfo.username'),
  signed: t('userinfo.signed'),
  email: t('userinfo.email'),
  phone: t('userinfo.phone'),
  login_ip: t('userinfo.loginIp'),
  login_time: t('userinfo.loginTime'),
})

watch(avatar, async (val: string | undefined) => {
  const response: any = await useHttp().post('/admin/permission/update', { avatar: val ?? '' })
  if (response.code === 200) {
    msg.success(globalTrans('crud.updateSuccess'))
    const userInfo = userStore.getUserInfo()
    if (userInfo) {
      userInfo.avatar = val ?? ''
    }
  }
})
</script>

<template>
  <UcContainer>
    <UcTitle>
      <template #extra>
        <m-button class="h-8" @click="() => modalRef.openModal() ">
          {{ t('changeProfileOrPassword') }}
        </m-button>
      </template>
    </UcTitle>
    <div class="mine-uc-layout-content">
      <div class="w-full">
        <m-tabs
          v-model="selected"
          class="text-sm lg:w-6/12"
          :options="tabOptions"
        />
        <ul v-if="selected === 'profile'" class="info-list">
          <li class="!b-none">
            <div class="desc-item">
              <div class="desc-label">
                {{ t('userinfo.avatar') }}
              </div>
              <div class="desc-value">
                <ma-upload-image v-model="avatar" />
              </div>
            </div>
          </li>
          <template v-for="(value, key) in displayUserInfo">
            <li v-if="showFields[key]">
              <div class="desc-item">
                <div class="desc-label">
                  {{ showFields[key] }}
                </div>
                <div class="desc-value">
                  {{ value ?? '-' }}
                </div>
              </div>
            </li>
          </template>
        </ul>

        <ul v-if="selected === 'setting'" class="info-list b-1 b-gray-2 rounded b-solid dark-b-dark-4">
          <li class="bg-gray-1 !b-none dark-bg-dark-5">
            <div class="desc-item">
              <div class="desc-label font-bold">
                {{ t('explain') }}
              </div>
              <div class="desc-value font-bold">
                {{ t('action') }}
              </div>
            </div>
          </li>
          <li>
            <div class="desc-item">
              <div class="desc-label">
                {{ t('totp.label') }}
              </div>
              <div class="desc-value flex flex-wrap items-center gap-2">
                <el-tag :type="totpEnabled ? 'success' : 'info'" size="small">
                  {{ totpEnabled ? t('totp.enabled') : t('totp.disabled') }}
                </el-tag>
                <el-button v-if="!totpEnabled" size="small" type="primary" @click="openTotpSetup">
                  {{ t('totp.enable') }}
                </el-button>
                <el-button v-else size="small" type="danger" plain @click="disableTotp">
                  {{ t('totp.disable') }}
                </el-button>
              </div>
            </div>
          </li>
          <li>
            <div class="desc-item">
              <div class="desc-label">
                {{ t('whetherReceiveMsg') }}
              </div>
              <div class="desc-value">
                <!--                <m-switch v-model="form.isReceiveMsg" /> -->
              </div>
            </div>
          </li>
          <li>
            <div class="desc-item">
              <div class="desc-label">
                {{ t('whetherMultiDeviceLogin') }}
              </div>
              <div class="desc-value">
                <!--                <m-switch v-model="form.multiDeviceLogin" /> -->
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <UcModifyInfo ref="modalRef" />

    <!-- 绑定 TOTP：后端生成 secret，前端只负责展示二维码/密钥并回传动态码确认 -->
    <m-modal
      v-model="totpDialog"
      :title="t('totp.setupTitle')"
      content-class="w-[420px] totp-setup-modal"
      :close-on-click-modal="false"
      @close="resetTotpDialog"
    >
      <div class="totp-setup">
        <p class="totp-setup__desc">
          {{ t('totp.setupDesc') }}
        </p>
        <div class="totp-setup__qr">
          <img v-if="totpQr" :src="totpQr" alt="TOTP QR">
        </div>
        <div class="totp-setup__secret">
          <span class="totp-setup__secret-tip">
            <ma-svg-icon name="material-symbols:key-outline" :size="14" />
            {{ t('totp.secretTip') }}
          </span>
          <div class="totp-setup__secret-line">
            <code
              class="totp-setup__secret-key"
              :title="t('totp.copy')"
              @click="copyTotpSecret"
            >{{ totpSecret }}</code>
            <span
              class="totp-setup__copy"
              :class="{ 'is-copied': totpCopied }"
              @click="copyTotpSecret"
            >
              <ma-svg-icon
                :name="totpCopied ? 'material-symbols:check-rounded' : 'material-symbols:content-copy-outline'"
                :size="14"
              />
              {{ totpCopied ? t('totp.copiedShort') : t('totp.copy') }}
            </span>
          </div>
        </div>
        <div class="totp-setup__row">
          <div class="totp-setup__input">
            <m-input
              v-model="totpCode"
              class="w-full"
              maxlength="6"
              inputmode="numeric"
              autocomplete="one-time-code"
              :placeholder="t('totp.codeHint')"
            />
          </div>
          <m-button
            class="totp-setup__submit"
            :loading="totpLoading"
            @click="submitTotp"
          >
            {{ t('totp.confirm') }}
          </m-button>
        </div>
      </div>
    </m-modal>
  </UcContainer>
</template>

<style scoped lang="scss">
.info-list {
  @apply w-full mt-3;

  & li {
    @apply b-t-1 b-t-gray-2 b-t-solid pr-2.5 dark-b-t-dark-4 py-4 text-sm hover-bg-gray-50 dark-hover-bg-dark-5;

    .desc-item {
      @apply w-full lg:w-6/12 flex items-center justify-between text-stone-8 dark-text-stone-3;

      .desc-label {
        @apply w-6/12 lg:w-5/12 pl-2 lg:pl-3 truncate;
      }

      .desc-value {
        @apply w-6/12 lg:w-7/12 text-left truncate;
      }
    }
  }
}

.totp-setup {
  @apply flex flex-col gap-3;
}

/* 点击复制/密钥时浏览器可能给弹窗容器或可点击元素加焦点黑框，这里统一去掉 */
:global(.totp-setup-modal) {
  -webkit-tap-highlight-color: transparent;
}

:global(.totp-setup-modal:focus),
:global(.totp-setup-modal:focus-visible),
:global(.totp-setup__copy:focus),
:global(.totp-setup__copy:focus-visible),
:global(.totp-setup__secret-key:focus),
:global(.totp-setup__secret-key:focus-visible) {
  outline: none !important;
}

:global(.totp-setup__copy),
:global(.totp-setup__secret-key) {
  outline: none !important;
  -webkit-tap-highlight-color: transparent;
}

.totp-setup__row {
  @apply flex items-stretch gap-2.5;

  margin-top: 8px;
}

.totp-setup__input {
  @apply min-w-0 flex-1;

  :deep(input) {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    font-size: 12px;
    line-height: 32px;
  }
}

.totp-setup__submit {
  @apply flex-none;

  width: 80px;
  height: 32px;
  padding: 0;
  font-size: 12px;
  border-radius: 6px;
}

.totp-setup__desc {
  @apply m-0 text-xs leading-relaxed text-gray-5;
}

.totp-setup__qr {
  @apply self-center rounded-xl bg-white p-2 ring-1 ring-gray-2;

  img {
    @apply block h-55 w-55;
  }
}

.totp-setup__secret {
  @apply flex flex-col gap-1.5 text-xs text-gray-5;
}

.totp-setup__secret-tip {
  @apply inline-flex items-center gap-1 text-xs font-500;

  color: rgb(var(--ui-primary));
}

.totp-setup__secret-line {
  @apply flex items-center gap-2;
}

.totp-setup__secret-line code {
  @apply min-w-0 flex-1 cursor-pointer overflow-x-auto whitespace-nowrap rounded bg-gray-1 px-2 py-1 text-gray-8;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  scrollbar-width: none;
  transition: background 0.2s ease;

  &:hover {
    background: rgb(var(--ui-primary) / 8%);
  }
}

.totp-setup__copy {
  @apply inline-flex flex-none cursor-pointer items-center gap-1 whitespace-nowrap text-xs font-500;

  padding: 3px 8px;
  border-radius: 6px;
  background: rgb(var(--ui-primary) / 10%);
  color: rgb(var(--ui-primary));
  transition: background 0.2s ease;

  &:hover {
    background: rgb(var(--ui-primary) / 18%);
  }

  &.is-copied {
    background: rgb(103 194 58 / 12%);
    color: #67c23a;
  }
}
</style>
