<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: {
    type: Object,
    default: () => ({
      titleKey: '',
      games: []
    })
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  locale: {
    type: String,
    default: 'es'
  },
  selectedPlatform: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['open-game', 'back'])

const USD_RATE = 1.08

const i18n = {
  es: {
    back: 'Volver al inicio',
    noGames: 'No hay juegos para esta categoria con el filtro actual.',
    totalGames: 'juegos encontrados',
    bestSellers: 'Mas vendidos',
    mostSearched: 'Mas buscados',
    releases: 'Lanzamientos',
    topRated: 'Mas valorados',
    over70: 'Mas del 70% dto.',
    between40: 'Entre 40% y 70%',
    under40: 'Menos del 40%',
    action: 'Accion / Shooters',
    rpg: 'RPG / Aventura',
    indie: 'Indie',
    horror: 'Terror',
    sports: 'Deportes',
    fps: 'FPS / Multijugador'
  },
  en: {
    back: 'Back to home',
    noGames: 'No games found for this category with the current filter.',
    totalGames: 'games found',
    bestSellers: 'Best sellers',
    mostSearched: 'Most searched',
    releases: 'Releases',
    topRated: 'Top rated',
    over70: 'Over 70% off',
    between40: 'Between 40% and 70%',
    under40: 'Under 40%',
    action: 'Action / Shooters',
    rpg: 'RPG / Adventure',
    indie: 'Indie',
    horror: 'Horror',
    sports: 'Sports',
    fps: 'FPS / Multiplayer'
  }
}

function t(key) {
  return i18n[props.locale]?.[key] || i18n.es[key] || key
}

function fmt(price) {
  const normalized = props.currency === 'USD' ? price * USD_RATE : price
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol} ${normalized.toFixed(2)}`
}

function discountBadge(value) {
  if (typeof value === 'string') {
    return value
  }
  return `-${value}%`
}

function matchesPlatform(game) {
  if (props.selectedPlatform === 'all') {
    return true
  }

  const text = String(game?.platform || '').toLowerCase()

  if (props.selectedPlatform === 'steam') {
    return text.includes('steam') || text.includes('pc')
  }

  if (props.selectedPlatform === 'epic') {
    return text.includes('epic')
  }

  if (props.selectedPlatform === 'ps5') {
    return text.includes('ps5') || text.includes('playstation 5')
  }

  if (props.selectedPlatform === 'ps4') {
    return text.includes('ps4') || text.includes('playstation 4')
  }

  if (props.selectedPlatform === 'xbox') {
    return text.includes('xbox')
  }

  if (props.selectedPlatform === 'switch') {
    return text.includes('switch') || text.includes('nintendo')
  }

  return true
}

const filteredGames = computed(() => {
  const list = Array.isArray(props.category?.games) ? props.category.games : []
  return list.filter(matchesPlatform)
})

const categoryTitle = computed(() => t(props.category?.titleKey || ''))

function openGame(game) {
  emit('open-game', game)
}
</script>

<template>
  <main class="category-page" role="main">
    <div class="category-page-top">
      <button class="category-back-btn" @click="emit('back')">← {{ t('back') }}</button>
      <div class="category-count">{{ filteredGames.length }} {{ t('totalGames') }}</div>
    </div>

    <div class="sec-head">
      <h2>{{ categoryTitle }}</h2>
    </div>

    <section v-if="filteredGames.length" class="cards-grid category-page-grid">
      <article
        v-for="game in filteredGames"
        :key="`cat-${game.key}`"
        class="gcard"
        @click="openGame(game)"
      >
        <img :src="game.img" :alt="game.name" class="gcard-img">
        <span class="gcard-platform">{{ game.platform }}</span>
        <span class="gcard-disc">{{ discountBadge(game.discount) }}</span>
        <div class="gcard-overlay">
          <div class="gcard-name">{{ game.name }}</div>
          <div>
            <span class="gcard-price">{{ fmt(game.price) }}</span>
            <span class="gcard-was">{{ fmt(game.was) }}</span>
          </div>
        </div>
      </article>
    </section>

    <div v-else class="category-empty">
      {{ t('noGames') }}
    </div>
  </main>
</template>
