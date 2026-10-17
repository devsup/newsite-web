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
import type { UserLoginVo } from '~/base/api/log.ts'
import { UserLoginLog } from '~/base/api/log.ts'
import type { MaProTableExpose, MaProTableOptions, MaProTableSchema } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import getColumns from './userLoginLogData/UserLoginLogColumn.tsx'
import getSearchItems from './userLoginLogData/UserLoginLogSearch.tsx'
import { ResultCode } from '@/utils/ResultCode.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import MaBatchActions from '@/components/ma-batch-actions/index.vue'
import type { BatchAction } from '@/components/ma-batch-actions/index.vue'
import { clearTableSelection } from '@/utils/table.ts'

defineOptions({ name: 'log:userLogin' })

const t = useTrans().globalTrans
const proTableRef = ref<MaProTableExpose>() as Ref<MaProTableExpose>
const selections: Ref<UserLoginVo[]> = ref([])
const msg = useMessage()

/**
 * 批量删除所选日志.
 *
 * 日志按下发条件直接删，删完清空勾选，避免停留在「删了但还勾着」的状态。
 */
function handleDelete(): void {
  const ids = selections.value.map((value: UserLoginVo) => value.id)
  if (ids.length === 0) {
    return
  }
  msg.confirm(t('crud.batchDeleteConfirm', { count: ids.length })).then(async () => {
    const res = await UserLoginLog.delete(ids)
    if (res.code === ResultCode.SUCCESS) {
      msg.success(t('crud.delSuccess'))
      clearTableSelection(proTableRef, selections)
      proTableRef.value.refresh()
    }
    else {
      msg.error(res.message)
    }
  })
}

/** 批量操作菜单：当前只有删除，后续新增批量项在这里追加 */
const batchActions: BatchAction[] = [
  { command: 'delete', label: () => t('crud.delete'), icon: 'material-symbols:delete-outline', danger: true },
]

function handleBatchCommand(command: string): void {
  if (command === 'delete') {
    handleDelete()
  }
}

const options = ref<MaProTableOptions>({
  // 表格距离底部的像素偏移适配
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t('baseLoginLog.title'),
  },
  // 表格参数
  tableOptions: {
    on: {
      // 表格选择事件
      onSelectionChange: (selection: any[]) => selections.value = selection,
    },
  },
  // 搜索参数
  searchOptions: {
    fold: true,
    text: {
      searchBtn: () => t('crud.search'),
      resetBtn: () => t('crud.reset'),
      isFoldBtn: () => t('crud.searchFold'),
      notFoldBtn: () => t('crud.searchUnFold'),
    },
  },
  // 搜索表单参数
  searchFormOptions: { labelWidth: '90px' },
  // 请求配置
  requestOptions: {
    api: UserLoginLog.page,
  },
})
// 架构配置
const schema = ref<MaProTableSchema>({
  // 搜索项
  searchItems: getSearchItems(t),
  // 表格列
  tableColumns: getColumns(t),
})
</script>

<template>
  <div class="mine-layout pt-3">
    <MaProTable ref="proTableRef" :options="options" :schema="schema">
      <template #toolbarLeft>
        <MaBatchActions :count="selections.length" :actions="batchActions" @command="handleBatchCommand" />
      </template>
    </MaProTable>
  </div>
</template>

<style scoped lang="scss">

</style>
