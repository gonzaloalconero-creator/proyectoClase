const CATALOG_KEY = 'codekeys-catalog-db'

function defaultDb() {
  return {
    hiddenGames: [],
    hiddenStores: [],
    gameOverrides: {},
    storeOverrides: {},
    addedGames: [],
    addedStores: []
  }
}

function readDb() {
  const raw = localStorage.getItem(CATALOG_KEY)
  if (!raw) return defaultDb()
  try {
    const parsed = JSON.parse(raw)
    return {
      ...defaultDb(),
      ...parsed,
      hiddenGames: Array.isArray(parsed.hiddenGames) ? parsed.hiddenGames : [],
      hiddenStores: Array.isArray(parsed.hiddenStores) ? parsed.hiddenStores : [],
      addedGames: Array.isArray(parsed.addedGames) ? parsed.addedGames : [],
      addedStores: Array.isArray(parsed.addedStores) ? parsed.addedStores : []
    }
  } catch {
    return defaultDb()
  }
}

function writeDb(db) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(db))
}

function upsertByKey(items, item) {
  const index = items.findIndex((x) => x.key === item.key)
  if (index >= 0) {
    items[index] = { ...items[index], ...item }
  } else {
    items.push(item)
  }
}

export function applyGameCatalog(baseGames) {
  const db = readDb()
  const map = new Map(baseGames.map((g) => [g.key, { ...g }]))

  db.addedGames.forEach((g) => {
    map.set(g.key, { ...g })
  })

  Object.entries(db.gameOverrides).forEach(([key, override]) => {
    const existing = map.get(key)
    if (existing) {
      map.set(key, { ...existing, ...override })
    }
  })

  return [...map.values()].filter((g) => !db.hiddenGames.includes(g.key))
}

export function applyStoreCatalog(baseStores) {
  const db = readDb()
  const map = new Map(baseStores.map((s) => [s.key, { ...s }]))

  db.addedStores.forEach((s) => {
    map.set(s.key, { ...s })
  })

  Object.entries(db.storeOverrides).forEach(([key, override]) => {
    const existing = map.get(key)
    if (existing) {
      map.set(key, { ...existing, ...override })
    }
  })

  return [...map.values()].filter((s) => !db.hiddenStores.includes(s.key))
}

export function setGameHidden(key, hidden) {
  const db = readDb()
  const set = new Set(db.hiddenGames)
  if (hidden) set.add(key)
  else set.delete(key)
  db.hiddenGames = [...set]
  writeDb(db)
}

export function setStoreHidden(key, hidden) {
  const db = readDb()
  const set = new Set(db.hiddenStores)
  if (hidden) set.add(key)
  else set.delete(key)
  db.hiddenStores = [...set]
  writeDb(db)
}

export function upsertGameOverride(override) {
  const db = readDb()
  if (!override?.key) return
  db.gameOverrides[override.key] = {
    ...(db.gameOverrides[override.key] || {}),
    ...override
  }
  writeDb(db)
}

export function upsertStoreOverride(override) {
  const db = readDb()
  if (!override?.key) return
  db.storeOverrides[override.key] = {
    ...(db.storeOverrides[override.key] || {}),
    ...override
  }
  writeDb(db)
}

export function addGame(game) {
  if (!game?.key) return
  const db = readDb()
  upsertByKey(db.addedGames, game)
  writeDb(db)
}

export function addStore(store) {
  if (!store?.key) return
  const db = readDb()
  upsertByKey(db.addedStores, store)
  writeDb(db)
}

export function getCatalogDbSnapshot() {
  return readDb()
}
