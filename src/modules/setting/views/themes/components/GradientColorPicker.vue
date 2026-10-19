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
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'

/**
 * 支持「纯色 + 渐变」的颜色选择器.
 *
 * 为什么不用 el-color-picker：它只支持纯色，而主题里的背景类颜色需要渐变
 * （如 linear-gradient(90deg, #e11d48, #f43f5e)）。这里引入 vue3-colorpicker
 * 与参考站点（../site/web 的主题管理）保持同一套交互——这是 AGENTS「不引入新 UI 库」
 * 的明确例外：它是专用颜色组件而非 UI 框架，且只在主题管理里使用。
 *
 * 交互说明：库自带的 isWidget=false 点击弹面板在 el-dialog 里不弹（弹出层事件被弹窗吞掉），
 * 所以这里改成 el-popover 挂触发器 + 库的内联面板（isWidget）：
 * 由 Element Plus 负责弹出与层级，库只负责渲染选色面板，稳且不挑环境。
 *
 * 值格式：纯色存 #rrggbb 等；渐变存完整 CSS linear-gradient(...) 串
 * （后端已放宽正则与字段长度，列表色板/预览也能直接渲染渐变）。
 */
const props = defineProps<{
  /** 当前颜色值（纯色或渐变 CSS 串） */
  modelValue?: string
  /** 仅允许纯色（如文本颜色这类不该用渐变的字段） */
  disableGradient?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const pureColor = ref('')
const gradientColor = ref('')

/** 从渐变串里提取第一个颜色字面量（#hex / rgb() / rgba() / hsl() / hsla()） */
function extractFirstColor(gradient: string): string {
  const matched = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))/.exec(gradient)
  return matched ? matched[1] : ''
}

/**
 * 我最后一次「推给库」的镜像值（纯色 / 渐变各一份）.
 *
 * 库在 props 被动变化时也会抛 pure-color-change / gradient-color-change，
 * 若照单回写就会把「外部刚设进来的渐变」用同步出来的纯色覆盖回去——这正是
 * 「点一次『套用示例配色』没有渐变、渐变色被截成第一个色」的原因。
 *
 * 所以这里记下我推过去的值：回调值与之相同即判定为被动同步、忽略；
 * 只有值不同（用户真的在面板里选了色）才回写，并且立即把它更新为新基线。
 */
let pushedPureColor = ''
let pushedGradientColor = ''

/**
 * 外部值变化时同步内部两份状态：
 * 含 gradient 视为渐变，同时从渐变里取第一个色作为纯色的兜底（切回「纯色」标签不是空色块）；
 * 是纯色时也要给 gradientColor 一个合法初值：留空会让面板的「渐变」标签首次打开是空白的、
 *   得再点一次才渲染出来（实测过的问题）。用「同色渐变」占位，用户不动它就不会改到原纯色。
 */
watch(() => props.modelValue, (value) => {
  const current = String(value ?? '')

  if (current.includes('gradient')) {
    pureColor.value = pushedPureColor = extractFirstColor(current) || pureColor.value
    gradientColor.value = pushedGradientColor = current
    return
  }

  pureColor.value = pushedPureColor = current

  if (!props.disableGradient && current) {
    gradientColor.value = pushedGradientColor = `linear-gradient(90deg, ${current} 0%, ${current} 100%)`
  }
}, { immediate: true })

/** 触发器上的色块样式：是渐变就整串铺上，否则纯色填充 */
const swatchStyle = computed(() => ({
  background: String(props.modelValue ?? '').includes('gradient')
    ? String(props.modelValue)
    : (props.modelValue || 'transparent'),
}))

function onPureChange(color: string): void {
  // 与「我推给库的镜像值」相同 → 外部赋值引起的被动回调，忽略
  if (color === pushedPureColor) {
    return
  }
  pushedPureColor = color
  emit('update:modelValue', color)
}

function onGradientChange(color: string): void {
  if (color === pushedGradientColor) {
    return
  }
  pushedGradientColor = color
  emit('update:modelValue', color)
}
</script>

<template>
  <el-popover
    trigger="click"
    placement="bottom-start"
    width="auto"
    :teleported="true"
    popper-class="gradient-color-picker__popper"
  >
    <template #reference>
      <span class="gradient-color-picker__swatch" :style="swatchStyle" />
    </template>

    <ColorPicker
      :pure-color="pureColor"
      :gradient-color="gradientColor"
      :use-type="disableGradient ? 'pure' : 'both'"
      format="hex"
      :is-widget="true"
      :disable-history="true"
      picker-type="chrome"
      @pure-color-change="onPureChange"
      @gradient-color-change="onGradientChange"
    />
  </el-popover>
</template>

<style scoped lang="scss">
.gradient-color-picker__swatch {
  display: inline-block;
  width: 52px;
  height: 26px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
}

:global(.gradient-color-picker__popper) {
  // 面板自己有内边距与边框，外层 popover 的 padding 归零，否则会「框大一圈、没包住」
  padding: 0 !important;
  border-radius: 8px;
}

:global(.gradient-color-picker__popper .vc-colorpicker) {
  margin: 0;
  width: 100%;
}
</style>
