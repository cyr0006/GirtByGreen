<template>
  <div class="flex justify-center items-center min-h-[calc(100vh-80px)] px-4">
    <Card class="max-w-sm w-full">
      <template #title>My Profile</template>
      <template #content>
        <div class="flex flex-col items-center gap-4 py-2">
          <Avatar :label="initials" shape="circle" size="xlarge" class="text-xl" />
          <div class="text-center">
            <div class="text-lg font-semibold">{{ user?.displayName || 'Unnamed User' }}</div>
            <div class="text-sm text-surface-500">{{ user?.email }}</div>
          </div>

          <Divider />

          <div class="w-full flex flex-col gap-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-surface-500">Account type</span>
              <Tag :value="roleLabel" :severity="getRoleSeverity" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-surface-500">Member since</span>
              <span>{{ memberSince }}</span>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import { useAuth } from '../composables/useAuth'

const { user, isOrg, isAdmin } = useAuth()

const roleLabel = computed(() => (isOrg.value ? 'Organisation' : isAdmin.value ? 'Admin' : 'User'))

const getRoleSeverity = computed(() => {
  if (isOrg.value) return 'info'
  if (isAdmin.value) return 'success'
  return 'secondary'
})

const initials = computed(() => {
  const name = user.value?.displayName?.trim()
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const memberSince = computed(() => {
  const created = user.value?.metadata?.creationTime
  if (!created) return '—'
  return new Date(created).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})
</script>
