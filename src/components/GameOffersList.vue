<template>
  <div class="offers-list">
    <div v-for="offer in offers" :key="offer.id" class="offer-card">
      <div class="offer-left">
        <img :src="offer.storeLogo" :alt="offer.storeName" class="store-logo" />
        <div class="store-info">
          <div class="store-name">{{ offer.storeName }}</div>
          <div class="store-rating">
            <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.round(offer.rating) }">★</span>
            <span class="rating-num">{{ offer.rating }}/5</span>
            <span class="votes">({{ offer.votes }})</span>
          </div>
        </div>
        <div class="platform">
          <img :src="offer.platformIcon" :alt="offer.platform" class="platform-icon" />
          <span>{{ offer.platform }}</span>
        </div>
        <div class="edition">{{ offer.edition }}</div>
      </div>
      <div class="offer-center">
        <div class="original-price" v-if="offer.originalPrice">
          <s>{{ money(offer.originalPrice) }}</s>
        </div>
        <div class="coupon-box" v-if="offer.couponCode">
          <span class="coupon-percent">-{{ offer.couponPercent }}%</span>
          <span class="coupon-code">{{ offer.couponCode }}</span>
          <button class="copy-btn" @click="copyCoupon(offer.couponCode)">📋</button>
        </div>
      </div>
      <div class="offer-right">
        <div class="final-price">{{ money(offer.finalPrice) }}</div>
        <button class="buy-btn">➔</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  offers: { type: Array, required: true }
})

function money(val) {
  return typeof val === 'number' ? `€${val.toFixed(2)}` : val
}

function copyCoupon(code) {
  navigator.clipboard.writeText(code)
}
</script>

<style scoped>
.offers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.offer-card {
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px #0002;
  border: 2px solid var(--border-medium);
  transition: box-shadow 0.2s, border-color 0.2s;
}

:root[data-theme='light'] .offer-card {
  border-color: var(--accent) !important;
}
.offer-card:hover {
  box-shadow: 0 4px 16px #0004;
}
.offer-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 2;
}
.store-logo {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #fff;
  object-fit: contain;
}
.store-info {
  display: flex;
  flex-direction: column;
}
.store-name {
  font-weight: bold;
  color: var(--text-primary);
}
.store-rating {
  font-size: 0.95em;
  color: var(--text-muted);
}
.star {
  color: #ffd700;
  margin-right: 1px;
  opacity: 0.35;
  font-size: 1.1em;
  transition: opacity 0.15s;
}
.star.filled {
  opacity: 1;
}
.rating-num {
  color: var(--text-primary);
  margin-left: 4px;
  margin-right: 2px;
  font-weight: 500;
}
.votes {
  color: #888;
  margin-left: 2px;
}
.platform {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
  color: var(--blue);
  font-size: 0.95em;
}
.platform-icon {
  width: 20px;
  height: 20px;
}
.edition {
  margin-left: 16px;
  color: var(--text-muted);
  font-size: 0.95em;
}
.offer-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.original-price {
  color: var(--text-muted);
  font-size: 1em;
}
.coupon-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-surface);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.95em;
  color: var(--text-primary);
}
.coupon-percent {
  color: #ff5e5e;
  font-weight: bold;
}
.coupon-code {
  font-family: monospace;
  background: var(--bg-elevated);
  border-radius: 4px;
  padding: 1px 4px;
  margin: 0 2px;
}
.copy-btn {
  background: none;
  border: none;
  color: #b5e0ff;
  cursor: pointer;
  font-size: 1.1em;
}
.offer-right {
  flex: 0 0 110px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.final-price {
  font-size: 1.3em;
  font-weight: bold;
  color: var(--green);
}
.buy-btn {
  background: #3fffad;
  color: #23263a;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background 0.2s;
}
.buy-btn:hover {
  background: #2fdc8c;
}
@media (max-width: 600px) {
  .offer-card {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 6px;
    gap: 8px;
  }
  .offer-left, .offer-center, .offer-right {
    flex: unset;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  .offer-left {
    flex-direction: row;
    gap: 8px;
  }
  .store-logo {
    width: 28px;
    height: 28px;
  }
  .final-price {
    font-size: 1.1em;
  }
}
</style>
