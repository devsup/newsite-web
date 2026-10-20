<script setup lang="ts">
import EventRecordPage from '../components/EventRecordPage.vue'
import { channelRecordPage } from '~/dataCenter/api/dataCenter'

defineOptions({ name: 'dataCenter:channelRecord' })
</script>

<template>
  <EventRecordPage
    :endpoint="channelRecordPage"
    title-key="dataCenter.channelRecord.title"
    subtitle-key="dataCenter.channelRecord.subtitle"
    :event-types="[1, 2, 5]"
    show-deducted
  />
</template>
