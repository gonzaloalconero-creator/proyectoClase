const ALERTS_KEY = 'codekeys-price-alerts'

function readAlerts() {
  try {
    const raw = localStorage.getItem(ALERTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAlerts(alerts) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
}

export function getAlerts(userId) {
  return readAlerts().filter(a => a.userId === userId)
}

export function hasAlert(userId, gameSlug) {
  return readAlerts().some(a => a.userId === userId && a.gameSlug === gameSlug)
}

export function addAlert(userId, { gameSlug, gameName, gameImg, targetPrice }) {
  const alerts = readAlerts()
  if (alerts.some(a => a.userId === userId && a.gameSlug === gameSlug)) return false
  alerts.push({
    id: `alert_${Date.now()}`,
    userId,
    gameSlug,
    gameName,
    gameImg,
    targetPrice: parseFloat(targetPrice),
    createdAt: new Date().toISOString(),
    triggered: false,
    triggeredPrice: null,
    triggeredAt: null,
    storeName: null
  })
  writeAlerts(alerts)
  return true
}

export function removeAlert(alertId) {
  writeAlerts(readAlerts().filter(a => a.id !== alertId))
}

export function dismissTriggered(alertId) {
  writeAlerts(readAlerts().map(a => a.id === alertId ? { ...a, triggered: false } : a))
}

export async function checkAlerts(userId) {
  const all = readAlerts()
  const pending = all.filter(a => a.userId === userId && !a.triggered)
  if (!pending.length) return []

  const triggered = []

  for (const alert of pending) {
    try {
      const res = await fetch(`/api/ofertas/${alert.gameSlug}`)
      if (!res.ok) continue
      const offers = await res.json()
      if (!Array.isArray(offers) || !offers.length) continue

      const cheapest = offers.reduce((min, o) => o.price < min.price ? o : min, offers[0])

      if (cheapest.price <= alert.targetPrice) {
        const idx = all.findIndex(a => a.id === alert.id)
        if (idx !== -1) {
          all[idx] = {
            ...all[idx],
            triggered: true,
            triggeredPrice: cheapest.price,
            triggeredAt: new Date().toISOString(),
            storeName: cheapest.storeName
          }
          triggered.push(all[idx])
        }
      }
    } catch {
      // red o API no disponible, ignorar esta alerta
    }
  }

  if (triggered.length) writeAlerts(all)
  return triggered
}
