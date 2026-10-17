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
import LogoSvg from '@/assets/images/logo.svg'
import { useSiteStore } from '@/store/modules/useSiteStore.ts'

/**
 * 登录页左侧的品牌区（站点图标 + 站点名称）.
 *
 * 只保留这两项：版本号、副标题（一款开箱即用的…）、技术栈图标都已按需求移除；
 * 图标与名称都取系统设置，与后台左上角、右侧登录框的 logo 完全一致。
 */
const site = useSiteStore()
site.load()
</script>

<template>
  <div class="absolute left-10 z-10 w-[80%] text-white">
    <!-- 背景图由系统设置提供，可能是浅色照片：图标和文字都加一层阴影保证可读 -->
    <div class="mt-5 flex items-center gap-x-3">
      <img
        :alt="site.name"
        :src="site.icon || LogoSvg"
        class="login-slogan-logo"
      >
      <p class="text-[35px] font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
        {{ site.name }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 与右侧登录框的图标同尺寸同圆角（44px + 11px），压在背景图上时用阴影托一下 */
.login-slogan-logo {
  @apply h-[44px] w-[44px] shrink-0 rounded-[11px] object-cover
    drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)];
}
</style>
