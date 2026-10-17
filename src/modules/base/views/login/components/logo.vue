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

// logo 图与名称都来自系统设置（站点图标 / 站点名称），与后台左上角完全一致；
// 未配置时回退到内置 SVG 与 VITE_APP_TITLE
const site = useSiteStore()
site.load()
const appTitle = computed(() => site.name)
</script>

<template>
  <div class="relative min-w-0 w-full flex items-center justify-center gap-x-3">
    <img :alt="appTitle" :src="site.icon || LogoSvg" class="login-logo">
    <h3 class="min-w-0 truncate text-4xl text-white tracking-[3px] lg:text-[#2d2d33ff]">
      {{ appTitle }}
    </h3>
  </div>
</template>
