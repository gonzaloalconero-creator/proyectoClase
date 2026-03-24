<script setup>
const props = defineProps({
  theme: {
    type: String,
    default: 'dark'
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

const emit = defineEmits(['toggle-theme', 'toggle-currency', 'toggle-locale'])

const topbarLabels = {
  es: {
    region: 'Espana',
    chrome: 'Extension Chrome',
    alerts: 'Alertas de precio',
    blog: 'Blog',
    api: 'API',
    light: 'Modo claro',
    dark: 'Modo oscuro',
    lang: 'EN'
  },
  en: {
    region: 'Spain',
    chrome: 'Chrome Extension',
    alerts: 'Price alerts',
    blog: 'Blog',
    api: 'API',
    light: 'Light mode',
    dark: 'Dark mode',
    lang: 'ES'
  }
}

function t(key) {
  return topbarLabels[props.locale]?.[key] || topbarLabels.es[key]
}

function onToggleTheme() {
  emit('toggle-theme')
}

function setCurrency(value) {
  emit('toggle-currency', value)
}

function toggleLocale() {
  emit('toggle-locale')
}
</script>

<template>
<div class="topbar">
  <div class="topbar-inner">
    <div style="display:flex;align-items:center;gap:10px;">
      <span id="topbarRegion">{{ props.locale === 'es' ? '🇪🇸' : '🇬🇧' }} {{ t('region') }}</span>
      <div class="currency-switcher">
        <button class="currency-btn" :class="{ active: props.currency === 'EUR' }" id="btnEUR" @click="setCurrency('EUR')">€ EUR</button>
        <div class="currency-sep"></div>
        <button class="currency-btn" :class="{ active: props.currency === 'USD' }" id="btnUSD" @click="setCurrency('USD')">$ USD</button>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <button class="theme-toggle" type="button" @click="onToggleTheme">
        {{ props.theme === 'dark' ? `☀️ ${t('light')}` : `🌙 ${t('dark')}` }}
      </button>

      <button class="theme-toggle" type="button" @click="toggleLocale">
        {{ t('lang') }}
      </button>

      <div class="topbar-links">
      <a href="#">{{ t('chrome') }}</a>
      <a href="#">{{ t('alerts') }}</a>
      <a href="#">{{ t('blog') }}</a>
      <a href="#">{{ t('api') }}</a>
      </div>
    </div>
  </div>
</div>
</template>

