<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { ProjectService } from '@/service/ProjectService'
import { PlantService } from '@/service/PlantService'
import { trimmed, containsHtml } from '@/utils/validation'
import { renderMarkdownLite } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id

const project = ref(null)
const loadError = ref('')
const loading = ref(true)

const messages = ref([])
const pendingMessages = ref([])
const draft = ref('')
const sendError = ref('')
const sending = ref(false)

let unsubscribe = null
const scrollEl = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

onMounted(async () => {
  try {
    project.value = await ProjectService.getProject(projectId)
    if (!project.value) {
      loadError.value = 'Project not found.'
    }
  } catch (err) {
    console.error('Failed to load project:', err)
    loadError.value = 'Could not load this project right now.'
  } finally {
    loading.value = false
  }

  unsubscribe = ProjectService.listenToMessages(projectId, (msgs) => {
    messages.value = msgs
    // Once the server-saved message with matching content shows up, drop the
    // local optimistic echo for it so it isn't shown twice.
    pendingMessages.value = pendingMessages.value.filter(
      (pending) => !msgs.some((m) => m.role === 'user' && m.content === pending.content),
    )
    scrollToBottom()
  })
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
})

watch(pendingMessages, scrollToBottom)

async function sendMessage() {
  sendError.value = ''
  const text = trimmed(draft.value)
  if (!text) return
  if (text.length > 2000) {
    sendError.value = 'Message must be 2000 characters or fewer.'
    return
  }
  if (containsHtml(text)) {
    sendError.value = 'Message cannot contain < or > characters.'
    return
  }

  draft.value = ''
  pendingMessages.value.push({ role: 'user', content: text, pending: true })
  sending.value = true
  scrollToBottom()

  try {
    const plants = await PlantService.getPlants()
    const plantsContext = plants.map((p) => ({
      name: p.name,
      origin: p.origin,
      dimensions: p.dimensions,
      sun: p.sun,
      water: p.water,
      description: p.description,
    }))
    await ProjectService.sendChatMessage({ projectId, message: text, plantsContext })
  } catch (err) {
    console.error('Failed to send message:', err)
    sendError.value = err?.message || 'Failed to get a reply. Please try again.'
    pendingMessages.value = pendingMessages.value.filter((m) => m.content !== text)
  } finally {
    sending.value = false
  }
}

function formatTime(timestamp) {
  const date = timestamp?.toDate?.()
  if (!date) return ''
  return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}
</script>

<template>
  <div class="py-10 px-4 max-w-4xl mx-auto">
    <Button
      label="Back to projects"
      icon="pi pi-arrow-left"
      text
      class="mb-4"
      @click="router.push('/my-garden-projects')"
    />

    <p v-if="loading" class="text-center text-surface-500">Loading project...</p>
    <Message v-else-if="loadError" severity="error" :closable="false">{{ loadError }}</Message>

    <template v-else>
      <Card class="mb-4">
        <template #title>{{ project.address }}</template>
        <template #content>
          <p class="text-sm text-surface-600"><strong>Goal:</strong> {{ project.goal }}</p>
          <p class="text-sm text-surface-600">
            <strong>Conditions:</strong> {{ project.conditions }}
          </p>
        </template>
      </Card>

      <Card>
        <template #title>Garden Advisor Chat</template>
        <template #content>
          <div ref="scrollEl" class="flex flex-col gap-3 h-[50vh] overflow-y-auto p-2">
            <p
              v-if="!messages.length && !pendingMessages.length"
              class="text-center text-surface-400 text-sm mt-8"
            >
              Ask about what to plant, how to prepare the space, or anything else about this
              project.
            </p>
            <div
              v-for="m in messages"
              :key="m.id"
              class="flex flex-col max-w-[80%]"
              :class="m.role === 'user' ? 'self-end items-end' : 'self-start items-start'"
            >
              <div
                class="chat-bubble rounded-lg px-3 py-2 text-sm"
                :class="m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'"
                v-html="renderMarkdownLite(m.content)"
              ></div>
              <span class="text-xs text-surface-400 mt-1">{{ formatTime(m.createdAt) }}</span>
            </div>
            <div
              v-for="(m, i) in pendingMessages"
              :key="`pending-${i}`"
              class="flex flex-col max-w-[80%] self-end items-end opacity-60"
            >
              <div
                class="chat-bubble chat-bubble-user rounded-lg px-3 py-2 text-sm"
                v-html="renderMarkdownLite(m.content)"
              ></div>
            </div>
            <div v-if="sending" class="flex items-center gap-2 self-start text-surface-400 text-sm">
              <ProgressSpinner style="width: 16px; height: 16px" :strokeWidth="6" />
              Thinking...
            </div>
          </div>

          <Message v-if="sendError" severity="error" :closable="false" class="mt-3">{{
            sendError
          }}</Message>

          <div class="flex gap-2 mt-3">
            <Textarea
              v-model="draft"
              rows="2"
              class="flex-1"
              placeholder="Ask the garden advisor..."
              maxlength="2000"
              :disabled="sending"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <Button label="Send" :loading="sending" @click="sendMessage" />
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<style scoped>
.chat-bubble-user {
  background-color: var(--p-primary-color);
  color: #ffffff;
}

.chat-bubble {
  max-width: 100%;
  overflow-x: auto;
}

.chat-bubble-assistant {
  background-color: var(--p-gray-900);
  color: #f5f5f5;
}

/* The global base reset (src/assets/base.css) sets font-weight: normal on
   every element, and Tailwind's preflight sets heading font-size/weight to
   `inherit` - both would otherwise flatten everything marked.js produces
   back to plain text. These rules are unlayered so they win over both. */
.chat-bubble :deep(strong) {
  font-weight: 600;
}
.chat-bubble :deep(em) {
  font-style: italic;
}
.chat-bubble :deep(h1),
.chat-bubble :deep(h2),
.chat-bubble :deep(h3),
.chat-bubble :deep(h4) {
  font-weight: 600;
  margin: 0.75rem 0 0.4rem;
}
.chat-bubble :deep(h1:first-child),
.chat-bubble :deep(h2:first-child),
.chat-bubble :deep(h3:first-child),
.chat-bubble :deep(h4:first-child) {
  margin-top: 0;
}
.chat-bubble :deep(h1) {
  font-size: 1.25rem;
}
.chat-bubble :deep(h2) {
  font-size: 1.125rem;
}
.chat-bubble :deep(h3),
.chat-bubble :deep(h4) {
  font-size: 1rem;
}
.chat-bubble :deep(p) {
  margin: 0 0 0.5rem;
}
.chat-bubble :deep(ul),
.chat-bubble :deep(ol) {
  margin: 0 0 0.5rem;
  padding-left: 1.25rem;
}
.chat-bubble :deep(ul) {
  list-style: disc;
}
.chat-bubble :deep(ol) {
  list-style: decimal;
}
.chat-bubble :deep(p:last-child),
.chat-bubble :deep(ul:last-child),
.chat-bubble :deep(ol:last-child),
.chat-bubble :deep(table:last-child) {
  margin-bottom: 0;
}
.chat-bubble :deep(code) {
  background-color: rgba(0, 0, 0, 0.12);
  border-radius: 0.25rem;
  padding: 0.1rem 0.3rem;
  font-size: 0.85em;
}
.chat-bubble :deep(pre) {
  background-color: rgba(0, 0, 0, 0.12);
  border-radius: 0.375rem;
  padding: 0.5rem;
  overflow-x: auto;
  margin: 0 0 0.5rem;
}
.chat-bubble :deep(pre code) {
  background-color: transparent;
  padding: 0;
}
.chat-bubble :deep(table) {
  border-collapse: collapse;
  margin: 0 0 0.5rem;
  font-size: 0.85em;
}
.chat-bubble :deep(th),
.chat-bubble :deep(td) {
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 0.3rem 0.5rem;
  text-align: left;
}
.chat-bubble :deep(th) {
  font-weight: 600;
}
</style>
