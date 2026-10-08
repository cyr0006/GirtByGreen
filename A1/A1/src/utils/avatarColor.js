// Deterministic avatar colour + initial for a signed-in user, drawn from the
// same background palette already used for the plant thumbnails in
// PlantService (e.g. 'https://placehold.co/64x64/6b8f3f/ffffff?text=CD').
const PALETTE = [
  '#6b8f3f',
  '#4c7a3a',
  '#b3402c',
  '#7a8f6e',
  '#d9a441',
  '#8bb33a',
  '#3a5f8f',
  '#5a7a5a',
  '#8f5a9e',
  '#6a4c93',
  '#d4a017',
  '#9fa88f',
]

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// Keyed on a stable identifier (uid) rather than the display name, so a
// user's colour doesn't change if they rename themselves.
export function avatarColorFor(seed) {
  if (!seed) return PALETTE[0]
  return PALETTE[hashString(seed) % PALETTE.length]
}

export function avatarInitial(name, fallback) {
  const cleanName = (name || '').trim()
  if (cleanName) return cleanName[0].toUpperCase()
  const cleanFallback = (fallback || '').trim()
  return cleanFallback ? cleanFallback[0].toUpperCase() : '?'
}
