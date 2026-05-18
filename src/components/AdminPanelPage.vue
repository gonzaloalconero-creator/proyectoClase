<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import {
  addGame,
  addStore,
  getCatalogDbSnapshot,
  setGameHidden,
  setStoreHidden,
  upsertGameOverride,
  upsertStoreOverride,
  applyGameCatalog,
  applyStoreCatalog
} from '../services/mockCatalogDb'
import { fetchJuegos, fetchTiendas } from '../services/apiService'
import BlogAdminPanel from './BlogAdminPanel.vue'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['back', 'updated'])

const canManage = computed(() => props.currentUser?.role === 'admin')
const feedback = ref('')
const feedbackType = ref('success') // 'success' | 'error'

// ── Datos reales desde API ───────────────────────────────────
const allGames  = ref([])
const allStores = ref([])

onMounted(async () => {
  try {
    const juegos  = await fetchJuegos()
    allGames.value = applyGameCatalog(juegos)
  } catch (e) {
    console.error('Error cargando juegos:', e)
  }
  try {
    const tiendas = await fetchTiendas()
    allStores.value = tiendas // sin filtrar para ver todas incluyendo ocultas
  } catch (e) {
    console.error('Error cargando tiendas:', e)
  }
})

// ── Snapshot reactivo (se recalcula tras cada acción) ────────
const snapshot = ref(getCatalogDbSnapshot())
function refreshSnapshot() {
  snapshot.value = getCatalogDbSnapshot()
}

// ── Contadores reales ────────────────────────────────────────
const totalJuegosApi   = computed(() => allGames.value.length + snapshot.value.hiddenGames.length)
const totalTiendasApi  = computed(() => allStores.value.length + snapshot.value.hiddenStores.length)
const juegosVisibles   = computed(() => totalJuegosApi.value - snapshot.value.hiddenGames.length)
const tiendasVisibles  = computed(() => totalTiendasApi.value - snapshot.value.hiddenStores.length)

// ── Buscador de juego para ocultar/mostrar ───────────────────
const gameSearch      = ref('')
const selectedGameKey = ref('')

const filteredGames = computed(() => {
  const q = gameSearch.value.toLowerCase().trim()
  if (!q) return allGames.value.slice(0, 80)
  return allGames.value.filter(g =>
    g.name.toLowerCase().includes(q) || g.key.includes(q)
  ).slice(0, 80)
})

function isGameHidden(key) {
  return snapshot.value.hiddenGames.includes(key)
}

function toggleGameVisibility() {
  const key = selectedGameKey.value
  if (!key) {
    showFeedback('Selecciona un juego primero.', 'error')
    return
  }
  const hidden = !isGameHidden(key)
  setGameHidden(key, hidden)
  refreshSnapshot()
  const game = allGames.value.find(g => g.key === key)
  showFeedback(hidden ? `Juego ocultado: ${game?.name || key}` : `Juego visible de nuevo: ${game?.name || key}`)
}

// ── Estado de tiendas ────────────────────────────────────────
function isStoreHidden(key) {
  return snapshot.value.hiddenStores.includes(key)
}

function toggleStoreVisibility(storeKey) {
  const hidden = !isStoreHidden(storeKey)
  setStoreHidden(storeKey, hidden)
  refreshSnapshot()
  const store = allStores.value.find(s => s.key === storeKey)
  showFeedback(hidden ? `Tienda ocultada: ${store?.name || storeKey}` : `Tienda visible: ${store?.name || storeKey}`)
}

// ── Formularios edición / adición ───────────────────────────
const gameEditForm = reactive({
  key: '', name: '', platform: '', genre: '', tags: '', img: '',
  price: '', was: '', discount: ''
})

const storeEditForm = reactive({ key: '', name: '', desc: '' })

const gameAddForm = reactive({
  key: '', name: '', img: '', platform: '', genre: '', tags: '',
  price: '', was: '', discount: ''
})

const storeAddForm = reactive({ key: '', name: '', desc: '' })

// ── Helpers ──────────────────────────────────────────────────
function normalizeKey(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '').replace(/\s+/g, '-')
}
function maybeNumber(value) {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
function maybePercent(value) {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(String(value).replace('%', '').replace('-', '').trim())
  if (!Number.isFinite(parsed)) return undefined
  return Math.max(0, Math.round(parsed))
}
function maybeText(value) {
  const txt = String(value || '').trim()
  return txt || undefined
}
function maybeTags(value) {
  const tags = String(value || '').split(',').map(x => x.trim()).filter(Boolean)
  return tags.length ? tags : undefined
}
function deriveDiscount(price, was, rawDiscount) {
  const direct = maybePercent(rawDiscount)
  if (direct !== undefined) return direct
  if (Number.isFinite(price) && Number.isFinite(was) && was > 0 && price <= was)
    return Math.max(0, Math.round((1 - price / was) * 100))
  return undefined
}

function showFeedback(msg, type = 'success') {
  feedback.value = msg
  feedbackType.value = type
  emit('updated')
}

function submitEditGame() {
  const key = normalizeKey(gameEditForm.key)
  if (!key) { showFeedback('Indica la key del juego a modificar.', 'error'); return }
  const override = {
    key,
    name: maybeText(gameEditForm.name),
    platform: maybeText(gameEditForm.platform),
    genre: maybeText(gameEditForm.genre),
    tags: maybeTags(gameEditForm.tags),
    img: maybeText(gameEditForm.img),
    price: maybeNumber(gameEditForm.price),
    was: maybeNumber(gameEditForm.was),
    discount: deriveDiscount(maybeNumber(gameEditForm.price), maybeNumber(gameEditForm.was), gameEditForm.discount)
  }
  Object.keys(override).forEach(f => { if (override[f] === undefined) delete override[f] })
  upsertGameOverride(override)
  refreshSnapshot()
  showFeedback(`Juego actualizado: ${key}`)
}

function submitEditStore() {
  const key = normalizeKey(storeEditForm.key)
  if (!key) { showFeedback('Indica la key de la tienda a modificar.', 'error'); return }
  const override = { key, name: maybeText(storeEditForm.name), desc: maybeText(storeEditForm.desc) }
  Object.keys(override).forEach(f => { if (override[f] === undefined) delete override[f] })
  upsertStoreOverride(override)
  refreshSnapshot()
  showFeedback(`Tienda actualizada: ${key}`)
}

function submitAddGame() {
  const key      = normalizeKey(gameAddForm.key)
  const name     = maybeText(gameAddForm.name)
  const platform = maybeText(gameAddForm.platform)
  const img      = maybeText(gameAddForm.img)
  const genre    = maybeText(gameAddForm.genre)
  const tags     = maybeTags(gameAddForm.tags) || (genre ? [genre] : ['General'])
  const price    = maybeNumber(gameAddForm.price)
  const was      = maybeNumber(gameAddForm.was)
  const discount = deriveDiscount(price, was, gameAddForm.discount)
  if (!key || !name || !platform || !img || price === undefined || was === undefined || discount === undefined) {
    showFeedback('key, nombre, plataforma, imagen, precio, precio anterior y descuento son obligatorios.', 'error')
    return
  }
  addGame({ key, name, platform, img, genre: genre || 'General', tags, price, was, discount })
  refreshSnapshot()
  showFeedback(`Juego agregado: ${key}`)
}

function submitAddStore() {
  const key  = normalizeKey(storeAddForm.key)
  const name = maybeText(storeAddForm.name)
  const desc = maybeText(storeAddForm.desc)
  if (!key || !name || !desc) {
    showFeedback('key, nombre y descripcion son obligatorios.', 'error')
    return
  }
  addStore({ key, name, desc })
  refreshSnapshot()
  showFeedback(`Tienda agregada: ${key}`)
}
</script>

<template>
  <section class="admin-page">
    <header class="page-head">
      <div class="head-copy">
        <span class="head-badge">Administrador</span>
        <h1>Panel de administración</h1>
        <p>Controla visibilidad, catálogo y precios de juegos y tiendas.</p>
      </div>
      <button class="ghost" @click="emit('back')">Volver al inicio</button>
    </header>

    <!-- ── CONTADORES REALES ──────────────────────────────────── -->
    <section class="stats-strip" aria-label="Estado rápido">
      <article class="stat">
        <span class="stat-label">Total juegos (API)</span>
        <strong class="stat-value">{{ totalJuegosApi }}</strong>
      </article>
      <article class="stat">
        <span class="stat-label">Juegos visibles</span>
        <strong class="stat-value accent-green">{{ juegosVisibles }}</strong>
      </article>
      <article class="stat">
        <span class="stat-label">Juegos ocultos</span>
        <strong class="stat-value accent-red">{{ snapshot.hiddenGames.length }}</strong>
      </article>
      <article class="stat">
        <span class="stat-label">Total tiendas (API)</span>
        <strong class="stat-value">{{ totalTiendasApi }}</strong>
      </article>
      <article class="stat">
        <span class="stat-label">Tiendas visibles</span>
        <strong class="stat-value accent-green">{{ tiendasVisibles }}</strong>
      </article>
      <article class="stat">
        <span class="stat-label">Tiendas ocultas</span>
        <strong class="stat-value accent-red">{{ snapshot.hiddenStores.length }}</strong>
      </article>
      <article class="stat">
        <span class="stat-label">Overrides juegos</span>
        <strong class="stat-value">{{ Object.keys(snapshot.gameOverrides).length }}</strong>
      </article>
      <article class="stat">
        <span class="stat-label">Overrides tiendas</span>
        <strong class="stat-value">{{ Object.keys(snapshot.storeOverrides).length }}</strong>
      </article>
      <article class="stat">
        <span class="stat-label">Juegos agregados</span>
        <strong class="stat-value">{{ snapshot.addedGames.length }}</strong>
      </article>
    </section>

    <div v-if="!canManage" class="blocked">
      Tu usuario no tiene permisos de administrador.
    </div>

    <template v-else>
      <p v-if="feedback" class="feedback" :class="feedbackType === 'error' ? 'feedback-error' : ''">
        {{ feedback }}
      </p>

      <!-- ── VISIBILIDAD JUEGOS ──────────────────────────────── -->
      <section class="admin-section">
        <h2 class="section-title">Visibilidad de juegos</h2>
        <article class="card card-soft">
          <h3>Ocultar o mostrar juego</h3>
          <p class="card-sub">Busca un título y activa o desactiva su visibilidad sin borrar sus datos.</p>

          <div class="search-row">
            <input
              v-model="gameSearch"
              placeholder="Buscar juego por nombre o key…"
              class="search-input"
            >
          </div>

          <div class="game-select-wrap">
            <select v-model="selectedGameKey" size="6" class="game-select">
              <option value="" disabled>— Selecciona un juego —</option>
              <option
                v-for="game in filteredGames"
                :key="game.key"
                :value="game.key"
              >
                {{ isGameHidden(game.key) ? '🚫 ' : '✅ ' }}{{ game.name }}
                <template v-if="game.platform"> · {{ game.platform }}</template>
              </option>
            </select>
          </div>

          <div v-if="selectedGameKey" class="selected-game-info">
            <span class="selected-name">
              {{ allGames.find(g => g.key === selectedGameKey)?.name || selectedGameKey }}
            </span>
            <span class="selected-status" :class="isGameHidden(selectedGameKey) ? 'status-hidden' : 'status-visible'">
              {{ isGameHidden(selectedGameKey) ? 'OCULTO' : 'VISIBLE' }}
            </span>
          </div>

          <button
            class="btn-toggle"
            :class="selectedGameKey && isGameHidden(selectedGameKey) ? 'btn-show' : 'btn-hide'"
            :disabled="!selectedGameKey"
            @click="toggleGameVisibility"
          >
            <span v-if="!selectedGameKey">Selecciona un juego</span>
            <span v-else-if="isGameHidden(selectedGameKey)">👁 Mostrar juego</span>
            <span v-else>🚫 Ocultar juego</span>
          </button>
        </article>
      </section>

      <!-- ── VISIBILIDAD TIENDAS ─────────────────────────────── -->
      <section class="admin-section">
        <h2 class="section-title">Visibilidad de tiendas</h2>
        <article class="card card-soft">
          <h3>Activar o desactivar tiendas</h3>
          <p class="card-sub">
            El botón muestra el estado actual de cada tienda.
            <strong class="accent-red">Rojo = oculta</strong> · <strong class="accent-green">Verde = visible</strong>.
            Haz clic para cambiar el estado.
          </p>

          <div v-if="allStores.length === 0" class="empty-stores">Cargando tiendas…</div>

          <div class="store-toggle-grid">
            <button
              v-for="store in allStores"
              :key="store.key"
              class="store-toggle-btn"
              :class="isStoreHidden(store.key) ? 'store-hidden' : 'store-visible'"
              @click="toggleStoreVisibility(store.key)"
            >
              <span class="store-toggle-icon">{{ isStoreHidden(store.key) ? '🚫' : '✅' }}</span>
              <span class="store-toggle-name">{{ store.name || store.key }}</span>
              <span class="store-toggle-status">{{ isStoreHidden(store.key) ? 'OCULTA' : 'ACTIVA' }}</span>
            </button>
          </div>
        </article>
      </section>

      <!-- ── BLOG ───────────────────────────────────────────── -->
      <section class="admin-section">
        <h2 class="section-title">Gestión de Blog</h2>
        <div class="blog-notice">
          <span class="blog-notice-icon">📖</span>
          <div>
            <strong>¿Dónde se ven las entradas publicadas?</strong>
            <p>
              Las entradas del blog son visibles para todos los usuarios en la sección
              <strong>Blog</strong> del menú de navegación principal. Accede desde el
              botón <em>"Blog"</em> en la barra superior o navega directamente a la
              página de blog desde el inicio.
            </p>
          </div>
        </div>
        <BlogAdminPanel />
      </section>

      <!-- ── EDICIÓN ─────────────────────────────────────────── -->
      <section class="admin-section">
        <h2 class="section-title">Edición</h2>
        <div class="grid-two">
          <article class="card">
            <h3>Modificar juego existente</h3>
            <p class="card-sub">Actualiza nombre, plataforma, imagen o precio usando su key.</p>
            <input v-model="gameEditForm.key" placeholder="key del juego (obligatoria)">
            <input v-model="gameEditForm.name" placeholder="nombre">
            <input v-model="gameEditForm.platform" placeholder="plataforma">
            <input v-model="gameEditForm.genre" placeholder="género">
            <input v-model="gameEditForm.tags" placeholder="tags separadas por coma">
            <input v-model="gameEditForm.img" placeholder="url de imagen">
            <div class="grid-three">
              <input v-model="gameEditForm.price" type="number" step="0.01" placeholder="precio">
              <input v-model="gameEditForm.was" type="number" step="0.01" placeholder="precio antes">
              <input v-model="gameEditForm.discount" type="number" step="1" placeholder="% desc">
            </div>
            <button class="btn-primary" @click="submitEditGame">Aplicar cambios</button>
          </article>

          <article class="card">
            <h3>Modificar tienda existente</h3>
            <p class="card-sub">Edita nombre y descripción de una tienda ya cargada.</p>
            <input v-model="storeEditForm.key" placeholder="key tienda (obligatoria)">
            <input v-model="storeEditForm.name" placeholder="nombre">
            <textarea v-model="storeEditForm.desc" rows="4" placeholder="descripción"></textarea>
            <button class="btn-primary" @click="submitEditStore">Aplicar cambios</button>
          </article>
        </div>
      </section>

      <!-- ── NUEVOS REGISTROS ────────────────────────────────── -->
      <section class="admin-section">
        <h2 class="section-title">Nuevos registros</h2>
        <div class="grid-two">
          <article class="card">
            <h3>Agregar nuevo juego</h3>
            <p class="card-sub">Registra juegos nuevos con precios y descuento inicial.</p>
            <input v-model="gameAddForm.key" placeholder="key nueva (ej: hollow-knight-2)">
            <input v-model="gameAddForm.name" placeholder="nombre">
            <input v-model="gameAddForm.platform" placeholder="plataforma">
            <input v-model="gameAddForm.genre" placeholder="género">
            <input v-model="gameAddForm.tags" placeholder="tags separadas por coma">
            <input v-model="gameAddForm.img" placeholder="url de imagen">
            <div class="grid-three">
              <input v-model="gameAddForm.price" type="number" step="0.01" placeholder="precio">
              <input v-model="gameAddForm.was" type="number" step="0.01" placeholder="precio antes">
              <input v-model="gameAddForm.discount" type="number" step="1" placeholder="% desc">
            </div>
            <button class="btn-success" @click="submitAddGame">Agregar juego</button>
          </article>

          <article class="card">
            <h3>Agregar nueva tienda</h3>
            <p class="card-sub">Suma una tienda al listado público en segundos.</p>
            <input v-model="storeAddForm.key" placeholder="key nueva (ej: greenman)">
            <input v-model="storeAddForm.name" placeholder="nombre">
            <textarea v-model="storeAddForm.desc" rows="4" placeholder="descripción"></textarea>
            <button class="btn-success" @click="submitAddStore">Agregar tienda</button>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.admin-page {
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 20px;
  background: var(--bg-base);
  color: var(--text-primary);
}

/* ── Cabecera ─────────────────────────────────────────────── */
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 8px 0 18px;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bg-base);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-subtle);
}
.page-head h1 { margin: 8px 0 4px; font-size: 1.55rem; letter-spacing: 0.3px; }
.page-head p  { margin: 0; color: var(--text-secondary); max-width: 80ch; line-height: 1.4; }
.head-copy    { display: grid; gap: 1px; }
.head-badge {
  width: fit-content;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.9px;
  padding: 4px 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(20,133,106,0.18), rgba(36,87,150,0.24));
  border: 1px solid rgba(110,192,171,0.35);
  color: #d9f4ec;
}
.ghost {
  background: var(--bg-base);
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
  border-radius: 12px;
  padding: 9px 13px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.16s, border-color 0.16s;
}
.ghost:hover { transform: translateY(-1px); border-color: var(--accent); color: var(--accent); }

/* ── Contadores ───────────────────────────────────────────── */
.stats-strip {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 10px;
  margin: 8px 0 18px;
}
.stat {
  padding: 10px;
  border-radius: 11px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-base);
  display: grid;
  gap: 3px;
}
.stat-label { color: var(--text-muted); font-size: 0.78rem; }
.stat-value { font-size: 1.18rem; color: var(--text-primary); font-weight: 700; }
.accent-green { color: #4ade80; }
.accent-red   { color: #f87171; }

/* ── Feedback ─────────────────────────────────────────────── */
.blocked {
  margin-top: 8px; padding: 12px 14px; border-radius: 12px;
  background: rgba(255,99,71,0.15); border: 1px solid rgba(255,99,71,0.4);
}
.feedback {
  margin: 8px 0 6px; padding: 11px 13px; border-radius: 12px;
  background: rgba(0,200,120,0.12); border: 1px solid rgba(0,200,120,0.45); color: #d8ffe7;
}
.feedback-error {
  background: rgba(255,99,71,0.12); border-color: rgba(255,99,71,0.45); color: #ffd6d6;
}

/* ── Secciones ────────────────────────────────────────────── */
.admin-section { margin-top: 20px; }
.section-title { margin: 0 0 10px; font-size: 1rem; letter-spacing: 0.2px; color: #d7e7ff; }

/* ── Cards ────────────────────────────────────────────────── */
.card {
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 13px;
  display: grid;
  gap: 9px;
}
.card-soft { border-color: var(--border-subtle); }
.card h3   { margin: 0 0 1px; font-size: 1rem; }
.card-sub  { margin: 0; color: var(--text-muted); font-size: 0.84rem; line-height: 1.35; }

.card input, .card textarea, .card select {
  border-radius: 11px;
  border: 1px solid var(--border-medium);
  background: var(--bg-base);
  color: inherit;
  padding: 9px 11px;
  transition: border-color 0.16s, box-shadow 0.16s;
  font-size: 0.9rem;
}
.card input:focus, .card textarea:focus, .card select:focus {
  outline: none;
  border-color: rgba(136,219,195,0.66);
  box-shadow: 0 0 0 3px rgba(91,199,165,0.16);
}

/* ── Buscador + select juegos ─────────────────────────────── */
.search-row   { display: flex; gap: 8px; }
.search-input { flex: 1; }

.game-select-wrap { position: relative; }
.game-select {
  width: 100%;
  min-height: 160px;
  border-radius: 11px;
  cursor: pointer;
  padding: 4px;
}
.game-select option { padding: 6px 8px; border-radius: 6px; }

.selected-game-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-subtle);
}
.selected-name   { font-weight: 600; flex: 1; }
.selected-status {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  padding: 3px 8px;
  border-radius: 999px;
}
.status-visible { background: rgba(74,222,128,0.15); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
.status-hidden  { background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }

/* ── Botón toggle juego ───────────────────────────────────── */
.btn-toggle {
  border-radius: 11px;
  border: none;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: filter 0.16s, opacity 0.16s;
}
.btn-toggle:disabled { opacity: 0.45; cursor: not-allowed; background: rgba(255,255,255,0.06); color: var(--text-muted); }
.btn-hide { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; }
.btn-show { background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; }
.btn-hide:not(:disabled):hover, .btn-show:not(:disabled):hover { filter: brightness(1.1); }

/* ── Grid tiendas ─────────────────────────────────────────── */
.empty-stores { color: var(--text-muted); font-size: 0.9rem; }

.store-toggle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.store-toggle-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 10px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  font-family: inherit;
  transition: filter 0.16s, transform 0.14s, border-color 0.16s;
}
.store-toggle-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }

.store-visible {
  background: rgba(74,222,128,0.1);
  border-color: rgba(74,222,128,0.4);
  color: #d8ffe7;
}
.store-hidden {
  background: rgba(248,113,113,0.1);
  border-color: rgba(248,113,113,0.4);
  color: #ffd6d6;
}

.store-toggle-icon  { font-size: 1.4rem; }
.store-toggle-name  { font-weight: 600; font-size: 0.88rem; text-align: center; }
.store-toggle-status {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  opacity: 0.75;
}

/* ── Blog notice ──────────────────────────────────────────── */
.blog-notice {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 13px 15px;
  border-radius: 12px;
  background: rgba(99,165,255,0.08);
  border: 1px solid rgba(99,165,255,0.25);
  color: #d6e8ff;
  margin-bottom: 12px;
}
.blog-notice-icon { font-size: 1.5rem; flex-shrink: 0; }
.blog-notice strong { display: block; margin-bottom: 4px; }
.blog-notice p { margin: 0; font-size: 0.88rem; line-height: 1.5; color: #b0ccf0; }

/* ── Grids ────────────────────────────────────────────────── */
.grid-two   { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.grid-three { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }

/* ── Botones de acción ────────────────────────────────────── */
.btn-primary, .btn-success {
  border-radius: 11px;
  border: none;
  padding: 9px 11px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.1px;
  transition: filter 0.16s;
  color: #fff;
}
.btn-primary { background: linear-gradient(135deg, #276dca, #215daa); }
.btn-success { background: linear-gradient(135deg, #138f67, #0f7353); }
.btn-primary:hover, .btn-success:hover { filter: brightness(1.06); }

/* ── Responsivo ───────────────────────────────────────────── */
@media (max-width: 1100px) {
  .stats-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .stats-strip, .grid-two, .grid-three { grid-template-columns: 1fr; }
  .admin-page { padding: 10px; }
  .page-head  { position: static; padding: 4px 0 10px; background: transparent; border-bottom-color: rgba(118,141,183,0.14); }
  .page-head h1 { font-size: 1.28rem; }
  .store-toggle-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>