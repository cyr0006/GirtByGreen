<script setup>
import SuburbCanopyDataTable from '../components/SuburbCanopyDataTable.vue'
import BlurText from '../components/BlurText.vue'
import TypeText from '../components/TypeText.vue'
</script>

<template>
  <div class="px-8 pt-10 mb-8 text-left">
    <BlurText tag="h1" text="Suburb Canopy &amp; Heat Data" class="text-4xl font-bold mb-2" />
    <TypeText
      tag="p"
      class="text-muted-color mb-4"
      text="See how vegetation cover and heat vulnerability compare across Melbourne's suburbs."
      :loop="false"
      :typing-speed="20"
    />
  </div>
  <div class="suburb-table-wrapper">
    <SuburbCanopyDataTable></SuburbCanopyDataTable>
  </div>
</template>

<style scoped>
.suburb-table-wrapper {
  margin: 0 2rem;
  margin-top: 2rem;
}
</style>
