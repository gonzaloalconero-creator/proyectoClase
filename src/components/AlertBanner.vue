<script setup>
import { ref } from 'vue'
import { dismissTriggered } from '../services/alertsDb'

const props = defineProps({
  alerts: { type: Array, default: () => [] }
})

const emit = defineEmits(['dismissed-all'])

const dismissed = ref(new Set())

function dismiss(alertId) {
  dismissTriggered(alertId)
  dismissed.value = new Set([...dismissed.value, alertId])
  if (props.alerts.every(a => dismissed.value.has(a.id))) {
    emit('dismissed-all')
  }
}

const visible = (alertId) => !dismissed.value.has(alertId)
</script>

<template>
  <div class="alert-banner-wrap">
    <div
      v-for="alert in alerts"
      v-show="visible(alert.id)"
      :key="alert.id"
      class="alert-banner"
    >
      <span class="ab-icon">🔔</span>
      <img :src="alert.gameImg" :alt="alert.gameName" class="ab-img" />
      <div class="ab-text">
        <strong>{{ alert.gameName }}</strong> ya está por debajo de tu precio límite.
        Disponible desde
        <strong>{{ alert.triggeredPrice?.toFixed(2) }} €</strong>
        en {{ alert.storeName }}.
      </div>
      <button class="ab-close" @click="dismiss(alert.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.alert-banner-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
}

.alert-banner {
  pointer-events: all;
  background: #15803d;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  font-size: 13px;
  font-family: var(--font-body);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}

.ab-icon { font-size: 18px; flex-shrink: 0; }

.ab-img {
  width: 30px;
  height: 40px;
  object-fit: cover;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.3);
}

.ab-text { flex: 1; line-height: 1.4; }

.ab-close {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.ab-close:hover { background: rgba(255,255,255,0.35); }
</style>
