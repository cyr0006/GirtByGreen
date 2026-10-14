<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  text: { type: [String, Array], required: true },
  tag: { type: String, default: 'div' },
  typingSpeed: { type: Number, default: 50 },
  initialDelay: { type: Number, default: 0 },
  pauseDuration: { type: Number, default: 2000 },
  deletingSpeed: { type: Number, default: 30 },
  loop: { type: Boolean, default: true },
  showCursor: { type: Boolean, default: true },
  hideCursorWhileTyping: { type: Boolean, default: false },
  cursorCharacter: { type: String, default: '|' },
  cursorClassName: { type: String, default: '' },
  cursorBlinkDuration: { type: Number, default: 0.5 },
  textColors: { type: Array, default: () => [] },
  variableSpeed: { type: Object, default: null }, // { min, max }
  startOnVisible: { type: Boolean, default: false },
  reverseMode: { type: Boolean, default: false },
})

const emit = defineEmits(['sentence-complete'])

const displayedText = ref('')
const currentCharIndex = ref(0)
const isDeleting = ref(false)
const currentTextIndex = ref(0)
const isVisible = ref(!props.startOnVisible)

const containerRef = ref(null)
const cursorRef = ref(null)

const textArray = computed(() => (Array.isArray(props.text) ? props.text : [props.text]))

const currentColor = computed(() =>
  props.textColors.length === 0 ? 'inherit' : props.textColors[currentTextIndex.value % props.textColors.length],
)

const shouldHideCursor = computed(
  () =>
    props.hideCursorWhileTyping &&
    (currentCharIndex.value < textArray.value[currentTextIndex.value].length || isDeleting.value),
)

function getRandomSpeed() {
  if (!props.variableSpeed) return props.typingSpeed
  const { min, max } = props.variableSpeed
  return Math.random() * (max - min) + min
}

let timeoutId = null
let cursorTween = null
let observer = null

function runEffect() {
  if (!isVisible.value) return

  const currentText = textArray.value[currentTextIndex.value]
  const processedText = props.reverseMode ? currentText.split('').reverse().join('') : currentText

  const executeTypingAnimation = () => {
    if (isDeleting.value) {
      if (displayedText.value === '') {
        isDeleting.value = false
        if (currentTextIndex.value === textArray.value.length - 1 && !props.loop) return
        emit('sentence-complete', textArray.value[currentTextIndex.value], currentTextIndex.value)
        currentTextIndex.value = (currentTextIndex.value + 1) % textArray.value.length
        currentCharIndex.value = 0
        runEffect()
      } else {
        timeoutId = setTimeout(() => {
          displayedText.value = displayedText.value.slice(0, -1)
          runEffect()
        }, props.deletingSpeed)
      }
    } else if (currentCharIndex.value < processedText.length) {
      timeoutId = setTimeout(
        () => {
          displayedText.value += processedText[currentCharIndex.value]
          currentCharIndex.value += 1
          runEffect()
        },
        props.variableSpeed ? getRandomSpeed() : props.typingSpeed,
      )
    } else if (textArray.value.length >= 1) {
      if (!props.loop && currentTextIndex.value === textArray.value.length - 1) return
      timeoutId = setTimeout(() => {
        isDeleting.value = true
        runEffect()
      }, props.pauseDuration)
    }
  }

  if (currentCharIndex.value === 0 && !isDeleting.value && displayedText.value === '') {
    timeoutId = setTimeout(executeTypingAnimation, props.initialDelay)
  } else {
    executeTypingAnimation()
  }
}

onMounted(() => {
  if (props.showCursor && cursorRef.value) {
    gsap.set(cursorRef.value, { opacity: 1 })
    cursorTween = gsap.to(cursorRef.value, {
      opacity: 0,
      duration: props.cursorBlinkDuration,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    })
  }

  if (props.startOnVisible && containerRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible.value) {
            isVisible.value = true
            runEffect()
          }
        })
      },
      { threshold: 0.1 },
    )
    observer.observe(containerRef.value)
  } else {
    runEffect()
  }
})

onBeforeUnmount(() => {
  clearTimeout(timeoutId)
  cursorTween?.kill()
  observer?.disconnect()
})
</script>

<template>
  <component :is="tag" ref="containerRef" class="inline-block whitespace-pre-wrap tracking-tight">
    <span class="inline" :style="{ color: currentColor }">{{ displayedText }}</span>
    <span
      v-if="showCursor"
      ref="cursorRef"
      :class="['ml-1 inline-block opacity-100', shouldHideCursor ? 'hidden' : '', cursorClassName]"
      >{{ cursorCharacter }}</span
    >
  </component>
</template>
