<script setup>
import { ref, onMounted } from 'vue'
import { getAlerts, removeAlert } from '../services/alertsDb'

const props = defineProps({
  currentUser: { type: Object, default: null }
})

const emit = defineEmits(['back', 'open-game'])

const alerts = ref([])

function loadAlerts() {
  alerts.value = props.currentUser ? getAlerts(props.currentUser.id) : []
}

function deleteAlert(alertId) {
  removeAlert(alertId)
  loadAlerts()
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(loadAlerts)
</script>

<template>
  <div class="alerts-page">
    <div class="alerts-header">
      <button class="al-back" @click="emit('back')">← Volver</button>
      <h1 class="al-title">🔔 Mis alertas de precio</h1>
    </div>

    <p class="al-sub">
      Recibirás una notificación al entrar a la web cuando el precio de un juego baje de tu límite.
      Para crear una alerta entra en la página de cualquier juego.
    </p>

    <div v-if="!alerts.length" class="al-empty">
      <div class="al-empty-icon">🔔</div>
      <div class="al-empty-title">No tienes alertas activas</div>
      <div class="al-empty-sub">Ve a la página de un juego y pulsa "Crear alerta".</div>
    </div>

    <div v-else class="al-list">
      <div v-for="alert in alerts" :key="alert.id" class="al-card">
        <img :src="alert.gameImg" :alt="alert.gameName" class="al-img" />

        <div class="al-info">
          <div class="al-name">{{ alert.gameName }}</div>
          <div class="al-target">
            Avisar si baja de <strong>{{ alert.targetPrice.toFixed(2) }} €</strong>
          </div>
          <div class="al-date">Creada el {{ fmtDate(alert.createdAt) }}</div>

          <div v-if="alert.triggered" class="al-triggered">
            ✓ Activada — {{ alert.triggeredPrice?.toFixed(2) }} € en {{ alert.storeName }}
            <span class="al-triggered-date">({{ fmtDate(alert.triggeredAt) }})</span>
          </div>
          <div v-else class="al-status">En espera...</div>
        </div>

        <div class="al-actions">
          <span v-if="alert.triggered" class="al-badge triggered">Activada</span>
          <span v-else class="al-badge pending">Activa</span>
          <button class="al-del" title="Eliminar alerta" @click="deleteAlert(alert.id)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alerts-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}

.alerts-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 12px;
}

.al-back {
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
.al-back:hover { border-color: var(--accent); color: var(--accent); }

.al-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
}

.al-sub {
  font-size: 13px;
  color: var(--text-faint);
  margin: 0 0 28px;
  line-height: 1.6;
}

.al-empty {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-surface);
  border: 1px dashed var(--border-medium);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.al-empty-icon { font-size: 40px; opacity: 0.4; }
.al-empty-title { font-size: 16px; font-weight: 700; color: var(--text-secondary); }
.al-empty-sub { font-size: 13px; color: var(--text-faint); }

.al-list { display: flex; flex-direction: column; gap: 10px; }

.al-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: border-color var(--transition);
}
.al-card:hover { border-color: var(--border-medium); }

.al-img {
  width: 48px;
  height: 64px;
  object-fit: cover;
  border-radius: 5px;
  flex-shrink: 0;
  border: 1px solid var(--border-medium);
}

.al-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }

.al-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.al-target { font-size: 13px; color: var(--text-secondary); }
.al-target strong { color: var(--accent); }

.al-date { font-size: 11px; color: var(--text-faint); }

.al-triggered {
  font-size: 12px;
  font-weight: 700;
  color: #16a34a;
  margin-top: 2px;
}
.al-triggered-date { font-weight: 400; opacity: 0.8; }

.al-status { font-size: 11px; color: var(--text-faint); font-style: italic; }

.al-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.al-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}
.al-badge.pending { background: var(--accent-dim); color: var(--accent); }
.al-badge.triggered { background: #16a34a22; color: #16a34a; border: 1px solid #16a34a44; }

.al-del {
  background: transparent;
  border: 1px solid var(--border-medium);
  color: var(--text-faint);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}
.al-del:hover { border-color: #ef4444; color: #ef4444; background: #ef444411; }
</style>
