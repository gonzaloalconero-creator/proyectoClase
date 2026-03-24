const HISTORY_KEY = 'codekeys-session-history-db'

function readHistory() {
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      userId: parsed.userId || null,
      startedAt: parsed.startedAt || null,
      games: Array.isArray(parsed.games) ? parsed.games : []
    }
  } catch {
    return null
  }
}

function writeHistory(value) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(value))
}

export function startHistorySession(userId) {
  if (!userId) return
  writeHistory({
    userId,
    startedAt: new Date().toISOString(),
    games: []
  })
}

export function clearHistorySession() {
  localStorage.removeItem(HISTORY_KEY)
}

export function getSessionHistory(userId) {
  const history = readHistory()
  if (!history || !userId || history.userId !== userId) return []
  return history.games
}

export function addVisitedGameToHistory(userId, game) {
  if (!userId || !game?.key) return

  let history = readHistory()
  if (!history || history.userId !== userId) {
    history = {
      userId,
      startedAt: new Date().toISOString(),
      games: []
    }
  }

  const entry = {
    key: game.key,
    name: game.name,
    img: game.img,
    platform: game.platform,
    price: game.price,
    was: game.was,
    discount: game.discount,
    viewedAt: new Date().toISOString()
  }

  const filtered = history.games.filter((item) => item.key !== game.key)
  history.games = [entry, ...filtered].slice(0, 30)
  writeHistory(history)
}
