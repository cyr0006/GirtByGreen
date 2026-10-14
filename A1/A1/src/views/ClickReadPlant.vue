<script setup>
import CRPTable from '../components/crp_datatable.vue'
import BlurText from '../components/BlurText.vue'
import TypeText from '../components/TypeText.vue'
</script>

<template>
  <div class="px-8 pt-10 mb-8 text-left">
    <BlurText tag="h1" text="Click, Read &amp; Plant" class="text-4xl font-bold mb-2" />
    <TypeText
      tag="p"
      class="text-muted-color mb-4"
      text="Find your next tree planting opportunity and make a difference!"
      :loop="false"
      :typing-speed="20"
    />
  </div>
  <div class="crp-table-wrapper">
    <CRPTable></CRPTable>
  </div>
</template>

<style scoped>
.crp-table-wrapper {
  margin: 0 2rem;
  margin-top: 2rem;
}
</style>
