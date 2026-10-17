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

import { deleteByIds, page, rebuildLanding } from '~/channel/api/channel'
import getSearchItems from './data/getSearchItems.tsx'
import getTableColumns from './data/getTableColumns.tsx'
import useDialog from '@/hooks/useDialog.ts'
import { useMessage } from '@/hooks/useMessage.ts'
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

/**
 * 重建全部落地页：落地页内容是从系统设置「烘焙」进静态文件的
 *（背景图 / 安装包地址 / 自动下载开关），所以改完系统设置点一次即可全量刷新。
 */
function handleRebuildLanding(): void {
  msg.confirm(t('channel.rebuildLandingConfirm')).then(async () => {
    const response = await rebuildLanding()
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('channel.rebuildLandingSuccess', {
        generated: response.data?.generated ?? 0,
        total: response.data?.total ?? 0,
      }))
    }
    else {
      msg.error(response.message)
    }
  })
}

/**
 * 批量重建所选渠道的落地页：勾选几条就只重建这几条，
 * 比「全部重建」更适合「只改了某几个渠道的 JS 代码 / 只想刷新某几个」的场景。
 */
function handleRebuildSelected(): void {
  const ids = selections.value.map((item: any) => item.id)
  msg.confirm(t('channel.rebuildLandingSelectedConfirm', { count: ids.length })).then(async () => {
    const response = await rebuildLanding(ids)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('channel.rebuildLandingSuccess', {
        generated: response.data?.generated ?? 0,
        total: response.data?.total ?? 0,
      }))
      proTableRef.value.refresh()
    }
    else {
      msg.error(response.message)
    }
  })
}

// 批量删除
function handleDelete(): void {
  const ids = selections.value.map((item: any) => item.id)
  msg.confirm(t('crud.delMessage')).then(async () => {
    const response = await deleteByIds(ids)
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.delSuccess'))
      proTableRef.value.refresh()
    }
  })
}
</script>

<template>
  <div class="mine-layout pt-3">
    <!-- 落地页是静态文件：改完系统设置不会自动生效，这条提示常驻显示（副标题放不下这么长的说明） -->
    <el-alert
      class="mb-3"
      type="warning"
      :closable="false"
      show-icon
      :title="t('channel.rebuildLandingNotice')"
    />

    <MaProTable ref="proTableRef" :options="options" :schema="schema">
      <template #actions>
        <!-- 落地页是「烘焙」出来的静态文件，系统设置改了不会自动生效，所以这个按钮用醒目的 warning 色，
             并用悬浮说明列清楚「哪些改动需要重建」——否则很容易改了背景图/安装包却忘了点 -->
        <el-tooltip placement="bottom" :show-after="120">
          <template #content>
            <div style="line-height: 1.7;">
              <div style="font-weight: 600;">
                {{ t('channel.rebuildLandingTipTitle') }}
              </div>
              <div>{{ t('channel.rebuildLandingTip1') }}</div>
              <div>{{ t('channel.rebuildLandingTip2') }}</div>
              <div>{{ t('channel.rebuildLandingTip3') }}</div>
              <div style="margin-top: 4px; font-size: 12px; opacity: .85;">
                {{ t('channel.rebuildLandingTipFooter') }}
              </div>
            </div>
          </template>
          <el-button
            v-auth="['channel:save']"
            type="warning"
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
        <el-button
          v-auth="['channel:delete']"
          type="danger"
          plain
          :disabled="selections.length < 1"
          @click="handleDelete"
        >
          {{ t('crud.delete') }}
        </el-button>
        <!-- 与「删除」并排：列表有多选，勾几条就只重建这几条 -->
        <el-button
          v-auth="['channel:save']"
          type="warning"
          plain
          :disabled="selections.length < 1"
          @click="handleRebuildSelected"
        >
          {{ t('channel.rebuildLandingSelected') }}
        </el-button>
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
