<!--
 - MineAdmin is committed to providing solutions for quickly building web applications
 - Please view the LICENSE file that was distributed with this source code,
 - For the full copyright and license information.
 - Thank you very much for using MineAdmin.
 -
 - @Author X.Mo<root@imoi.cn>
 - @Link   https://github.com/mineadmin
-->
<script setup lang="tsx">
import type { BaoTaDomainVo } from '~/setting/api/baota.ts'

import { domainList, sslApply, sslCertificate, sslClose, sslDeploy, sslForceHttps, sslInfo, sslRenew } from '~/setting/api/baota.ts'
import MaJsonViewer from '@/components/ma-json-viewer/index.vue'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'setting:baota:sslConfig' })

const props = defineProps<{
  /** 所属 API 配置 ID */
  configId?: number
  /** 面板里的站点 ID */
  siteId: number
  /** 站点名（面板查证书、部署证书都按站点名定位） */
  webname: string
}>()

const emit = defineEmits<{
  changed: []
}>()

const t = useTrans().globalTrans
const msg = useMessage()

const loading = ref(false)
const actionLoading = ref(false)
const applyLoading = ref(false)

// 面板 GetSSL 的状态响应（后端已剔除私钥与证书全文，只用于展示）
const sslData = ref<Record<string, any>>({})

// 手动部署证书用：打开弹窗时会自动载入当前证书内容（见 loadCertificate）
const certKey = ref('')
const certPem = ref('')

// 申请证书用：站点已绑定的域名
const domainOptions = ref<{ label: string, value: string }[]>([])
const selectedDomain = ref('')

/**
 * 是否为 IP 地址。
 *
 * 面板允许为 IP 申请证书，只是签发的是**自签名证书**（非 Let's Encrypt、有效期通常只有几天）。
 * 这里只用于在界面上如实提示，**不做任何拦截**——申请目标由使用者决定。
 */
function isIpAddress(value: string): boolean {
  if (!value) {
    return false
  }
  // IPv4 / IPv6（面板里 IPv6 通常不带方括号）
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) || value.includes(':')
}

/** 当前申请目标是否为 IP（仅用于切换提示文案） */
const isIpSelected = computed<boolean>(() => isIpAddress(selectedDomain.value))

/** 证书剩余天数（面板 cert_data.endtime 即为剩余天数） */
const remainingDays = computed<number | null>(() => {
  const value = sslData.value?.cert_data?.endtime
  return value === undefined || value === null || value === '' ? null : Number(value)
})

/**
 * 剩余天数对应的语义色：≤15 天红（临期）、≤30 天橙（提醒）、其余绿。
 * 同时用于「剩余天数」数字的配色与临期告警条。
 */
const remainingType = computed<'success' | 'warning' | 'danger' | 'info'>(() => {
  const days = remainingDays.value
  if (days === null) {
    return 'info'
  }
  return days <= 15 ? 'danger' : (days <= 30 ? 'warning' : 'success')
})

/** 是否处于临期（用于顶部告警条） */
const isExpiringSoon = computed<boolean>(() => remainingDays.value !== null && remainingDays.value <= 15)

/** 拉取 SSL 状态与证书信息（不含私钥，只用于展示） */
async function refreshSsl(): Promise<void> {
  if (!props.webname) {
    return
  }

  loading.value = true
  try {
    const res = await sslInfo({ config_id: props.configId, site_name: props.webname })
    if (res.code === ResultCode.SUCCESS) {
      sslData.value = res.data || {}
    }
    else {
      msg.error(res.message)
    }
  }
  finally {
    loading.value = false
  }
}

/**
 * 载入当前证书内容到编辑表单。
 *
 * 走独立接口取私钥与证书全文（状态接口刻意不返回私钥）：这样「看一眼状态」不会碰到私钥，
 * 只有真的打开证书表单时才取一次。域名没部署证书时面板返回空串，表单保持空白。
 */
async function loadCertificate(): Promise<void> {
  if (!props.webname) {
    return
  }

  const res = await sslCertificate({ config_id: props.configId, site_name: props.webname })
  if (res.code === ResultCode.SUCCESS) {
    certKey.value = res.data?.key || ''
    certPem.value = res.data?.csr || ''
  }
}

/** 拉取站点域名，供「申请证书」选择要签发的域名 */
async function loadDomains(): Promise<void> {
  if (!props.siteId) {
    return
  }

  const res = await domainList({ config_id: props.configId, site_id: props.siteId })
  if (res.code !== ResultCode.SUCCESS) {
    return
  }

  domainOptions.value = (res.data || []).map((item: BaoTaDomainVo) => ({
    label: item.name || '',
    value: item.name || '',
  }))

  if (!domainOptions.value.some((item: { value: string }) => item.value === selectedDomain.value)) {
    selectedDomain.value = domainOptions.value[0]?.value || ''
  }
}

/** 刷新状态、域名与证书内容（三者互不依赖，并行请求） */
async function refreshAll(): Promise<void> {
  await Promise.all([refreshSsl(), loadDomains(), loadCertificate()])
}

/**
 * 一键申请并部署 Let's Encrypt 证书。
 *
 * 需要域名已经解析到该服务器，面板侧要走 ACME 校验，失败时会把面板的错误原样提示出来。
 */
async function doApplyAndDeploy(): Promise<void> {
  if (!selectedDomain.value) {
    msg.error(t('baota.applyDomainRequired'))
    return
  }

  msg.confirm(t('baota.applyAndDeployConfirm', { domain: selectedDomain.value })).then(async () => {
    applyLoading.value = true
    try {
      const res = await sslApply({
        config_id: props.configId,
        site_name: selectedDomain.value,
        webname: props.webname,
        site_id: props.siteId,
      })
      if (res.code === ResultCode.SUCCESS) {
        msg.success(t('crud.updateSuccess'))
        await refreshAll()
        emit('changed')
      }
      else {
        msg.error(res.message)
      }
    }
    finally {
      applyLoading.value = false
    }
  })
}

/** 开启 / 关闭强制 HTTPS */
async function doForceHttps(enable: boolean): Promise<void> {
  actionLoading.value = true
  try {
    const res = await sslForceHttps({
      config_id: props.configId,
      site_name: props.webname,
      enable,
    })
    if (res.code === ResultCode.SUCCESS) {
      // 面板会返回自己的提示文案（如「设置成功」），优先展示它
      msg.success((res.data?.msg as string) || t('crud.updateSuccess'))
      await refreshSsl()
      emit('changed')
    }
    else {
      msg.error(res.message)
    }
  }
  finally {
    actionLoading.value = false
  }
}

/** 续签当前域名的证书（面板按证书索引续签，索引由后端查询得到） */
async function doRenew(): Promise<void> {
  msg.confirm(t('baota.renewSslConfirm')).then(async () => {
    actionLoading.value = true
    try {
      const res = await sslRenew({ config_id: props.configId, site_name: props.webname })
      if (res.code === ResultCode.SUCCESS) {
        msg.success((res.data?.msg as string) || t('crud.updateSuccess'))
        await refreshSsl()
        emit('changed')
      }
      else {
        msg.error(res.message)
      }
    }
    finally {
      actionLoading.value = false
    }
  })
}

/** 关闭 SSL（同时移除强制 HTTPS） */
async function doCloseSsl(): Promise<void> {
  msg.confirm(t('baota.closeSslConfirm')).then(async () => {
    actionLoading.value = true
    try {
      const res = await sslClose({ config_id: props.configId, site_name: props.webname })
      if (res.code === ResultCode.SUCCESS) {
        msg.success((res.data?.msg as string) || t('crud.updateSuccess'))
        await refreshAll()
        emit('changed')
      }
      else {
        msg.error(res.message)
      }
    }
    finally {
      actionLoading.value = false
    }
  })
}

/** 部署手动粘贴（或直接修改后）的证书：私钥 + 证书链 */
async function doSetSsl(): Promise<void> {
  if (!certKey.value.trim() || !certPem.value.trim()) {
    msg.error(t('baota.sslKeyPemRequired'))
    return
  }

  actionLoading.value = true
  try {
    const res = await sslDeploy({
      config_id: props.configId,
      site_name: props.webname,
      key_file: certKey.value,
      pem_file: certPem.value,
    })
    if (res.code === ResultCode.SUCCESS) {
      msg.success(t('crud.updateSuccess'))
      await refreshAll()
      emit('changed')
    }
    else {
      msg.error(res.message)
    }
  }
  finally {
    actionLoading.value = false
  }
}

onMounted(refreshAll)
</script>

<template>
  <div v-loading="loading || actionLoading" class="ssl-config">
    <!-- 原始响应：与其它卡片一样带边框，放在最前面，不必滚动到底部才能展开 -->
    <el-card class="ssl-raw mb-3" shadow="never">
      <el-collapse>
        <el-collapse-item name="raw">
          <!-- 提示与标题同一行：不展开也能看到「已经隐藏了私钥与证书」 -->
          <template #title>
            <div class="flex items-center gap-2">
              <span>{{ t('baota.rawResponse') }}</span>
              <span class="text-xs text-[var(--el-text-color-secondary)]">
                {{ t('baota.rawResponseTip') }}
              </span>
            </div>
          </template>
          <MaJsonViewer :data="sslData" :default-expand-depth="2" />
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 证书状态 -->
    <el-card class="mb-3" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">{{ t('baota.sslCert') }}</span>
          <el-button size="small" plain @click="refreshAll">
            {{ t('baota.refreshSsl') }}
          </el-button>
        </div>
      </template>

      <!-- 临期告警：只在剩余 ≤15 天时出现，避免平时占地方 -->
      <el-alert
        v-if="isExpiringSoon"
        class="mb-3"
        type="warning"
        show-icon
        :closable="false"
        :title="t('baota.sslExpiringTip', { day: remainingDays })"
      />

      <div class="ssl-head">
        <el-tag :type="sslData.status ? 'success' : 'info'" size="large" effect="light">
          {{ sslData.status ? t('baota.sslEnabled') : t('baota.sslDisabled') }}
        </el-tag>

        <div class="ssl-head__days">
          <span class="ssl-head__label">{{ t('baota.sslRemainingDays') }}</span>
          <span class="ssl-head__value" :class="`is-${remainingType}`">
            {{ remainingDays === null ? '-' : remainingDays }}
          </span>
          <span v-if="remainingDays !== null" class="ssl-head__unit">{{ t('baota.dayUnit') }}</span>
        </div>

        <el-tag :type="sslData.httpTohttps ? 'success' : 'danger'" effect="light">
          {{ t('baota.forceHttps') }}：{{ sslData.httpTohttps ? t('baota.sslEnabled') : t('baota.sslDisabled') }}
        </el-tag>
      </div>

      <el-descriptions class="mt-3" :column="2" border>
        <el-descriptions-item :label="t('baota.sslSubject')">
          {{ sslData.cert_data?.subject || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('baota.sslIssuer')">
          {{ sslData.cert_data?.issuer_O || '-' }}
          <span v-if="sslData.cert_data?.issuer" class="text-[var(--el-text-color-secondary)]">
            （{{ sslData.cert_data.issuer }}）
          </span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('baota.sslValidPeriod')">
          {{ sslData.cert_data?.notBefore || '-' }} ~ {{ sslData.cert_data?.notAfter || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('baota.sslAuthType')">
          {{ sslData.auth_type || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!--
      证书操作：按用途分成三行，左侧「图标 + 分组名」定宽、右侧控件，行间细线分隔。
      按钮按业务语义配色：申请部署=主色实心（主操作）、开启强制HTTPS=蓝色描边（启用）、
      关闭强制HTTPS=橙色描边（可逆的停用）、续签=绿色描边（续期）、关闭SSL=红色描边（销毁性操作）。
    -->
    <el-card class="mb-3" shadow="never">
      <template #header>
        <span class="font-medium">{{ t('baota.sslActions') }}</span>
      </template>

      <div class="ssl-action">
        <span class="ssl-action__label">
          <ma-svg-icon name="material-symbols:settings-outline" :size="16" />
          {{ t('baota.maintainGroup') }}
        </span>
        <div class="ssl-action__body">
          <el-button v-auth="['baota:sslSave']" type="success" plain @click="doRenew">
            {{ t('baota.renewSsl') }}
          </el-button>
          <el-button v-auth="['baota:sslSave']" type="danger" plain @click="doCloseSsl">
            {{ t('baota.closeSsl') }}
          </el-button>
        </div>
      </div>
      <div class="ssl-action">
        <span class="ssl-action__label">
          <ma-svg-icon name="material-symbols:lock-outline" :size="16" />
          {{ t('baota.httpsGroup') }}
        </span>
        <div class="ssl-action__body">
          <el-button v-auth="['baota:sslSave']" type="primary" plain @click="doForceHttps(true)">
            {{ t('baota.forceHttpsOn') }}
          </el-button>
          <el-button v-auth="['baota:sslSave']" type="warning" plain @click="doForceHttps(false)">
            {{ t('baota.forceHttpsOff') }}
          </el-button>
        </div>
      </div>
      <div class="ssl-action">
        <span class="ssl-action__label">
          <ma-svg-icon name="material-symbols:add-circle-outline" :size="16" />
          {{ t('baota.applyGroup') }}
        </span>
        <div class="ssl-action__body">
          <el-select
            v-model="selectedDomain"
            class="w-64"
            filterable
            :placeholder="t('baota.selectApplyDomain')"
          >
            <el-option
              v-for="item in domainOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button
            v-auth="['baota:sslSave']"
            type="primary"
            :loading="applyLoading"
            :disabled="!selectedDomain"
            @click="doApplyAndDeploy"
          >
            {{ t('baota.applyAndDeploy') }}
          </el-button>
          <span class="ssl-action__hint">
            {{ isIpSelected ? t('baota.applyHintIp') : t('baota.applyHint') }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 手动部署证书：打开弹窗时已自动载入当前证书，可直接改后再部署 -->
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">{{ t('baota.setSsl') }}</span>
          <span v-if="certKey && certPem" class="text-xs text-[var(--el-text-color-secondary)]">
            {{ t('baota.sslLoadedTip') }}
          </span>
        </div>
      </template>

      <el-form label-width="100px">
        <el-form-item :label="t('baota.sslKey')">
          <el-input
            v-model="certKey"
            type="textarea"
            :rows="6"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('baota.sslKeyPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('baota.sslPem')">
          <el-input
            v-model="certPem"
            type="textarea"
            :rows="6"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('baota.sslPemPlaceholder')"
          />
        </el-form-item>

        <!-- 提交按钮靠右，与「添加域名」卡片保持一致 -->
        <div class="flex justify-end">
          <el-button v-auth="['baota:sslSave']" type="primary" @click="doSetSsl">
            {{ t('baota.setSslSubmit') }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.ssl-config {
  // 弹窗内固定高度 + 内部滚动，长证书内容不会把弹窗越撑越高
  max-height: 68vh;
  padding-right: 4px;
  overflow-y: auto;

  // 折叠面板由外层卡片提供边框，去掉它自带的上下边框，避免出现「双线」
  :deep(.el-collapse) {
    border-top: none;
    border-bottom: none;
  }
}

// 原始响应卡片：卡片体只承载折叠标题，上下留白收窄，别让一条标题占掉太多高度
.ssl-raw {
  :deep(.el-card__body) {
    padding: 0 16px;
  }

  :deep(.el-collapse-item__header) {
    height: 40px;
    line-height: 40px;
  }

  :deep(.el-collapse-item__content) {
    padding-bottom: 12px;
  }
}

// 三行操作：左侧「图标 + 分组名」定宽，右侧控件，行间用细线分隔
.ssl-action {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 14px 0;

  & + & {
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__label {
    display: flex;
    flex: none;
    gap: 6px;
    align-items: center;
    width: 116px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  &__body {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  &__hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.ssl-head {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;

  &__days {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  &__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__value {
    font-size: 22px;
    font-weight: 600;
    line-height: 1;

    &.is-success {
      color: var(--el-color-success);
    }

    &.is-warning {
      color: var(--el-color-warning);
    }

    &.is-danger {
      color: var(--el-color-danger);
    }

    &.is-info {
      color: var(--el-text-color-secondary);
    }
  }

  &__unit {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
