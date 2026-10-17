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
import './style.scss'
import { useSiteStore } from '@/store/modules/useSiteStore.ts'
import Dashed from './components/dashed.vue'
import Light from './components/light.vue'
import Slogan from './components/slogan.vue'
import Logo from './components/logo.vue'
import LoginForm from './components/login-form.vue'
import LanguageSwitch from './components/language-switch.vue'

// 左侧大图取系统设置「站点背景」（site_image）；未配置时保持内置深蓝底 + 光效
const site = useSiteStore()
site.load()
const leftBgStyle = computed(() => site.image
  ? { backgroundImage: `url("${site.image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : {})
</script>

<template>
  <!-- 右侧留 4% 的边距：表单宽度固定后如果贴右边缘会显得很挤 -->
  <div class="box-border h-full min-w-[380px] w-full flex items-center justify-center overflow-hidden border-1 bg-blue-950 lg:justify-between lg:gap-x-10 lg:bg-white lg:pr-[4%]">
    <div class="relative hidden h-full flex-1 md:hidden lg:flex">
      <div class="gradient-rainbow" :style="leftBgStyle" />
      <Dashed />
      <Light />
      <Slogan />
    </div>
    <div class="login-form-container">
      <Logo />
      <LoginForm />
      <LanguageSwitch />
    </div>
    <!-- 下面兼容移动端的 -->
    <!-- 移动端：背景图与桌面端左侧同一张（系统设置 → 站点背景）；
         这一层放 z-0 垫在表单下面，原来的 z-4 会把背景图和表单一起盖住 -->
    <div
      class="login-mobile-bg min-[380px] relative left-0 top-0 z-0 h-full max-w-[1024px] w-full flex lg:hidden"
      :style="leftBgStyle"
    >
      <Dashed />
      <Light />
    </div>
  </div>
</template>
