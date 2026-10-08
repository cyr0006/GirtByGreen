# AI Garden Advisor — Implementation Handover

**Status: planned, not yet implemented.** Pick this up by handing this file to Claude Code (or implementing directly) when ready.

## What this feature is
A signed-in user creates a "project" (address + stated goal + space/conditions). A multi-turn AI chat then gives tailored planting advice for that project, grounded in:
- The app's existing plant catalog (`PlantService`)
- That suburb's vegetation cover / heat vulnerability stats (same data as the Suburb Canopy table)
- Nearby threatened species (same data as the map's biodiversity layer)

AI calls go through Groq (OpenAI-compatible REST API), chosen for being fast/lightweight.

## Decisions already made
- **Chat shape**: multi-turn, persistent conversation per project (not one-shot).
- **Data scope**: full enrichment — plant catalog + suburb stats + nearby species, all three.
- **Auth**: project creation requires sign-in (matches the existing `authOnlyRoutes` pattern in `src/router/index.js`).
- **Model**: Groq's `llama-3.1-8b-instant` as the default (fits "lightweight"), with `llama-3.3-70b-versatile` as a one-constant upgrade if advice quality needs it. Both confirmed on Groq's live model list as of this session (model availability can change — re-check at implementation time).

## Critical security constraint
The Groq API key must never reach the browser. This repo already has the right pattern: `functions/index.js`'s `sendPlantsCsvEmail` uses `defineSecret('SENDGRID_API_KEY')` (Firebase Secret Manager — there are no `.env` files anywhere in this repo) bound via `onCall({ secrets: [...] })`. The new Groq call follows the identical shape with `defineSecret('GROQ_API_KEY')`.

## Firestore schema (new)
```
projects/{projectId}
  ownerId: string (uid)
  address: string            // ezi_address from Vicmap
  lat, lng: number
  locality: string           // uppercase suburb, from Vicmap's locality_name
  goal: string
  conditions: string
  enrichment: {
    computedAt: Timestamp | null
    suburb: { vegCoverPct, treeCoverPct, vegChangePct, heatVulnerabilityIndex } | null
    species: Array<{ commonName, sciName, status, year, where }>   // capped ~15
  } | null                   // null until first chat turn computes & caches it
  createdAt: Timestamp

projects/{projectId}/messages/{messageId}
  role: 'user' | 'assistant'
  content: string
  createdAt: Timestamp
```
`projects` docs are created directly by the client (like the existing `users/{uid}` write in `register_card.vue`) — no secret needed for that. `messages` are written **only** by the Cloud Function via the Admin SDK (which bypasses Firestore rules); a client must never be able to write a message directly, or a user could forge a fake "assistant" reply.

**Verified live** (this session): Vicmap's `locality_name` and CoolingGreening's `LOCALITY` field format identically where they overlap (both "MELBOURNE", both "WEST WODONGA" — uppercase, same spacing). CoolingGreening only covers metro Melbourne, so addresses elsewhere in Victoria will have no suburb match — handle this as a valid "no data for this area" result, not an error (see enrichment caching below).

## Firestore security rules (new — none exist in the repo today)
`firestore.rules` does not exist anywhere in this repo, and `firebase.json` has no `"firestore"` key — a real gap for a feature that stores addresses and AI chat content. Add:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /projects/{projectId} {
      allow read: if request.auth != null && resource.data.ownerId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if false;  // enrichment is server-only; no edit/delete flow in scope

      match /messages/{messageId} {
        allow read: if request.auth != null &&
          get(/databases/$(database)/documents/projects/$(projectId)).data.ownerId == request.auth.uid;
        allow write: if false;  // Admin SDK only — prevents forged assistant messages
      }
    }
  }
}
```
Add `"firestore": { "rules": "firestore.rules" }` to `firebase.json`.

**Before deploying this, check the Firebase console** for whatever rules currently exist there (untracked in this repo) — a first-time `firebase deploy --only firestore:rules` will overwrite them.

## Implementation steps

### 1. Extract reusable address search — `src/composables/useAddressSearch.js` (new)
Move the WHERE-clause builder, debounced search, and suggestion state out of `src/views/VegetationMap.vue` (the hard-won prefix-match logic against Vicmap Address — substring search on that service was measured to hang 10-30s+, prefix matches on `house_number_1`/`road_name`/`locality_name` return in under a second). Extend `outFields` to `'ezi_address,locality_name'` and return `{label, lat, lng, locality}` per suggestion (currently only returns `{lat,lng,label}` — `locality` is new and required for the project schema). Refactor `VegetationMap.vue` to use this composable instead of its inline copy; its `onAddressSelect` keeps working unchanged.

### 2. Project service — `src/service/ProjectService.js` (new)
Mirrors the `getFirestore()`-called-locally + `withTimeout()` pattern from `useAuth.js`/`register_card.vue`:
- `createProject({ address, lat, lng, locality, goal, conditions })` — `setDoc` with `ownerId`, `enrichment: null`, `createdAt: serverTimestamp()`.
- `listMyProjects(uid)` — `where('ownerId','==',uid)` query, sorted **client-side** by `createdAt` (avoids a Firestore composite-index requirement that `where + orderBy` would otherwise force).
- `listenToMessages(projectId, callback)` — `onSnapshot` ordered by `createdAt`.
- `sendChatMessage({ projectId, message, plantsContext })` — `httpsCallable(functions, 'sendProjectChatMessage')`. `plantsContext` is `PlantService.getPlants()` trimmed to `{name, origin, dimensions, sun, water, description}` (drop `photo`/`reviews` — irrelevant to planting advice and pure token cost, sent fresh every turn since it's small).

### 3. Cloud Function — `functions/index.js` (add alongside existing `sendPlantsCsvEmail`)
- `const GROQ_API_KEY = defineSecret('GROQ_API_KEY')` and `const GROQ_MODEL = 'llama-3.1-8b-instant'` (comment: swap to `llama-3.3-70b-versatile` for higher quality at more cost/latency) at module scope.
- `exports.sendProjectChatMessage = onCall({ secrets: [GROQ_API_KEY] }, async (request) => {...})`:
  1. `request.auth` check → `HttpsError('unauthenticated', ...)`.
  2. Validate `{ projectId, message, plantsContext }` → `HttpsError('invalid-argument', ...)` per bad field (mirrors the `to`/`csv` checks already in the file).
  3. Load `projects/{projectId}` via `admin.firestore()`; `not-found` if missing; `permission-denied` if `data.ownerId !== request.auth.uid` — this check is the critical authorization boundary (without it, any signed-in user could pass an arbitrary `projectId`).
  4. If `enrichment.computedAt` is absent: compute it now, each lookup in its **own** try/catch so one failing source doesn't block the other or get permanently cached as a false success —
     - Suburb stats: `WHERE LOCALITY='<escaped locality>'` (single-quote-escape the locality, same class of fix as the existing address WHERE-clause builder) against `CoolingGreening` layers 22 (`PERANYVEG,PERANYTREE`), 37 (`PP_ANYVEG`), 62 (`HVI_2018`) — exact match, not substring, so it's fast.
     - Nearby species: small bbox (~1.5km) around `lat`/`lng` against `biod-gis` `vba_threatened_{fauna,flora}` layer 2 (**non-sensitive only** — never the "Sensitive" layers, which deliberately obscure at-risk species locations), capped ~15 records each.
     - `update()` the project doc with `{ enrichment: { computedAt: now, suburb, species } }` — a confirmed "no data here" (e.g. address outside metro Melbourne) is a valid cached result; a thrown/timed-out fetch is not cached, so it retries next turn.
  5. Save the user's message to `messages`, load the last ~20 messages for history, build a system prompt from address/goal/conditions + cached enrichment + `plantsContext`.
  6. `fetch('https://api.groq.com/openai/v1/chat/completions', ...)` with `Authorization: Bearer ${GROQ_API_KEY.value()}` and an `AbortController` timeout (mirror the pattern already used for ArcGIS calls in `VegetationMap.vue`) so a hung Groq request can't eat the whole callable's budget.
  7. Save the assistant's reply to `messages`, return `{ reply }`.
  8. Any failure → `console.error` + `HttpsError('internal', ...)`, matching `sendPlantsCsvEmail`'s style exactly.
- No new npm dependency needed — Node 22 (already pinned in `functions/package.json`) has global `fetch`, and `firebase-admin` is already installed.

### 4. Frontend views
- **`src/views/GardenProjects.vue`** (new) — card grid + `Dialog`-based "new project" form, following `Events.vue`'s exact convention: `ref({})` model + `ref({})` errors, `validate()` using `trimmed()`/`containsHtml()` from `src/utils/validation.js`, `<small v-if="errors.field">` under each input. Address field uses the new `useAddressSearch` composable (PrimeVue `AutoComplete`, same as the map page); goal/conditions are `Textarea`s with maxlength + required/HTML checks. On submit: `ProjectService.createProject(...)`, then route to that project's chat page.
- **`src/views/GardenProjectChat.vue`** (new) — route `/my-garden-projects/:id`. `ProjectService.listenToMessages` is the realtime source of truth. Because all writes happen server-side, the user's own sent message won't appear instantly from a bare snapshot wait — do a **local optimistic echo** (append the typed text to a local ref immediately on send, show a "thinking…" state, then let the snapshot listener take over once the real messages arrive) so the chat doesn't feel laggy. Calls `ProjectService.sendChatMessage` with the project id, the typed message, and `PlantService.getPlants()` trimmed per step 2.

### 5. Routing — `src/router/index.js`
Add `/my-garden-projects` (`GardenProjects`) and `/my-garden-projects/:id` (`GardenProjectChat`); add both route names to the existing `authOnlyRoutes` array. (Deliberately not under `/projects/*` — that prefix already has a dead, unregistered nav placeholder `/projects/blocks`.) No changes needed to the `beforeEach` guard itself.

### 6. Navigation — `src/components/navbar.vue`
Add an "AI Garden Advisor" item to the "Community & Events" dropdown (alongside the existing 4 items), and bump `badge: 4` → `badge: 5` to match.

## Things only you can do (can't be done or verified by an agent)
- Get a Groq API key, and double-check `llama-3.1-8b-instant` (or `llama-3.3-70b-versatile`) is still on Groq's live model list at implementation time.
- `firebase functions:secrets:set GROQ_API_KEY` against the real project (`fit5032-a1-59a62`) — same CLI-only pattern as the existing `SENDGRID_API_KEY`, no local `.env` anywhere in this repo.
- Check the Firebase console for any rules currently configured there before the first `firebase deploy --only firestore:rules` (this repo has none tracked, so a first deploy could overwrite console-only rules).
- `firebase deploy --only functions` to actually make `sendProjectChatMessage` callable — there's no local emulator configured in this repo, so this is the only way to test the live Groq call end-to-end.

## Verification (once implemented)
- `npx eslint` + `npx vite build` on every new/changed frontend file.
- Review the Cloud Function code carefully for correctness (auth check, ownership check, input validation, error handling).
- Once the secret is set and deployed: `npm run dev`, sign in, create a project with a real Melbourne-area address, send a chat message, confirm a reply arrives and both messages persist in Firestore (reload the page — history should still be there via `onSnapshot`).
- Confirm the Firestore rules actually block what they should: a second test account should not be able to read/list another user's `projects` docs or `messages`.
