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
import { useTrans } from '@/hooks/auto-imports/useTrans.ts'

defineOptions({ name: 'JsonNode' })

const {
  data = null,
  depth = 0,
  defaultExpandDepth = 2,
} = defineProps<{
  data?: any
  /** 当前嵌套层级，用于判断默认是否展开 */
  depth?: number
  defaultExpandDepth?: number
}>()

const { localTrans: t } = useTrans()

// 超过默认层级的节点先折叠起来（长 JSON 一打开不会铺满整屏）
const expanded = ref(depth < defaultExpandDepth)

/** 值的 JSON 类型：对象与数组是可展开的分支，其余是标量 */
const kind = computed<'array' | 'object' | 'string' | 'number' | 'boolean' | 'null'>(() => {
  if (data === null || data === undefined) {
    return 'null'
  }
  if (Array.isArray(data)) {
    return 'array'
  }

  const type = typeof data
  if (type === 'object') {
    return 'object'
  }
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return type
  }

  return 'string'
})

const isBranch = computed<boolean>(() => kind.value === 'array' || kind.value === 'object')

/** 分支节点的条目数（折叠时用来做摘要） */
const size = computed<number>(() => {
  if (!isBranch.value) {
    return 0
  }

  return Array.isArray(data) ? data.length : Object.keys(data as object).length
})

/** 标量值的展示文本：字符串带引号（转义交给 JSON.stringify），其它直接转字符串 */
const display = computed<string>(() => {
  if (kind.value === 'null') {
    return 'null'
  }
  if (kind.value === 'string') {
    return JSON.stringify(data)
  }

  return String(data)
})

const arrowIcon = computed<string>(() => expanded.value ? 'material-symbols:arrow-drop-down' : 'material-symbols:arrow-right')
const openBracket = computed<string>(() => kind.value === 'array' ? '[' : '{')
const closeBracket = computed<string>(() => kind.value === 'array' ? ']' : '}')
</script>

<template>
  <!-- 标量：直接显示，按类型着色 -->
  <span
    v-if="!isBranch"
    class="json-node__value"
    :class="`is-${kind}`"
  >
    {{ display }}
  </span>

  <!-- 对象 / 数组：点击行头折叠，折叠时给出「[ N 项 ]」摘要 -->
  <div v-else class="json-node">
    <div class="json-node__line" @click="expanded = !expanded">
      <ma-svg-icon class="json-node__arrow" :name="arrowIcon" :size="16" />
      <span class="json-node__bracket">{{ openBracket }}</span>
      <template v-if="!expanded">
        <span class="json-node__summary">{{ size }} {{ t('items') }}</span>
        <span class="json-node__bracket">{{ closeBracket }}</span>
      </template>
      <span v-else class="json-node__size">{{ size }} {{ t('items') }}</span>
    </div>

    <div v-show="expanded" class="json-node__children">
      <div v-for="(val, key) in data" :key="key" class="json-node__row">
        <span class="json-node__key">{{ key }}</span>
        <span class="json-node__colon">:</span>
        <JsonNode :data="val" :depth="depth + 1" :default-expand-depth="defaultExpandDepth" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.json-node {
  &__line {
    display: flex;
    gap: 2px;
    align-items: center;
    cursor: pointer;
    user-select: none;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  &__arrow {
    flex: none;
    color: var(--el-text-color-secondary);
  }

  &__bracket {
    color: var(--el-text-color-secondary);
  }

  &__summary {
    margin: 0 4px;
  }

  &__size {
    margin-left: 4px;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  &__children {
    margin-left: 7px;
    padding-left: 14px;
    // 虚线缩进线，方便一眼看出层级
    border-left: 1px dashed var(--el-border-color-lighter);
  }

  &__row {
    display: flex;
    gap: 4px;
    align-items: flex-start;
  }

  &__key {
    flex: none;
    color: var(--el-color-primary);
  }

  &__colon {
    flex: none;
    margin-right: 2px;
    color: var(--el-text-color-secondary);
  }

  &__value {
    // 证书 / 时间戳这类长值允许换行，不撑破弹窗
    word-break: break-all;

    &.is-string {
      color: var(--el-color-success);
    }

    &.is-number {
      color: var(--el-color-warning);
    }

    &.is-boolean {
      color: var(--el-color-danger);
    }

    &.is-null {
      color: var(--el-text-color-placeholder);
    }
  }
}
</style>
