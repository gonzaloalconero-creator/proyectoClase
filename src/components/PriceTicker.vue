<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchJuegos, fetchTiendas } from '../services/apiService'

const props = defineProps({
  currency: { type: String, default: 'EUR' },
  locale:   { type: String, default: 'es'  }
})

const USD_RATE = 1.08

const labels = {
  es: { offer: 'OFERTA', was: 'Antes' },
  en: { offer: 'DEAL',   was: 'Was'   }
}

function t(key) {
  return labels[props.locale]?.[key] || labels.es[key]
}

function money(value) {
  if (value == null) return '-'
  const normalized = props.currency === 'USD' ? value * USD_RATE : value
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol}${normalized.toFixed(2)}`
}

function storeScore(tienda) {
  const rating = tienda.rating || 0
  const votes  = tienda.votes  || 1
  return rating * Math.log10(votes + 1)
}

const tickerGames = ref([])

onMounted(async () => {
  try {
    const [juegos, tiendas] = await Promise.all([fetchJuegos(), fetchTiendas()])

    const bestStoreScore = tiendas.reduce((best, t) => {
      const s = storeScore(t)
      return s > best ? s : best
    }, 1)

    tickerGames.value = juegos
      .filter(g => g.discount > 0)
      .map(g => ({
        ...g,
        _score: g.discount * (bestStoreScore / 10)
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 20)
  } catch {
    tickerGames.value = []
  }
})

const marqueeItems = computed(() => [...tickerGames.value, ...tickerGames.value])
</script>

<template>
  <div class="ticker" aria-label="Mejores ofertas" aria-live="off">
    <div class="ticker-inner" id="tickerInner">
      <div
        v-for="(game, index) in marqueeItems"
        :key="`${game.key}-${index}`"
        class="ticker-item"
      >
        <span>{{ t('offer') }}</span>
        <span class="tsep">|</span>
        <span>{{ game.name }}</span>
        <span class="tsep">|</span>
        <span>{{ money(game.price) }}</span>
        <span class="tsep">{{ t('was') }} {{ money(game.was) }}</span>
        <span class="tsep">-{{ game.discount }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  background: linear-gradient(90deg, var(--accent) 0%, #ea580c 50%, var(--accent) 100%);
  background-size: 200% 100%;
  animation: ticker-bg 8s linear infinite;
  padding: 7px 0;
  /* Clave: evita que el contenido horizontal desborde el viewport */
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}
@keyframes ticker-bg {
  0%   { background-position: 0 0 }
  100% { background-position: 200% 0 }
}

.ticker-inner {
  display: inline-flex;
  animation: ticker-scroll 50s linear infinite;
  width: max-content;
  /* Asegura que no genere scroll horizontal */
  will-change: transform;
}
.ticker-inner:hover { animation-play-state: paused; }

.ticker-item {
  padding: 0 28px;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-display);
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}

.tsep { color: rgba(255,255,255,0.4); }

@keyframes ticker-scroll {
  from { transform: translateX(0) }
  to   { transform: translateX(-50%) }
}

/* En móvil reducir tamaño de fuente del ticker */
@media (max-width: 480px) {
  .ticker { padding: 5px 0; }
  .ticker-item {
    font-size: 11px;
    padding: 0 18px;
    gap: 5px;
  }
}
</style>