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
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const userStore = useUserStore()

/**
 * 登录页底部的语言切换.
 *
 * 原来这里还带着「© 年份 + 备案号」的版权行，版权信息已按需求移除，只保留语言切换。
 */
function switchLanguage(language: string): void {
  locale.value = language
  userStore.setLanguage(language)
}
</script>

<template>
  <div class="absolute bottom-5 z-30 w-[335px] text-center text-sm text-gray-3 lg:text-gray-5">
    <div class="flex justify-center gap-x-2 text-sm">
      <a v-for="item in userStore.getLocales()" :key="item.value" class="trans-link" @click="() => switchLanguage(item.value)">
        {{ item.label }}
      </a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.trans-link {
  /* 手机上语言切换压在背景图上，浅色照片里灰字几乎看不见，加一层阴影兜底（桌面取消） */
  @apply text-gray-3 lg:text-gray-7 lg:hover-text-gray-9 cursor-pointer decoration-none
    drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] lg:drop-shadow-none;
}
</style>
