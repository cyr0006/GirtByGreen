<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, useId } from 'vue'
import { gsap } from 'gsap'

const VIEW_W = 1200
const VIEW_H = 520
const CX = VIEW_W / 2
const CY = VIEW_H / 2
const EDGE_PAD = 6

function buildPath(shape, curviness, ribbonWidth) {
  const c = Math.max(0, curviness)
  const room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD)

  switch (shape) {
    case 'circle': {
      const r = Math.min(90 + c * 0.95, room)
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`
    }
    case 'infinity': {
      const r = 150 + c * 1.4
      const h = Math.min(60 + c * 0.95, room)
      return [
        `M ${CX} ${CY}`,
        `C ${CX + r * 0.55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * 0.55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * 0.55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * 0.55} ${CY + h} ${CX} ${CY}`,
        'Z',
      ].join(' ')
    }
    case 'arch': {
      const rise = Math.min(120 + c * 1.1, room * 2)
      return `M 120 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W - 120} ${CY + rise / 2}`
    }
    case 'line':
      return `M -320 ${CY} L ${VIEW_W + 320} ${CY}`
    case 'wave':
    default: {
      const a = Math.min(c * 2.2, room * 2)
      return `M -320 ${CY} Q -160 ${CY - a} 0 ${CY} T 320 ${CY} T 640 ${CY} T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`
    }
  }
}

const props = defineProps({
  text: { type: String, default: 'React ✦ Bits' },
  shape: { type: String, default: 'wave' },
  path: { type: String, default: null },
  speed: { type: Number, default: 90 },
  direction: { type: String, default: 'forward' },
  separator: { type: String, default: '✦' },
  curviness: { type: Number, default: 90 },
  fontSize: { type: Number, default: 46 },
  fontWeight: { type: Number, default: 800 },
  letterSpacing: { type: Number, default: 2 },
  uppercase: { type: Boolean, default: true },
  color: { type: String, default: '#ffffff' },
  ribbon: { type: Boolean, default: true },
  ribbonColor: { type: String, default: '#5227FF' },
  ribbonWidth: { type: Number, default: 86 },
  pauseOnHover: { type: Boolean, default: true },
})

const rootRef = ref(null)
const pathRef = ref(null)
const measureRef = ref(null)
const headRef = ref(null)
const tailRef = ref(null)

const metrics = ref({ length: 0, reps: 1 })

const rawId = useId()
const pathId = `text-loop-${rawId.replace(/:/g, '')}`

const d = computed(() => props.path || buildPath(props.shape, props.curviness, props.ribbonWidth))

const unit = computed(() => {
  const base = props.uppercase ? String(props.text).toUpperCase() : String(props.text)
  const gap = props.separator ? ` ${props.separator} ` : '   '
  return `${base}${gap}`
})

const textStyle = computed(() => ({
  fontSize: `${props.fontSize}px`,
  fontWeight: props.fontWeight,
  letterSpacing: `${props.letterSpacing}px`,
}))

const loopText = computed(() => unit.value.repeat(metrics.value.reps))
const fitLength = computed(() => metrics.value.length || undefined)

function measure() {
  const pathEl = pathRef.value
  const measureEl = measureRef.value
  if (!pathEl || !measureEl) return

  let length = 0
  let unitWidth = 0
  try {
    length = pathEl.getTotalLength()
    unitWidth = measureEl.getComputedTextLength()
  } catch {
    return
  }
  if (!length) return

  const reps = unitWidth > 0 ? Math.max(1, Math.round(length / unitWidth)) : 1
  if (metrics.value.length !== length || metrics.value.reps !== reps) {
    metrics.value = { length, reps }
  }
}

function measureAndRefresh() {
  measure()
  document.fonts?.ready?.then(measure).catch(() => {})
}

onMounted(measureAndRefresh)
watch(
  [d, unit, () => props.fontSize, () => props.fontWeight, () => props.letterSpacing],
  measureAndRefresh,
  { flush: 'post' },
)

let tween = null
let pauseHandler = null
let resumeHandler = null

function teardownAnimation() {
  tween?.kill()
  tween = null
  const root = rootRef.value
  if (root && pauseHandler) {
    root.removeEventListener('pointerenter', pauseHandler)
    root.removeEventListener('pointerleave', resumeHandler)
  }
  pauseHandler = null
  resumeHandler = null
}

function setupAnimation() {
  teardownAnimation()

  const length = metrics.value.length
  const head = headRef.value
  const tail = tailRef.value
  if (!head || !tail || !length) return

  const apply = (offset) => {
    const partner = offset >= 0 ? offset - length : offset + length
    head.setAttribute('startOffset', String(offset))
    tail.setAttribute('startOffset', String(partner))
  }
  apply(0)

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced || props.speed <= 0) return

  const state = { offset: 0 }
  tween = gsap.to(state, {
    offset: props.direction === 'reverse' ? -length : length,
    duration: length / props.speed,
    ease: 'none',
    repeat: -1,
    onUpdate: () => apply(state.offset),
  })

  const root = rootRef.value
  if (props.pauseOnHover && root) {
    pauseHandler = () => tween.pause()
    resumeHandler = () => tween.resume()
    root.addEventListener('pointerenter', pauseHandler)
    root.addEventListener('pointerleave', resumeHandler)
  }
}

watch(
  [metrics, () => props.speed, () => props.direction, () => props.pauseOnHover],
  setupAnimation,
  { flush: 'post' },
)

onBeforeUnmount(teardownAnimation)
</script>

<template>
  <div ref="rootRef" class="relative w-full overflow-hidden">
    <svg
      class="block w-full h-auto"
      :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="text"
    >
      <path
        ref="pathRef"
        :id="pathId"
        :d="d"
        fill="none"
        :stroke="ribbon ? ribbonColor : 'none'"
        :stroke-width="ribbon ? ribbonWidth : 0"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <text ref="measureRef" class="invisible pointer-events-none" :style="textStyle" aria-hidden="true">{{
        unit
      }}</text>

      <text
        class="select-none"
        :style="textStyle"
        :fill="color"
        dominant-baseline="central"
        aria-hidden="true"
        :textLength="fitLength"
        lengthAdjust="spacing"
      >
        <textPath ref="headRef" :href="`#${pathId}`" startOffset="0">{{ loopText }}</textPath>
      </text>

      <text
        class="select-none"
        :style="textStyle"
        :fill="color"
        dominant-baseline="central"
        aria-hidden="true"
        :textLength="fitLength"
        lengthAdjust="spacing"
      >
        <textPath ref="tailRef" :href="`#${pathId}`" startOffset="0">{{ loopText }}</textPath>
      </text>
    </svg>
  </div>
</template>
