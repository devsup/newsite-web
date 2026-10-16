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

import { domainList, sslApply, sslClose, sslDeploy, sslForceHttps, sslInfo, sslRenew } from '~/setting/api/baota.ts'
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

// 面板 GetSSL 的响应体（后端已剔除私钥与证书全文）
const sslData = ref<Record<string, any>>({})

// 手动部署证书用
const certKey = ref('')
const certPem = ref('')

// 申请证书用：站点已绑定的域名
const domainOptions = ref<{ label: string, value: string }[]>([])
const selectedDomain = ref('')

/** 证书剩余天数（面板 cert_data.endtime 即为剩余天数） */
const remainingDays = computed<number | null>(() => {
  const value = sslData.value?.cert_data?.endtime
  return value === undefined || value === null || value === '' ? null : Number(value)
})

/** 剩余天数对应的展示颜色：≤15 天红、≤30 天橙，其余绿 */
const remainingType = computed<'primary' | 'success' | 'warning' | 'info' | 'danger'>(() => {
  const days = remainingDays.value
  if (days === null) {
    return 'info'
  }
  return days <= 15 ? 'danger' : (days <= 30 ? 'warning' : 'success')
})

/** 拉取 SSL 状态与证书信息 */
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

/** 刷新 SSL 信息与域名列表 */
async function refreshAll(): Promise<void> {
  await Promise.all([refreshSsl(), loadDomains()])
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
        await refreshSsl()
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

/** 部署手动粘贴的证书（私钥 + 证书链） */
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
      certKey.value = ''
      certPem.value = ''
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

onMounted(refreshAll)
</script>

<template>
  <div v-loading="loading || actionLoading" class="ssl-config">
    <el-card class="mb-3" shadow="never">
      <template #header>
        <div class="flex flex-wrap items-center gap-2">
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
            type="success"
            :loading="applyLoading"
            :disabled="!selectedDomain"
            @click="doApplyAndDeploy"
          >
            {{ t('baota.applyAndDeploy') }}
          </el-button>
          <el-button v-auth="['baota:sslSave']" type="primary" @click="doForceHttps(true)">
            {{ t('baota.forceHttpsOn') }}
          </el-button>
          <el-button v-auth="['baota:sslSave']" type="warning" @click="doForceHttps(false)">
            {{ t('baota.forceHttpsOff') }}
          </el-button>
          <el-button v-auth="['baota:sslSave']" type="info" @click="doRenew">
            {{ t('baota.renewSsl') }}
          </el-button>
          <el-button v-auth="['baota:sslSave']" type="danger" @click="doCloseSsl">
            {{ t('baota.closeSsl') }}
          </el-button>
          <el-button plain @click="refreshAll">
            {{ t('baota.refreshSsl') }}
          </el-button>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item :label="t('baota.sslStatus')">
          <el-tag :type="sslData.status ? 'success' : 'info'">
            {{ sslData.status ? t('baota.sslEnabled') : t('baota.sslDisabled') }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item :label="t('baota.sslIssuer')">
          {{ sslData.cert_data?.issuer_O || '-' }}（{{ sslData.cert_data?.issuer || '-' }}）
        </el-descriptions-item>

        <el-descriptions-item :label="t('baota.sslValidPeriod')">
          {{ sslData.cert_data?.notBefore || '-' }} ~ {{ sslData.cert_data?.notAfter || '-' }}
        </el-descriptions-item>

        <el-descriptions-item :label="t('baota.sslRemainingDays')">
          <el-tag v-if="remainingDays !== null" :type="remainingType">
            {{ t('baota.sslRemaining', { day: remainingDays }) }}
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>

        <el-descriptions-item :label="t('baota.sslSubject')">
          {{ sslData.cert_data?.subject || '-' }}
        </el-descriptions-item>

        <el-descriptions-item :label="t('baota.forceHttps')">
          <el-tag :type="sslData.httpTohttps ? 'success' : 'danger'">
            {{ sslData.httpTohttps ? t('baota.sslEnabled') : t('baota.sslDisabled') }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-collapse class="mt-3">
        <el-collapse-item :title="t('baota.rawResponse')" name="raw">
          <p class="mb-2 text-xs text-[var(--el-text-color-secondary)]">
            {{ t('baota.rawResponseTip') }}
          </p>
          <pre class="whitespace-pre-wrap text-xs">{{ JSON.stringify(sslData, null, 2) }}</pre>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card shadow="never">
      <template #header>
        {{ t('baota.setSsl') }}
      </template>

      <el-form label-width="100px">
        <el-form-item :label="t('baota.sslKey')">
          <el-input
            v-model="certKey"
            type="textarea"
            :rows="6"
            :placeholder="t('baota.sslKeyPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('baota.sslPem')">
          <el-input
            v-model="certPem"
            type="textarea"
            :rows="6"
            :placeholder="t('baota.sslPemPlaceholder')"
          />
        </el-form-item>

        <el-form-item>
          <el-button v-auth="['baota:sslSave']" type="primary" @click="doSetSsl">
            {{ t('baota.setSslSubmit') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.ssl-config {
  // 弹窗内固定高度 + 内部滚动，长证书内容不会把弹窗越撑越高
  height: 62vh;
  min-height: 420px;
  overflow-y: auto;
}
</style>
