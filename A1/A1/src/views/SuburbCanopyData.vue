<script setup>
import SuburbCanopyDataTable from '../components/SuburbCanopyDataTable.vue'
</script>

<template>
  <h1
    class="text-5xl font-bold mb-32 flex justify-center"
    style="color: var(--p-primary-color); margin-bottom: 15px; margin-top: 2rem"
  >
    Suburb Canopy & Heat Data
  </h1>
  <p class="text-xl mb-8 text-surface-200 flex justify-center" style="margin-bottom: 50px">
    See how vegetation cover and heat vulnerability compare across Melbourne's suburbs.
  </p>
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
