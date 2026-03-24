<script setup>
const props = defineProps({
  history: {
    type: Array,
    default: () => []
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

const emit = defineEmits(['back', 'open-game'])

const i18n = {
  es: {
    title: 'Historial de juegos',
    subtitle: 'Juegos que abriste desde que iniciaste sesion.',
    back: 'Volver al inicio',
    empty: 'Todavia no abriste juegos en esta sesion.',
    viewedAt: 'Visto',
    open: 'Abrir'
  },
  en: {
    title: 'Game history',
    subtitle: 'Games you opened since you signed in.',
    back: 'Back to home',
    empty: 'You have not opened games in this session yet.',
    viewedAt: 'Viewed',
    open: 'Open'
  }
}

function t(key) {
  return i18n[props.locale]?.[key] || i18n.es[key]
}

function fmt(price) {
  if (price == null) return '-'
  const normalized = props.currency === 'USD' ? price * 1.08 : price
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol} ${normalized.toFixed(2)}`
}

function viewedAtLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(props.locale === 'en' ? 'en-US' : 'es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  })
}

function openGame(game) {
  emit('open-game', game)
}
</script>

<template>
  <main class="history-page" role="main">
    <div class="history-top">
      <button class="history-back-btn" @click="emit('back')">← {{ t('back') }}</button>
    </div>

    <div class="sec-head">
      <h2>{{ t('title') }}</h2>
    </div>
    <p class="history-sub">{{ t('subtitle') }}</p>

    <section v-if="history.length" class="history-grid">
      <article v-for="game in history" :key="`h-${game.key}`" class="history-card">
        <img :src="game.img" :alt="game.name" class="history-cover">
        <div class="history-body">
          <div class="history-name">{{ game.name }}</div>
          <div class="history-meta">{{ game.platform }}</div>
          <div class="history-row">
            <span class="history-price">{{ fmt(game.price) }}</span>
            <span class="history-was">{{ fmt(game.was) }}</span>
            <span class="history-disc">-{{ game.discount }}%</span>
          </div>
          <div class="history-time">{{ t('viewedAt') }}: {{ viewedAtLabel(game.viewedAt) }}</div>
          <button class="history-open" @click="openGame(game)">{{ t('open') }}</button>
        </div>
      </article>
    </section>

    <div v-else class="history-empty">
      {{ t('empty') }}
    </div>
  </main>
</template>

<style scoped>
.history-page {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 14px 8px 22px;
}

.history-top {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.history-back-btn {
  border-radius: 10px;
  border: 1px solid var(--border-medium);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  padding: 8px 12px;
  cursor: pointer;
}

.history-back-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.history-sub {
  margin: -2px 0 14px;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.history-card {
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  border-radius: 12px;
  overflow: hidden;
}

.history-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.history-body {
  padding: 10px;
  display: grid;
  gap: 6px;
}

.history-name {
  font-weight: 700;
  color: var(--text-primary);
}

.history-meta {
  font-size: 12px;
  color: var(--text-faint);
}

.history-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.history-price {
  font-weight: 800;
  color: var(--accent);
}

.history-was {
  color: var(--text-faint);
  text-decoration: line-through;
  font-size: 12px;
}

.history-disc {
  color: var(--green);
  font-size: 12px;
  font-weight: 700;
}

.history-time {
  font-size: 11px;
  color: var(--text-faint);
}

.history-open {
  border-radius: 9px;
  border: 1px solid var(--border-medium);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  padding: 7px 10px;
  cursor: pointer;
}

.history-open:hover {
  color: var(--text-primary);
  border-color: var(--accent);
}

.history-empty {
  margin-top: 12px;
  border: 1px dashed var(--border-medium);
  border-radius: 12px;
  padding: 16px;
  color: var(--text-faint);
}
</style>
