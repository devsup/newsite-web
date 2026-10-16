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
import type { MaTableExpose } from '@mineadmin/table'
import type { BaoTaDomainVo } from '~/setting/api/baota.ts'

import { domainAdd, domainDelete, domainList } from '~/setting/api/baota.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import useTable from '@/hooks/useTable.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

defineOptions({ name: 'setting:baota:domainManager' })

const props = defineProps<{
  /** 所属 API 配置 ID */
  configId?: number
  /** 面板里的站点 ID */
  siteId: number
  /** 站点名（删除域名时面板需要它一起定位） */
  webname: string
}>()

const emit = defineEmits<{
  changed: []
}>()

const t = useTrans().globalTrans
const msg = useMessage()

// 模板 ref 名必须与这个变量同名，ma-table 才会被绑定上
const domainTable = ref<MaTableExpose>()
// useTable 是异步的，这里额外留一份实例兜底：刷新可能在它 resolve 之前被触发
let tableInstance: MaTableExpose | undefined

const loading = ref(false)
const domains = ref<BaoTaDomainVo[]>([])
const domainsInput = ref('')

/**
 * 拉取站点域名列表。
 *
 * 面板返回的域名里可能带端口，后端已把端口拆到 port 字段，
 * 这样删除时能直接拼出面板需要的 domain + port 参数。
 */
async function refresh(): Promise<void> {
  if (!props.siteId) {
    return
  }

  loading.value = true
  try {
    const res = await domainList({ config_id: props.configId, site_id: props.siteId })
    if (res.code === ResultCode.SUCCESS) {
      domains.value = res.data || []
      // setData 必须传新数组，传同一引用表格不会重新渲染
      ;(domainTable.value ?? tableInstance)?.setData([...domains.value])
    }
    else {
      msg.error(res.message)
    }
  }
  finally {
    loading.value = false
  }
}

/** 删除单个域名（需带上端口，否则面板定位不到该条记录） */
async function removeDomain(row: BaoTaDomainVo): Promise<void> {
  msg.delConfirm(t('crud.delDataMessage')).then(async () => {
    const res = await domainDelete({
      config_id: props.configId,
      site_id: props.siteId,
      webname: props.webname,
      domain: row.name,
      port: row.port,
    })
    if (res.code === ResultCode.SUCCESS) {
      msg.success(t('crud.delSuccess'))
      await refresh()
      emit('changed')
    }
    else {
      msg.error(res.message)
    }
  })
}

/** 批量添加域名：后端会把换行 / 逗号分隔的文本拆开并去重后一次提交给面板 */
async function addDomains(): Promise<void> {
  if (!domainsInput.value.trim()) {
    msg.error(t('baota.domainsEmpty'))
    return
  }

  const res = await domainAdd({
    config_id: props.configId,
    site_id: props.siteId,
    webname: props.webname,
    domains: domainsInput.value,
  })

  if (res.code === ResultCode.SUCCESS) {
    msg.success(t('crud.createSuccess'))
    domainsInput.value = ''
    await refresh()
    emit('changed')
  }
  else {
    msg.error(res.message)
  }
}

useTable('domainTable').then((table: MaTableExpose) => {
  tableInstance = table
  table.setColumns([
    { label: () => t('baota.siteId'), prop: 'pid', width: '90px' },
    { label: () => t('baota.domain'), prop: 'name', minWidth: '220px' },
    { label: () => t('baota.port'), prop: 'port', width: '90px' },
    { label: () => t('crud.createTime'), prop: 'addtime', width: '170px' },
    {
      label: () => t('crud.operation'),
      width: '100px',
      cellRender: ({ row }): any => (
        <el-button
          link
          type="danger"
          disabled={!hasAuth('baota:domainSave')}
          onClick={() => removeDomain(row)}
        >
          {t('crud.delete')}
        </el-button>
      ),
    },
  ])
  table.setData([...domains.value])
})

onMounted(refresh)
</script>

<template>
  <div class="domain-manager">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-xs text-[var(--el-text-color-secondary)]">
        {{ t('baota.domainTotal', { total: domains.length }) }}
      </span>
      <el-button type="primary" plain :loading="loading" @click="refresh">
        {{ t('baota.refreshDomains') }}
      </el-button>
    </div>

    <ma-table ref="domainTable" v-loading="loading" max-height="320" />

    <el-card class="mt-3" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>{{ t('baota.addDomains') }}</span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ t('baota.addDomainsTip') }}</span>
        </div>
      </template>

      <el-input
        v-model="domainsInput"
        type="textarea"
        :rows="4"
        :placeholder="t('baota.domainsPlaceholder')"
      />

      <div class="mt-2">
        <el-button
          v-auth="['baota:domainSave']"
          type="primary"
          @click="addDomains"
        >
          {{ t('baota.addDomainSubmit') }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.domain-manager {
  // 不给固定高度：表格限额滚动（max-height="320"），「添加域名」卡片自然跟在下方，
  // 弹窗高度由内容决定，避免卡片被挤到需要滚动才能看到的位置
  max-height: 70vh;
  overflow-y: auto;
}
</style>
