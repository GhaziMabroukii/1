import { createClient } from '@blinkdotnew/sdk'

function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = window.location.hostname
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  if (match) return match[1]
  return 'ekrili-rentals-app-91sv24m9'
}

export const blink = createClient({
  projectId: getProjectId(),
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY,
  auth: { mode: 'managed' },
})
