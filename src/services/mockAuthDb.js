import { clearHistorySession, startHistorySession } from './sessionHistoryDb'

const SESSION_KEY = 'codekeys-session-user'

export async function registerUser({ name, email, password }) {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    const data = await res.json()
    if (data.ok) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))
      startHistorySession(data.user.id)
    }
    return data
  } catch {
    return { ok: false, error: 'SERVER_ERROR' }
  }
}

export async function loginUser({ email, password }) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.ok) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))
      startHistorySession(data.user.id)
    }
    return data
  } catch {
    return { ok: false, error: 'SERVER_ERROR' }
  }
}

export function getSessionUser() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.id) return null
    return parsed
  } catch {
    return null
  }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)
  clearHistorySession()
}
