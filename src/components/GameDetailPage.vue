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
      <GameOffersList
        :offers="storeOffers"
        :currency="currency"
        :game-name="game.name"
      />
    </div>

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
  game:     { type: Object, required: true },
  currency: { type: String, default: 'EUR' }
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
const storeOffers = ref([])

const shortDescription = computed(() => {
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
    borderColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
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
.fav-btn:hover { background: #ffe4e1; }
.heart { font-size: 1.7em; color: #f97316; transition: color 0.15s; }
.heart.filled { color: #e11d48; }

.game-detail-page {
  width: 100vw;
  max-width: 100vw;
  margin: 0;
  padding: 0 0 40px 0;
  box-sizing: border-box;
}

.game-detail-card {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-medium);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.13);
  padding: 36px;
  display: flex;
  gap: 32px;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
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
}

.store-prices-box,
.price-chart-box {
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
.store-prices-box h3,
.price-chart-box h3 {
  color: var(--accent);
  font-size: 1.18em;
  margin-bottom: 14px;
  font-weight: 700;
}

.store-prices-box { position: relative; }
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
  transition: background var(--transition);
  z-index: 10;
}
.back-btn:hover { background: var(--accent-hover); }

@media (max-width: 900px) {
  .game-detail-card { flex-direction: column; padding: 24px 8vw; gap: 18px; }
  .store-prices-box, .price-chart-box { padding-left: 8vw; padding-right: 8vw; }
}
@media (max-width: 600px) {
  .game-detail-img { width: 100%; max-width: 320px; height: auto; min-height: 180px; }
  .game-detail-title { font-size: 1.3em; text-align: center; }
  .back-btn { top: 10px; right: 16px; padding: 6px 16px; font-size: 0.95em; }
}
</style>