<script setup lang="ts">
import type { CategoryVo } from '~/merchant/api/category'

defineOptions({ name: 'merchant:category:dailyPlaceholder' })

const { category } = defineProps<{
  category?: CategoryVo | null
}>()

const t = useTrans().globalTrans
</script>

<template>
  <div class="daily-placeholder">
    <div class="daily-placeholder__icon">
      <ma-svg-icon name="ant-design:bar-chart-outlined" :size="30" />
    </div>
    <div class="daily-placeholder__title">
      {{ t('category.dailyPlaceholderTitle', { name: category?.name || '-' }) }}
    </div>
    <div class="daily-placeholder__desc">
      {{ t('category.dailyPlaceholderDesc') }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.daily-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  padding: 24px;
  text-align: center;
}

.daily-placeholder__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  color: rgb(var(--ui-primary));
  background: rgb(var(--ui-primary) / 10%);
}

.daily-placeholder__title {
  font-size: 15px;
  font-weight: 600;
}

.daily-placeholder__desc {
  max-width: 360px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.7;
}
</style>
