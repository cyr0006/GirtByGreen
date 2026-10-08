const BASE_URL = 'https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/CoolingGreening/CoolingGreening/MapServer'

async function fetchLayer(layerId, outFields) {
  const params = new URLSearchParams({
    where: '1=1',
    outFields,
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '1000',
  })
  const res = await fetch(`${BASE_URL}/${layerId}/query?${params.toString()}`)
  if (!res.ok) throw new Error(`Request to layer ${layerId} failed: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Service returned an error')
  return (data.features || []).map((f) => f.attributes)
}

export default {
  async getSuburbCanopyData() {
    const [vegetation, change, heat] = await Promise.all([
      fetchLayer(22, 'LOCALITY,PERANYVEG,PERANYTREE'),
      fetchLayer(37, 'LOCALITY,PP_ANYVEG'),
      fetchLayer(62, 'LOCALITY,HVI_2018'),
    ])

    const rows = new Map()
    const getRow = (locality) => {
      if (!rows.has(locality)) {
        rows.set(locality, {
          locality,
          vegCoverPct: null,
          treeCoverPct: null,
          vegChangePct: null,
          heatVulnerabilityIndex: null,
        })
      }
      return rows.get(locality)
    }

    vegetation.forEach((r) => {
      const row = getRow(r.LOCALITY)
      row.vegCoverPct = r.PERANYVEG
      row.treeCoverPct = r.PERANYTREE
    })
    change.forEach((r) => {
      getRow(r.LOCALITY).vegChangePct = r.PP_ANYVEG
    })
    heat.forEach((r) => {
      getRow(r.LOCALITY).heatVulnerabilityIndex = r.HVI_2018
    })

    return Array.from(rows.values()).sort((a, b) => a.locality.localeCompare(b.locality))
  },
}
