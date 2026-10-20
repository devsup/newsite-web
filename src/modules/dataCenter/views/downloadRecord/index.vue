<script setup lang="ts">
import EventRecordPage from '../components/EventRecordPage.vue'
import { downloadRecordPage } from '~/dataCenter/api/dataCenter'

defineOptions({ name: 'dataCenter:downloadRecord' })
</script>

<template>
  <EventRecordPage
    :endpoint="downloadRecordPage"
    title-key="dataCenter.downloadRecord.title"
    subtitle-key="dataCenter.downloadRecord.subtitle"
    :event-types="[4]"
    variant="download"
  />
</template>
