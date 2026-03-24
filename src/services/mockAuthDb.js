import { clearHistorySession, startHistorySession } from './sessionHistoryDb'

const USERS_KEY = 'codekeys-users-db'
const SESSION_KEY = 'codekeys-session-user'

function readUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    const seeded = [
      {
        id: 'admin_seed',
        name: 'Administrador',
        email: 'admin@codekeys.local',
        password: 'admin123',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ]
    writeUsers(seeded)
    return seeded
  }
  try {
    const users = JSON.parse(raw)
    return Array.isArray(users)
      ? users.map((u) => ({ ...u, role: u.role || 'normal' }))
      : []
  } catch {
    return []
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'normal'
  }
}

export function registerUser({ name, email, password }) {
  const users = readUsers()
  const cleanEmail = email.trim().toLowerCase()

  const exists = users.some((u) => u.email === cleanEmail)
  if (exists) {
    return { ok: false, error: 'EMAIL_EXISTS' }
  }

  const user = {
    id: `u_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name: name.trim(),
    email: cleanEmail,
    password,
    role: 'normal',
    createdAt: new Date().toISOString()
  }

  users.push(user)
  writeUsers(users)
  localStorage.setItem(SESSION_KEY, user.id)
  startHistorySession(user.id)

  return { ok: true, user: publicUser(user) }
}

export function loginUser({ email, password }) {
  const users = readUsers()
  const cleanEmail = email.trim().toLowerCase()
  const user = users.find((u) => u.email === cleanEmail && u.password === password)

  if (!user) {
    return { ok: false, error: 'INVALID_CREDENTIALS' }
  }

  localStorage.setItem(SESSION_KEY, user.id)
  startHistorySession(user.id)
  return { ok: true, user: publicUser(user) }
}

export function getSessionUser() {
  const sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) return null

  const users = readUsers()
  const user = users.find((u) => u.id === sessionId)
  return user ? publicUser(user) : null
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)
  clearHistorySession()
}
