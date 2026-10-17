<script setup lang="tsx">
import type { MaProTableExpose, MaProTableOptions, MaProTableSchema } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { TabFooterVo } from '~/merchant/api/tabFooter'

import { deleteByIds, page } from '~/merchant/api/tabFooter'
import getSearchItems from './data/getSearchItems.tsx'
import getTableColumns from './data/getTableColumns.tsx'
import useDialog from '@/hooks/useDialog.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import MaBatchActions from '@/components/ma-batch-actions/index.vue'
import type { BatchAction } from '@/components/ma-batch-actions/index.vue'
import { clearTableSelection } from '@/utils/table.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import TabFooterForm from './form.vue'
import BindCategory from './components/BindCategory.vue'

defineOptions({ name: 'merchant:tabFooter' })

const t = useTrans().globalTrans
const msg = useMessage()
const proTableRef = ref<MaProTableExpose>() as Ref<MaProTableExpose>
const selections = ref<any[]>([])
const formRef = ref()
const bindRow = ref<TabFooterVo | null>(null)

/** 新增 / 编辑表单弹窗 */
const maDialog: UseDialogExpose = useDialog({
  width: '680px',
  ok: ({ formType }, okLoadingState: (state: boolean) => void) => {
    okLoadingState(true)
    formRef.value.getElFormRef().validate().then(() => {
      const request = formType === 'edit' ? formRef.value.edit() : formRef.value.add()
      request.then((res: any) => {
        if (res.code === ResultCode.SUCCESS) {
          msg.success(formType === 'edit' ? t('crud.updateSuccess') : t('crud.createSuccess'))
          maDialog.close()
          proTableRef.value.refresh()
        }
        else {
          msg.error(res.message)
        }
      }).catch((err: any) => {
        msg.alertError(err)
      })
    }).catch()
    okLoadingState(false)
  },
})

/** 绑定顶部Tab弹窗：绑定 / 解绑 / 改排序都在弹窗内即时完成，底部按钮只负责关闭 */
const bindDialog: UseDialogExpose = useDialog({
  width: '900px',
  ok: () => {
    bindDialog.close()
  },
})

const options = ref<MaProTableOptions>({
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t('tabFooter.mainTitle'),
    subTitle: () => t('tabFooter.subTitle'),
  },
  tableOptions: {
    stripe: true,
    border: true,
    cellStyle: () => ({ textAlign: 'center' }),
    headerCellStyle: () => ({ textAlign: 'center' }),
    on: {
      onSelectionChange: (selection: any[]) => selections.value = selection,
    },
  },
  searchOptions: {
    text: {
      searchBtn: () => t('crud.search'),
      resetBtn: () => t('crud.reset'),
      isFoldBtn: () => t('crud.searchFold'),
      notFoldBtn: () => t('crud.searchUnFold'),
    },
  },
  searchFormOptions: { labelWidth: '90px' },
  requestOptions: { api: page },
})

function openBind(row: TabFooterVo): void {
  bindRow.value = row
  bindDialog.setTitle(t('tabFooter.bindTitle', { name: row.name ?? '' }))
  bindDialog.setAttr({ okText: t('crud.close') })
  bindDialog.open({})
}

const schema = ref<MaProTableSchema>({
  searchItems: getSearchItems(t),
  tableColumns: getTableColumns(maDialog, t, proTableRef, openBind),
})

function openAdd(): void {
  maDialog.setTitle(t('crud.add'))
  maDialog.open({ formType: 'add' })
}

/** 批量操作菜单：权限不满足的项由组件内部过滤 */
const batchActions: BatchAction[] = [
  { command: 'delete', label: () => t('crud.delete'), icon: 'material-symbols:delete-outline', danger: true, auth: 'tabFooter:delete' },
]

/** 批量操作入口：当前各页只有删除，后续新增批量项在这里分发即可 */
function handleBatchCommand(command: string): void {
  if (command === 'delete') {
    handleDelete()
  }
}

/**
 * 批量删除所选数据.
 *
 * 确认框写明「N 条 + 不可恢复」，比通用的「是否删除所选中数据」更能避免误删；
 * 成功后清空勾选，避免删完还勾着导致下一次误操作。
 */
function handleDelete(): void {
  const ids = selections.value.map((item: any) => item.id)
  if (ids.length === 0) {
    return
  }
  msg.confirm(t('crud.batchDeleteConfirm', { count: ids.length })).then(async () => {
    const response = await deleteByIds(ids)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.delSuccess'))
      clearTableSelection(proTableRef, selections)
      proTableRef.value.refresh()
    }
    else {
      msg.error(response.message)
    }
  })
}
</script>

<template>
  <div class="mine-layout pt-3">
    <MaProTable ref="proTableRef" :options="options" :schema="schema">
      <template #actions>
        <el-button v-auth="['tabFooter:save']" type="primary" @click="openAdd">
          {{ t('crud.add') }}
        </el-button>
      </template>

      <template #toolbarLeft>
        <MaBatchActions :count="selections.length" :actions="batchActions" @command="handleBatchCommand" />
      </template>
    </MaProTable>

    <component :is="maDialog.Dialog">
      <template #default="{ formType, data }">
        <TabFooterForm v-if="['add', 'edit'].includes(formType)" ref="formRef" :form-type="formType" :data="data" />
      </template>
    </component>

    <component :is="bindDialog.Dialog">
      <BindCategory :data="bindRow" @changed="proTableRef.refresh()" />
    </component>
  </div>
</template>
