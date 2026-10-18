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

import { useDebounceFn } from '@vueuse/core'
import { deleteByIds, options as fetchChannelOptions, page, rebuildLanding } from '~/channel/api/channel'
import getSearchItems from './data/getSearchItems.tsx'
import getTableColumns from './data/getTableColumns.tsx'
import useDialog from '@/hooks/useDialog.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import MaBatchActions from '@/components/ma-batch-actions/index.vue'
import type { BatchAction } from '@/components/ma-batch-actions/index.vue'
import { clearTableSelection } from '@/utils/table.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

import ChannelForm from './form.vue'

defineOptions({ name: 'channel:channel' })

const proTableRef = ref<MaProTableExpose>() as Ref<MaProTableExpose>
const formRef = ref()
const selections = ref<any[]>([])
const t = useTrans().globalTrans
const msg = useMessage()

// 弹窗配置
const maDialog: UseDialogExpose = useDialog({
  // 表单两列排版（含「提示文字」占满整行），用 width 显式指定（不要用 lgWidth：MaDialog 的响应式断点只到 1920px，超宽屏会退成默认 55%）；
  // 960px 时两列各约 300px，输入框与提示文字明显挤压，这里放宽到 1150px（与宝塔「API 配置管理」弹窗同宽）
  width: '1150px',
  ok: ({ formType }, okLoadingState: (state: boolean) => void) => {
    okLoadingState(true)
    const elForm = formRef.value.getElFormRef()
    // 验证通过后
    elForm.validate().then(() => {
      const request = formType === 'edit' ? formRef.value.edit() : formRef.value.add()
      request.then((res: any) => {
        if (res.code === ResultCode.SUCCESS) {
          msg.success(formType === 'edit' ? t('crud.updateSuccess') : t('crud.createSuccess'))
          // 落地页静态文件生成失败时额外提示：渠道已经保存好了，点「重建落地页」可以补
          if (res.data && res.data.landing === false) {
            msg.error(t('channel.landingFailed'))
          }
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
    mainTitle: () => t('channel.mainTitle'),
    subTitle: () => t('channel.subTitle'),
  },
  // 表格参数
  tableOptions: {
    // 与宝塔信息列表保持一致的观感：斑马纹 + 单元格边框（竖分割线 + 灰底表头）
    stripe: true,
    border: true,
    // 单元格内容整体居中（宝塔信息列表就是全列居中；自定义 JSX 列内部再各自对齐）
    cellStyle: () => ({ textAlign: 'center' }),
    headerCellStyle: () => ({ textAlign: 'center' }),
    on: {
      // 表格选择事件
      onSelectionChange: (selection: any[]) => selections.value = selection,
    },
  },
  // 搜索参数
  searchOptions: {
    // 4 个搜索项默认展开会把最后一项挤出容器（宝塔只有 2 项才默认展开），这里保持折叠
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
/**
 * 搜索区「渠道名称」下拉的选项.
 *
 * 渠道名会被当作筛选值，所以取的是全量清单（1000+ 条）；下拉可输入过滤。
 */
const channelOptions = ref<Array<{ id: number, name: string }>>([])

// 等渠道清单加载完再渲染表格：MaSearch 只在初始化时读一次 searchItems，
// 之后改 schema.searchItems 不会生效（组件内部没有 watch），所以必须先拿到选项再建 schema
const ready = ref(false)

const schema = ref<MaProTableSchema>({
  searchItems: [],
  tableColumns: [],
})

/**
 * 加载渠道清单并构建列表配置.
 *
 * 失败不阻断列表（只是名称下拉为空），所以这里不弹错误提示，保留编码/状态等其它筛选。
 */
async function loadChannelOptions(): Promise<void> {
  const response = await fetchChannelOptions()
  if (response.code === ResultCode.SUCCESS) {
    channelOptions.value = response.data ?? []
  }

  schema.value = {
    searchItems: getSearchItems(t, channelOptions.value),
    tableColumns: getTableColumns(maDialog, t, proTableRef),
  }
  ready.value = true
}

loadChannelOptions()

/** 打开新增弹窗 */
function openAdd(): void {
  maDialog.setTitle(t('crud.add'))
  maDialog.open({ formType: 'add' })
}

/** 重建请求的全局 loading：请求期间两个按钮都禁用，避免重复触发 */
const rebuilding = ref(false)

/**
 * 重建落地页（全量/批量共用）。
 *
 * 防抖 500ms：连续点击只执行一次；确认框弹出前就锁住 rebuilding，取消后释放。
 * 后端另有 Redis 锁，多标签页/直接调接口也会被串行化。
 */
const runRebuildLanding = useDebounceFn(async (ids?: number[]) => {
  if (rebuilding.value) {
    return
  }
  rebuilding.value = true

  try {
    try {
      await msg.confirm(ids
        ? t('channel.rebuildLandingSelectedConfirm', { count: ids.length })
        : t('channel.rebuildLandingConfirm'))
    }
    catch {
      // 用户取消确认框
      return
    }

    const response = await rebuildLanding(ids)
    if (response.code !== ResultCode.SUCCESS) {
      msg.error(response.message)
      return
    }
    if (response.data?.busy) {
      msg.warning(t('channel.rebuildLandingBusy'))
      return
    }

    msg.success(t('channel.rebuildLandingSuccess', {
      generated: response.data?.generated ?? 0,
      total: response.data?.total ?? 0,
    }))
    if (ids) {
      proTableRef.value.refresh()
    }
  }
  finally {
    rebuilding.value = false
  }
}, 500)

/**
 * 重建全部落地页：落地页内容是从系统设置「烘焙」进静态文件的
 *（背景图 / 安装包地址 / 自动下载开关），所以改完系统设置点一次即可全量刷新。
 */
function handleRebuildLanding(): void {
  runRebuildLanding()
}

/**
 * 批量重建所选渠道的落地页：勾选几条就只重建这几条，
 * 比「全部重建」更适合「只改了某几个渠道的 JS 代码 / 只想刷新某几个」的场景。
 */
function handleRebuildSelected(): void {
  const ids = selections.value.map((item: any) => item.id)
  if (ids.length === 0) {
    return
  }
  runRebuildLanding(ids)
}

// 批量删除
/** 批量删除渠道：确认框写明条数，删除会一并删掉对应的落地页文件，成功后清空勾选 */
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

/**
 * 批量操作菜单.
 *
 * 重建过程中把「重建」项禁用，避免重复触发既耗磁盘又要排队；
 * 删除单独加分隔线并用危险色，和重建区分开。
 */
const batchActions = computed<BatchAction[]>(() => [
  { command: 'rebuild', label: () => t('channel.rebuildLanding'), icon: 'material-symbols:refresh', auth: 'channel:save', disabled: rebuilding.value },
  { command: 'delete', label: () => t('crud.delete'), icon: 'material-symbols:delete-outline', danger: true, divided: true, auth: 'channel:delete' },
])

function handleBatchCommand(command: string): void {
  if (command === 'rebuild') {
    handleRebuildSelected()
    return
  }
  if (command === 'delete') {
    handleDelete()
  }
}
</script>

<template>
  <div class="mine-layout pt-3">
    <MaProTable v-if="ready" ref="proTableRef" :options="options" :schema="schema">
      <template #actions>
        <!-- 落地页是「烘焙」出来的静态文件，系统设置改了不会自动生效，所以这个按钮用醒目的 warning 色，
             并用悬浮说明列清楚「哪些改动需要重建」——否则很容易改了背景图/安装包却忘了点 -->
        <el-tooltip placement="left" :show-after="120">
          <template #content>
            <div style="line-height: 1.7;">
              <div style="font-weight: 600;">
                {{ t('channel.rebuildLandingTipTitle') }}
              </div>
              <div>{{ t('channel.rebuildLandingTip1') }}</div>
              <div>{{ t('channel.rebuildLandingTip2') }}</div>
              <div>{{ t('channel.rebuildLandingTip3') }}</div>
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,.35);">
                {{ t('channel.rebuildLandingTipCdn') }}
              </div>
              <div style="margin-top: 4px; font-size: 12px; opacity: .85;">
                {{ t('channel.rebuildLandingTipFooter') }}
              </div>
            </div>
          </template>
          <el-button
            v-auth="['channel:save']"
            type="warning"
            :loading="rebuilding"
            :disabled="rebuilding"
            @click="handleRebuildLanding"
          >
            <ma-svg-icon name="material-symbols:sync-rounded" :size="16" class="mr-1" />
            {{ t('channel.rebuildLanding') }}
          </el-button>
        </el-tooltip>
        <el-button
          v-auth="['channel:save']"
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
            v-auth="['channel:save']"
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
        <ChannelForm ref="formRef" :form-type="formType" :data="data" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">

</style>
