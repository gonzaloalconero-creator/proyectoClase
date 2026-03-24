<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  releases: {
    type: Object,
    default: () => ({ titleKey: 'upcoming', games: [] })
  },
  locale: {
    type: String,
    default: 'es'
  },
  currency: {
    type: String,
    default: 'EUR'
  }
})

const emit = defineEmits(['back'])

const nowTs = ref(Date.now())
let timer = null

const i18n = {
  es: {
    back: 'Volver al inicio',
    total: 'proximos lanzamientos',
    upcoming: 'Proximos lanzamientos',
    releaseDate: 'Fecha',
    countdown: 'Cuenta atras',
    released: 'Disponible',
    from: 'Desde'
  },
  en: {
    back: 'Back to home',
    total: 'upcoming releases',
    upcoming: 'Upcoming releases',
    releaseDate: 'Release date',
    countdown: 'Countdown',
    released: 'Released',
    from: 'From'
  }
}

function t(key) {
  return i18n[props.locale]?.[key] || i18n.es[key]
}

function fmt(price) {
  const normalized = props.currency === 'USD' ? price * 1.08 : price
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol} ${normalized.toFixed(2)}`
}

function formatCountdown(releaseDate) {
  const target = new Date(releaseDate).getTime()
  if (Number.isNaN(target)) return '--:--:--'

  const diff = target - nowTs.value
  if (diff <= 0) return t('released')

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  return `${days}d ${hh}:${mm}:${ss}`
}

const upcomingList = computed(() => {
  const list = Array.isArray(props.releases?.games) ? props.releases.games : []
  return [...list].sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate))
})

onMounted(() => {
  timer = setInterval(() => {
    nowTs.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <main class="category-page" role="main">
    <div class="category-page-top">
      <button class="category-back-btn" @click="emit('back')">← {{ t('back') }}</button>
      <div class="category-count">{{ upcomingList.length }} {{ t('total') }}</div>
    </div>

    <div class="sec-head">
      <h2>{{ t('upcoming') }}</h2>
    </div>

    <section class="upcoming-page-grid">
      <article v-for="game in upcomingList" :key="`upcoming-${game.key}`" class="upcoming-page-card">
        <div class="upcoming-img-wrap">
          <img :src="game.img" :alt="game.name">
          <span class="upcoming-date-badge">{{ game.date }}</span>
        </div>

        <div class="upcoming-body">
          <div class="upcoming-name">{{ game.name }}</div>
          <div class="upcoming-meta">
            <span class="upcoming-genre">{{ game.genre }}</span>
          </div>

          <div class="upcoming-page-stats">
            <div class="ups-row">
              <span class="ups-k">{{ t('releaseDate') }}</span>
              <span class="ups-v">{{ game.date }}</span>
            </div>
            <div class="ups-row">
              <span class="ups-k">{{ t('countdown') }}</span>
              <span class="ups-v ups-countdown">{{ formatCountdown(game.releaseDate) }}</span>
            </div>
          </div>

          <div class="upcoming-footer">
            <span class="upcoming-price-label">{{ t('from') }}</span>
            <span class="upcoming-price">{{ fmt(game.price) }}</span>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>
