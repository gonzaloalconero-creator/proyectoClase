<script setup>
const props = defineProps({
  locale: {
    type: String,
    default: 'es'
  }
})

const labels = {
  es: {
    desc: 'El comparador de precios de claves de juegos mas completo. Mas de 40 tiendas comparadas al instante.',
    platforms: 'Plataformas',
    stores: 'Tiendas',
    help: 'Ayuda',
    maintenance: 'Ver pagina de mantenimiento',
    legal: '© 2025 CodeKeys - Precios actualizados cada 5 minutos - No somos responsables de los precios mostrados'
  },
  en: {
    desc: 'The most complete game key price comparison platform. More than 40 stores compared instantly.',
    platforms: 'Platforms',
    stores: 'Stores',
    help: 'Help',
    maintenance: 'View maintenance page',
    legal: '© 2025 CodeKeys - Prices updated every 5 minutes - We are not responsible for displayed prices'
  }
}

function t(key) {
  return labels[props.locale]?.[key] || labels.es[key]
}
</script>

<template>
<footer>
  <div class="foot-top">
    <div class="fb">
      <div class="logo">CODE<span class="acc">KEYS</span></div>
      <p>{{ t('desc') }}</p>
    </div>
    <div class="fc">
      <h4>{{ t('platforms') }}</h4>
      <ul>
        <li><a href="#">PC / Steam</a></li>
        <li><a href="#">PlayStation</a></li>
        <li><a href="#">Xbox</a></li>
        <li><a href="#">Nintendo Switch</a></li>
      </ul>
    </div>
    <div class="fc">
      <h4>{{ t('stores') }}</h4>
      <ul>
        <li><a href="#">CDKeys</a></li>
        <li><a href="#">Eneba</a></li>
        <li><a href="#">G2A</a></li>
        <li><a href="#">Ver todas</a></li>
      </ul>
    </div>
    <div class="fc">
      <h4>{{ t('help') }}</h4>
      <ul>
        <li><a href="#">¿Cómo funciona?</a></li>
        <li><a href="#">Alertas de precio</a></li>
        <li><a href="#">Contacto</a></li>
        <li><a href="#">Blog</a></li>
        <li><a href="/error.html" style="color:var(--accent);font-weight:700;">{{ t('maintenance') }}</a></li>
      </ul>
    </div>
  </div>
  <div class="foot-bot">{{ t('legal') }}</div>
</footer>
</template>

