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
  items: items
zh_CN:
  items: 项
zh_TW:
  items: 項
</i18n>

<script setup lang="ts">
import JsonNode from './components/JsonNode.vue'

defineOptions({ name: 'MaJsonViewer' })

const {
  data = null,
  defaultExpandDepth = 2,
} = defineProps<{
  /** 任意 JSON 结构（对象 / 数组 / 标量） */
  data?: any
  /** 默认展开到第几层，更深的节点自动折叠，避免一屏铺不完 */
  defaultExpandDepth?: number
}>()
</script>

<template>
  <div class="ma-json-viewer">
    <JsonNode :data="data" :depth="0" :default-expand-depth="defaultExpandDepth" />
  </div>
</template>

<style scoped lang="scss">
.ma-json-viewer {
  padding: 2px 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 22px;
  color: var(--el-text-color-primary);
}
</style>
