<script setup>
import CRPTable from '../components/crp_datatable.vue'
</script>

<template>
  <h1
    class="text-5xl font-bold mb-32 flex justify-center"
    style="color: var(--p-primary-color); margin-bottom: 15px; margin-top: 2rem"
  >
    Click, Read & Plant
  </h1>
  <p class="text-xl mb-8 text-surface-200 flex justify-center" style="margin-bottom: 50px">
    Find your next tree planting opportunity and make a difference!
  </p>
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
