<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { getPriceHistory } from '../services/priceHistory'
import GameOffersList from './GameOffersList.vue'
import CheapestGamesList from './CheapestGamesList.vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  game: {
    type: Object,
    default: null
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  locale: {
    type: String,
    default: 'es'
  }
})

const emit = defineEmits(['close'])

const labels = {
  es: {
    title: 'Detalle del juego',
    platform: 'Plataforma',
    verified: 'Verificado',
    discount: 'Descuento actual',
    best: 'Mejor precio ahora',
    close: 'Cerrar',
    info: 'Este modal ya esta conectado en Vue. El siguiente paso seria poblar tabla de tiendas, filtros y ordenacion desde datos reales.'
  },
  en: {
    title: 'Game details',
    platform: 'Platform',
    verified: 'Verified',
    discount: 'Current discount',
    best: 'Best price now',
    close: 'Close',
    info: 'This modal is already connected in Vue. Next step is to populate store table, filters and sorting from real data.'
  }
}

const USD_RATE = 1.08

function t(key) {
  return labels[props.locale]?.[key] || labels.es[key]
}

function money(value) {
  if (value == null) return '-'
  const normalized = props.currency === 'USD' ? value * USD_RATE : value
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol} ${normalized.toFixed(2)}`
}

const title = computed(() => props.game?.name || t('title'))
const cover = computed(() => props.game?.img || '')
const bestPrice = computed(() => money(props.game?.price))
const originalPrice = computed(() => money(props.game?.was))
const discount = computed(() => props.game?.discount || '-')


// --- Precios por tienda y gráfica ---
const priceHistory = ref([])
const chartRef = ref(null)
let chartInstance = null

// Ranking dinámico: todas las ofertas del mismo juego en distintas tiendas/plataformas
const cheapestOffers = computed(() => {
  if (!props.game) return [];
  // Usar priceHistory para simular ofertas en tiendas
  return priceHistory.value
    .map((store, idx) => {
      const lastPrice = store.prices[store.prices.length-1]?.price || 0;
      return {
        id: `${props.game.key}-${store.storeKey}`,
        gameTitle: props.game.name,
        storeName: store.storeName,
        storeLogo: `/logos/${store.storeKey}.png`,
        rating: [4.2, 3.4, 4.7, 4.0][idx] || 4.0,
        votes: [319, 367, 63, 157][idx] || 0,
        platform: ['PC', 'PC', 'PSN', 'Xbox'][idx] || 'PC',
        platformIcon: `/platforms/${store.storeKey}.png`,
        edition: 'Standard',
        originalPrice: lastPrice + 5, // Simulado
        couponPercent: [15, 18, 15, 13][idx] || 0,
        couponCode: ['AKSDRFFL', 'AKS18', 'SUPERDEAL', 'SEAL13AKS'][idx] || '',
        finalPrice: lastPrice
      }
    })
    .sort((a, b) => a.finalPrice - b.finalPrice);
})

function loadPriceHistory() {
  priceHistory.value = getPriceHistory(props.game?.key)
}

function renderChart() {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.destroy()
  }
  // Ejes: días (1-30), series: tiendas
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

watch(() => props.game, () => {
  if (props.game) {
    loadPriceHistory()
    setTimeout(renderChart, 100)
  }
})

onMounted(() => {
  if (props.game) {
    loadPriceHistory()
    setTimeout(renderChart, 100)
  }
})

function closeModal() {
  emit('close')
}


</script>

<template>
  <div
    id="gameModal"
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Detalle del juego"
    :class="{ open }"
    @click.self="closeModal"
  >
    <div class="modal-inner">
      <div class="modal-close-row">
        <button class="modal-close-btn" :aria-label="t('close')" @click="closeModal">✕ {{ t('close') }}</button>
      </div>


      <!-- Ofertas visuales por tienda (actual juego) -->
      <div class="store-prices-box">
        <h3>Precios en tiendas</h3>
        <GameOffersList :offers="storeOffers" />
      </div>

      <!-- Gráfica de evolución de precios -->
      <div class="price-chart-box">
        <h3>Evolución de precios este mes</h3>
        <canvas ref="chartRef" width="400" height="200"></canvas>
      </div>

      <div class="info-box">
        <span style="flex-shrink:0;">ℹ️</span>
        <span>{{ t('info') }}</span>
      </div>
    </div>
  </div>
</template>
<style scoped>
.modal-compare-btn {
  margin-left: 12px;
  background: #3fffad;
  color: #23263a;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.modal-compare-btn:hover {
  background: #2fdc8c;
}
</style>
