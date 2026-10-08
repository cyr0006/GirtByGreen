// Renders a chat message (plain text from the user, or GFM-ish Markdown from
// the Groq reply - headers, tables, lists, bold/italic, and the occasional
// literal <br> the model emits) to HTML. `marked` does the parsing; DOMPurify
// strips anything that isn't plain content (scripts, event handlers, etc.)
// before it's ever handed to v-html, since this text is model-authored and
// not something we can trust outright.
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ gfm: true, breaks: true })

export function renderMarkdownLite(text) {
  if (!text) return ''
  return DOMPurify.sanitize(marked.parse(text))
}
