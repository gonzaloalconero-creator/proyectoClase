<script setup>
const props = defineProps({
  currentUser: { type: Object, default: null },
  theme:    { type: String, default: 'dark' },
  currency: { type: String, default: 'EUR' },
  locale:   { type: String, default: 'es' }
})

const emit = defineEmits(['back', 'toggle-theme', 'toggle-currency', 'toggle-locale'])
</script>

<template>
  <div class="config-page">
    <div class="config-header">
      <button class="cfg-back" @click="emit('back')">← Volver</button>
      <h1 class="cfg-title">⚙️ Configuración</h1>
    </div>

    <div class="cfg-body">

      <!-- Perfil -->
      <section class="cfg-section">
        <h2 class="cfg-section-title">Perfil</h2>
        <div class="cfg-card">
          <div class="cfg-avatar">{{ (currentUser?.name?.[0] || 'U').toUpperCase() }}</div>
          <div class="cfg-user-info">
            <div class="cfg-name">{{ currentUser?.name }}</div>
            <div class="cfg-email">{{ currentUser?.email }}</div>
            <span class="cfg-badge" :class="currentUser?.role">{{ currentUser?.role === 'admin' ? 'Administrador' : 'Usuario' }}</span>
          </div>
        </div>
      </section>

      <!-- Apariencia -->
      <section class="cfg-section">
        <h2 class="cfg-section-title">Apariencia</h2>
        <div class="cfg-row">
          <div class="cfg-row-info">
            <span class="cfg-row-label">Tema</span>
            <span class="cfg-row-sub">{{ theme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado' }}</span>
          </div>
          <button class="cfg-toggle" @click="emit('toggle-theme')">
            {{ theme === 'dark' ? '🌙 Oscuro' : '☀️ Claro' }}
          </button>
        </div>
      </section>

      <!-- Idioma y moneda -->
      <section class="cfg-section">
        <h2 class="cfg-section-title">Región</h2>
        <div class="cfg-row">
          <div class="cfg-row-info">
            <span class="cfg-row-label">Idioma</span>
            <span class="cfg-row-sub">{{ locale === 'es' ? 'Español' : 'English' }}</span>
          </div>
          <button class="cfg-toggle" @click="emit('toggle-locale')">
            {{ locale === 'es' ? '🇪🇸 Español' : '🇬🇧 English' }}
          </button>
        </div>
        <div class="cfg-row">
          <div class="cfg-row-info">
            <span class="cfg-row-label">Moneda</span>
            <span class="cfg-row-sub">{{ currency === 'EUR' ? 'Euro (€)' : 'Dólar ($)' }}</span>
          </div>
          <div class="cfg-currency-btns">
            <button :class="['cfg-cur', { active: currency === 'EUR' }]" @click="emit('toggle-currency', 'EUR')">€ EUR</button>
            <button :class="['cfg-cur', { active: currency === 'USD' }]" @click="emit('toggle-currency', 'USD')">$ USD</button>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.config-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}

.config-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 32px;
}

.cfg-back {
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-family: var(--font-body);
  transition: all var(--transition);
  white-space: nowrap;
}
.cfg-back:hover { border-color: var(--accent); color: var(--accent); }

.cfg-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
}

.cfg-body { display: flex; flex-direction: column; gap: 28px; }

.cfg-section {}

.cfg-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-faint);
  margin: 0 0 10px;
}

.cfg-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.cfg-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #b45309);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 900;
  color: #fff;
  flex-shrink: 0;
  border: 2px solid var(--accent);
}

.cfg-user-info { display: flex; flex-direction: column; gap: 3px; }
.cfg-name { font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text-primary); }
.cfg-email { font-size: 12px; color: var(--text-faint); }
.cfg-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  width: fit-content;
}
.cfg-badge.admin { background: var(--accent-dim); color: var(--accent); }
.cfg-badge.normal { background: var(--bg-elevated); color: var(--text-muted); }

.cfg-row {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}
.cfg-row:last-child { margin-bottom: 0; }

.cfg-row-info { display: flex; flex-direction: column; gap: 2px; }
.cfg-row-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.cfg-row-sub { font-size: 11px; color: var(--text-faint); }

.cfg-toggle {
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  white-space: nowrap;
  transition: all var(--transition);
}
.cfg-toggle:hover { border-color: var(--accent); color: var(--accent); }

.cfg-currency-btns { display: flex; gap: 6px; }
.cfg-cur {
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  color: var(--text-muted);
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  transition: all var(--transition);
}
.cfg-cur:hover { border-color: var(--accent); color: var(--accent); }
.cfg-cur.active { background: var(--accent); border-color: var(--accent); color: #fff; }

</style>
