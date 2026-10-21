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
import { deleted, execute, list, save } from '$/mineadmin/hyperf-crontab/api/crontab.ts'
import useDialog from '@/hooks/useDialog.ts'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'
import { useMessage } from '@/hooks/useMessage.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

import CrontabFrom from './form.vue'
import Logs from './logs.vue'
import hasAuth from '@/utils/permission/hasAuth.ts'
import type { UseDrawerExpose } from '@/hooks/useDrawer.ts'
import useDrawer from '@/hooks/useDrawer.ts'
import getSearchItems from '$/mineadmin/hyperf-crontab/views/components/getSearchItems.tsx'

defineOptions({ name: 'plugin:mine-admin:crontab' })

const msg = useMessage()
const dictStore = useDictStore()
const formRef = ref()
const t = useTrans().globalTrans
const loading = ref(true)

const pagination = ref({
  page: 1,
  page_size: 10,
})

const data = ref<{ total: number, list: any[] }>({
  total: 0,
  list: [],
})

const formItems = getSearchItems(t)

function getCrontabList(params: Record<string, any> = {}) {
  loading.value = true
  list({ ...pagination.value, ...params }).then((res: any) => {
    data.value.total = res.data.total
    data.value.list = res.data.list as any[]
  }).catch((err) => {
    throw new Error(err)
  }).finally(() => {
    loading.value = false
  })
}

// 更新定时任务
function enableOrDisable(item: any) {
  item.status = !item.status
  save(item.id as number, item).then((res: any) => {
    res.code === ResultCode.SUCCESS ? msg.success(t('crud.updateSuccess')) : msg.error(res.message)
    getCrontabList()
  }).catch((err) => {
    throw new Error(err)
  })
}

// 执行定时任务
function executeTask(id: number) {
  execute([id]).then((res: any) => {
    if (res.code === ResultCode.SUCCESS) {
      msg.success(t('mineCrontab.op.executeSuccess'))
    }
    else {
      msg.error(t('mineCrontab.op.executeFail'))
    }
  })
}

// 删除
function handleDelete(id: number) {
  msg.delConfirm(t('crud.delDataMessage')).then(async () => {
    const response: any = await deleted([id])
    if (response.code === ResultCode.SUCCESS) {
      msg.success(t('crud.delSuccess'))
      getCrontabList()
    }
  })
}

// 抽屉配置
const maDrawer: UseDrawerExpose = useDrawer({
  size: '50%',
})

// 弹窗配置
const maDialog: UseDialogExpose = useDialog({
  alignCenter: true,
  // 保存数据
  ok: ({ formType }, okLoadingState: (state: boolean) => void) => {
    okLoadingState(true)
    if (['add', 'edit'].includes(formType)) {
      const elForm = formRef.value.maForm.getElFormRef()
      // 验证通过后
      elForm.validate().then(() => {
        switch (formType) {
          // 新增
          case 'add':
            formRef.value.add().then((res: any) => {
              res.code === ResultCode.SUCCESS ? msg.success(t('crud.createSuccess')) : msg.error(res.message)
              maDialog.close()
              getCrontabList()
            }).catch((err: any) => {
              msg.alertError(err)
            })
            break
            // 修改
          case 'edit':
            formRef.value.edit().then((res: any) => {
              res.code === 200 ? msg.success(t('crud.updateSuccess')) : msg.error(res.message)
              maDialog.close()
              getCrontabList()
            }).catch((err: any) => {
              msg.alertError(err)
            })
            break
        }
      }).catch()
    }
    else {
      maDialog.close()
    }
    okLoadingState(false)
  },
})

function handlePageChange(page: number) {
  pagination.value.page = page
  getCrontabList()
}

function handleSizeChange(size: number) {
  pagination.value.page_size = size
  pagination.value.page = 1 // 切换每页条数时通常回到第一页
  getCrontabList()
}

onMounted(() => {
  getCrontabList()
})
</script>

<template>
  <div class="mine-layout">
    <div class="mine-card">
      <!-- 表头：与 MaProTable 的 header 保持一致（主标题 16px + 副标题 14px 同一行，右侧按钮） -->
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0 flex items-baseline gap-4">
          <span class="shrink-0 text-base font-500">{{ t('mineCrontab.menu.index') }}</span>
          <span class="truncate text-sm text-[var(--el-text-color-regular)]">
            {{ t('mineCrontab.menu.description') }}
          </span>
        </div>
        <el-button
          v-auth="['plugin:mine-admin:crontab:create']"
          type="primary"
          class="shrink-0"
          @click="() => {
            maDialog.setTitle(t('mineCrontab.menu.save'))
            maDialog.open({ formType: 'add' })
          }"
        >
          {{ t('mineCrontab.menu.save') }}
        </el-button>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="mine-card">
      <ma-search
        :search-items="formItems"
        :options="{ cols: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, foldButtonShow: false }" @search="getCrontabList"
        @reset="getCrontabList"
      />
    </div>

    <!-- 空态 -->
    <div v-if="data.list.length === 0" class="mine-card">
      <el-empty>
        <el-button
          v-auth="['plugin:mine-admin:crontab:create']" type="primary" @click="() => {
            maDialog.setTitle(t('mineCrontab.menu.save'))
            maDialog.open({ formType: 'add' })
          }"
        >
          {{ t('mineCrontab.menu.save') }}
        </el-button>
      </el-empty>
    </div>

    <!-- 卡片列表 -->
    <div v-else v-loading="loading" class="mine-card">
      <div class="grid grid-cols-1 w-full gap-3 2xl:grid-cols-3 sm:grid-cols-2">
        <template v-for="item in data.list">
          <div
            class="crontab_box"
          >
            <div class="relative z-2 flex flex-1 flex-col">
              <div class="flex items-center justify-between gap-2">
                <span
                  class="inline-flex items-center gap-1.5 text-[13px] font-medium"
                  :class="item.status ? 'text-green-6 dark-text-green-4' : 'text-red-5 dark-text-red-4'"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="item.status ? 'bg-green-5' : 'bg-red-5'" />
                  {{ item.status ? t('mineCrontab.status.running') : t('mineCrontab.status.stopped') }}
                </span>
                <span class="shrink-0 text-[13px] text-gray-4 dark-text-gray-5">
                  {{ t(dictStore.t('crontab-type', item.type, 'i18n')) }}
                </span>
              </div>

              <div class="mt-3 break-words text-[15px] font-600 leading-6">
                {{ item.id }} - {{ item.name }}
              </div>
              <div class="mt-2 break-words text-[13px] text-gray-4 leading-5 dark-text-gray-5">
                {{ item.memo ?? '-' }}
              </div>

              <div class="mt-4 flex flex-col gap-2 text-[13px]">
                <div class="w-full flex items-start justify-between gap-3">
                  <span class="shrink-0 text-gray-4 dark-text-gray-5">{{ t('mineCrontab.cols.rule') }}</span>
                  <span class="min-w-0 break-all text-right text-gray-7 dark-text-gray-2">
                    {{ item.rule }}
                  </span>
                </div>
                <div class="w-full flex items-start justify-between gap-3">
                  <span class="shrink-0 text-gray-4 dark-text-gray-5">{{ t('mineCrontab.cols.value') }}</span>
                  <span class="min-w-0 break-all text-right text-gray-7 dark-text-gray-2">
                    {{ item.value }}
                  </span>
                </div>
                <div class="mt-1 flex gap-3 text-gray-4 dark-text-gray-5">
                  <span class="inline-flex items-center gap-1">
                    <ma-svg-icon
                      :name="item.is_singleton ? 'heroicons:check-16-solid' : 'heroicons:x-mark-16-solid'"
                      :size="14"
                    />
                    {{ t('mineCrontab.cols.singleton') }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <ma-svg-icon
                      :name="item.is_on_one_server ? 'heroicons:check-16-solid' : 'heroicons:x-mark-16-solid'"
                      :size="14"
                    />
                    {{ t('mineCrontab.cols.onOneServer') }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-auto w-full flex items-center justify-between pt-4">
              <div>
                <el-button v-auth="['plugin:mine-admin:crontab:save']" circle size="small">
                  <ma-svg-icon
                    :name="item.status ? 'material-symbols:pause-rounded' : 'material-symbols:play-arrow-rounded'"
                    :size="18" @click="enableOrDisable(item)"
                  />
                </el-button>
              </div>
              <el-dropdown>
                <el-button text size="small">
                  <ma-svg-icon name="i-si:more-square-horiz-fill" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-if="hasAuth('plugin:mine-admin:crontab:execute')" key="executeOnce"
                      @click="executeTask(item.id)"
                    >
                      {{ t('mineCrontab.op.executeOnce') }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      key="runLogs" divided @click="() => {
                        maDrawer.setTitle(`${item.name} - ${t('mineCrontab.op.runLogs')}`)
                        maDrawer.open({ formType: null, data: item })
                      }"
                    >
                      {{ t('mineCrontab.op.runLogs') }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="hasAuth('plugin:mine-admin:crontab:save')" key="edit" @click="() => {
                        maDialog.setTitle((`${t('mineCrontab.op.edit')} - ${item.name}`))
                        maDialog.open({ formType: 'edit', crontabData: item })
                      }"
                    >
                      {{ t('mineCrontab.op.edit') }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="hasAuth('plugin:mine-admin:crontab:delete')" key="delete"
                      @click="handleDelete(item.id)"
                    >
                      {{ t('mineCrontab.op.delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>
      </div>
      <div class="mt-4 flex justify-end">
        <el-pagination
          background layout="total, sizes, prev, pager, next, jumper" :total="data.total"
          @current-change="handlePageChange" @size-change="handleSizeChange"
        />
      </div>
    </div>

    <component :is="maDialog.Dialog">
      <template #default="{ formType, crontabData }">
        <!-- 新增、编辑任务表单 -->
        <CrontabFrom v-if="formType" ref="formRef" :form-type="formType" :crontab-data="crontabData" />
      </template>
    </component>
    <component :is="maDrawer.Drawer">
      <template #default="{ data }">
        <!-- 运行日志 -->
        <Logs :crontab-id="data.id" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
/* 搜索区未选择时占位文字默认偏浅（#a8abb2），提到次级文字色，白底上更清晰 */
:deep(.el-select__placeholder.is-transparent),
:deep(.el-input__inner::placeholder) {
  color: var(--el-text-color-secondary);
}

.crontab_box {
  @apply relative min-h-[220px] flex flex-col rounded-xl p-5 transition-all duration-200;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);

  /* 悬停时换主色描边并加深投影，静止态保持白底轻阴影，避免灰底发闷 */
  &:hover {
    border-color: var(--el-color-primary-light-3);
    box-shadow: var(--el-box-shadow);
    transform: translateY(-1px);
  }
}

.run-state {
  @apply -top-25 text-green-8 -right-25 !absolute opacity-[0.1];
}

.pause-state {
  @apply -top-25 text-red-5 -right-27 !absolute opacity-[0.1];
}

.memo {
  @apply text-gray-4;
}

.add-crontab {
  @apply flex justify-center items-center b-1 b-solid b-gray-3 hover:b-[rgb(var(--ui-primary))] rounded transition-all duration-200 ease-in-out cursor-pointer dark-b-dark-1 dark-hover:b-[rgb(var(--ui-primary))] text-gray-5 hover:text-[rgb(var(--ui-primary))];
}
</style>
