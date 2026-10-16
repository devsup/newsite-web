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

import { configDelete, configPage } from '~/setting/api/baota.ts'
import getConfigSearchItems from '../data/getConfigSearchItems.tsx'
import getConfigTableColumns from '../data/getConfigTableColumns.tsx'
import useDialog from '@/hooks/useDialog.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

import ConfigForm from './ConfigForm.vue'

defineOptions({ name: 'setting:baota:configManager' })

const emit = defineEmits<{
  changed: []
}>()

const proTableRef = ref<MaProTableExpose>() as Ref<MaProTableExpose>
const selections = ref<any[]>([])
const formRef = ref()
const t = useTrans().globalTrans
const msg = useMessage()

// 配置表单弹窗（在配置管理弹窗内部再开一层），复用项目统一的 useDialog + ma-form 校验流程
const formDialog: UseDialogExpose = useDialog({
  width: '620px',
  ok: ({ formType }, okLoadingState: (state: boolean) => void) => {
    okLoadingState(true)
    const elForm = formRef.value.maForm.getElFormRef()
    elForm.validate().then(() => {
      const request = formType === 'edit' ? formRef.value.edit() : formRef.value.add()
      request.then((res: any) => {
        if (res.code === ResultCode.SUCCESS) {
          msg.success(formType === 'edit' ? t('crud.updateSuccess') : t('crud.createSuccess'))
        }
        else {
          msg.error(res.message)
        }
        formDialog.close()
        proTableRef.value.refresh()
        // 通知主页面刷新配置下拉与网站列表
        emit('changed')
      }).catch((err: any) => {
        msg.alertError(err)
      })
    }).catch()
    okLoadingState(false)
  },
})

const options = ref<MaProTableOptions>({
  // 表格嵌在弹窗内，底部偏移按弹窗下沿 + 分页条估算，避免撑出整页滚动
  adaptionOffsetBottom: 300,
  // 弹窗外层已有标题，这里不再重复渲染大标题
  header: { show: false },
  tableOptions: {
    stripe: true,
    on: {
      onSelectionChange: (selection: any[]) => selections.value = selection,
    },
  },
  searchOptions: {
    fold: false,
    text: {
      searchBtn: () => t('crud.search'),
      resetBtn: () => t('crud.reset'),
    },
  },
  searchFormOptions: { labelWidth: '80px' },
  requestOptions: {
    api: configPage,
  },
})

const schema = ref<MaProTableSchema>({
  searchItems: getConfigSearchItems(t),
  tableColumns: getConfigTableColumns(formDialog, t, proTableRef),
})

/** 新增配置 */
function openAdd(): void {
  formDialog.setTitle(t('baota.configAdd'))
  formDialog.open({ formType: 'add' })
}

/** 批量删除配置 */
function handleDelete(): void {
  const ids = selections.value.map((item: any) => item.id)
  msg.confirm(t('crud.delMessage')).then(async () => {
    const response = await configDelete(ids)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.delSuccess'))
      proTableRef.value.refresh()
      emit('changed')
    }
    else {
      msg.error(response.message)
    }
  })
}

defineExpose({
  refresh: () => proTableRef.value?.refresh(),
})
</script>

<template>
  <div class="baota-config-manager">
    <MaProTable ref="proTableRef" :options="options" :schema="schema">
      <template #toolbarLeft>
        <div class="flex items-center gap-x-2">
          <el-button
            v-auth="['baota:save']"
            type="primary"
            @click="openAdd"
          >
            {{ t('baota.configAdd') }}
          </el-button>
          <el-button
            v-auth="['baota:delete']"
            type="danger"
            plain
            :disabled="selections.length < 1"
            @click="handleDelete"
          >
            {{ t('crud.delete') }}
          </el-button>
        </div>
      </template>
    </MaProTable>

    <component :is="formDialog.Dialog">
      <template #default="{ formType, data }">
        <ConfigForm ref="formRef" :form-type="formType" :data="data" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
.baota-config-manager {
  // 弹窗内容区给一个明确的高度，表格的高度自适应才有参照
  height: 62vh;
  min-height: 420px;
}
</style>
