<template>
  <div class="offers-list">
    <div
      v-for="(offer, i) in offers"
      :key="`${offer.storeKey}-${offer.platformKey}-${i}`"
      class="offer-card"
      :class="{ 'offer-card--best': i === 0 }"
    >
      <div class="offer-left">
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
        <div class="store-info">
          <div class="store-name">{{ offer.storeName }}</div>
          <div class="store-rating">
            <span
              v-for="n in 5"
              :key="n"
              class="star"
              :class="{ filled: n <= Math.round(offer.rating) }"
            >{{ '\u2605' }}</span>
            <span class="rating-num">{{ offer.rating }}/5</span>
            <span class="votes">({{ offer.votes }})</span>
          </div>
          <div class="offer-tags">
            <span class="offer-tag">{{ offer.platformName }}</span>
            <span v-if="offer.region" class="offer-tag">{{ offer.region }}</span>
            <span
              class="offer-tag"
              :class="offer.stock === 'ok' ? 'offer-tag--green' : 'offer-tag--red'"
            >{{ offer.stock === 'ok' ? 'En stock' : 'Agotado' }}</span>
          </div>
        </div>
      </div>

      <div class="offer-right">
        <div class="final-price">{{ money(offer.price) }}</div>
        <button
          class="buy-btn"
          @click="openStore(offer)"
        >IR</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  offers:   { type: Array,  required: true },
  currency: { type: String, default: 'EUR' },
  gameName: { type: String, default: ''    }
})

const USD_RATE = 1.08

function money(val) {
  if (val == null) return '—'
  const num = parseFloat(val) || 0
  const normalized = props.currency === 'USD' ? num * USD_RATE : num
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol} ${normalized.toFixed(2)}`
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
  const url = buildUrl(offer)
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.offers-list {
  display: flex;
  flex-direction: column;
}

.offer-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-faint);
  transition: background var(--transition);
  gap: 12px;
}
.offer-card:last-child { border-bottom: none; }
.offer-card:hover { background: var(--bg-elevated); }
.offer-card--best {
  border-left: 3px solid var(--green);
  background: rgba(34, 197, 94, 0.04);
}

.offer-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.store-logo-wrap {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
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

.store-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
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

.store-rating {
  display: flex;
  align-items: center;
  gap: 1px;
  font-size: 12px;
}
.star {
  color: var(--yellow, #f59e0b);
  opacity: 0.3;
  font-size: 12px;
}
.star.filled { opacity: 1; }
.rating-num {
  color: var(--text-primary);
  font-weight: 600;
  margin-left: 4px;
  font-size: 11px;
}
.votes {
  color: var(--text-faint);
  font-size: 11px;
  margin-left: 2px;
}

.offer-tags {
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
  padding: 1px 6px;
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

.offer-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
}
.final-price {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 900;
  color: var(--green);
}
.buy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #3fffad;
  color: #23263a;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition), transform var(--transition);
  line-height: 1;
}
.buy-btn:hover {
  background: #2fdc8c;
  transform: scale(1.05);
}

@media (max-width: 600px) {
  .offer-card { padding: 10px 12px; }
  .final-price { font-size: 17px; }
  .votes { display: none; }
  .offer-tags { display: none; }
}
</style>