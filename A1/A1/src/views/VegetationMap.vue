<script setup>
import { reactive, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import Card from 'primevue/card'
import ToggleSwitch from 'primevue/toggleswitch'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'

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
function gradientCss(ramp) {
  return `linear-gradient(to right, ${ramp.join(', ')})`
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

async function buildTreeCoverLayer() {
  return L.tileLayer(TREE_EXTENT_URL, {
    maxZoom: 19,
    opacity: 0.7,
    attribution:
      'Vegetation, heat & biodiversity data &copy; State of Victoria (<a href="https://www.data.vic.gov.au/">data.vic.gov.au</a>), CC BY 4.0',
  })
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

// Each entry drives both the map layer and its own on/off + legend UI - the
// legend only ever reflects the layer(s) actually switched on (see template).
const layers = reactive([
  {
    key: 'treeCover',
    label: 'Tree cover',
    description: 'Statewide tree canopy classification (Vicmap Vegetation Tree Extent).',
    visible: false,
    loading: false,
    error: null,
    instance: null,
    build: buildTreeCoverLayer,
    legend: { kind: 'swatch', color: '#2f6b2f', opacity: 0.7, label: 'Tree canopy' },
  },
  {
    key: 'heatVulnerability',
    label: 'Heat vulnerability (2018)',
    description: 'Suburb-level index combining heat exposure with population vulnerability.',
    visible: false,
    loading: false,
    error: null,
    instance: null,
    build: buildHeatVulnerabilityLayer,
    legend: { kind: 'gradient', ramp: HVI_RAMP, minLabel: 'Low', maxLabel: 'High' },
  },
  {
    key: 'biodiversity',
    label: 'Biodiversity sightings',
    description: 'Threatened species records near Melbourne (Victorian Biodiversity Atlas, sample of up to 1000 per group).',
    visible: false,
    loading: false,
    error: null,
    instance: null,
    build: buildBiodiversityLayer,
    legend: {
      kind: 'categories',
      items: [
        { label: 'Fauna', color: FAUNA_COLOR },
        { label: 'Flora', color: FLORA_COLOR },
      ],
    },
  },
])

async function setLayerVisible(entry, nextVisible) {
  if (nextVisible) {
    if (!entry.instance) {
      entry.loading = true
      entry.error = null
      try {
        entry.instance = await entry.build()
      } catch {
        entry.error = 'Could not load this layer right now.'
        entry.loading = false
        return
      }
      entry.loading = false
    }
    map.addLayer(entry.instance)
    entry.visible = true
  } else {
    if (entry.instance) {
      // Closing any open popup first avoids a leaflet.markercluster/Leaflet 1.9
      // bug where a popup left open on a removed marker keeps a stale zoom-anim
      // listener registered on the map, crashing on the next zoom.
      map.closePopup()
      map.removeLayer(entry.instance)
    }
    entry.visible = false
  }
}

onMounted(async () => {
  map = L.map('vegetation-map', {
    center: [-37.81, 144.96],
    zoom: 11,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  await setLayerVisible(
    layers.find((l) => l.key === 'treeCover'),
    true,
  )
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
  <p class="text-xl mb-8 text-surface-200 flex justify-center">
    Explore tree cover, heat vulnerability and biodiversity across Melbourne and Victoria.
  </p>

  <div class="vegetation-map-wrapper flex flex-col lg:flex-row gap-4">
    <div
      id="vegetation-map"
      class="h-[70vh] w-full lg:flex-1 rounded-xl overflow-hidden border border-surface-200 shadow-md"
    ></div>

    <Card class="w-full lg:w-80 shrink-0">
      <template #title>Map layers</template>
      <template #content>
        <div class="flex flex-col gap-5">
          <div v-for="entry in layers" :key="entry.key" class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-3">
              <label :for="entry.key" class="text-sm font-medium cursor-pointer">{{ entry.label }}</label>
              <div class="flex items-center gap-2">
                <ProgressSpinner
                  v-if="entry.loading"
                  style="width: 16px; height: 16px"
                  strokeWidth="6"
                />
                <Tag v-else-if="entry.error" severity="danger" value="Unavailable" />
                <ToggleSwitch
                  :inputId="entry.key"
                  :modelValue="entry.visible"
                  :disabled="entry.loading"
                  @update:modelValue="(val) => setLayerVisible(entry, val)"
                />
              </div>
            </div>
            <p class="text-xs text-surface-400">{{ entry.description }}</p>

            <div v-if="entry.visible && !entry.loading && !entry.error" class="pt-1">
              <div v-if="entry.legend.kind === 'swatch'" class="flex items-center gap-2 text-xs">
                <span
                  class="inline-block w-4 h-4 rounded shrink-0"
                  :style="{ backgroundColor: entry.legend.color, opacity: entry.legend.opacity }"
                ></span>
                <span>{{ entry.legend.label }}</span>
              </div>

              <div v-else-if="entry.legend.kind === 'gradient'">
                <div class="h-3 rounded-full" :style="{ background: gradientCss(entry.legend.ramp) }"></div>
                <div class="flex justify-between text-xs text-surface-400 mt-1">
                  <span>{{ entry.legend.minLabel }}</span>
                  <span>{{ entry.legend.maxLabel }}</span>
                </div>
              </div>

              <div v-else-if="entry.legend.kind === 'categories'" class="flex flex-col gap-1">
                <div
                  v-for="item in entry.legend.items"
                  :key="item.label"
                  class="flex items-center gap-2 text-xs"
                >
                  <span
                    class="inline-block w-3 h-3 rounded-full shrink-0"
                    :style="{ backgroundColor: item.color }"
                  ></span>
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.vegetation-map-wrapper {
  margin: 0 2rem 2rem;
}
</style>
