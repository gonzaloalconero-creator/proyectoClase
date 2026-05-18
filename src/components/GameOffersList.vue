<template>
  <div class="offers-wrap">
    <div v-if="!offers.length" class="offers-empty">
      <span>No hay ofertas disponibles para este juego.</span>
    </div>

    <div class="tiendas-comparadas">
      <h3 class="tiendas-title">
        <span class="tiendas-title-bar"></span>
        Tiendas comparadas
      </h3>

      <div class="tiendas-grid">
        <div
          v-for="(offer, i) in offers"
          :key="`${offer.storeKey}-${offer.platformKey}-${i}`"
          class="tienda-card"
          :class="{ 'tienda-card--best': i === 0 }"
          @click="openStore(offer)"
        >
          <!-- Cabecera tienda -->
          <div class="tienda-card-header">
            <div class="store-logo-wrap">
              <img
                v-if="offer.storeLogo"
                :src="offer.storeLogo"
                :alt="offer.storeName"
                class="store-logo"
                @error="e => e.target.style.display='none'"
              />
              <span v-else class="store-logo-fallback">{{ offer.storeName?.slice(0,2).toUpperCase() }}</span>
            </div>
            <div class="store-meta">
              <div class="store-name">{{ offer.storeName }}</div>
              <div class="store-url">{{ storeUrlShort(offer.storeUrl) }}</div>
            </div>
            <button
              v-if="i === 0"
              class="best-badge"
              tabindex="-1"
            >Mejor precio</button>
            <button
              v-else
              class="minus-badge"
              tabindex="-1"
            >—</button>
          </div>

          <!-- Precio -->
          <div class="tienda-card-price-row">
            <span class="tienda-label">Mejor oferta</span>
            <div class="tienda-price-wrap">
              <span
                class="tienda-price"
                :class="validPrice(offer.price) ? 'tienda-price--ok' : 'tienda-price--empty'"
              >
                {{ validPrice(offer.price) ? money(offer.price) : '—' }}
              </span>
            </div>
          </div>

          <!-- Tags -->
          <div class="tienda-tags-row">
            <span class="offer-tag">{{ offer.platformName }}</span>
            <span v-if="offer.region" class="offer-tag">{{ offer.region }}</span>
            <span
              class="offer-tag"
              :class="offer.stock === 'ok' ? 'offer-tag--green' : 'offer-tag--red'"
            >{{ offer.stock === 'ok' ? 'En stock' : 'Agotado' }}</span>
          </div>

          <!-- Rating -->
          <div class="tienda-rating-row">
            <span
              v-for="n in 5"
              :key="n"
              class="star"
              :class="{ filled: n <= Math.round(offer.rating || 0) }"
            >★</span>
            <span class="rating-num">{{ offer.rating || '—' }}/5</span>
            <span class="votes">({{ offer.votes || 0 }} votos)</span>
          </div>

          <!-- Juegos disponibles en tienda -->
          <div class="tienda-count-row">
            <span class="tienda-count-label">Juegos disponibles:</span>
            <span class="tienda-count-val">
              {{ storeCount(offer.storeKey) }}
            </span>
          </div>

          <!-- Botón visitar -->
          <button class="visit-btn" @click.stop="openStore(offer)">
            Visitar tienda
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchTiendasConteo } from '../services/apiService'

const props = defineProps({
  offers:   { type: Array,  required: true },
  currency: { type: String, default: 'EUR' },
  gameName: { type: String, default: '' }
})

const USD_RATE = 1.08
const conteoMap = ref({})

onMounted(async () => {
  try {
    const conteo = await fetchTiendasConteo()
    conteo.forEach(c => {
      conteoMap.value[c.storeKey] = c.totalJuegos
    })
  } catch {
    conteoMap.value = {}
  }
})

function storeCount(key) {
  const n = conteoMap.value[key?.toLowerCase()]
  if (n == null) return '—'
  return n.toLocaleString('es-ES') + ' juegos'
}

function validPrice(val) {
  const n = parseFloat(val)
  return !isNaN(n) && n > 0
}

function money(val) {
  if (!validPrice(val)) return '—'
  const num = parseFloat(val)
  const normalized = props.currency === 'USD' ? num * USD_RATE : num
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol} ${normalized.toFixed(2)}`
}

function storeUrlShort(url) {
  if (!url) return ''
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const SEARCH_TEMPLATES = {
  instantgaming: q => `https://www.instant-gaming.com/es/busqueda/?q=${q}`,
  cdkeys:        q => `https://www.cdkeys.com/catalogsearch/result/?q=${q}`,
  eneba:         q => `https://www.eneba.com/store/all-games?text=${q}`,
  kinguin:       q => `https://www.kinguin.net/listing?search=${q}`,
  g2a:           q => `https://www.g2a.com/search?query=${q}`,
  gamivo:        q => `https://www.gamivo.com/search#search=${q}`,
  hrkgame:       q => `https://www.hrkgame.com/en/games/search/?q=${q}`,
  mmoga:         q => `https://www.mmoga.com/games/?search=${q}`,
  sologame:      q => `https://www.sologame.com/search?q=${q}`,
  royalcdkeys:   q => `https://www.royalcdkeys.com/search?q=${q}`,
}

function buildUrl(offer) {
  const key = offer.storeKey?.toLowerCase()
  const query = encodeURIComponent(props.gameName || '')
  const template = SEARCH_TEMPLATES[key]
  if (template && query) return template(query)
  return offer.storeUrl || '#'
}

function openStore(offer) {
  window.open(buildUrl(offer), '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.offers-wrap {
  width: 100%;
}

.offers-empty {
  color: var(--text-faint);
  padding: 24px 0;
  text-align: center;
  font-size: 0.95rem;
}

.tiendas-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}
.tiendas-title-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: var(--accent, #f97316);
  flex-shrink: 0;
}

/* Grid de tarjetas */
.tiendas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.tienda-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
}
.tienda-card:hover {
  border-color: var(--accent, #f97316);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}
.tienda-card--best {
  border-color: var(--green, #22c55e);
}
.tienda-card--best:hover {
  border-color: var(--green, #22c55e);
}

/* Cabecera */
.tienda-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.store-logo-wrap {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--bg-base);
  border: 1px solid var(--border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.store-logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
}
.store-logo-fallback {
  font-size: 11px;
  font-weight: 800;
  color: var(--text-secondary);
}
.store-meta {
  flex: 1;
  min-width: 0;
}
.store-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.store-url {
  font-size: 10px;
  color: var(--text-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.best-badge {
  background: var(--green, #22c55e);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  white-space: nowrap;
  cursor: default;
}
.minus-badge {
  background: var(--bg-base);
  color: var(--text-faint);
  border: 1px solid var(--border-medium);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  cursor: default;
}

/* Precio */
.tienda-card-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-base);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}
.tienda-label {
  font-size: 11px;
  color: var(--text-faint);
}
.tienda-price--ok {
  font-size: 18px;
  font-weight: 900;
  color: var(--green, #22c55e);
  font-family: var(--font-display);
}
.tienda-price--empty {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-faint);
}

/* Tags */
.tienda-tags-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.offer-tag {
  font-size: 10px;
  font-weight: 600;
  background: var(--bg-base);
  border: 1px solid var(--border-medium);
  color: var(--text-faint);
  padding: 2px 7px;
  border-radius: 3px;
}
.offer-tag--green {
  background: var(--green-dim);
  border-color: rgba(34,197,94,0.3);
  color: var(--green);
}
.offer-tag--red {
  background: var(--red-dim);
  border-color: rgba(239,68,68,0.3);
  color: var(--red);
}

/* Rating */
.tienda-rating-row {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}
.star {
  color: var(--yellow, #f59e0b);
  opacity: 0.25;
}
.star.filled { opacity: 1; }
.rating-num {
  color: var(--text-primary);
  font-weight: 600;
  margin-left: 5px;
  font-size: 11px;
}
.votes {
  color: var(--text-faint);
  font-size: 11px;
  margin-left: 3px;
}

/* Conteo juegos */
.tienda-count-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-faint);
  border-top: 1px solid var(--border-faint);
  padding-top: 8px;
}
.tienda-count-val {
  font-weight: 700;
  color: var(--text-secondary);
}

/* Botón visitar */
.visit-btn {
  width: 100%;
  background: var(--bg-base);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  padding: 9px 0;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, color 0.18s;
  margin-top: auto;
}
.visit-btn:hover {
  background: var(--accent, #f97316);
  border-color: var(--accent, #f97316);
  color: #fff;
}

@media (max-width: 600px) {
  .tiendas-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 400px) {
  .tiendas-grid {
    grid-template-columns: 1fr;
  }
}
</style>