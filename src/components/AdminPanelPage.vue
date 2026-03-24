<script setup>
import { computed, reactive, ref } from 'vue'
import {
  addGame,
  addStore,
  getCatalogDbSnapshot,
  setGameHidden,
  setStoreHidden,
  upsertGameOverride,
  upsertStoreOverride
} from '../services/mockCatalogDb'
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

const hideGameForm = reactive({ key: '', hidden: true })
const hideStoreForm = reactive({ key: '', hidden: true })

const gameEditForm = reactive({
  key: '',
  name: '',
  platform: '',
  genre: '',
  tags: '',
  img: '',
  price: '',
  was: '',
  discount: ''
})

const storeEditForm = reactive({
  key: '',
  name: '',
  desc: ''
})

const gameAddForm = reactive({
  key: '',
  name: '',
  img: '',
  platform: '',
  genre: '',
  tags: '',
  price: '',
  was: '',
  discount: ''
})

const storeAddForm = reactive({
  key: '',
  name: '',
  desc: ''
})

const snapshot = computed(() => getCatalogDbSnapshot())

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
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
  const tags = String(value || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  return tags.length ? tags : undefined
}

function deriveDiscount(price, was, rawDiscount) {
  const direct = maybePercent(rawDiscount)
  if (direct !== undefined) return direct
  if (Number.isFinite(price) && Number.isFinite(was) && was > 0 && price <= was) {
    return Math.max(0, Math.round((1 - price / was) * 100))
  }
  return undefined
}

function pushUpdated(message) {
  feedback.value = message
  emit('updated')
}

function submitHideGame() {
  const key = normalizeKey(hideGameForm.key)
  if (!key) {
    feedback.value = 'Indica una key de juego valida.'
    return
  }
  setGameHidden(key, hideGameForm.hidden)
  pushUpdated(hideGameForm.hidden ? `Juego ocultado: ${key}` : `Juego visible de nuevo: ${key}`)
}

function submitHideStore() {
  const key = normalizeKey(hideStoreForm.key)
  if (!key) {
    feedback.value = 'Indica una key de tienda valida.'
    return
  }
  setStoreHidden(key, hideStoreForm.hidden)
  pushUpdated(hideStoreForm.hidden ? `Tienda ocultada: ${key}` : `Tienda visible de nuevo: ${key}`)
}

function submitEditGame() {
  const key = normalizeKey(gameEditForm.key)
  if (!key) {
    feedback.value = 'Indica la key del juego a modificar.'
    return
  }

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

  Object.keys(override).forEach((field) => {
    if (override[field] === undefined) delete override[field]
  })

  upsertGameOverride(override)
  pushUpdated(`Juego actualizado: ${key}`)
}

function submitEditStore() {
  const key = normalizeKey(storeEditForm.key)
  if (!key) {
    feedback.value = 'Indica la key de la tienda a modificar.'
    return
  }

  const override = {
    key,
    name: maybeText(storeEditForm.name),
    desc: maybeText(storeEditForm.desc)
  }

  Object.keys(override).forEach((field) => {
    if (override[field] === undefined) delete override[field]
  })

  upsertStoreOverride(override)
  pushUpdated(`Tienda actualizada: ${key}`)
}

function submitAddGame() {
  const key = normalizeKey(gameAddForm.key)
  const name = maybeText(gameAddForm.name)
  const platform = maybeText(gameAddForm.platform)
  const img = maybeText(gameAddForm.img)
  const genre = maybeText(gameAddForm.genre)
  const tags = maybeTags(gameAddForm.tags) || (genre ? [genre] : ['General'])
  const price = maybeNumber(gameAddForm.price)
  const was = maybeNumber(gameAddForm.was)
  const discount = deriveDiscount(price, was, gameAddForm.discount)

  if (!key || !name || !platform || !img || price === undefined || was === undefined || discount === undefined) {
    feedback.value = 'Para agregar juego: key, nombre, plataforma, imagen, precio, precio anterior y descuento son obligatorios.'
    return
  }

  addGame({
    key,
    name,
    platform,
    img,
    genre: genre || 'General',
    tags,
    price,
    was,
    discount
  })
  pushUpdated(`Juego agregado/actualizado: ${key}`)
}

function submitAddStore() {
  const key = normalizeKey(storeAddForm.key)
  const name = maybeText(storeAddForm.name)
  const desc = maybeText(storeAddForm.desc)

  if (!key || !name || !desc) {
    feedback.value = 'Para agregar tienda: key, nombre y descripcion son obligatorios.'
    return
  }

  addStore({ key, name, desc })
  pushUpdated(`Tienda agregada/actualizada: ${key}`)
}
</script>

<template>
  <section class="admin-page">
    <header class="page-head">
      <div class="head-copy">
        <span class="head-badge">Administrador</span>
        <h1>Panel de administracion</h1>
        <p>Controla visibilidad, catalogo y precios de juegos y tiendas con persistencia local.</p>
      </div>
      <button class="ghost" @click="emit('back')">Volver al inicio</button>
    </header>

    <section class="stats-strip" aria-label="Estado rapido">
      <article class="stat">
        <span class="stat-label">Juegos ocultos</span>
        <strong class="stat-value">{{ snapshot.hiddenGames.length }}</strong>
      </article>
      <article class="stat">
        <span class="stat-label">Tiendas ocultas</span>
        <strong class="stat-value">{{ snapshot.hiddenStores.length }}</strong>
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
      <article class="stat">
        <span class="stat-label">Tiendas agregadas</span>
        <strong class="stat-value">{{ snapshot.addedStores.length }}</strong>
      </article>
    </section>

    <div v-if="!canManage" class="blocked">
      Tu usuario no tiene permisos de administrador.
    </div>

    <template v-else>
      <p v-if="feedback" class="feedback">{{ feedback }}</p>

      <section class="admin-section">
        <h2 class="section-title">Visibilidad</h2>
        <div class="grid-two">
          <article class="card card-soft">
            <h3>Ocultar o mostrar juego</h3>
            <p class="card-sub">Oculta temporalmente un titulo sin borrar sus datos.</p>
            <input v-model="hideGameForm.key" placeholder="key del juego (ej: cyberpunk)">
            <label class="inline"><input v-model="hideGameForm.hidden" type="checkbox"> Ocultar</label>
            <button class="btn-primary" @click="submitHideGame">Guardar juego</button>
          </article>

          <article class="card card-soft">
            <h3>Ocultar o mostrar tienda</h3>
            <p class="card-sub">Desactiva una tienda de la interfaz para todos los usuarios.</p>
            <input v-model="hideStoreForm.key" placeholder="key de tienda (ej: steam)">
            <label class="inline"><input v-model="hideStoreForm.hidden" type="checkbox"> Ocultar</label>
            <button class="btn-primary" @click="submitHideStore">Guardar tienda</button>
          </article>
        </div>
      </section>

      <section class="admin-section">
        <h2>Gestión de Blogs</h2>
        <BlogAdminPanel />
      </section>

      <section class="admin-section">
        <h2 class="section-title">Edicion</h2>
        <div class="grid-two">
          <article class="card">
            <h3>Modificar juego existente</h3>
            <p class="card-sub">Actualiza nombre, plataforma, imagen o precio usando su key.</p>
            <input v-model="gameEditForm.key" placeholder="key del juego (obligatoria)">
            <input v-model="gameEditForm.name" placeholder="nombre">
            <input v-model="gameEditForm.platform" placeholder="plataforma">
            <input v-model="gameEditForm.genre" placeholder="genero">
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
            <p class="card-sub">Edita nombre y descripcion de una tienda ya cargada.</p>
            <input v-model="storeEditForm.key" placeholder="key tienda (obligatoria)">
            <input v-model="storeEditForm.name" placeholder="nombre">
            <textarea v-model="storeEditForm.desc" rows="4" placeholder="descripcion"></textarea>
            <button class="btn-primary" @click="submitEditStore">Aplicar cambios</button>
          </article>
        </div>
      </section>

      <section class="admin-section">
        <h2 class="section-title">Nuevos registros</h2>
        <div class="grid-two">
          <article class="card">
            <h3>Agregar nuevo juego</h3>
            <p class="card-sub">Registra juegos nuevos con precios y descuento inicial.</p>
            <input v-model="gameAddForm.key" placeholder="key nueva (ej: hollow-knight-2)">
            <input v-model="gameAddForm.name" placeholder="nombre">
            <input v-model="gameAddForm.platform" placeholder="plataforma">
            <input v-model="gameAddForm.genre" placeholder="genero">
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
            <p class="card-sub">Suma una tienda al listado publico en segundos.</p>
            <input v-model="storeAddForm.key" placeholder="key nueva (ej: greenman)">
            <input v-model="storeAddForm.name" placeholder="nombre">
            <textarea v-model="storeAddForm.desc" rows="4" placeholder="descripcion"></textarea>
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

.page-head h1 {
  margin: 8px 0 4px;
  font-size: 1.55rem;
  letter-spacing: 0.3px;
}

.page-head p {
  margin: 0;
  color: var(--text-secondary);
  max-width: 80ch;
  line-height: 1.4;
}

.head-copy {
  display: grid;
  gap: 1px;
}

.head-badge {
  width: fit-content;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.9px;
  padding: 4px 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(20, 133, 106, 0.18), rgba(36, 87, 150, 0.24));
  border: 1px solid rgba(110, 192, 171, 0.35);
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
  transition: transform 0.16s ease, border-color 0.16s ease;
}

.ghost:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
  color: var(--accent);
}

.stats-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin: 8px 0 18px;
}

.blocked {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 99, 71, 0.15);
  border: 1px solid rgba(255, 99, 71, 0.4);
}

.feedback {
  margin: 8px 0 6px;
  padding: 11px 13px;
  border-radius: 12px;
  background: rgba(0, 200, 120, 0.12);
  border: 1px solid rgba(0, 200, 120, 0.45);
  color: #d8ffe7;
}

.admin-section {
  margin-top: 16px;
}

.section-title {
  margin: 0 0 10px;
  font-size: 1rem;
  letter-spacing: 0.2px;
  color: #d7e7ff;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.grid-three {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.card {
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 13px;
  display: grid;
  gap: 9px;
}

.card-soft {
  border-color: var(--border-subtle);
}

.card h3 {
  margin: 0 0 1px;
  font-size: 1rem;
  letter-spacing: 0.1px;
}

.card-sub {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.35;
}

.card input,
.card textarea,
.card button {
  border-radius: 11px;
  border: 1px solid var(--border-medium);
  background: var(--bg-base);
  color: inherit;
  padding: 9px 11px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.card input:focus,
.card textarea:focus {
  outline: none;
  border-color: rgba(136, 219, 195, 0.66);
  box-shadow: 0 0 0 3px rgba(91, 199, 165, 0.16);
}

.card button {
  border-color: transparent;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.1px;
}

.btn-primary {
  background: linear-gradient(135deg, #276dca, #215daa);
}

.btn-success {
  background: linear-gradient(135deg, #138f67, #0f7353);
}

.btn-primary:hover,
.btn-success:hover {
  filter: brightness(1.06);
}

.inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.stat {
  padding: 10px;
  border-radius: 11px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-base);
  display: grid;
  gap: 3px;
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.stat-value {
  font-size: 1.18rem;
  color: var(--text-primary);
  font-weight: 700;
}

@media (max-width: 900px) {
  .stats-strip,
  .grid-two,
  .grid-three {
    grid-template-columns: 1fr;
  }

  .admin-page {
    padding: 10px;
  }

  .page-head {
    position: static;
    padding: 4px 0 10px;
    background: transparent;
    border-bottom-color: rgba(118, 141, 183, 0.14);
  }

  .page-head h1 {
    font-size: 1.28rem;
  }
}
</style>
