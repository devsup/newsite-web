<!--
 - MineAdmin is committed to providing solutions for quickly building web applications
 - Please view the LICENSE file that was distributed with this source code,
 - For the full copyright and license information.
 - Thank you very much for using MineAdmin.
 -
 - @Author X.Mo<root@imoi.cn>
 - @Link   https://github.com/mineadmin
-->
<i18n lang="yaml">
en:
  title: Resource Picker
zh_CN:
  title: 资源选择器
zh_TW:
  title: 資源選擇器
</i18n>

<script setup lang="ts">
import { omit } from 'lodash-es'
import MaResourcePanel from './panel.vue'
import type { Resource } from './type.ts'

defineOptions({ name: 'MaResourcePicker' })

const emit = defineEmits<{
  cancel: []
  confirm: [selected: Resource[]]
}>()

const { localTrans: t } = useTrans()

const dialogVisible = defineModel<boolean>('visible', { default: false })
function onCancel() {
  dialogVisible.value = false
  emit('cancel')
}

function onConfirm(selected: any[]) {
  dialogVisible.value = false
  emit('confirm', selected)
}

// 获得所有attrs
const attrs = omit(useAttrs(), ['onConfirm', 'onCancel'])
</script>

<template>
  <MaDialog
    v-model="dialogVisible"
    class="resource-picker-dialog"
    :title="t('title')"
    append-to-body
    destroy-on-close
    align-center
    :footer="false"
    width="min(1280px, 92vw)"
  >
    <div class="resource-picker-body">
      <MaResourcePanel v-bind="attrs" :page-size="100" @cancel="onCancel" @confirm="onConfirm" />
    </div>
  </MaDialog>
</template>

<style scoped lang="scss">
.resource-picker-body {
  // 资源选择器按 10×10 展示，固定 595px 只能看到几行；高度跟随视口放大，同时限制上下限
  height: clamp(560px, 84vh, 900px);
}

// 取消/确认与分页器在底部操作区垂直居中，不要贴着内容区下沿偏高
:global(.resource-picker-dialog) {
  padding-bottom: 0;
}

:global(.resource-picker-dialog .el-dialog__body) {
  padding-bottom: 8px;
}

// MaDialog 即使 footer=false 仍会渲染一个空的 footer，占掉底部空间，导致分页/按钮看起来偏上
:global(.resource-picker-dialog .el-dialog__footer) {
  display: none;
}

:global(.resource-picker-dialog .ma-resource-panel__footer) {
  padding-top: 4px;
  padding-bottom: 4px;
  align-items: center;
}
</style>
