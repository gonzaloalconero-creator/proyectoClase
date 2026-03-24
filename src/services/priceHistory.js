// priceHistory.js
// Simula un histórico de precios para cada juego y tienda

export function getPriceHistory(gameKey) {
  // Simulación: 4 tiendas, 30 días
  const stores = [
    { key: 'steam', name: 'Steam' },
    { key: 'epic', name: 'Epic Games' },
    { key: 'psn', name: 'PlayStation Store' },
    { key: 'xbox', name: 'Xbox Store' }
  ]
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  // Genera precios aleatorios para cada tienda y día
  return stores.map(store => ({
    storeKey: store.key,
    storeName: store.name,
    prices: days.map(day => ({
      day,
      price: +(30 + Math.random() * 10 - (day * 0.1)).toFixed(2) // Simula bajada
    }))
  }))
}
