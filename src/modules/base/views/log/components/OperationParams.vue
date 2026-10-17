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
import MaJsonViewer from '@/components/ma-json-viewer/index.vue'

const props = defineProps<{
  /** 当前行数据，取其中的 request_data（已由后端脱敏） */
  data?: { request_data?: Record<string, any> | null }
}>()

const t = useTrans().globalTrans

/** 后端没记录参数（改造前的历史数据）或参数为空时，展示空态而不是一个空 JSON */
const params = computed(() => props.data?.request_data ?? null)
const empty = computed(() => {
  const value = params.value
  if (value === null || value === undefined) {
    return true
  }
  return typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0
})
</script>

<template>
  <div class="operation-params">
    <el-alert
      v-if="empty"
      type="info"
      :closable="false"
      show-icon
      :title="t('baseOperationLog.paramsEmpty')"
    />
    <!-- 递归折叠 + 按类型着色，比 <pre> 直接输出好读 -->
    <MaJsonViewer v-else :data="params" :default-expand-depth="3" />
  </div>
</template>

<style scoped lang="scss">
/* 参数可能很长：弹窗高度固定，内容区内部滚动（与列表弹窗的观感一致） */
.operation-params {
  max-height: 60vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
