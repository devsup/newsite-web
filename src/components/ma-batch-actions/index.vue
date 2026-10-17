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
import hasAuth from '@/utils/permission/hasAuth'

/** 批量操作下拉里的一项 */
export interface BatchAction {
  /** 点击后 emit 的 command */
  command: string
  /** 菜单文案（用函数以支持语言切换后重新求值） */
  label: () => string
  /** material-symbols 图标名 */
  icon?: string
  /** 危险操作（删除等）：红色显示 */
  danger?: boolean
  /** 在菜单项上方加分隔线，把普通操作与危险操作分开 */
  divided?: boolean
  /** 需要的权限码；不传表示始终显示（与 v-auth 同源，避免出现点了必然 403 的入口） */
  auth?: string | string[]
  /** 单独禁用某一项（例如正在执行中的操作） */
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  /** 已勾选条数：为 0 时整个按钮禁用 */
  count: number
  actions: BatchAction[]
}>(), {
  count: 0,
})

const emit = defineEmits<{ command: [command: string] }>()

const t = useTrans().globalTrans

const visibleActions = computed(() => props.actions.filter(action => !action.auth || hasAuth(action.auth)))

function handleCommand(command: string): void {
  emit('command', command)
}
</script>

<template>
  <el-dropdown trigger="click" :disabled="count < 1" @command="handleCommand">
    <el-button :disabled="count < 1">
      <ma-svg-icon name="material-symbols:checklist" class="mr-1" />
      {{ t('crud.batchActions') }}
      <span v-if="count > 0" class="ma-batch-actions__count">{{ count }}</span>
      <ma-svg-icon name="material-symbols:keyboard-arrow-down" class="ml-1" />
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="action in visibleActions"
          :key="action.command"
          :command="action.command"
          :divided="action.divided"
          :disabled="action.disabled"
          :class="{ 'ma-batch-actions__danger': action.danger }"
        >
          <ma-svg-icon v-if="action.icon" :name="action.icon" class="mr-1" />
          {{ action.label() }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
/* 按钮上的已选条数胶囊：一眼看出这批操作作用到多少条 */
.ma-batch-actions__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  font-size: 12px;
  line-height: 1;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 9px;
}

/* 下拉里的危险项（删除）：与上方的编辑类操作区分开 */
:deep(.ma-batch-actions__danger),
.ma-batch-actions__danger {
  color: var(--el-color-danger);
}

:deep(.ma-batch-actions__danger:hover),
.ma-batch-actions__danger:hover {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
</style>
