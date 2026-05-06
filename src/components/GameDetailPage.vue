<template>
  <main class="game-detail-page">
    <div class="game-detail-card">
      <div class="game-detail-img-wrap">
        <img :src="game.img" :alt="game.name" class="game-detail-img" />
        <button class="fav-btn" :aria-pressed="isFavorite" @click="toggleFavorite">
          <span v-if="isFavorite" class="heart filled">♥</span>
          <span v-else class="heart">♡</span>
        </button>
      </div>
      <div class="game-detail-info">
        <h1 class="game-detail-title">{{ game.name }}</h1>
        <p class="game-detail-desc">{{ shortDescription }}</p>
      </div>
    </div>
    <div class="store-prices-box">
      <button class="back-btn" @click="$emit('back')">← Volver</button>
      <h3>Precios en tiendas</h3>
      <GameOffersList :offers="storeOffers" />
    </div>
    <!-- El bloque de precios ya incluye el botón de volver -->
    <div class="price-chart-box">
      <h3>Evolución de precios este mes</h3>
      <canvas ref="chartRef" width="400" height="200"></canvas>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import GameOffersList from './GameOffersList.vue'
import Chart from 'chart.js/auto'
import { getPriceHistory } from '../services/priceHistory'
import { fetchOfertas, fetchPrecioHistorial } from '../services/apiService'

const props = defineProps({
  game: { type: Object, required: true }
})

const isFavorite = ref(false)
const FAVORITES_KEY = 'favoriteGames'

function loadFavorite() {
  const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  isFavorite.value = favs.includes(props.game.key)
}

function toggleFavorite() {
  const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  if (isFavorite.value) {
    const idx = favs.indexOf(props.game.key)
    if (idx !== -1) favs.splice(idx, 1)
    isFavorite.value = false
  } else {
    favs.push(props.game.key)
    isFavorite.value = true
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
}

watch(() => props.game.key, loadFavorite, { immediate: true })

const chartRef = ref(null)
let chartInstance = null

const priceHistory = ref([])

// TODO: keyStores y storeOffers simulados comentados — datos vienen de la BD
// const keyStores = [ ... ]
// const storeOffers = computed(() => { ... generación simulada ... })

const storeOffers = ref([])

const shortDescription = computed(() => {
  // Simulación de descripción resumida
  return props.game?.desc || 'Sin descripción disponible.'
})

function renderChart() {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()
  const labels = Array.from({ length: 30 }, (_, i) => i + 1)
  const datasets = priceHistory.value.map(store => ({
    label: store.storeName,
    data: store.prices.map(p => p.price),
    fill: false,
    borderColor: '#' + Math.floor(Math.random()*16777215).toString(16),
    tension: 0.2
  }))
  chartInstance = new Chart(chartRef.value, {
    type: 'line',
    data: { labels, datasets },
    options: {
      plugins: { legend: { display: true } },
      responsive: true,
      scales: {
        y: { beginAtZero: false, title: { display: true, text: 'Precio (€)' } },
        x: { title: { display: true, text: 'Día del mes' } }
      }
    }
  })
}

async function loadGameData(slug) {
  try {
    storeOffers.value = await fetchOfertas(slug)
  } catch {
    storeOffers.value = []
  }
  try {
    const historial = await fetchPrecioHistorial(slug)
    priceHistory.value = historial.length ? historial : getPriceHistory(slug)
  } catch {
    priceHistory.value = getPriceHistory(slug)
  }
  setTimeout(renderChart, 100)
}

watch(() => props.game, (g) => { if (g) loadGameData(g.key) })

onMounted(() => { if (props.game) loadGameData(props.game.key) })
</script>

<style scoped>
.game-detail-img-wrap {
  position: relative;
  display: inline-block;
}
.fav-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255,255,255,0.85);
  border: none;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.10);
  transition: background 0.15s;
  z-index: 2;
}
.fav-btn:hover {
  background: #ffe4e1;
}
.heart {
  font-size: 1.7em;
  color: #f97316;
  transition: color 0.15s;
}
.heart.filled {
  color: #e11d48;
}
@media (max-width: 600px) {
  .game-detail-page {
    max-width: 100vw;
    margin: 0;
    padding: 0 0 24px 0;
  }
  .game-detail-card {
    flex-direction: column;
    gap: 18px;
    padding: 18px 8px 16px 8px;
    border-radius: var(--radius-md);
    margin-bottom: 18px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.10);
  }
  .game-detail-img {
    width: 100%;
    max-width: 320px;
    height: auto;
    min-height: 180px;
    margin: 0 auto;
    display: block;
    border-radius: var(--radius-md);
  }
  .game-detail-info {
    gap: 8px;
    padding: 0 2px;
  }
  .game-detail-title {
    font-size: 1.3em;
    text-align: center;
    margin-bottom: 6px;
  }
  .game-detail-desc {
    font-size: 1em;
    text-align: center;
    margin-bottom: 4px;
  }
  .store-prices-box, .price-chart-box {
    padding: 12px 4vw 10px 4vw;
    margin-bottom: 14px;
    border-radius: var(--radius-sm);
  }
  .store-prices-box h3, .price-chart-box h3 {
    font-size: 1em;
    margin-bottom: 8px;
    text-align: center;
  }
  .back-btn {
    width: 100%;
    padding: 12px 0;
    font-size: 1em;
    margin-top: 14px;
    border-radius: var(--radius-sm);
  }
}
/* --- Rediseño para encajar con la web principal --- */
.game-detail-page {
  width: 100vw;
  max-width: 100vw;
  margin: 0;
  padding: 0 0 40px 0;
  box-sizing: border-box;
  border-radius: 0;
  box-shadow: none;
}

.game-detail-card {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-medium);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.13);
  padding: 36px 36px 28px 36px;
  display: flex;
  gap: 32px;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 900px) {
  .game-detail-card {
    flex-direction: column;
    align-items: center;
    padding: 24px 8vw 18px 8vw;
    gap: 18px;
  }
  .game-detail-img-wrap {
    margin-bottom: 10px;
  }
}
@media (max-width: 800px) {
  .game-detail-card {
    padding-right: 18px;
    padding-left: 12px;
  }
}

.game-detail-img {
  width: 210px;
  height: 280px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 2.5px solid var(--border-subtle);
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.18);
  background: var(--bg-elevated);
}

.game-detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.game-detail-title {
  margin: 0 0 10px 0;
  color: var(--text-primary);
  font-size: 2.1em;
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.5px;
}
.game-detail-desc {
  color: var(--text-secondary);
  font-size: 1.13em;
  line-height: 1.6;
  margin-bottom: 8px;
}

.store-prices-box, .price-chart-box {
  background: var(--bg-elevated);
  border: 1px solid var(--border-faint);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.07);
  padding: 22px 36px 18px 36px;
  margin-bottom: 24px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 900px) {
  .store-prices-box, .price-chart-box {
    padding-left: 8vw;
    padding-right: 8vw;
  }
}
.store-prices-box h3, .price-chart-box h3 {
  color: var(--accent);
  font-size: 1.18em;
  margin-bottom: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.price-chart-box {
  padding-bottom: 24px;
}
/* Botón de volver flotante en la esquina superior izquierda del bloque de precios */
.store-prices-box {
  position: relative;
}
.back-btn {
  position: absolute;
  top: 14px;
  right: 32px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 24px;
  font-size: 1em;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.08);
  transition: background var(--transition), color var(--transition);
  z-index: 10;
}
.back-btn:hover {
  background: var(--accent-hover);
  color: #fff;
}
@media (max-width: 600px) {
  .back-btn {
    top: 6px;
    right: 16px;
    left: auto;
    padding: 6px 16px;
    font-size: 0.95em;
  }
}
@media (max-width: 600px) {
  .back-btn {
    top: 10px;
    left: 10px;
    padding: 8px 18px;
    font-size: 1em;
  }
}
</style>
