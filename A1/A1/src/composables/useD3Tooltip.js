import { onBeforeUnmount } from 'vue'

// One floating tooltip div per chart instance, positioned at the cursor.
// Kept outside the chart's own SVG (fixed-position, appended to body) so it
// never gets clipped by the chart's container or affects its layout.
export function useD3Tooltip() {
  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '1000',
    background: 'rgba(17, 24, 39, 0.92)',
    color: '#fff',
    padding: '0.4rem 0.6rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    lineHeight: '1.3',
    opacity: '0',
    transition: 'opacity 0.1s ease',
    maxWidth: '220px',
  })
  document.body.appendChild(el)

  function move(event) {
    const pad = 14
    el.style.left = `${event.clientX + pad}px`
    el.style.top = `${event.clientY + pad}px`
  }

  function show(html, event) {
    el.innerHTML = html
    el.style.opacity = '1'
    move(event)
  }

  function hide() {
    el.style.opacity = '0'
  }

  onBeforeUnmount(() => {
    el.remove()
  })

  return { show, move, hide }
}
