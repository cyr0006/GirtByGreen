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

// Vicmap's hosted FeatureServer hangs for 8s+ (no error, just dead air)
// whenever a query ANDs two LIKE predicates together, e.g.
// `road_name LIKE 'MAIN%' AND locality_name LIKE 'MELB%'` - confirmed by
// timing dozens of query shapes directly against the service. A single LIKE
// predicate (optionally ANDed with an exact house_number_1 match) reliably
// stays well under ~2s. So for a "<street> <suburb>" query we filter
// server-side on the street only, pull a larger batch, and narrow to the
// suburb client-side rather than asking the service to AND both.
const STREET_BATCH_SIZE = '300'

function parseWords(query) {
  return query
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

// Returns { where, suburbWord } - suburbWord is set when the suburb filter
// needs to be applied client-side (see fetch above) rather than in `where`.
function buildAddressQuery(query) {
  const words = parseWords(query)
  if (words.length === 0) return null

  let houseNumber = null
  let rest = words
  if (/^\d+$/.test(words[0])) {
    houseNumber = words[0]
    rest = words.slice(1)
  }
  if (rest.length === 0) return null

  const houseClause = houseNumber ? `house_number_1=${houseNumber} AND ` : ''

  if (rest.length === 1) {
    // Could be a street name or a suburb - try both. Only one LIKE clause
    // either way (OR, not AND), so this stays fast.
    const word = rest[0]
    return { where: `${houseClause}(road_name LIKE '${word}%' OR locality_name LIKE '${word}%')` }
  }

  // Natural typed order: "<number> <street words...> <suburb>" - take the
  // first remaining word as the street name and the last as the suburb.
  const roadWord = rest[0]
  const suburbWord = rest[rest.length - 1]
  return { where: `${houseClause}road_name LIKE '${roadWord}%'`, suburbWord }
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
    const built = buildAddressQuery(query)
    if (!built) {
      addressSuggestions.value = []
      return
    }
    const { where, suburbWord } = built
    try {
      const data = await fetchJson(
        ADDRESS_URL,
        {
          where,
          outFields: 'ezi_address,locality_name',
          outSR: '4326',
          f: 'geojson',
          resultRecordCount: suburbWord ? STREET_BATCH_SIZE : '8',
        },
        { timeoutMs: 8000 },
      )
      let features = data.features || []
      if (suburbWord) {
        features = features.filter((f) => f.properties.locality_name?.startsWith(suburbWord))
      }
      addressSuggestions.value = features.slice(0, 8).map((feature) => ({
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
