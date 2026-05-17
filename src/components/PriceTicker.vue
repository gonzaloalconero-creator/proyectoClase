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

    // Calcular el score ponderado de la mejor tienda
    const bestStoreScore = tiendas.reduce((best, t) => {
      const s = storeScore(t)
      return s > best ? s : best
    }, 1)

    tickerGames.value = juegos
      .filter(g => g.discount > 0)
      .map(g => ({
        ...g,
        // Score = descuento * score_tienda_normalizado
        // Cuanto mayor el descuento y mejor la tienda, más arriba sale
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
      <div v-for="(game, index) in marqueeItems" :key="`${game.key}-${index}`" class="ticker-item">
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