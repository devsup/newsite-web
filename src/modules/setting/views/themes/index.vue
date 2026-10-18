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
import type { MaProTableExpose, MaProTableOptions, MaProTableSchema } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'

import { deleteByIds, page } from '~/setting/api/themes'
import getSearchItems from './data/getSearchItems.tsx'
import getTableColumns from './data/getTableColumns.tsx'
import useDialog from '@/hooks/useDialog.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import MaBatchActions from '@/components/ma-batch-actions/index.vue'
import type { BatchAction } from '@/components/ma-batch-actions/index.vue'
import { clearTableSelection } from '@/utils/table.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

import ThemesForm from './form.vue'

defineOptions({ name: 'setting:themes' })

const proTableRef = ref<MaProTableExpose>() as Ref<MaProTableExpose>
const formRef = ref()
const selections = ref<any[]>([])
const t = useTrans().globalTrans
const msg = useMessage()

// 弹窗配置
const maDialog: UseDialogExpose = useDialog({
  // 表单含 16 个颜色字段 + 右侧实时预览，用 width 显式指定（不要用 lgWidth，超宽屏会失效）；
  // 宽度要同时喂饱两列颜色表单和 380px 宽的手机样张，太窄会让样张被压得又细又长。
  width: '1280px',
  ok: ({ formType }, okLoadingState: (state: boolean) => void) => {
    okLoadingState(true)
    const elForm = formRef.value.getElFormRef()
    // 验证通过后
    elForm.validate().then(() => {
      const request = formType === 'edit' ? formRef.value.edit() : formRef.value.add()
      request.then((res: any) => {
        if (res.code === ResultCode.SUCCESS) {
          msg.success(formType === 'edit' ? t('crud.updateSuccess') : t('crud.createSuccess'))
        }
        else {
          msg.error(res.message)
        }
        maDialog.close()
        proTableRef.value.refresh()
      }).catch((err: any) => {
        msg.alertError(err)
      })
    }).catch()
    okLoadingState(false)
  },
})

// 参数配置
const options = ref<MaProTableOptions>({
  // 表格距离底部的像素偏移适配
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t('theme.mainTitle'),
    subTitle: () => t('theme.subTitle'),
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
    api: page,
  },
})
// 架构配置
const schema = ref<MaProTableSchema>({
  // 搜索项
  searchItems: getSearchItems(t),
  // 表格列
  tableColumns: getTableColumns(maDialog, t, proTableRef),
})

/** 打开新增弹窗 */
function openAdd(): void {
  maDialog.setTitle(t('crud.add'))
  maDialog.open({ formType: 'add' })
}

// 批量删除

/** 批量操作菜单：权限不满足的项由组件内部过滤 */
const batchActions: BatchAction[] = [
  { command: 'delete', label: () => t('crud.delete'), icon: 'material-symbols:delete-outline', danger: true, auth: 'themes:delete' },
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
        <el-button
          v-auth="['themes:save']"
          type="primary"
          @click="openAdd()"
        >
          {{ t('crud.add') }}
        </el-button>
      </template>

      <template #toolbarLeft>
        <MaBatchActions :count="selections.length" :actions="batchActions" @command="handleBatchCommand" />
      </template>
      <!-- 数据为空时 -->
      <template #empty>
        <el-empty>
          <el-button
            v-auth="['themes:save']"
            type="primary"
            @click="openAdd()"
          >
            {{ t('crud.add') }}
          </el-button>
        </el-empty>
      </template>
    </MaProTable>

    <component :is="maDialog.Dialog">
      <template #default="{ formType, data }">
        <ThemesForm ref="formRef" :form-type="formType" :data="data" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">

</style>
