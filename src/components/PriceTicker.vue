<script setup>
import { computed } from 'vue'
import { applyGameCatalog } from '../services/mockCatalogDb'

const props = defineProps({
  currency: {
    type: String,
    default: 'EUR'
  },
  locale: {
    type: String,
    default: 'es'
  }
})

const USD_RATE = 1.08

const labels = {
  es: {
    offer: 'OFERTA',
    was: 'Antes'
  },
  en: {
    offer: 'DEAL',
    was: 'Was'
  }
}

const baseTickerGames = [
  { key: 'cyberpunk', name: 'Cyberpunk 2077', price: 5.49, was: 59.99, discount: 91 },
  { key: 'witcher3', name: 'The Witcher 3', price: 3.89, was: 29.99, discount: 87 },
  { key: 'eldenring', name: 'ELDEN RING', price: 24.99, was: 59.99, discount: 58 },
  { key: 'rdr2', name: 'Red Dead Redemption 2', price: 12.99, was: 59.99, discount: 78 },
  { key: 'hogwarts', name: 'Hogwarts Legacy', price: 19.99, was: 59.99, discount: 67 },
  { key: 'spiderman', name: 'Spider-Man Remastered', price: 23.49, was: 59.99, discount: 61 },
  { key: 'godofwar', name: 'God of War', price: 17.99, was: 49.99, discount: 64 },
  { key: 'helldivers2', name: 'HELLDIVERS 2', price: 31.99, was: 39.99, discount: 20 }
]

function t(key) {
  return labels[props.locale]?.[key] || labels.es[key]
}

function money(value) {
  if (value == null) return '-'
  const normalized = props.currency === 'USD' ? value * USD_RATE : value
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol}${normalized.toFixed(2)}`
}

const tickerGames = computed(() => {
  const merged = applyGameCatalog(baseTickerGames)
  return merged.slice(0, 10)
})

const marqueeItems = computed(() => [...tickerGames.value, ...tickerGames.value])
</script>

<template>
  <div class="ticker" aria-label="Ultimas ofertas" aria-live="off">
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

