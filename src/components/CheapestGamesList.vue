<template>
  <div class="cheapest-games-list">
    <div v-for="offer in offers" :key="offer.id" class="offer-card">
      <div class="offer-left">
        <img :src="offer.storeLogo" :alt="offer.storeName" class="store-logo" />
        <div class="store-info">
          <div class="store-name">{{ offer.storeName }}</div>
          <div class="store-rating">
            <span class="star">★</span>
            <span>{{ offer.rating }}/5</span>
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
        <div class="game-title">{{ offer.gameTitle }}</div>
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
        <button class="buy-btn" disabled>➔</button>
      </div>
    </div>
  </div>
</template>

<script setup>
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
.cheapest-games-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.offer-card {
  display: flex;
  align-items: center;
  background: #23263a;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px #0002;
  transition: box-shadow 0.2s;
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
  color: #fff;
}
.store-rating {
  font-size: 0.95em;
  color: #b5b5b5;
}
.star {
  color: #ffd700;
  margin-right: 2px;
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
  color: #b5e0ff;
  font-size: 0.95em;
}
.platform-icon {
  width: 20px;
  height: 20px;
}
.edition {
  margin-left: 16px;
  color: #b5b5b5;
  font-size: 0.95em;
}
.offer-center {
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.game-title {
  font-weight: bold;
  color: #b5e0ff;
  font-size: 1.1em;
}
.original-price {
  color: #b5b5b5;
  font-size: 1em;
}
.coupon-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1a1d2e;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.95em;
  color: #fff;
}
.coupon-percent {
  color: #ff5e5e;
  font-weight: bold;
}
.coupon-code {
  font-family: monospace;
  background: #23263a;
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
  color: #3fffad;
}
.buy-btn {
  background: #3fffad;
  color: #23263a;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 1.2em;
  cursor: not-allowed;
  opacity: 0.7;
  transition: background 0.2s;
}
.buy-btn:active {
  background: #2fdc8c;
}
</style>
