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
import type { MaTableExpose } from '@mineadmin/table'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import type { BaoTaConfigVo } from '~/setting/api/baota.ts'

import { ElSwitch } from 'element-plus'
import { configDelete, configPage, configUpdateStatus } from '~/setting/api/baota.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import useDialog from '@/hooks/useDialog.ts'
import useTable from '@/hooks/useTable.ts'
import { ResultCode } from '@/utils/ResultCode.ts'
import hasAuth from '@/utils/permission/hasAuth.ts'

import ConfigForm from './ConfigForm.vue'

defineOptions({ name: 'setting:baota:configManager' })

const emit = defineEmits<{
  changed: []
}>()

const t = useTrans().globalTrans
const msg = useMessage()

// 模板 ref 名必须与这个变量同名，ma-table 才会被绑定上
const configTable = ref<MaTableExpose>()
// useTable 是异步的，额外留一份实例兜底：列表加载可能早于它 resolve
let tableInstance: MaTableExpose | undefined

const loading = ref(false)
const page = ref(1)
const pageSize = ref(30)
const total = ref(0)
const searchName = ref('')
const searchUrl = ref('')
// 正在切换状态的行 id，用于开关的 loading 态
const statusLoading = ref<number>()
const formRef = ref()

/**
 * 配置表单弹窗（在配置管理弹窗内部再开一层），复用项目统一的 useDialog + ma-form 校验流程。
 */
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
        loadList()
        // 通知主页面刷新配置下拉与网站列表
        emit('changed')
      }).catch((err: any) => {
        msg.alertError(err)
      })
    }).catch()
    okLoadingState(false)
  },
})

/**
 * 加载配置列表。
 *
 * 用 ma-table（而不是 MaProTable）：它自带分页且高度可由 maxHeight 直接控制，
 * 而 MaProTable 的高度自适应是按「视口」算的，放进弹窗里必然算多、把表格撑出弹窗。
 */
async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await configPage({
      name: searchName.value || undefined,
      api_url: searchUrl.value || undefined,
      page: page.value,
      page_size: pageSize.value,
    })

    if (res.code === ResultCode.SUCCESS) {
      const data = res.data || {}
      ;(configTable.value ?? tableInstance)?.setData([...(data.list || [])])
      total.value = data.total || 0
    }
    else {
      msg.error(res.message)
    }
  }
  finally {
    loading.value = false
  }
}

/** 每页条数变化：回到第一页再查 */
function handleSizeChange(): void {
  page.value = 1
  loadList()
}

/** 搜索：回到第一页再查 */
function handleSearch(): void {
  page.value = 1
  loadList()
}

/** 重置搜索条件 */
function handleReset(): void {
  searchName.value = ''
  searchUrl.value = ''
  page.value = 1
  loadList()
}

/** 新增配置 */
function openAdd(): void {
  formDialog.setTitle(t('baota.configAdd'))
  formDialog.open({ formType: 'add' })
}

/** 切换配置启用状态：成功后刷新列表，失败给提示并同样刷新以回滚显示 */
function handleStatusChange(row: BaoTaConfigVo, status: number): void {
  statusLoading.value = row.id
  configUpdateStatus(row.id as number, status).then((response) => {
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.updateSuccess'))
    }
    else {
      msg.error(response.message)
    }
    loadList()
    emit('changed')
  }).finally(() => {
    statusLoading.value = undefined
  })
}

/** 删除单条配置 */
function handleDelete(row: BaoTaConfigVo): void {
  msg.delConfirm(t('crud.delDataMessage')).then(async () => {
    const response = await configDelete([row.id as number])
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.delSuccess'))
      loadList()
      emit('changed')
    }
    else {
      msg.error(response.message)
    }
  })
}

useTable('configTable').then((table: MaTableExpose) => {
  tableInstance = table
  table.setOptions({
    stripe: true,
    border: true,
    // 弹窗内不用「按视口自适应高度」（算法基于 window，在弹窗里必然算大），
    // 改为固定最大高度，超出部分由表格自己滚动
    adaption: false,
    maxHeight: 400,
  })

  table.setColumns([
    { label: () => t('ID'), prop: 'id', width: '70px' },
    { label: () => t('baota.configName'), prop: 'name', minWidth: '140px' },
    { label: () => t('baota.apiUrl'), prop: 'api_url', minWidth: '240px', showOverflowTooltip: true },
    {
      label: () => t('crud.status'),
      prop: 'status',
      width: '90px',
      cellRender: ({ row }): any => (
        <ElSwitch
          modelValue={Number(row.status)}
          activeValue={1}
          inactiveValue={2}
          loading={statusLoading.value === row.id}
          disabled={!hasAuth('baota:save')}
          onChange={(value: string | number | boolean) => handleStatusChange(row, Number(value))}
        />
      ),
    },
    { label: () => t('baota.weight'), prop: 'weight', width: '80px' },
    { label: () => t('crud.createTime'), prop: 'created_at', width: '170px' },
    { label: () => t('baota.updatedBy'), prop: 'updated_by_name', width: '110px' },
    {
      label: () => t('crud.operation'),
      // 放「编辑 / 删除」两个文字按钮：110px 会把「删除」挤到贴边甚至被单元格裁掉，
      // 这里给到 150px，并沿用 el-button 相邻按钮自带的 12px 间距（不再叠加 gap，避免撑宽）
      width: '150px',
      cellRender: ({ row }): any => (
        <div class="flex items-center">
          <el-button
            link
            type="primary"
            disabled={!hasAuth('baota:save')}
            onClick={() => {
              formDialog.setTitle(t('crud.edit'))
              formDialog.open({ formType: 'edit', data: row })
            }}
          >
            {t('crud.edit')}
          </el-button>
          <el-button
            link
            type="danger"
            disabled={!hasAuth('baota:delete')}
            onClick={() => handleDelete(row)}
          >
            {t('crud.delete')}
          </el-button>
        </div>
      ),
    },
  ])

  loadList()
})

defineExpose({
  refresh: () => loadList(),
})
</script>

<template>
  <div class="config-manager">
    <div class="config-manager__toolbar">
      <el-input
        v-model="searchName"
        class="w-52"
        clearable
        :placeholder="t('baota.configName')"
        @keyup.enter="handleSearch"
      />
      <el-input
        v-model="searchUrl"
        class="w-72"
        clearable
        :placeholder="t('baota.apiUrl')"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">
        {{ t('crud.search') }}
      </el-button>
      <el-button @click="handleReset">
        {{ t('crud.reset') }}
      </el-button>

      <div class="flex-1" />

      <el-button v-auth="['baota:save']" type="primary" @click="openAdd">
        {{ t('baota.configAdd') }}
      </el-button>
    </div>

    <ma-table ref="configTable" v-loading="loading" />

    <!-- 分页用项目通用的 el-pagination 手写：ma-table 的内置分页需要配套插槽，直接手写更可控 -->
    <div class="config-manager__pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        background
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadList"
        @size-change="handleSizeChange"
      />
    </div>

    <component :is="formDialog.Dialog">
      <template #default="{ formType, data }">
        <ConfigForm ref="formRef" :form-type="formType" :data="data" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
.config-manager {
  // 宽度锁死，表格与分页只在弹窗内布局，不向外溢出
  width: 100%;
  overflow: hidden;

  &__toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  &__pager {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}
</style>
