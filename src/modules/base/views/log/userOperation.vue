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
import type { MaProTableExpose, MaProTableOptions, MaProTableSchema } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import getSearchItems from './userOperationLogData/UserOperationLogSearch.tsx'
import getColumns from './userOperationLogData/UserOperationLogColumn.tsx'
import { UserOperatorLog } from '~/base/api/log.ts'
import useDialog from '@/hooks/useDialog.ts'
import OperationParams from './components/OperationParams.vue'

defineOptions({ name: 'log:userOperation' })

const t = useTrans().globalTrans
const proTableRef = ref<MaProTableExpose>() as Ref<MaProTableExpose>

/**
 * 「请求参数」查看弹窗.
 *
 * 参数是脱敏后的 JSON，长度不可控，所以只读弹窗、不设 footer（用右上角 × 或 Esc 关闭），
 * 内容区内部滚动。
 */
const maDialog: UseDialogExpose = useDialog({
  width: '860px',
  footer: false,
})

/** 点「查看」时把当前行交给弹窗 */
function openParams(row: any): void {
  maDialog.setTitle(t('baseOperationLog.paramsTitle'))
  maDialog.open({ formType: 'params', data: row })
}

const options = ref<MaProTableOptions>({
  // 表格距离底部的像素偏移适配
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t('baseOperationLog.title'),
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
    api: UserOperatorLog.page,
  },
})
// 架构配置
const schema = ref<MaProTableSchema>({
  // 搜索项
  searchItems: getSearchItems(t),
  // 表格列
  tableColumns: getColumns(t, openParams),
})
</script>

<template>
  <div class="mine-layout pt-3">
    <MaProTable ref="proTableRef" :options="options" :schema="schema" />

    <component :is="maDialog.Dialog">
      <template #default="{ formType, data }">
        <OperationParams v-if="formType === 'params'" :data="data" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">

</style>
