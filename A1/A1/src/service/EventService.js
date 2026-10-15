import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

const db = getFirestore()
const auth = getAuth()

const bookEventCallable = httpsCallable(functions, 'bookEvent')
const cancelBookingCallable = httpsCallable(functions, 'cancelBooking')
const deleteEventCallable = httpsCallable(functions, 'deleteEvent')

export const EventService = {
  async createEvent({ title, date, location, description, capacity, category }) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in to create an event.')

    const ref = await addDoc(collection(db, 'events'), {
      title,
      date,
      location,
      description,
      capacity,
      bookedCount: 0,
      category,
      createdBy: uid,
      createdAt: serverTimestamp(),
    })
    return ref.id
  },

  // Org-only, own-event-only (enforced by Firestore rules) - bookedCount
  // isn't accepted here since the rules pin it to its current value anyway.
  async updateEvent(eventId, { title, date, location, description, capacity, category }) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in to edit an event.')
    await updateDoc(doc(db, 'events', eventId), {
      title,
      date,
      location,
      description,
      capacity,
      category,
    })
  },

  // Real-time so a booking (yours or anyone else's) updates spots-remaining
  // live, instead of needing a refresh.
  listenToEvents(callback) {
    const eventsQuery = query(collection(db, 'events'), orderBy('date'))
    return onSnapshot(eventsQuery, (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  },

  listenToMyBookings(uid, callback) {
    return onSnapshot(collection(db, 'users', uid, 'myBookings'), (snapshot) => {
      callback(new Set(snapshot.docs.map((d) => d.id)))
    })
  },

  async bookEvent(eventId) {
    const result = await bookEventCallable({ eventId })
    return result.data
  },

  async cancelBooking(eventId) {
    const result = await cancelBookingCallable({ eventId })
    return result.data
  },

  // Admin-only (enforced server-side) - removes the event along with every
  // booking mirror pointing at it.
  async deleteEvent(eventId) {
    const result = await deleteEventCallable({ eventId })
    return result.data
  },
}
