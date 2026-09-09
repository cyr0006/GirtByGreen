// Shared client-side validation helpers.
//
// These checks are a UX convenience, not a security boundary — the actual
// trust boundary is Firebase Auth (unique email, password rules) and
// Firestore security rules (who can read/write which documents). Everything
// here can be bypassed by a user calling the API directly, so nothing
// sensitive should depend on it alone.

export const EMAIL_REGEX = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/

export function trimmed(value) {
  return typeof value === 'string' ? value.trim() : value
}

// Vue escapes all template interpolation by default (this app never uses
// v-html/innerHTML), so stored values are never parsed as HTML today. This
// check is defense-in-depth: it stops markup from reaching storage at all,
// so a future template change — or some other consumer of the same data —
// can't accidentally render it unescaped.
export function containsHtml(value) {
  return typeof value === 'string' && /[<>]/.test(value)
}
