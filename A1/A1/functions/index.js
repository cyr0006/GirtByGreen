const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const sgMail = require('@sendgrid/mail')
const admin = require('firebase-admin')

admin.initializeApp()

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')
const GROQ_API_KEY = defineSecret('GROQ_API_KEY')
const GROQ_MODEL = 'openai/gpt-oss-120b'

// Must be a Single Sender you verified in SendGrid, or an address on a domain you authenticated there.
const FROM_EMAIL = 'acyrus0007@gmail.com'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

exports.sendPlantsCsvEmail = onCall({ secrets: [SENDGRID_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to email the plant list.')
  }

  const { to, csv } = request.data || {}

  if (typeof to !== 'string' || !EMAIL_RE.test(to)) {
    throw new HttpsError('invalid-argument', 'A valid recipient email address is required.')
  }
  if (typeof csv !== 'string' || !csv.trim()) {
    throw new HttpsError('invalid-argument', 'CSV content is required.')
  }

  sgMail.setApiKey(SENDGRID_API_KEY.value())

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: 'Your GirtByGreen plant list export',
      text: 'Attached is the plant list you exported from GirtByGreen.',
      attachments: [
        {
          content: Buffer.from(csv, 'utf-8').toString('base64'),
          filename: 'plants.csv',
          type: 'text/csv',
          disposition: 'attachment',
        },
      ],
    })
  } catch (err) {
    console.error('SendGrid send failed', err?.response?.body || err)
    throw new HttpsError('internal', 'Failed to send email.')
  }

  return { success: true }
})

const COOLING_GREENING_URL =
  'https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/CoolingGreening/CoolingGreening/MapServer'
const FAUNA_URL =
  'https://biod-gis.mapshare.vic.gov.au/arcgis/rest/services/NatureKit/vba_threatened_fauna/MapServer/2/query'
const FLORA_URL =
  'https://biod-gis.mapshare.vic.gov.au/arcgis/rest/services/NatureKit/vba_threatened_flora/MapServer/2/query'
const SPECIES_CAP = 15
const SPECIES_RADIUS_KM = 1.5

async function fetchJson(url, params, timeoutMs = 8000) {
  const qs = new URLSearchParams(params).toString()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${url}?${qs}`, { signal: controller.signal })
    if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error.message || data.error.details?.[0] || 'Service returned an error')
    return data
  } finally {
    clearTimeout(timer)
  }
}

// Same class of fix as the address WHERE-clause builder: single-quote-escape
// user-derived text before interpolating it into an ArcGIS WHERE clause.
function escapeForWhere(value) {
  return String(value).replace(/'/g, "''")
}

async function fetchSuburbStats(locality) {
  const where = `LOCALITY='${escapeForWhere(locality)}'`
  const base = { where, returnGeometry: 'false', f: 'json', resultRecordCount: '1' }
  const [vegetation, change, heat] = await Promise.all([
    fetchJson(`${COOLING_GREENING_URL}/22/query`, { ...base, outFields: 'PERANYVEG,PERANYTREE' }),
    fetchJson(`${COOLING_GREENING_URL}/37/query`, { ...base, outFields: 'PP_ANYVEG' }),
    fetchJson(`${COOLING_GREENING_URL}/62/query`, { ...base, outFields: 'HVI_2018' }),
  ])
  const vegAttrs = vegetation.features?.[0]?.attributes
  const changeAttrs = change.features?.[0]?.attributes
  const heatAttrs = heat.features?.[0]?.attributes
  if (!vegAttrs && !changeAttrs && !heatAttrs) return null // no data for this area - a valid result, not an error
  return {
    vegCoverPct: vegAttrs?.PERANYVEG ?? null,
    treeCoverPct: vegAttrs?.PERANYTREE ?? null,
    vegChangePct: changeAttrs?.PP_ANYVEG ?? null,
    heatVulnerabilityIndex: heatAttrs?.HVI_2018 ?? null,
  }
}

function bboxAround(lat, lng, radiusKm) {
  const dLat = radiusKm / 111
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180))
  return `${lng - dLng},${lat - dLat},${lng + dLng},${lat + dLat}`
}

async function fetchNearbySpecies(lat, lng) {
  const queryParams = {
    geometry: bboxAround(lat, lng, SPECIES_RADIUS_KM),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    where: '1=1',
    outFields: 'COMM_NAME,SCI_NAME,FFG_DESC,EPBC_DESC,START_YEAR,LOCN_DESC',
    outSR: '4326',
    f: 'geojson',
    resultRecordCount: String(SPECIES_CAP),
  }
  const [fauna, flora] = await Promise.all([
    fetchJson(FAUNA_URL, queryParams),
    fetchJson(FLORA_URL, queryParams),
  ])
  const toRecords = (collection) =>
    (collection.features || []).map((f) => ({
      commonName: f.properties.COMM_NAME || null,
      sciName: f.properties.SCI_NAME || null,
      status: f.properties.FFG_DESC || f.properties.EPBC_DESC || null,
      year: f.properties.START_YEAR || null,
      where: f.properties.LOCN_DESC || null,
    }))
  return [...toRecords(fauna), ...toRecords(flora)].slice(0, SPECIES_CAP)
}

function buildSystemPrompt({ address, goal, conditions, enrichment, plantsContext }) {
  const lines = [
    'You are an AI gardening advisor for GirtByGreen, a Victorian (Australia) native-gardening app.',
    'Give concise, practical planting advice tailored to the project below. Prefer plants from the provided catalog when they fit; you may suggest others but say so.',
    '',
    `Project address: ${address}`,
    `Stated goal: ${goal}`,
    `Space/conditions: ${conditions}`,
  ]

  if (enrichment?.suburb) {
    const s = enrichment.suburb
    lines.push(
      '',
      'Suburb vegetation & heat stats:',
      `- Vegetation cover: ${s.vegCoverPct ?? 'unknown'}%`,
      `- Tree cover: ${s.treeCoverPct ?? 'unknown'}%`,
      `- Vegetation change (2014-2018): ${s.vegChangePct ?? 'unknown'}%`,
      `- Heat vulnerability index: ${s.heatVulnerabilityIndex ?? 'unknown'} / 5`,
    )
  } else {
    lines.push('', 'No suburb vegetation/heat data is available for this address.')
  }

  if (enrichment?.species?.length) {
    lines.push('', 'Threatened species recorded nearby (consider habitat value, avoid recommending anything that could harm them):')
    enrichment.species.forEach((sp) => {
      lines.push(`- ${sp.commonName || sp.sciName || 'Unknown'}${sp.status ? ` (${sp.status})` : ''}`)
    })
  }

  if (plantsContext?.length) {
    lines.push('', 'Plant catalog available in this app:')
    plantsContext.forEach((p) => {
      lines.push(`- ${p.name} | ${p.origin} | ${p.dimensions} | Sun: ${p.sun} | Water: ${p.water} | ${p.description}`)
    })
  }

  return lines.join('\n')
}

exports.sendProjectChatMessage = onCall({ secrets: [GROQ_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to chat with the garden advisor.')
  }

  const { projectId, message, plantsContext } = request.data || {}

  if (typeof projectId !== 'string' || !projectId.trim()) {
    throw new HttpsError('invalid-argument', 'A valid projectId is required.')
  }
  if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
    throw new HttpsError('invalid-argument', 'A valid message (1-2000 characters) is required.')
  }
  if (plantsContext !== undefined && !Array.isArray(plantsContext)) {
    throw new HttpsError('invalid-argument', 'plantsContext must be an array when provided.')
  }

  const db = admin.firestore()
  const projectRef = db.collection('projects').doc(projectId)
  const projectSnap = await projectRef.get()

  if (!projectSnap.exists) {
    throw new HttpsError('not-found', 'Project not found.')
  }
  const project = projectSnap.data()
  if (project.ownerId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'You do not have access to this project.')
  }

  let enrichment = project.enrichment || null
  if (!enrichment?.computedAt) {
    let suburb = null
    let species = []
    try {
      suburb = await fetchSuburbStats(project.locality)
    } catch (err) {
      console.error('Suburb stats lookup failed', err)
    }
    try {
      species = await fetchNearbySpecies(project.lat, project.lng)
    } catch (err) {
      console.error('Nearby species lookup failed', err)
    }
    enrichment = { computedAt: admin.firestore.Timestamp.now(), suburb, species }
    try {
      await projectRef.update({ enrichment })
    } catch (err) {
      console.error('Failed to cache enrichment', err)
    }
  }

  const messagesRef = projectRef.collection('messages')

  try {
    await messagesRef.add({
      role: 'user',
      content: message,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const historySnap = await messagesRef.orderBy('createdAt', 'desc').limit(20).get()
    const history = historySnap.docs
      .map((d) => d.data())
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }))

    const systemPrompt = buildSystemPrompt({
      address: project.address,
      goal: project.goal,
      conditions: project.conditions,
      enrichment,
      plantsContext,
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    let reply
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY.value()}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'system', content: systemPrompt }, ...history],
        }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`Groq request failed: ${res.status}`)
      const data = await res.json()
      reply = data.choices?.[0]?.message?.content
      if (!reply) throw new Error('Groq response had no content')
    } finally {
      clearTimeout(timer)
    }

    await messagesRef.add({
      role: 'assistant',
      content: reply,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { reply }
  } catch (err) {
    console.error('sendProjectChatMessage failed', err)
    throw new HttpsError('internal', 'Failed to get a reply from the garden advisor.')
  }
})
