<template>
  <main class="price-comparison-page">
    <div class="cheapest-games-box">
      <h2>Comparador de precios</h2>
      <CheapestGamesList :offers="cheapestOffers" />
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import CheapestGamesList from './CheapestGamesList.vue'
import { getPriceHistory } from '../services/priceHistory'

const props = defineProps({
  game: { type: Object, required: true }
})

// Simula todas las ofertas del mismo juego en distintas tiendas/plataformas
const priceHistory = computed(() => getPriceHistory(props.game.key))

const cheapestOffers = computed(() => {
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
</script>

<style scoped>
.price-comparison-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 0;
}
.cheapest-games-box {
  background: #23263a;
  border-radius: 12px;
  padding: 24px 20px;
  box-shadow: 0 2px 12px #0003;
}
.cheapest-games-box h2 {
  margin-bottom: 18px;
  color: #fff;
}
</style>
