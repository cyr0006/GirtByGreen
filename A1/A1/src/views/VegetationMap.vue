<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'

let map = null

const TREE_EXTENT_URL =
  'https://tiles-ap1.arcgis.com/P744lA0wf4LlBZ84/arcgis/rest/services/Vicmap_Vegetation_Tree_Extent/MapServer/tile/{z}/{y}/{x}'
const HVI_URL =
  'https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/CoolingGreening/CoolingGreening/MapServer/62/query'
const FAUNA_URL =
  'https://biod-gis.mapshare.vic.gov.au/arcgis/rest/services/NatureKit/vba_threatened_fauna/MapServer/2/query'
const FLORA_URL =
  'https://biod-gis.mapshare.vic.gov.au/arcgis/rest/services/NatureKit/vba_threatened_flora/MapServer/2/query'
const METRO_BBOX = '144.5,-38.2,145.5,-37.5'

// Sequential (magnitude) ramp, single hue light->dark, from the dataviz skill's
// default palette (references/palette.md) - Heat Vulnerability Index is 0-5.
const HVI_RAMP = [
  '#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7',
  '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b',
]
function hviColor(v) {
  if (v == null || Number.isNaN(v)) return '#cccccc'
  const idx = Math.max(0, Math.min(HVI_RAMP.length - 1, Math.round((v / 5) * (HVI_RAMP.length - 1))))
  return HVI_RAMP[idx]
}

// Categorical (identity) slots 1 & 2, fixed order, from the same default palette.
const FAUNA_COLOR = '#2a78d6'
const FLORA_COLOR = '#eb6834'

function speciesMarker(latlng, color) {
  return L.circleMarker(latlng, {
    radius: 6,
    color: '#ffffff',
    weight: 1,
    fillColor: color,
    fillOpacity: 0.9,
  })
}

function speciesPopup(props) {
  const name = props.COMM_NAME || props.SCI_NAME || 'Unknown species'
  const sci = props.SCI_NAME ? `<br><i>${props.SCI_NAME}</i>` : ''
  const status = props.FFG_DESC || props.EPBC_DESC
  const year = props.START_YEAR
  const where = props.LOCN_DESC
  return [
    `<strong>${name}</strong>${sci}`,
    status ? `Status: ${status}` : null,
    year ? `Observed: ${year}` : null,
    where || null,
  ]
    .filter(Boolean)
    .join('<br>')
}

function toSpeciesMarkers(featureCollection, color) {
  return (featureCollection.features || []).map((feature) => {
    const [lng, lat] = feature.geometry.coordinates
    return speciesMarker([lat, lng], color).bindPopup(speciesPopup(feature.properties))
  })
}

async function fetchJson(url, params) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${url}?${qs}`)
  if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`)
  return res.json()
}

async function buildHeatVulnerabilityLayer() {
  const hvi = await fetchJson(HVI_URL, {
    where: '1=1',
    outFields: 'HVI_2018,LOCALITY',
    outSR: '4326',
    f: 'geojson',
  })
  return L.geoJSON(hvi, {
    style: (feature) => ({
      color: '#ffffff',
      weight: 1,
      fillColor: hviColor(feature.properties.HVI_2018),
      fillOpacity: 0.65,
    }),
    onEachFeature: (feature, layer) => {
      const { LOCALITY, HVI_2018 } = feature.properties
      layer.bindPopup(`<strong>${LOCALITY}</strong><br>Heat Vulnerability Index: ${HVI_2018 ?? 'n/a'} / 5`)
    },
  })
}

async function buildBiodiversityLayer() {
  const queryParams = {
    geometry: METRO_BBOX,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    where: '1=1',
    outFields: 'COMM_NAME,SCI_NAME,FFG_DESC,EPBC_DESC,START_YEAR,LOCN_DESC',
    outSR: '4326',
    f: 'geojson',
    resultRecordCount: '1000',
  }
  const [fauna, flora] = await Promise.all([
    fetchJson(FAUNA_URL, queryParams),
    fetchJson(FLORA_URL, queryParams),
  ])

  const sightings = L.markerClusterGroup()
  sightings.addLayers([
    ...toSpeciesMarkers(fauna, FAUNA_COLOR),
    ...toSpeciesMarkers(flora, FLORA_COLOR),
  ])
  return sightings
}

onMounted(async () => {
  map = L.map('vegetation-map', {
    center: [-37.81, 144.96],
    zoom: 11,
  })

  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  const treeExtent = L.tileLayer(TREE_EXTENT_URL, {
    maxZoom: 19,
    opacity: 0.7,
    attribution:
      'Vegetation, heat & biodiversity data &copy; State of Victoria (<a href="https://www.data.vic.gov.au/">data.vic.gov.au</a>), CC BY 4.0',
  }).addTo(map)

  const overlays = { 'Tree cover': treeExtent }

  const [hviLayer, biodiversityLayer] = await Promise.allSettled([
    buildHeatVulnerabilityLayer(),
    buildBiodiversityLayer(),
  ])

  if (hviLayer.status === 'fulfilled') {
    overlays['Heat vulnerability (2018)'] = hviLayer.value
  }
  if (biodiversityLayer.status === 'fulfilled') {
    overlays['Biodiversity sightings'] = biodiversityLayer.value
  }

  L.control.layers({ OpenStreetMap: osm }, overlays).addTo(map)
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
  <p class="text-xl mb-2 text-surface-200 flex justify-center">
    Explore tree cover, heat vulnerability and biodiversity across Melbourne and Victoria.
  </p>
  <p class="text-sm mb-6 text-surface-400 flex justify-center">
    Biodiversity sightings: <span style="color: #2a78d6">●</span> fauna ·
    <span style="color: #eb6834">●</span> flora (threatened species, Victorian Biodiversity Atlas)
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
