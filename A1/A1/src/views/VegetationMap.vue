<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import VegetationService from '../service/VegetationService'

let map = null

onMounted(async () => {
  map = L.map('vegetation-map', {
    center: [-37.81, 144.96],
    zoom: 11,
  })

  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' +
      ' | Vegetation data &copy; State of Victoria (<a href="https://www.data.vic.gov.au/">data.vic.gov.au</a>), CC BY 4.0',
  }).addTo(map)

  const geojson = await VegetationService.getVegetationCover()

  const vegetationLayer = L.geoJSON(geojson, {
    style: {
      color: '#2f6b2f',
      weight: 1,
      fillColor: '#4caf50',
      fillOpacity: 0.5,
    },
  }).addTo(map)

  if (vegetationLayer.getBounds().isValid()) {
    map.fitBounds(vegetationLayer.getBounds(), { maxZoom: 13 })
  }

  L.control
    .layers({ OpenStreetMap: osm }, { 'Vegetation cover': vegetationLayer })
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
    Explore vegetation cover across metropolitan Melbourne.
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
