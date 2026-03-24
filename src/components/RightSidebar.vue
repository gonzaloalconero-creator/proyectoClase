<script setup>
const props = defineProps({
  locale: {
    type: String,
    default: 'es'
  }
})

const emit = defineEmits(['open-auth'])

const labels = {
  es: {
    title: '¡Activa tu alerta gamer!',
    text: '¿Esperando rebaja? Te avisamos al instante cuando tu juego favorito baje de precio. ¡No pierdas la mejor oferta!',
    cta: 'Activar alerta gratis',
    trending: 'Más buscados hoy',
    flash: 'Ofertas Flash'
  },
  en: {
    title: 'Activate your gamer alert!',
    text: 'Waiting for a price drop? Get instant alerts when your favorite game gets cheaper. Never miss a deal!',
    cta: 'Activate free alert',
    trending: 'Most searched today',
    flash: 'Flash Deals'
  }
}

function t(key) {
  return labels[props.locale]?.[key] || labels.es[key]
}

function openRegister() {
  emit('open-auth', 'register')
}
</script>

<template>
<aside aria-label="Tendencias">
    <div class="alert-w">
      <div class="alert-anim">
        <span class="alert-bell">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              <ellipse cx="14" cy="23.5" rx="5" ry="2.5" fill="#a855f7" fill-opacity="0.25"/>
              <path d="M14 4C10.13 4 7 7.13 7 11V16.17L5.59 17.59C5.21 17.98 5 18.48 5 19V20C5 20.55 5.45 21 6 21H22C22.55 21 23 20.55 23 20V19C23 18.48 22.79 17.98 22.41 17.59L21 16.17V11C21 7.13 17.87 4 14 4Z" fill="#a855f7" stroke="#fff" stroke-width="1.5"/>
              <circle cx="14" cy="24" r="1.5" fill="#fff" stroke="#a855f7" stroke-width="1"/>
            </g>
          </svg>
        </span>
      </div>
      <h3>{{ t('title') }}</h3>
      <p>{{ t('text') }}</p>
      <button class="btn-alr glow" @click="openRegister">
        <span class="btn-ico">⚡</span> {{ t('cta') }}
      </button>
    </div>
    <div class="sbox">
      <div class="sbh"><span class="i">📈</span> {{ t('trending') }}</div>
      <ul class="ti" id="sidebarTrending">
        <!-- renderizado por renderSidebar() -->
      </ul>
    </div>
    <div class="sbox">
      <div class="sbh"><span class="i">⚡</span> {{ t('flash') }}</div>
      <div id="sidebarFlash">
        <!-- renderizado por renderSidebar() -->
      </div>
    </div>
  </aside>
</template>

