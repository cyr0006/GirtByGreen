const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const sgMail = require('@sendgrid/mail')
const admin = require('firebase-admin')
const sanitizeHtml = require('sanitize-html')

admin.initializeApp()

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')
const GROQ_API_KEY = defineSecret('GROQ_API_KEY')
const GROQ_MODEL = 'openai/gpt-oss-120b'

// Must be a Single Sender you verified in SendGrid, or an address on a domain you authenticated there.
const FROM_EMAIL = 'acyrus0007@gmail.com'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAX_SUBJECT_LEN = 150
const MAX_NAME_LEN = 100
const MAX_DESCRIPTION_LEN = 20000

// The editor only ever needs to produce body copy, so the allowlist below
// is intentionally narrow (no images/scripts/iframes) - this is the one
// place arbitrary user-authored HTML reaches a human (the recipient's
// inbox), so it's sanitized server-side regardless of what the client sent.
const DESCRIPTION_SANITIZE_OPTIONS = {
  allowedTags: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'a', 'span'],
  allowedAttributes: { a: ['href', 'target', 'rel'], span: ['style'] },
  allowedStyles: { span: { color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(\d+,\s*\d+,\s*\d+\)$/] } },
  allowedSchemes: ['http', 'https', 'mailto'],
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toPlainText(html) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: [] }).trim()
}

async function sendMail(message) {
  sgMail.setApiKey(SENDGRID_API_KEY.value())
  await sgMail.send({ from: FROM_EMAIL, ...message })
}

function formatEventDate(dateStr) {
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

exports.sendPlantsCsvEmail = onCall({ secrets: [SENDGRID_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to email the plant list.')
  }

  const { to, csv, subject, name, description } = request.data || {}

  if (typeof to !== 'string' || !EMAIL_RE.test(to)) {
    throw new HttpsError('invalid-argument', 'A valid recipient email address is required.')
  }
  if (typeof csv !== 'string' || !csv.trim()) {
    throw new HttpsError('invalid-argument', 'CSV content is required.')
  }

  const subjectText = typeof subject === 'string' ? subject.replace(/[\r\n]+/g, ' ').trim() : ''
  if (!subjectText || subjectText.length > MAX_SUBJECT_LEN) {
    throw new HttpsError(
      'invalid-argument',
      `A subject between 1 and ${MAX_SUBJECT_LEN} characters is required.`,
    )
  }

  const nameText = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LEN) : ''

  if (typeof description !== 'string' || description.length > MAX_DESCRIPTION_LEN) {
    throw new HttpsError(
      'invalid-argument',
      `A message of ${MAX_DESCRIPTION_LEN} characters or fewer is required.`,
    )
  }
  const safeDescription = sanitizeHtml(description, DESCRIPTION_SANITIZE_OPTIONS)
  if (!toPlainText(safeDescription)) {
    throw new HttpsError('invalid-argument', 'A message is required.')
  }

  const signOff = nameText ? `<p>Kind regards,<br>${escapeHtml(nameText)}</p>` : ''
  const html = `${safeDescription}${signOff}`
  const text = toPlainText(html)

  try {
    await sendMail({
      to,
      subject: subjectText,
      text,
      html,
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

// Aggregated, de-identified stats for the community impact charts. Runs on the
// Admin SDK (bypasses Firestore rules, which otherwise scope /projects reads to
// each doc's owner) and only ever returns counts grouped by locality/goal/month -
// never addresses, coordinates or ownerId - so no individual project is exposed.
exports.getProjectStats = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to view community stats.')
  }

  const db = admin.firestore()
  const snapshot = await db.collection('projects').get()

  const byLocality = new Map()
  const byGoal = new Map()
  const byMonth = new Map()

  snapshot.forEach((doc) => {
    const data = doc.data()

    const locality = data.locality || 'Unknown suburb'
    byLocality.set(locality, (byLocality.get(locality) || 0) + 1)

    const goal = data.goal || 'Unspecified'
    byGoal.set(goal, (byGoal.get(goal) || 0) + 1)

    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null
    if (createdAt) {
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1)
    }
  })

  const toSortedByCount = (map) =>
    Array.from(map, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)

  const byMonthSorted = Array.from(byMonth, ([label, count]) => ({ label, count })).sort((a, b) =>
    a.label.localeCompare(b.label),
  )

  return {
    total: snapshot.size,
    byLocality: toSortedByCount(byLocality).slice(0, 12),
    byGoal: toSortedByCount(byGoal),
    byMonth: byMonthSorted,
  }
})

// Shared by every admin-only endpoint below - checks the caller's own user
// doc via the Admin SDK rather than trusting a client-supplied role.
async function requireAdmin(db, uid) {
  const callerSnap = await db.collection('users').doc(uid).get()
  if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access is required for this action.')
  }
}

// Admin-only aggregate counts for the admin dashboard (number of users and
// their account types, plus total garden projects). Never returns individual
// user records (names/emails) - counts only.
exports.getAdminDashboardStats = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to view the admin dashboard.')
  }

  const db = admin.firestore()
  await requireAdmin(db, request.auth.uid)

  const [usersSnap, projectsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('projects').get(),
  ])

  const usersByRole = new Map()
  usersSnap.forEach((doc) => {
    const role = doc.data().role || 'unspecified'
    usersByRole.set(role, (usersByRole.get(role) || 0) + 1)
  })

  return {
    totalUsers: usersSnap.size,
    usersByRole: Array.from(usersByRole, ([label, count]) => ({ label, count })).sort(
      (a, b) => b.count - a.count,
    ),
    totalGardenProjects: projectsSnap.size,
  }
})

// Registers the caller for an event, inside one Firestore transaction so a
// capacity check-and-increment can never race two users into the last spot,
// and rejects if they already have another event booked the same day (the
// "booking conflict management" the calendar view needs). Mirrors the
// booking into users/{uid}/myBookings so that same-day check is a single
// doc read next time rather than a scan over every event's bookings.
exports.bookEvent = onCall({ secrets: [SENDGRID_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to register for an event.')
  }

  const { eventId } = request.data || {}
  if (typeof eventId !== 'string' || !eventId.trim()) {
    throw new HttpsError('invalid-argument', 'A valid eventId is required.')
  }

  const db = admin.firestore()
  const uid = request.auth.uid
  const eventRef = db.collection('events').doc(eventId)
  const bookingRef = eventRef.collection('bookings').doc(uid)
  const myBookingsRef = db.collection('users').doc(uid).collection('myBookings')

  let bookedEvent = null

  await db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef)
    if (!eventSnap.exists) {
      throw new HttpsError('not-found', 'This event no longer exists.')
    }
    const event = eventSnap.data()

    const bookingSnap = await tx.get(bookingRef)
    if (bookingSnap.exists) {
      throw new HttpsError('already-exists', "You're already registered for this event.")
    }

    if ((event.bookedCount || 0) >= event.capacity) {
      throw new HttpsError('resource-exhausted', 'This event is fully booked.')
    }

    // Conflict check: does this user already have a different event booked
    // on the same date?
    const sameDaySnap = await tx.get(myBookingsRef.where('date', '==', event.date))
    const conflict = sameDaySnap.docs.find((d) => d.id !== eventId)
    if (conflict) {
      throw new HttpsError(
        'failed-precondition',
        `You already have "${conflict.data().title}" booked on ${event.date}.`,
      )
    }

    tx.update(eventRef, { bookedCount: admin.firestore.FieldValue.increment(1) })
    tx.set(bookingRef, { bookedAt: admin.firestore.FieldValue.serverTimestamp() })
    tx.set(myBookingsRef.doc(eventId), {
      title: event.title,
      date: event.date,
      location: event.location,
      bookedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    bookedEvent = event
  })

  // Best-effort: the booking itself already succeeded above, so a failed
  // confirmation email shouldn't fail the registration - just log it.
  const recipient = request.auth.token.email
  if (recipient && bookedEvent) {
    try {
      await sendMail({
        to: recipient,
        subject: `You're registered: ${bookedEvent.title}`,
        html: `<p>Hi there,</p><p>You're confirmed for <strong>${escapeHtml(bookedEvent.title)}</strong> on ${escapeHtml(formatEventDate(bookedEvent.date))} at ${escapeHtml(bookedEvent.location)}.</p><p>See you there!</p>`,
        text: `You're confirmed for ${bookedEvent.title} on ${formatEventDate(bookedEvent.date)} at ${bookedEvent.location}.`,
      })
    } catch (err) {
      console.error('Failed to send booking confirmation email', err?.response?.body || err)
    }
  }

  return { success: true }
})

// Cancels the caller's own registration, releasing the spot for someone else.
exports.cancelBooking = onCall({ secrets: [SENDGRID_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to cancel a booking.')
  }

  const { eventId } = request.data || {}
  if (typeof eventId !== 'string' || !eventId.trim()) {
    throw new HttpsError('invalid-argument', 'A valid eventId is required.')
  }

  const db = admin.firestore()
  const uid = request.auth.uid
  const eventRef = db.collection('events').doc(eventId)
  const bookingRef = eventRef.collection('bookings').doc(uid)
  const myBookingRef = db.collection('users').doc(uid).collection('myBookings').doc(eventId)

  let cancelledBooking = null

  await db.runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bookingRef)
    if (!bookingSnap.exists) {
      throw new HttpsError('not-found', "You don't have a booking for this event.")
    }
    const myBookingSnap = await tx.get(myBookingRef)
    cancelledBooking = myBookingSnap.exists ? myBookingSnap.data() : null

    tx.update(eventRef, { bookedCount: admin.firestore.FieldValue.increment(-1) })
    tx.delete(bookingRef)
    tx.delete(myBookingRef)
  })

  // Best-effort, same as bookEvent - cancellation already succeeded above.
  const recipient = request.auth.token.email
  if (recipient && cancelledBooking) {
    try {
      await sendMail({
        to: recipient,
        subject: `Booking cancelled: ${cancelledBooking.title}`,
        html: `<p>Hi there,</p><p>Your registration for <strong>${escapeHtml(cancelledBooking.title)}</strong> on ${escapeHtml(formatEventDate(cancelledBooking.date))} has been cancelled.</p>`,
        text: `Your registration for ${cancelledBooking.title} on ${formatEventDate(cancelledBooking.date)} has been cancelled.`,
      })
    } catch (err) {
      console.error('Failed to send cancellation confirmation email', err?.response?.body || err)
    }
  }

  return { success: true }
})

// Approves a pending organisation account, letting it sign in. Only
// organisation accounts have a 'pending' status to clear - anything else is
// a no-op from the caller's point of view, so it's rejected rather than
// silently accepted.
exports.approveOrganisation = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to approve accounts.')
  }

  const db = admin.firestore()
  await requireAdmin(db, request.auth.uid)

  const { uid } = request.data || {}
  if (typeof uid !== 'string' || !uid.trim()) {
    throw new HttpsError('invalid-argument', 'A valid uid is required.')
  }

  const ref = db.collection('users').doc(uid)
  const snap = await ref.get()
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Account not found.')
  }
  if (snap.data().role !== 'org') {
    throw new HttpsError('failed-precondition', 'Only organisation accounts need approval.')
  }

  await ref.update({ status: 'approved' })
  return { success: true }
})

// Deletes a user's account entirely - their Firestore profile, their event
// bookings (releasing the spots so capacity counts stay accurate), and their
// Firebase Auth sign-in. Admin-only, and an admin can't delete themselves
// (would otherwise be able to lock every admin out of this dashboard).
exports.deleteUserAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to delete an account.')
  }

  const db = admin.firestore()
  await requireAdmin(db, request.auth.uid)

  const { uid } = request.data || {}
  if (typeof uid !== 'string' || !uid.trim()) {
    throw new HttpsError('invalid-argument', 'A valid uid is required.')
  }
  if (uid === request.auth.uid) {
    throw new HttpsError('failed-precondition', "You can't delete your own admin account.")
  }

  const userRef = db.collection('users').doc(uid)

  // Best-effort: release this user's event bookings first. A failure here
  // doesn't block deleting the account itself.
  try {
    const myBookingsSnap = await userRef.collection('myBookings').get()
    await Promise.all(
      myBookingsSnap.docs.map(async (bookingDoc) => {
        const eventId = bookingDoc.id
        const eventRef = db.collection('events').doc(eventId)
        await db.runTransaction(async (tx) => {
          const eventSnap = await tx.get(eventRef)
          if (eventSnap.exists) {
            tx.update(eventRef, { bookedCount: admin.firestore.FieldValue.increment(-1) })
          }
          tx.delete(eventRef.collection('bookings').doc(uid))
          tx.delete(bookingDoc.ref)
        })
      }),
    )
  } catch (err) {
    console.error('Failed to release bookings while deleting account', err)
  }

  await userRef.delete()

  try {
    await admin.auth().deleteUser(uid)
  } catch (err) {
    if (err.code !== 'auth/user-not-found') {
      console.error('Failed to delete auth user', err)
      throw new HttpsError(
        'internal',
        'Account data was removed, but deleting the sign-in failed. Please try again.',
      )
    }
  }

  return { success: true }
})

// Deletes an event along with every booking mirror that points at it (the
// events/{id}/bookings docs and each booked user's users/{uid}/myBookings
// entry), so no stale references are left behind. Admin-only.
exports.deleteEvent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to delete an event.')
  }

  const db = admin.firestore()
  await requireAdmin(db, request.auth.uid)

  const { eventId } = request.data || {}
  if (typeof eventId !== 'string' || !eventId.trim()) {
    throw new HttpsError('invalid-argument', 'A valid eventId is required.')
  }

  const eventRef = db.collection('events').doc(eventId)
  const eventSnap = await eventRef.get()
  if (!eventSnap.exists) {
    throw new HttpsError('not-found', 'This event no longer exists.')
  }

  const bookingsSnap = await eventRef.collection('bookings').get()
  const batch = db.batch()
  bookingsSnap.docs.forEach((bookingDoc) => {
    batch.delete(bookingDoc.ref)
    batch.delete(db.collection('users').doc(bookingDoc.id).collection('myBookings').doc(eventId))
  })
  batch.delete(eventRef)
  await batch.commit()

  return { success: true }
})
