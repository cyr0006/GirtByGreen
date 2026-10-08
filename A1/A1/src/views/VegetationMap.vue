<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

let map = null

onMounted(() => {
  map = L.map('vegetation-map', {
    center: [-37.81, 144.96],
    zoom: 11,
  })

  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  const treeExtent = L.tileLayer(
    'https://tiles-ap1.arcgis.com/P744lA0wf4LlBZ84/arcgis/rest/services/Vicmap_Vegetation_Tree_Extent/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      opacity: 0.7,
      attribution:
        'Vegetation (tree extent) &copy; State of Victoria (<a href="https://www.data.vic.gov.au/">data.vic.gov.au</a>), CC BY 4.0',
    },
  ).addTo(map)

  L.control
    .layers({ OpenStreetMap: osm }, { 'Tree cover': treeExtent })
    .addTo(map)
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <h1
    class="text-5xl font-bold flex justify-center"
    style="color: var(--p-primary-color); margin-bottom: 15px; margin-top: 2rem"
  >
    Vegetation Cover Map
  </h1>
  <p class="text-xl mb-8 text-surface-200 flex justify-center" style="margin-bottom: 30px">
    Explore tree cover across Melbourne and Victoria.
  </p>
  <div class="vegetation-map-wrapper">
    <div id="vegetation-map" class="h-[70vh] w-full"></div>
  </div>
</template>

<style scoped>
.vegetation-map-wrapper {
  margin: 0 2rem 2rem;
}
</style>
