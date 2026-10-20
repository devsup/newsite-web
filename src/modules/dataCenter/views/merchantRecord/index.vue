<script setup lang="ts">
import EventRecordPage from '../components/EventRecordPage.vue'
import { merchantRecordPage } from '~/dataCenter/api/dataCenter'

defineOptions({ name: 'dataCenter:merchantRecord' })
</script>

<template>
  <EventRecordPage
    :endpoint="merchantRecordPage"
    title-key="dataCenter.merchantRecord.title"
    subtitle-key="dataCenter.merchantRecord.subtitle"
    :event-types="[3]"
    show-merchant
  />
</template>
