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
import { colorOr, THEME_COLOR_FIELDS } from '../data/colorFields.ts'

/**
 * 主题实时预览：把 16 个颜色按它们的实际用途渲染成一个「手机样张」，编辑颜色时立刻能看到效果.
 *
 * 样张里填了分类标签、卡片、两列、列表、按钮、底部菜单等常见元素，目的是让每个颜色都有
 * 可见的着落（不然只有几块内容会显得很空、也判断不出配色好坏）。
 * 所有颜色都取自 props，辅助元素（分隔线、图标占位）用 currentColor + 透明度实现，
 * 不引入任何写死的色值——否则预览就失真了。
 *
 * 兜底色统一取自 colorFields 里各字段的 default（即「套用示例配色」那套），
 * 不在这里再写一遍色值——加/改配色只需动 colorFields.ts 一处。
 */
const props = defineProps<{
  /** 颜色值集合，键为字段名 */
  colors: Record<string, any>
}>()

const FALLBACK_COLORS: Record<string, string> = Object.fromEntries(
  THEME_COLOR_FIELDS.map(field => [field.key, field.default]),
)

/** 取某字段的当前色；为空时回落到该字段的预设色，避免样张出现「透明块」 */
function c(key: string): string {
  return colorOr(props.colors?.[key], FALLBACK_COLORS[key] ?? 'transparent')
}
</script>

<template>
  <div class="tp-phone">
    <!-- 头部：返回 / 标题 / 更多 -->
    <div
      class="tp-header"
      :style="{
        background: c('header_bg_color'),
        color: c('header_text_color'),
      }"
    >
      <span class="tp-header-icon">‹</span>
      <span class="tp-header-title">主题预览</span>
      <span class="tp-header-icon">⋯</span>
    </div>

    <!-- 内容区 -->
    <div
      class="tp-body"
      :style="{
        background: c('bg_color'),
        color: c('text_color'),
      }"
    >
      <!-- 分类标签：选中项用「文本选中颜色」 -->
      <div class="tp-tabs">
        <span :style="{ color: c('text_selected_color') }">推荐</span>
        <span class="tp-dim">最新</span>
        <span class="tp-dim">热门</span>
      </div>

      <!-- 卡片 -->
      <div
        class="tp-card"
        :style="{
          background: c('card_bg_color'),
          borderColor: c('card_border_color'),
        }"
      >
        <div
          class="tp-card-title"
          :style="{
            background: c('card_title_bg_color'),
            color: c('card_title_text_color'),
          }"
        >
          卡片标题
        </div>
        <div class="tp-card-content">
          <p>这里是正文内容，用来看「文本颜色」在浅底上的可读性。</p>
          <p>关键字高亮：<span :style="{ color: c('text_selected_color') }">选中文字</span></p>
        </div>
      </div>

      <!-- 两列 -->
      <div class="tp-columns">
        <div
          class="tp-column"
          :style="{ background: c('double_column_bg_color') }"
        >
          <div class="tp-column-title" :style="{ color: c('double_column_title_text_color') }">
            两列标题
          </div>
          <div class="tp-dim">
            内容一
          </div>
        </div>
        <div
          class="tp-column"
          :style="{ background: c('double_column_bg_color') }"
        >
          <div class="tp-column-title" :style="{ color: c('double_column_title_text_color') }">
            两列标题
          </div>
          <div class="tp-dim">
            内容二
          </div>
        </div>
      </div>

      <!-- 数据统计：三格，填满中部并演示两列背景色的另一种用法 -->
      <div class="tp-stats">
        <div
          v-for="i in 3"
          :key="i"
          class="tp-stat"
          :style="{ background: c('double_column_bg_color') }"
        >
          <div class="tp-stat-value" :style="{ color: c('text_selected_color') }">
            {{ i * 128 }}
          </div>
          <div class="tp-stat-label tp-dim">
            指标 {{ i }}
          </div>
        </div>
      </div>

      <!-- 列表：缩略图色块复用「卡片标题背景」，分隔线复用「卡片边框色」 -->
      <div
        class="tp-list"
        :style="{
          background: c('card_bg_color'),
          borderColor: c('card_border_color'),
        }"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="tp-list-item"
          :style="{ borderColor: c('card_border_color') }"
        >
          <span
            class="tp-list-thumb"
            :style="{ background: c('card_title_bg_color') }"
          />
          <div class="tp-list-text">
            <div class="tp-list-title">
              列表项标题 {{ i }}
            </div>
            <div class="tp-list-desc tp-dim">
              列表项描述文字
            </div>
          </div>
        </div>
      </div>

      <!-- 按钮：margin-top:auto 把它压在内容区底部，更像真实的底部操作按钮 -->
      <button
        class="tp-button"
        type="button"
        :style="{
          background: c('button_bg_color'),
          color: c('button_text_color'),
        }"
      >
        主要按钮
      </button>
    </div>

    <!-- 底部菜单 -->
    <div
      class="tp-tabbar"
      :style="{
        background: c('bottom_menu_bg'),
        color: c('bottom_menu_text'),
      }"
    >
      <span>首页</span>
      <span :style="{ color: c('bottom_menu_selected_color') }">分类</span>
      <span>我的</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tp-phone {
  width: 100%;
  max-width: 380px;
  min-height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 22px rgb(0 0 0 / 10%);
  user-select: none;
}

.tp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 46px;
  padding: 0 14px;
  font-size: 15px;
  font-weight: 600;
}

.tp-header-title {
  font-size: 15px;
}

.tp-header-icon {
  font-size: 14px;
  opacity: 0.85;
}

.tp-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  min-height: 0;
}

// 辅助文字统一用 currentColor + 透明度，避免写死颜色
.tp-dim {
  opacity: 0.6;
}

.tp-tabs {
  display: flex;
  gap: 14px;
  font-size: 13px;
  font-weight: 600;
}

.tp-card {
  border: 1px solid transparent;
  border-radius: 10px;
  overflow: hidden;
}

.tp-card-title {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
}

.tp-card-content {
  padding: 10px 12px 12px;
  font-size: 13px;
  line-height: 1.7;

  p {
    margin: 0 0 4px;
  }

  p:last-child {
    margin-bottom: 0;
  }
}

.tp-columns {
  display: flex;
  gap: 10px;
}

.tp-column {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.tp-column-title {
  margin-bottom: 2px;
  font-weight: 600;
}

.tp-list {
  border: 1px solid transparent;
  border-radius: 10px;
  overflow: hidden;
}

// 数据统计三格
.tp-stats {
  display: flex;
  gap: 8px;
}

.tp-stat {
  flex: 1;
  padding: 8px 10px;
  border-radius: 10px;
  text-align: center;
  line-height: 1.5;
}

.tp-stat-value {
  font-size: 15px;
  font-weight: 700;
}

.tp-stat-label {
  font-size: 12px;
}

.tp-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid transparent;

  &:last-child {
    border-bottom: none;
  }
}

.tp-list-thumb {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 8px;
}

.tp-list-text {
  min-width: 0;
  font-size: 13px;
  line-height: 1.5;
}

.tp-list-title {
  font-weight: 600;
}

.tp-list-desc {
  font-size: 12px;
}

.tp-button {
  // 内容区是 column 布局 + gap，auto 外边距把按钮顶到底部（紧贴底部菜单），
  // 中间多出来的空间就落在列表与按钮之间，不会让按钮「悬在半空」
  margin-top: auto;
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: default;
}

.tp-tabbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 48px;
  font-size: 13px;
}

.tp-tabbar > span {
  padding: 4px 10px;
  border-radius: 8px;
}
</style>
