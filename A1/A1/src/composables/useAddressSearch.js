import { ref } from 'vue'

const ADDRESS_URL =
  'https://services-ap1.arcgis.com/P744lA0wf4LlBZ84/arcgis/rest/services/Vicmap_Address/FeatureServer/0/query'

async function fetchJson(url, params, { timeoutMs } = {}) {
  const qs = new URLSearchParams(params).toString()
  const controller = timeoutMs ? new AbortController() : null
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null
  try {
    const res = await fetch(`${url}?${qs}`, controller ? { signal: controller.signal } : {})
    if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error.message || data.error.details?.[0] || 'Service returned an error')
    return data
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// Query Vicmap's structured fields (house_number_1 / road_name / locality_name)
// with prefix matches rather than a substring search on the combined address
// string. A leading-wildcard LIKE '%...%' on `ezi_address` (a multi-million-row
// statewide table) measured 10s+ or outright hung on this service once two or
// more words were involved; prefix matches ('WORD%') on the structured fields
// come back in well under a second, AND'd together or not.
function buildAddressWhereClause(query) {
  const words = query
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  if (words.length === 0) return null

  let houseNumber = null
  let rest = words
  if (/^\d+$/.test(words[0])) {
    houseNumber = words[0]
    rest = words.slice(1)
  }
  if (rest.length === 0) return null

  const conditions = []
  if (houseNumber) conditions.push(`house_number_1=${houseNumber}`)

  if (rest.length === 1) {
    // Could be a street name or a suburb - try both.
    const word = rest[0]
    conditions.push(`(road_name LIKE '${word}%' OR locality_name LIKE '${word}%')`)
  } else {
    // Natural typed order: "<number> <street words...> <suburb>" - take the
    // first remaining word as the street name and the last as the suburb.
    // (They can legitimately be the same word, e.g. "Emerald Lake Rd, Emerald" -
    // road_name and locality_name are different fields, so no need to dedupe.)
    const roadWord = rest[0]
    const suburbWord = rest[rest.length - 1]
    conditions.push(`road_name LIKE '${roadWord}%'`)
    conditions.push(`locality_name LIKE '${suburbWord}%'`)
  }

  return conditions.join(' AND ')
}

// Debounced Vicmap address autocomplete, shared by any view that needs to
// resolve a Victorian address to {lat, lng, locality}.
export function useAddressSearch() {
  const addressSuggestions = ref([])
  const addressError = ref('')

  async function searchAddress(event) {
    const query = event.query?.trim()
    addressError.value = ''
    if (!query || query.length < 3) {
      addressSuggestions.value = []
      return
    }
    const where = buildAddressWhereClause(query)
    if (!where) {
      addressSuggestions.value = []
      return
    }
    try {
      const data = await fetchJson(
        ADDRESS_URL,
        {
          where,
          outFields: 'ezi_address,locality_name',
          outSR: '4326',
          f: 'geojson',
          resultRecordCount: '8',
          orderByFields: 'ezi_address',
        },
        { timeoutMs: 8000 },
      )
      addressSuggestions.value = (data.features || []).map((feature) => ({
        label: feature.properties.ezi_address,
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        locality: feature.properties.locality_name,
      }))
    } catch (err) {
      addressSuggestions.value = []
      addressError.value =
        err?.name === 'AbortError'
          ? 'Address search timed out - try again.'
          : 'Address search failed - try again.'
      console.error('Address search failed:', err)
    }
  }

  return { addressSuggestions, addressError, searchAddress }
}
