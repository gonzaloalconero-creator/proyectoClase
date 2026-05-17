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
      <!-- Izquierda: región + moneda -->
      <div class="topbar-left">
        <span class="topbar-region">{{ props.locale === 'es' ? '🇪🇸' : '🇬🇧' }} {{ t('region') }}</span>
        <div class="currency-switcher">
          <button class="currency-btn" :class="{ active: props.currency === 'EUR' }" @click="setCurrency('EUR')">€ EUR</button>
          <div class="currency-sep"></div>
          <button class="currency-btn" :class="{ active: props.currency === 'USD' }" @click="setCurrency('USD')">$ USD</button>
        </div>
      </div>

      <!-- Derecha: tema + idioma + links -->
      <div class="topbar-right">
        <!-- Links solo en desktop -->
        <div class="topbar-links">
          <a href="#">{{ t('chrome') }}</a>
          <a href="#">{{ t('alerts') }}</a>
          <a href="#">{{ t('blog') }}</a>
          <a href="#">{{ t('api') }}</a>
        </div>
        <button class="theme-toggle" type="button" @click="onToggleTheme">
          <span class="theme-icon">{{ props.theme === 'dark' ? '☀️' : '🌙' }}</span>
          <span class="theme-label">{{ props.theme === 'dark' ? t('light') : t('dark') }}</span>
        </button>
        <button class="theme-toggle lang-btn" type="button" @click="toggleLocale">
          {{ t('lang') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topbar {
  background: var(--bg-deep);
  border-bottom: 1px solid var(--border-subtle);
  padding: 6px 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.topbar-inner {
  max-width: 100%;
  padding: 0 24px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  box-sizing: border-box;
  flex-wrap: nowrap;
  min-width: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-width: 0;
}

.topbar-region {
  white-space: nowrap;
  flex-shrink: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
}

.topbar-links {
  display: flex;
  gap: 18px;
}

.topbar-links a {
  color: var(--text-muted);
  transition: color var(--transition);
  white-space: nowrap;
}

.topbar-links a:hover {
  color: var(--text-primary);
}

.theme-toggle {
  border: 1px solid var(--border-medium);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font-body);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.theme-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}

.theme-label {
  /* En móvil se oculta el texto, queda solo el icono */
}

.currency-switcher {
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.currency-btn {
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  font-family: Arial, sans-serif;
  transition: all var(--transition);
  line-height: 1.4;
  white-space: nowrap;
}

.currency-btn:hover { color: var(--text-primary); }
.currency-btn.active { background: var(--accent); color: #fff; }

.currency-sep {
  width: 1px;
  height: 14px;
  background: var(--border-medium);
  flex-shrink: 0;
}

/* ── 768px ── */
@media (max-width: 768px) {
  .topbar-inner {
    padding: 0 12px;
  }
  .topbar-links {
    display: none;
  }
  .topbar-region {
    display: none;
  }
}

/* ── 480px ── */
@media (max-width: 480px) {
  .topbar-inner {
    padding: 0 10px;
    gap: 6px;
  }
  .topbar-left {
    gap: 6px;
  }
  .topbar-right {
    gap: 5px;
  }
  /* Ocultar texto del botón tema, dejar solo emoji */
  .theme-label {
    display: none;
  }
  .theme-toggle {
    padding: 3px 7px;
  }
  .currency-btn {
    padding: 3px 6px;
    font-size: 10px;
  }
}
</style>