<script setup>
import NCPDisplay from '@/components/ncp/NCPDisplay.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const ncp = route.params.ncp
const format = route.params.format
</script>

<template>
  <DefaultLayout>
    <NCPDisplay :ncp="ncp" :format="format" />
  </DefaultLayout>
</template>
