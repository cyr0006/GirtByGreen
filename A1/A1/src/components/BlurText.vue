<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  text: { type: String, default: '' },
  tag: { type: String, default: 'p' },
  delay: { type: Number, default: 200 },
  animateBy: { type: String, default: 'words' }, // 'words' | 'letters'
  direction: { type: String, default: 'top' }, // 'top' | 'bottom'
  threshold: { type: Number, default: 0.1 },
  rootMargin: { type: String, default: '0px' },
  animationFrom: { type: Object, default: null },
  animationTo: { type: Array, default: null },
  easing: { type: Function, default: (t) => t },
  stepDuration: { type: Number, default: 0.35 },
})

const emit = defineEmits(['complete'])

const rootRef = ref(null)
const spanRefs = ref([])

const elements = computed(() =>
  props.animateBy === 'words' ? props.text.split(' ') : props.text.split(''),
)

const displaySegments = computed(() =>
  elements.value.map((segment, index) => {
    const base = segment === ' ' ? ' ' : segment
    const trailing = props.animateBy === 'words' && index < elements.value.length - 1 ? ' ' : ''
    return base + trailing
  }),
)

const fromSnapshot = computed(
  () =>
    props.animationFrom ??
    (props.direction === 'top'
      ? { filter: 'blur(10px)', opacity: 0, y: -50 }
      : { filter: 'blur(10px)', opacity: 0, y: 50 }),
)

const toSnapshots = computed(
  () =>
    props.animationTo ?? [
      { filter: 'blur(5px)', opacity: 0.5, y: props.direction === 'top' ? 5 : -5 },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
)

let observer = null
const timelines = []

function playAnimations() {
  const lastElIndex = spanRefs.value.length - 1
  const lastStepIndex = toSnapshots.value.length - 1

  spanRefs.value.forEach((el, index) => {
    if (!el) return

    const tl = gsap.timeline({ delay: (index * props.delay) / 1000 })
    toSnapshots.value.forEach((step, stepIndex) => {
      const isFinalStep = index === lastElIndex && stepIndex === lastStepIndex
      tl.to(el, {
        ...step,
        duration: props.stepDuration,
        ease: props.easing,
        onComplete: isFinalStep ? () => emit('complete') : undefined,
      })
    })
    timelines.push(tl)
  })
}

onMounted(() => {
  spanRefs.value.forEach((el) => {
    if (el) gsap.set(el, fromSnapshot.value)
  })

  const node = rootRef.value
  if (!node) return

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        observer.unobserve(node)
        playAnimations()
      }
    },
    { threshold: props.threshold, rootMargin: props.rootMargin },
  )
  observer.observe(node)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  timelines.forEach((tl) => tl.kill())
})
</script>

<template>
  <component :is="tag" ref="rootRef" class="blur-text flex flex-wrap">
    <span
      v-for="(segment, index) in displaySegments"
      :key="index"
      ref="spanRefs"
      class="inline-block will-change-[transform,filter,opacity]"
      >{{ segment }}</span
    >
  </component>
</template>
