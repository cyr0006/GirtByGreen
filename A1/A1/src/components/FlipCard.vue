<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const STEP = 1 / 240
const SLOP = { fine: 4, coarse: 8 }
const TILT_SPRING = { stiffness: 240, damping: 24, mass: 0.6 }
const LIFT_SPRING = { stiffness: 320, damping: 26, mass: 1 }
const FLING = 0.16
const HISTORY_MS = 90

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const snapAngle = (deg) => Math.round(deg / 180) * 180
const isBack = (deg) => Math.abs(Math.round(deg / 180)) % 2 === 1
const px = (v) => (typeof v === 'number' ? `${v}px` : v)

const makeSpring = (value) => ({ value, velocity: 0 })

const snapSpring = (spring, value) => {
  spring.value = value
  spring.velocity = 0
}

const stepSpring = (spring, target, stiffness, damping, mass, dt) => {
  const k = stiffness / mass
  const d = damping / mass
  const steps = Math.max(1, Math.ceil(dt / STEP))
  const h = dt / steps
  for (let i = 0; i < steps; i++) {
    spring.velocity += (k * (target - spring.value) - d * spring.velocity) * h
    spring.value += spring.velocity * h
  }
  return Math.abs(target - spring.value) > 0.05 || Math.abs(spring.velocity) > 0.05
}

const props = defineProps({
  flipped: { type: Boolean, default: undefined },
  defaultFlipped: { type: Boolean, default: false },
  axis: { type: String, default: 'y' }, // 'y' | 'x'
  flipOnClick: { type: Boolean, default: true },
  draggable: { type: Boolean, default: true },
  dragDistance: { type: Number, default: 0 },
  tilt: { type: Boolean, default: true },
  tiltMax: { type: Number, default: 12 },
  glare: { type: Boolean, default: true },
  glareOpacity: { type: Number, default: 0.22 },
  hoverScale: { type: Number, default: 1.03 },
  perspective: { type: Number, default: 1100 },
  stiffness: { type: Number, default: 170 },
  damping: { type: Number, default: 20 },
  width: { type: [Number, String], default: 300 },
  height: { type: [Number, String], default: 400 },
  radius: { type: Number, default: 22 },
  background: { type: String, default: '#27272a' },
  color: { type: String, default: '#f5f5f5' },
  shadow: { type: Boolean, default: true },
  shadowColor: { type: String, default: '#000000' },
  shadowOpacity: { type: Number, default: 0.45 },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: 'Flip card' },
})

const emit = defineEmits(['update:flipped', 'flip-change'])

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isControlled = computed(() => props.flipped !== undefined)
const inner = ref(props.defaultFlipped)
const shown = computed(() => (isControlled.value ? Boolean(props.flipped) : inner.value))
const dragging = ref(false)

const rootRef = ref(null)
const rotorRef = ref(null)
const shadowRef = ref(null)

const initialShown = props.flipped !== undefined ? Boolean(props.flipped) : props.defaultFlipped

let raf = 0
let last = 0
let target = initialShown ? 180 : 0
const turnSpring = makeSpring(target)
const tiltXSpring = makeSpring(0)
const tiltYSpring = makeSpring(0)
const liftSpring = makeSpring(1)
const sheenSpring = makeSpring(0)
let tiltTargetX = 0
let tiltTargetY = 0
let liftTarget = 1
let sheenTarget = 0
let gx = 50
let gy = 50
let grip = null

function settle(to, velocity, instant) {
  target = to
  if (instant || reducedMotion) snapSpring(turnSpring, to)
  else turnSpring.velocity = velocity
  const next = isBack(to)
  if (next !== shown.value) {
    if (!isControlled.value) inner.value = next
    emit('update:flipped', next)
    emit('flip-change', next)
  }
  wake()
}

function flip(instant) {
  const base = snapAngle(turnSpring.value)
  settle(isBack(base) ? base - 180 : base + 180, 0, instant)
}

function rest() {
  tiltTargetX = 0
  tiltTargetY = 0
  sheenTarget = 0
  liftTarget = 1
  wake()
}

function write() {
  const rotor = rotorRef.value
  if (rotor) {
    if (!reducedMotion) {
      let transform
      if (props.axis === 'x') {
        const sum = turnSpring.value + tiltXSpring.value
        transform = `perspective(${props.perspective}px) scale(${liftSpring.value}) rotateY(${tiltYSpring.value}deg) rotateX(${sum}deg)`
      } else {
        const sum = turnSpring.value + tiltYSpring.value
        transform = `perspective(${props.perspective}px) scale(${liftSpring.value}) rotateX(${tiltXSpring.value}deg) rotateY(${sum}deg)`
      }
      rotor.style.transform = transform
    }
    rotor.style.setProperty('--fc-gx', `${gx}%`)
    rotor.style.setProperty('--fc-gy', `${gy}%`)
    rotor.style.setProperty('--fc-sheen', String(sheenSpring.value))
  }
  const shadowEl = shadowRef.value
  if (shadowEl) {
    const facing = Math.abs(Math.cos((turnSpring.value * Math.PI) / 180))
    const spread = 0.08 + 0.92 * facing
    const shade = 0.1 + 0.9 * facing * facing
    shadowEl.style.transform = props.axis === 'x' ? `scaleY(${spread})` : `scaleX(${spread})`
    shadowEl.style.opacity = String(shade)
  }
}

function frame(now) {
  raf = 0
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
  last = now
  let busy = false
  if (!grip) busy = stepSpring(turnSpring, target, props.stiffness, props.damping, 1, dt) || busy
  busy =
    stepSpring(tiltXSpring, tiltTargetX, TILT_SPRING.stiffness, TILT_SPRING.damping, TILT_SPRING.mass, dt) || busy
  busy =
    stepSpring(tiltYSpring, tiltTargetY, TILT_SPRING.stiffness, TILT_SPRING.damping, TILT_SPRING.mass, dt) || busy
  busy = stepSpring(liftSpring, liftTarget, LIFT_SPRING.stiffness, LIFT_SPRING.damping, LIFT_SPRING.mass, dt) || busy
  busy =
    stepSpring(sheenSpring, sheenTarget, LIFT_SPRING.stiffness, LIFT_SPRING.damping, LIFT_SPRING.mass, dt) || busy
  write()
  if (busy || grip) raf = requestAnimationFrame(frame)
  else last = 0
}

function wake() {
  if (!raf) {
    last = 0
    raf = requestAnimationFrame(frame)
  }
}

function onPointerDown(e) {
  if (props.disabled || e.button !== 0 || grip) return
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {
    /* pointer capture not supported */
  }
  grip = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    base: turnSpring.value,
    moved: false,
    slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine,
    hist: [],
  }
  if (!reducedMotion) liftTarget = props.hoverScale
  wake()
}

function onPointerMove(e) {
  const g = grip
  if (g && g.id === e.pointerId) {
    const d = props.axis === 'x' ? e.clientY - g.y : e.clientX - g.x
    if (!g.moved) {
      if (Math.abs(d) < g.slop || !props.draggable || reducedMotion) return
      g.moved = true
      dragging.value = true
      tiltTargetX = 0
      tiltTargetY = 0
      sheenTarget = 0
    }
    const span = props.dragDistance > 0 ? props.dragDistance : props.axis === 'x' ? props.height : props.width
    const deg = g.base + (props.axis === 'x' ? -1 : 1) * (d / span) * 180
    snapSpring(turnSpring, deg)
    const now = performance.now()
    g.hist.push({ t: now, v: deg })
    while (g.hist.length > 2 && now - g.hist[0].t > HISTORY_MS) g.hist.shift()
    wake()
    return
  }
  if (!props.tilt || reducedMotion || props.disabled || e.pointerType === 'touch') return
  const r = e.currentTarget.getBoundingClientRect()
  const px1 = clamp((e.clientX - r.left) / r.width, 0, 1)
  const py = clamp((e.clientY - r.top) / r.height, 0, 1)
  tiltTargetX = (0.5 - py) * 2 * props.tiltMax
  tiltTargetY = (px1 - 0.5) * 2 * props.tiltMax
  gx = px1 * 100
  gy = py * 100
  sheenTarget = 1
  wake()
}

function release(e, cancelled) {
  const g = grip
  if (!g || g.id !== e.pointerId) return
  grip = null
  try {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  } catch {
    /* pointer capture not supported */
  }
  dragging.value = false
  if (e.pointerType === 'touch' || !rootRef.value?.matches(':hover')) rest()
  if (!g.moved) {
    if (!cancelled && props.flipOnClick) flip(false)
    else settle(target, 0, false)
    return
  }
  const here = turnSpring.value
  let velocity = 0
  const a = g.hist[0]
  const b = g.hist[g.hist.length - 1]
  if (!cancelled && a && b && b.t > a.t && performance.now() - b.t < 60) velocity = ((b.v - a.v) / (b.t - a.t)) * 1000
  const to = cancelled
    ? snapAngle(g.base)
    : clamp(snapAngle(here + velocity * FLING), snapAngle(here) - 180, snapAngle(here) + 180)
  settle(to, velocity, false)
}

function onKeyDown(e) {
  if (props.disabled || (e.key !== 'Enter' && e.key !== ' ')) return
  e.preventDefault()
  if (!e.repeat) flip(true)
}

function onClick(e) {
  if (!props.disabled && e.detail === 0) flip(true)
}

function onPointerEnter(e) {
  if (!reducedMotion && !props.disabled && e.pointerType !== 'touch') {
    liftTarget = props.hoverScale
    wake()
  }
}

function onPointerLeave() {
  if (!grip) rest()
}

watch(
  () => props.flipped,
  (value) => {
    if (value === undefined) return
    if (isBack(target) === value) return
    target = isBack(target) ? target - 180 : target + 180
    if (reducedMotion) snapSpring(turnSpring, target)
    wake()
  },
)

watch(
  () => props.disabled,
  (value) => {
    if (value) rest()
  },
)

onMounted(write)
onBeforeUnmount(() => cancelAnimationFrame(raf))

const dataFade = computed(() => (reducedMotion ? (shown.value ? 'back' : 'front') : undefined))
const rootVars = computed(() => ({
  '--fc-w': px(props.width),
  '--fc-h': px(props.height),
  '--fc-radius': `${props.radius}px`,
  '--fc-bg': props.background,
  '--fc-ink': props.color,
  '--fc-shadow': props.shadowColor,
  '--fc-shadow-o': props.shadowOpacity,
  '--fc-glare': props.glareOpacity,
}))
</script>

<template>
  <div
    ref="rootRef"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-pressed="shown"
    :aria-label="ariaLabel"
    :aria-disabled="disabled || undefined"
    class="group relative inline-block max-w-full cursor-pointer touch-pan-y select-none outline-none [width:var(--fc-w)] [height:var(--fc-h)] [border-radius:var(--fc-radius)] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[axis=x]:touch-pan-x data-[draggable]:cursor-grab data-[dragging]:cursor-grabbing data-[disabled]:cursor-default data-[disabled]:opacity-60"
    :data-axis="axis"
    :data-draggable="draggable && !disabled && !reducedMotion ? '' : undefined"
    :data-dragging="dragging ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-fade="dataFade"
    :style="rootVars"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="(e) => release(e, false)"
    @pointercancel="(e) => release(e, true)"
    @lostpointercapture="(e) => release(e, true)"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @keydown="onKeyDown"
    @click="onClick"
    @dragstart.prevent
  >
    <span
      v-if="shadow"
      ref="shadowRef"
      class="pointer-events-none absolute [inset:12%_9%_-5%] [border-radius:var(--fc-radius)] [background:color-mix(in_srgb,var(--fc-shadow)_calc(var(--fc-shadow-o)*100%),transparent)] [filter:blur(22px)]"
      aria-hidden="true"
    />
    <div ref="rotorRef" class="absolute inset-0 [transform-style:preserve-3d]">
      <div
        class="absolute inset-0 overflow-hidden [border-radius:var(--fc-radius)] [background:var(--fc-bg)] [color:var(--fc-ink)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [&_img]:[-webkit-user-drag:none] group-data-[fade]:opacity-0 group-data-[fade]:[backface-visibility:visible] group-data-[fade]:[-webkit-backface-visibility:visible] group-data-[fade]:[transition:opacity_200ms_ease] group-data-[fade=front]:opacity-100!"
        :aria-hidden="shown"
        :inert="shown"
      >
        <slot name="front" />
        <span
          v-if="glare"
          class="pointer-events-none absolute inset-0 [opacity:var(--fc-sheen,0)] [background:radial-gradient(circle_farthest-side_at_var(--fc-gx,50%)_var(--fc-gy,50%),rgba(255,255,255,var(--fc-glare))_0%,rgba(255,255,255,calc(var(--fc-glare)*0.76))_12%,rgba(255,255,255,calc(var(--fc-glare)*0.5))_26%,rgba(255,255,255,calc(var(--fc-glare)*0.28))_42%,rgba(255,255,255,calc(var(--fc-glare)*0.12))_60%,rgba(255,255,255,calc(var(--fc-glare)*0.04))_78%,rgba(255,255,255,0)_100%)]"
          aria-hidden="true"
        />
      </div>
      <div
        class="absolute inset-0 overflow-hidden [border-radius:var(--fc-radius)] [background:var(--fc-bg)] [color:var(--fc-ink)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [&_img]:[-webkit-user-drag:none] group-data-[fade]:opacity-0 group-data-[fade]:[backface-visibility:visible] group-data-[fade]:[-webkit-backface-visibility:visible] group-data-[fade]:[transition:opacity_200ms_ease] [transform:rotateY(180deg)] group-data-[axis=x]:[transform:rotateX(180deg)] group-data-[fade]:[transform:none]! group-data-[fade=back]:opacity-100!"
        :aria-hidden="!shown"
        :inert="!shown"
      >
        <slot name="back" />
        <span
          v-if="glare"
          class="pointer-events-none absolute inset-0 [opacity:var(--fc-sheen,0)] [background:radial-gradient(circle_farthest-side_at_var(--fc-gx,50%)_var(--fc-gy,50%),rgba(255,255,255,var(--fc-glare))_0%,rgba(255,255,255,calc(var(--fc-glare)*0.76))_12%,rgba(255,255,255,calc(var(--fc-glare)*0.5))_26%,rgba(255,255,255,calc(var(--fc-glare)*0.28))_42%,rgba(255,255,255,calc(var(--fc-glare)*0.12))_60%,rgba(255,255,255,calc(var(--fc-glare)*0.04))_78%,rgba(255,255,255,0)_100%)]"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>
