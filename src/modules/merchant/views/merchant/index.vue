<script setup lang="tsx">
import { Status } from '@/constants/status.ts'
import type { MaProTableExpose, MaProTableOptions, MaProTableSchema } from '@mineadmin/pro-table'
import type { Ref } from 'vue'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { MerchantOptions } from '~/merchant/api/merchant'

import { batchUpdate, deleteByIds, options as fetchOptions, page } from '~/merchant/api/merchant'
import getSearchItems from './data/getSearchItems.tsx'
import getTableColumns from './data/getTableColumns.tsx'
import useDialog from '@/hooks/useDialog.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import MaBatchActions from '@/components/ma-batch-actions/index.vue'
import type { BatchAction } from '@/components/ma-batch-actions/index.vue'
import { clearTableSelection } from '@/utils/table.ts'
import MerchantForm from './form.vue'
import BatchUpdateDialog from './components/BatchUpdateDialog.vue'

defineOptions({ name: 'merchant:merchant' })

const t = useTrans().globalTrans
const msg = useMessage()
const proTableRef = ref<MaProTableExpose>() as Ref<MaProTableExpose>
const selections = ref<any[]>([])
const batchCount = computed(() => selections.value.length)
const formRef = ref()
const batchRef = ref()
const ready = ref(false)
const options = ref<MerchantOptions>({
  categoryTypes: [],
  areas: [],
  showTypes: [],
  layerTypes: [],
})

/** 今日商户点击合计（列表接口 summary，工具栏展示） */
const pageSummary = ref({ merchant_pv: 0, merchant_uv_by_merchant: 0 })

const maDialog: UseDialogExpose = useDialog({
  // 动态字段较多，宽度给足；用 width 而不是 lgWidth（MaDialog 的响应式断点只到 1920px）
  width: '1120px',
  // 专属 class：让这个弹窗「整体固定高度 + 表单区内部滚动」（见文件底部 .merchant-form-dialog 样式）。
  // 商户表单会随 show_type / layer_type 增减字段，若让整窗滚动，弹窗高度会跟着跳、底部按钮也容易被顶出视口
  class: 'merchant-form-dialog',
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

/**
 * 批量修改弹窗（改名称 / 改跳转链接）.
 *
 * 与新增/编辑共用同一套 useDialog + MaDialog，宽度收窄到 520px：
 * 只有一个输入框，没有必要铺满；弹窗内会写明「选中的 N 个商户都会改成这个值」。
 */
const maBatchDialog: UseDialogExpose = useDialog({
  width: '520px',
  ok: (_args: any, okLoadingState: (state: boolean) => void) => {
    okLoadingState(true)
    batchRef.value.submit()
      .then((res: any) => {
        if (res.code === ResultCode.SUCCESS) {
          msg.success(t('merchantInfo.batchUpdateDone', { count: res.data?.updated ?? batchCount.value }))
          maBatchDialog.close()
          resetSelection()
          proTableRef.value.refresh()
        }
        else {
          msg.error(res.message)
        }
      })
      // 表单校验未通过时 submit 会 reject，这里不需要额外提示（输入框下方已有红字）
      .catch(() => {})
      .finally(() => okLoadingState(false))
  },
})

const tableOptions = ref<MaProTableOptions>({
  adaptionOffsetBottom: 161,
  header: {
    mainTitle: () => t('merchantInfo.mainTitle'),
    subTitle: () => t('merchantInfo.subTitle'),
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
    // 7 个搜索项，必须折叠，否则最后几项会被挤出容器
    fold: true,
    text: {
      searchBtn: () => t('crud.search'),
      resetBtn: () => t('crud.reset'),
      isFoldBtn: () => t('crud.searchFold'),
      notFoldBtn: () => t('crud.searchUnFold'),
    },
  },
  searchFormOptions: { labelWidth: '90px' },
  requestOptions: {
    api: async (params: any) => {
      const response = await page(params)
      // 列表接口同时返回今日商户点击合计，工具栏「总PV / 总UV」与列表数据一起刷新
      if (response.code === ResultCode.SUCCESS && response.data?.summary) {
        pageSummary.value = response.data.summary
      }

      return response
    },
  },
})

const schema = ref<MaProTableSchema>({
  searchItems: [],
  tableColumns: [],
})

/** 元数据一次取齐；表单的区域下拉会按 show_type 在前端即时过滤 */
async function loadOptions(): Promise<void> {
  const response = await fetchOptions()
  if (response.code !== ResultCode.SUCCESS) {
    msg.error(response.message)
    return
  }

  options.value = response.data
  schema.value = {
    searchItems: getSearchItems(t, options.value),
    tableColumns: getTableColumns(maDialog, t, proTableRef, options.value),
  }
  ready.value = true
}

loadOptions()

function openAdd(): void {
  maDialog.setTitle(t('crud.add'))
  maDialog.open({ formType: 'add' })
}

/** 清空表格选中状态（含 pro-table 内部的选中缓存），避免「改完还勾着」导致下一次误操作 */
function resetSelection(): void {
  clearTableSelection(proTableRef, selections)
}

/** 批量操作菜单：权限不满足的项由组件内部过滤掉 */
const batchActions: BatchAction[] = [
  { command: 'enable', label: () => t('merchantInfo.batchEnable'), icon: 'material-symbols:check-circle-outline', auth: 'merchant:save' },
  { command: 'disable', label: () => t('merchantInfo.batchDisable'), icon: 'material-symbols:block', auth: 'merchant:save' },
  { command: 'name', label: () => t('merchantInfo.batchModifyName'), icon: 'material-symbols:edit-note', divided: true, auth: 'merchant:save' },
  { command: 'jump_url', label: () => t('merchantInfo.batchModifyJumpUrl'), icon: 'material-symbols:link', auth: 'merchant:save' },
  { command: 'delete', label: () => t('crud.delete'), icon: 'material-symbols:delete-outline', danger: true, divided: true, auth: 'merchant:delete' },
]

/**
 * 批量操作入口：下拉菜单统一分发.
 *
 * 状态切换只需要确认框，名称 / 链接需要输入新值（走批量修改弹窗），删除走删除确认。
 */
function handleBatchCommand(command: string): void {
  const ids = selections.value.map((item: any) => item.id)
  if (ids.length === 0) {
    return
  }

  if (command === 'enable' || command === 'disable') {
    handleBatchStatus(ids, command === 'enable' ? 1 : 2)
    return
  }

  if (command === 'name' || command === 'jump_url') {
    maBatchDialog.setTitle(command === 'name' ? t('merchantInfo.batchModifyName') : t('merchantInfo.batchModifyJumpUrl'))
    maBatchDialog.open({ formType: 'batch', data: { ids, field: command } })
    return
  }

  if (command === 'delete') {
    handleDelete(ids)
  }
}

/**
 * 批量启用 / 禁用.
 *
 * 与批量修改共用一个接口（field=status），一次 SQL 更新所有选中行：
 * 后端调试环境只有 1 个 worker，前端循环调单个接口会排队到超时。
 */
function handleBatchStatus(ids: number[], status: number): void {
  const action = status === Status.ENABLED ? t('merchantInfo.batchEnableAction') : t('merchantInfo.batchDisableAction')
  msg.confirm(t('merchantInfo.batchStatusConfirm', { action, count: ids.length })).then(async () => {
    const response = await batchUpdate(ids, 'status', status)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('merchantInfo.batchStatusDone', { action, count: response.data?.updated ?? ids.length }))
      resetSelection()
      proTableRef.value.refresh()
    }
    else {
      msg.error(response.message)
    }
  })
}

/**
 * 批量删除.
 *
 * 确认框写明「N 条 + 不可恢复」，比通用的「确定要删除吗」更能避免误删。
 */
function handleDelete(ids: number[]): void {
  if (ids.length === 0) {
    return
  }
  msg.confirm(t('merchantInfo.batchDeleteConfirm', { count: ids.length })).then(async () => {
    const response = await deleteByIds(ids)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.delSuccess'))
      resetSelection()
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
    <MaProTable v-if="ready" ref="proTableRef" :options="tableOptions" :schema="schema">
      <template #actions>
        <el-button v-auth="['merchant:save']" type="primary" @click="openAdd">
          {{ t('crud.add') }}
        </el-button>
      </template>

      <template #toolbarLeft>
        <div class="merchant-toolbar">
          <MaBatchActions :count="selections.length" :actions="batchActions" @command="handleBatchCommand" />
          <div class="merchant-today-stat">
            <span>{{ t('merchantInfo.totalPv') }} <b>{{ pageSummary.merchant_pv }}</b></span>
            <i class="merchant-today-stat__divider" />
            <span>{{ t('merchantInfo.totalUv') }} <b>{{ pageSummary.merchant_uv_by_merchant }}</b></span>
          </div>
        </div>
      </template>
    </MaProTable>

    <component :is="maDialog.Dialog">
      <template #default="{ formType, data }">
        <MerchantForm
          v-if="['add', 'edit'].includes(formType)"
          ref="formRef"
          :form-type="formType"
          :data="data"
          :options="options"
        />
      </template>
    </component>

    <component :is="maBatchDialog.Dialog">
      <template #default="{ data }">
        <BatchUpdateDialog ref="batchRef" :data="data" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
/* 工具栏：左侧批量操作 + 今日点击合计 */
.merchant-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.merchant-today-stat {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 5px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  background: var(--el-fill-color-blank);

  b {
    margin-left: 4px;
    color: var(--el-color-danger);
    font-size: 15px;
    font-variant-numeric: tabular-nums;
  }
}

.merchant-today-stat__divider {
  width: 1px;
  height: 14px;
  background: var(--el-border-color-lighter);
}

/* 商户表单弹窗：弹窗本体不滚动，滚动发生在表单区域内部.
   切换展示 / 弹窗类型时字段数量会变，若按内容撑高整窗，弹窗高度会跟着跳、
   底部「确定 / 取消」也会被顶出视口——所以这里用固定高度（不是 max-height），
   让弹窗大小恒定，滚动全部交给 body。 */
:global(.merchant-form-dialog) {
  display: flex;
  flex-direction: column;
  height: 92vh;
  margin: 4vh auto !important;
  overflow: hidden;
}

/* 全屏时不保留 4vh 上下留白 */
:global(.merchant-form-dialog.is-fullscreen) {
  height: 100vh;
  max-height: 100vh;
  margin: 0 !important;
}

/* 头部与底部固定，只有中间的表单区滚动 */
:global(.merchant-form-dialog .el-dialog__header),
:global(.merchant-form-dialog .el-dialog__footer) {
  flex: 0 0 auto;
}

:global(.merchant-form-dialog .el-dialog__body) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  /* 内部滚到底时不把滚动传给外层页面 */
  overscroll-behavior: contain;
}
</style>
