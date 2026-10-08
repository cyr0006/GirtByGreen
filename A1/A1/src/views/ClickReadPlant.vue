<script setup>
import CRPTable from '../components/crp_datatable.vue'
</script>

<template>
  <div class="px-8 pt-10 mb-8 text-left">
    <h1 class="text-4xl font-bold mb-2">Click, Read &amp; Plant</h1>
    <p class="text-gray-500 mb-4">
      Find your next tree planting opportunity and make a difference!
    </p>
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
