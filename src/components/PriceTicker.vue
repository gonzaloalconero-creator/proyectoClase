<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchJuegos } from '../services/apiService'

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

const tickerGames = ref([])

onMounted(async () => {
  try {
    const juegos = await fetchJuegos()
    tickerGames.value = juegos
      .filter(g => g.discount > 0)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 10)
  } catch {
    tickerGames.value = []
  }
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
