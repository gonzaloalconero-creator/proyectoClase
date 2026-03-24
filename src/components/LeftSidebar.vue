<template>
<aside aria-label="Filtros">
    <div class="sbox">
      <div class="sbh"><span class="i">🎮</span> Plataformas</div>
      <ul class="pl">
        <li><a href="#">🖥️ PC Steam <span class="cnt">120k</span></a></li>
        <li><a href="#">🔵 Epic Games <span class="cnt">8k</span></a></li>
        <li><a href="#">🎮 PlayStation 5 <span class="cnt">4.2k</span></a></li>
        <li><a href="#">🎮 PlayStation 4 <span class="cnt">12k</span></a></li>
        <li><a href="#">🟩 Xbox Series X <span class="cnt">3.8k</span></a></li>
        <li><a href="#">🟩 Xbox One <span class="cnt">9k</span></a></li>
        <li><a href="#">🔴 Nintendo Switch <span class="cnt">6k</span></a></li>
      </ul>
    </div>
    <div class="sbox">
      <div class="sbh"><span class="i">🏷️</span> Géneros</div>
      <div class="gtags">
        <span
          v-for="genre in genres"
          :key="genre"
          class="gt"
          :class="{ selected: selectedGenre === genre }"
          @click="selectGenre(genre)"
        >{{ genre }}</span>
      </div>
    </div>
    <div class="sbox">
      <div class="sbh"><span class="i">🏪</span> Tiendas</div>
      <ul class="pl">
        <li><a href="#">🔑 CDKeys <span class="cnt">42k</span></a></li>
        <li><a href="#">🛒 G2A <span class="cnt">180k</span></a></li>
        <li><a href="#">⚡ Eneba <span class="cnt">95k</span></a></li>
        <li><a href="#">👑 Kinguin <span class="cnt">78k</span></a></li>
        <li><a href="#">💜 Instant Gaming <span class="cnt">15k</span></a></li>
        <li><a href="#">🔵 Fanatical <span class="cnt">10k</span></a></li>
        <li><a href="#" style="color:var(--accent);font-weight:700;">Ver todas (40+) →</a></li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { ref, defineEmits, watch } from 'vue'

const genres = [
  'Acción', 'RPG', 'FPS', 'Aventura', 'Estrategia', 'Simulación',
  'Deportes', 'Terror', 'Indie', 'Multijugador', 'Carreras', 'MMORPG'
]

const selectedGenre = ref(null)
const emit = defineEmits(['genre-selected'])

function selectGenre(genre) {
  selectedGenre.value = genre === selectedGenre.value ? null : genre
  emit('genre-selected', selectedGenre.value)
}
</script>

<style scoped>
.gt.selected {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
</style>

