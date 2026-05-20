<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { applyGameCatalog } from '../services/mockCatalogDb'
import { fetchJuegos } from '../services/apiService'

const props = defineProps({
  locale: { type: String, default: 'es' },
  selectedPlatform: { type: String, default: 'all' },
  currency: { type: String, default: 'EUR' },
  currentUser: { type: Object, default: null }
})

const emit = defineEmits(['open-auth', 'open-game', 'logout', 'open-admin', 'open-history', 'open-alerts', 'open-config', 'open-blog', 'go-home', 'go-section'])

const isMobileMenuOpen = ref(false)

const labels = {
  es: {
    goHome: 'Ir al inicio',
    searchPlaceholder: 'Busca un juego...',
    search: 'Buscar',
    stores: 'Tiendas',
    deals: 'Ofertas',
    upcoming: 'Proximos',
    upcomingLong: 'Proximos lanzamientos',
    login: 'Entrar',
    register: 'Registro',
    alerts: 'Alertas de precio',
    blog: 'Blog',
    results: 'Resultados',
    allPlatforms: 'Todas las plataformas',
    noResultTitle: 'No se encontro',
    noResultSub: 'Prueba con otro titulo',
    unavailableIn: 'Sin disponibilidad en',
    notAvailableIn: 'No disponible en',
    availableIn: 'Disponible en:',
    history: 'Historial'
  },
  en: {
    goHome: 'Go home',
    searchPlaceholder: 'Search game...',
    search: 'Search',
    stores: 'Stores',
    deals: 'Deals',
    upcoming: 'Upcoming',
    upcomingLong: 'Upcoming releases',
    login: 'Login',
    register: 'Register',
    alerts: 'Price alerts',
    blog: 'Blog',
    results: 'Results',
    allPlatforms: 'All platforms',
    noResultTitle: 'No results for',
    noResultSub: 'Try another title',
    unavailableIn: 'Unavailable in',
    notAvailableIn: 'Not available in',
    availableIn: 'Available in:',
    history: 'History'
  }
}

const platformMeta = {
  all: { icon: '🌐', label: { es: 'Todas', en: 'All' } },
  steam: { icon: '🖥️', label: { es: 'PC Steam', en: 'PC Steam' } },
  epic: { icon: '🔵', label: { es: 'Epic Games', en: 'Epic Games' } },
  ps5: { icon: '🎮', label: { es: 'PlayStation 5', en: 'PlayStation 5' } },
  ps4: { icon: '🎮', label: { es: 'PlayStation 4', en: 'PlayStation 4' } },
  xbox: { icon: '🟩', label: { es: 'Xbox', en: 'Xbox' } },
  switch: { icon: '🔴', label: { es: 'Nintendo Switch', en: 'Nintendo Switch' } }
}

const gameCatalog = ref([])
const searchWrapRef = ref(null)
const userMenuRef = ref(null)
const userMenuMobileRef = ref(null)
const searchQuery = ref('')
const searchSelectedIndex = ref(-1)
const searchCurrentResults = ref([])
const availableResults = ref([])
const unavailableResults = ref([])
const isDropdownOpen = ref(false)
let searchTimer = null
const isUserMenuOpen = ref(false)

function t(key) {
  return labels[props.locale]?.[key] || labels.es[key]
}

function platformLabel(key) {
  const meta = platformMeta[key] || platformMeta.all
  return `${meta.icon} ${meta.label[props.locale]}`
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightMatch(name, q) {
  if (!q) return escHtml(name)
  const lowName = name.toLowerCase()
  const lowQ = q.toLowerCase()
  const idx = lowName.indexOf(lowQ)
  if (idx === -1) return escHtml(name)
  return `${escHtml(name.slice(0, idx))}<mark>${escHtml(name.slice(idx, idx + q.length))}</mark>${escHtml(name.slice(idx + q.length))}`
}

function fmt(price) {
  const normalized = props.currency === 'USD' ? price * 1.08 : price
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol} ${normalized.toFixed(2)}`
}

function matchesSelectedPlatform(game) {
  const selected = props.selectedPlatform
  if (selected === 'all') return true
  const text = String(game.platform || '').toLowerCase()
  if (selected === 'steam') return text.includes('steam') || text.includes('pc')
  if (selected === 'epic') return text.includes('epic')
  if (selected === 'ps5') return text.includes('ps5') || text.includes('playstation 5')
  if (selected === 'ps4') return text.includes('ps4') || text.includes('playstation 4')
  if (selected === 'xbox') return text.includes('xbox')
  if (selected === 'switch') return text.includes('switch') || text.includes('nintendo')
  return true
}

function closeSearchDropdown() {
  isDropdownOpen.value = false
  searchSelectedIndex.value = -1
}

function performSearch(query) {
  const q = query.toLowerCase()
  const matches = gameCatalog.value.filter((g) => g.name.toLowerCase().includes(q))

  if (!matches.length) {
    availableResults.value = []
    unavailableResults.value = []
    searchCurrentResults.value = []
    isDropdownOpen.value = true
    searchSelectedIndex.value = -1
    return
  }

  const withOffers = matches.filter(matchesSelectedPlatform).sort((a, b) => b.discount - a.discount)
  const withoutOffers = props.selectedPlatform === 'all' ? [] : matches.filter((g) => !matchesSelectedPlatform(g))

  availableResults.value = withOffers
  unavailableResults.value = withoutOffers.slice(0, 3)
  searchCurrentResults.value = [...withOffers, ...withoutOffers.slice(0, 3)]
  searchSelectedIndex.value = -1
  isDropdownOpen.value = true
}

function onSearchInput() {
  clearTimeout(searchTimer)
  if (!searchQuery.value.trim()) {
    closeSearchDropdown()
    return
  }
  searchTimer = setTimeout(() => {
    performSearch(searchQuery.value.trim())
  }, 120)
}

function triggerSearch() {
  const val = searchQuery.value.trim()
  if (!val) return
  performSearch(val)
  if (searchCurrentResults.value[0]) {
    selectSearchResult(searchCurrentResults.value[0])
  }
}

function selectSearchResult(game) {
  closeSearchDropdown()
  searchQuery.value = ''
  emit('open-game', game)
}

function onSearchKeydown(e) {
  if (!isDropdownOpen.value) return
  const total = searchCurrentResults.value.length

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!total) return
    searchSelectedIndex.value = Math.min(searchSelectedIndex.value + 1, total - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (!total) return
    searchSelectedIndex.value = Math.max(searchSelectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (searchSelectedIndex.value >= 0 && searchCurrentResults.value[searchSelectedIndex.value]) {
      selectSearchResult(searchCurrentResults.value[searchSelectedIndex.value])
    } else {
      triggerSearch()
    }
  } else if (e.key === 'Escape') {
    closeSearchDropdown()
  }
}

const noResults = computed(() => {
  return !availableResults.value.length && !unavailableResults.value.length && !!searchQuery.value.trim()
})

function openLogin() { emit('open-auth', 'login') }
function openRegister() { emit('open-auth', 'register') }

const userInitials = computed(() => {
  if (!props.currentUser?.name) return 'U'
  const parts = props.currentUser.name.trim().split(/\s+/)
  return (parts[0]?.[0] || 'U').toUpperCase()
})

const isAdmin = computed(() => props.currentUser?.role === 'admin')

function toggleUserMenu() { isUserMenuOpen.value = !isUserMenuOpen.value }
function closeUserMenu() { isUserMenuOpen.value = false }

function doLogout() {
  closeUserMenu()
  emit('logout')
}

function openAdminPanel() {
  closeUserMenu()
  emit('open-admin')
}

function openHistoryPage() {
  closeUserMenu()
  emit('open-history')
}

function openAlertsPage() {
  closeUserMenu()
  emit('open-alerts')
}

function openConfigPage() {
  closeUserMenu()
  emit('open-config')
}

function goToSection(hash) {
  emit('go-section', hash)
  closeMobileMenu()
  setTimeout(() => {
    const el = document.querySelector(hash)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    else window.location.hash = hash
  }, 50)
}

function handleOutsideClick(e) {
  const wrap = searchWrapRef.value
  if (wrap && !wrap.contains(e.target)) closeSearchDropdown()
  const desktop = userMenuRef.value
  const mobile = userMenuMobileRef.value
  const insideDesktop = desktop && desktop.contains(e.target)
  const insideMobile = mobile && mobile.contains(e.target)
  if (!insideDesktop && !insideMobile) closeUserMenu()
}

function handleMenuBtnClick(e) {
  e.stopPropagation()
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() { isMobileMenuOpen.value = false }

function handleMobileMenuClick(e) {
  if (e.target.classList.contains('mobile-menu')) closeMobileMenu()
}

onMounted(async () => {
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('hashchange', closeMobileMenu)
  try {
    const juegos = await fetchJuegos()
    gameCatalog.value = applyGameCatalog(juegos)
  } catch (e) {
    console.error('Error cargando catálogo:', e)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('hashchange', closeMobileMenu)
  clearTimeout(searchTimer)
})
</script>

<template>
  <nav>
    <div class="nav-inner">
      <!-- Logo -->
      <a href="#" class="logo" :title="t('goHome')" @click.prevent="emit('go-home')">
        CODE<span class="acc">KEYS</span>
      </a>

      <!-- Búsqueda -->
      <div ref="searchWrapRef" class="nav-search-wrap">
        <div class="nav-search" role="search">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('searchPlaceholder')"
            :aria-label="t('search')"
            autocomplete="off"
            @input="onSearchInput"
            @keydown="onSearchKeydown"
          >
          <button :aria-label="t('search')" @click="triggerSearch">
            🔍 <span class="search-btn-label">{{ t('search') }}</span>
          </button>
        </div>

        <div :class="['search-dropdown', { open: isDropdownOpen }]">
          <template v-if="noResults">
            <div class="search-dd-header">
              <span>{{ t('results') }}</span>
              <span class="search-dd-plat">{{ props.selectedPlatform === 'all' ? t('allPlatforms') : platformLabel(props.selectedPlatform) }}</span>
            </div>
            <div class="search-result-row no-result">
              <span class="sr-no-plat-icon">🔍</span>
              <span class="sr-no-plat-title">{{ t('noResultTitle') }} "{{ searchQuery.trim() }}"</span>
              <span class="sr-no-plat-sub">{{ t('noResultSub') }}</span>
            </div>
          </template>

          <template v-else-if="isDropdownOpen">
            <div class="search-dd-header">
              <span>{{ t('results') }}</span>
              <span class="search-dd-plat">{{ props.selectedPlatform === 'all' ? t('allPlatforms') : platformLabel(props.selectedPlatform) }}</span>
            </div>

            <div
              v-for="(game, idx) in availableResults"
              :key="`search-hit-${game.key}`"
              class="search-result-row"
              :style="{ background: searchSelectedIndex === idx ? 'var(--bg-hover)' : '' }"
              @click="selectSearchResult(game)"
            >
              <img class="sr-thumb" :src="game.img" :alt="game.name" loading="lazy">
              <div class="sr-info">
                <div class="sr-name" v-html="highlightMatch(game.name, searchQuery.trim())"></div>
                <div class="sr-meta">
                  <span class="ptag">{{ game.platform }}</span>
                  <span v-if="game.tags?.[0]" class="ptag">{{ game.tags[0] }}</span>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <span class="sr-price">{{ fmt(game.price) }}</span>
                <span class="sr-disc">-{{ game.discount }}%</span>
              </div>
            </div>

            <template v-if="props.selectedPlatform !== 'all' && unavailableResults.length">
              <div class="search-dd-header" style="margin-top:2px;">
                <span>{{ t('unavailableIn') }} {{ platformLabel(props.selectedPlatform) }}</span>
              </div>
              <div
                v-for="(game, idx) in unavailableResults"
                :key="`search-no-${game.key}`"
                class="search-result-row"
                :style="{ opacity: 0.65, background: searchSelectedIndex === availableResults.length + idx ? 'var(--bg-hover)' : '' }"
                @click="selectSearchResult(game)"
              >
                <img class="sr-thumb" :src="game.img" :alt="game.name" loading="lazy">
                <div class="sr-info">
                  <div class="sr-name" v-html="highlightMatch(game.name, searchQuery.trim())"></div>
                  <div class="sr-meta">
                    <span style="font-size:10px;color:var(--red);font-weight:600;">✗ {{ t('notAvailableIn') }} {{ platformLabel(props.selectedPlatform) }}</span>
                  </div>
                  <div style="font-size:10px;color:var(--text-faint);margin-top:2px;">{{ t('availableIn') }} {{ game.platform }}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;font-size:10px;color:var(--text-faint);">
                  <span>{{ fmt(game.price) }}</span>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- Links desktop -->
      <div class="nav-links" id="navLinks">
        <a href="#" @click.prevent="goToSection('#secTiendas')">{{ t('stores') }}</a>
        <a href="#" @click.prevent="goToSection('#secOfertas')">{{ t('deals') }}</a>
        <a href="#" @click.prevent="goToSection('#secUpcoming')">🚀 {{ t('upcoming') }}</a>
        <a href="#" @click.prevent="emit('open-blog')">📝 {{ t('blog') }}</a>

        <template v-if="!props.currentUser">
          <a href="#" class="btn-login" @click.prevent="openLogin">{{ t('login') }}</a>
          <a href="#" class="btn-reg" @click.prevent="openRegister">{{ t('register') }}</a>
        </template>

        <div v-else ref="userMenuRef" style="display:flex;align-items:center;gap:8px;position:relative;">
          <div class="nav-avatar" role="button" aria-haspopup="true" @click="toggleUserMenu">{{ userInitials }}</div>
          <div :class="['nav-user-menu', { open: isUserMenuOpen }]" role="menu">
            <div class="num-header">
              <div class="num-name">{{ props.currentUser.name }}</div>
              <div class="num-email">{{ props.currentUser.email }}</div>
            </div>
            <div class="num-item" role="menuitem">⭐ Mis favoritos</div>
            <div class="num-item" role="menuitem" @click="openAlertsPage">🔔 Mis alertas</div>
            <div class="num-item" role="menuitem" @click="openHistoryPage">📋 {{ t('history') }}</div>
            <div v-if="isAdmin" class="num-item" role="menuitem" @click="openAdminPanel">🛠️ Panel admin</div>
            <div class="num-item" role="menuitem" @click="openConfigPage">⚙️ Configuracion</div>
            <div class="num-item danger" role="menuitem" @click="doLogout">🚪 Cerrar sesion</div>
          </div>
        </div>
      </div>

      <!-- Avatar en móvil (cuando hay usuario) -->
      <div
        v-if="props.currentUser"
        ref="userMenuMobileRef"
        class="nav-avatar-mobile"
      >
        <div class="nav-avatar" role="button" @click="toggleUserMenu">{{ userInitials }}</div>
        <div :class="['nav-user-menu', { open: isUserMenuOpen }]" role="menu">
          <div class="num-header">
            <div class="num-name">{{ props.currentUser.name }}</div>
            <div class="num-email">{{ props.currentUser.email }}</div>
          </div>
          <div class="num-item" role="menuitem">⭐ Mis favoritos</div>
          <div class="num-item" role="menuitem">🔔 Mis alertas</div>
          <div class="num-item" role="menuitem" @click="openHistoryPage">📋 {{ t('history') }}</div>
          <div v-if="isAdmin" class="num-item" role="menuitem" @click="openAdminPanel">🛠️ Panel admin</div>
          <div class="num-item danger" role="menuitem" @click="doLogout">🚪 Cerrar sesion</div>
        </div>
      </div>

      <!-- Botón hamburguesa -->
      <button
        id="menuBtn"
        class="hamburger-btn"
        aria-label="Menú"
        :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
        @click.stop="handleMenuBtnClick"
      >☰</button>
    </div>

    <!-- Menú móvil -->
    <div
      v-if="isMobileMenuOpen"
      id="mobileMenu"
      class="mobile-menu"
      role="navigation"
      @click.self="handleMobileMenuClick"
    >
      <button class="mm-close-btn" aria-label="Cerrar menú" @click="closeMobileMenu">✕</button>
      <a href="#" class="mm-link" @click.prevent="goToSection('#secTiendas')">🏪 {{ t('stores') }}</a>
      <a href="#" class="mm-link" @click.prevent="goToSection('#secOfertas')">🔥 {{ t('deals') }}</a>
      <a href="#" class="mm-link" @click.prevent="goToSection('#secUpcoming')">🚀 {{ t('upcomingLong') }}</a>
      <a href="#" class="mm-link">🔔 {{ t('alerts') }}</a>
      <a href="#" class="mm-link" @click.prevent="emit('open-blog'); closeMobileMenu()">📝 {{ t('blog') }}</a>
      <div v-if="!props.currentUser" class="mm-btns">
        <a href="#" class="mm-btn-login" @click.prevent="openLogin(); closeMobileMenu()">{{ t('login') }}</a>
        <a href="#" class="mm-btn-reg" @click.prevent="openRegister(); closeMobileMenu()">{{ t('register') }}</a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* ── Base nav ───────────────────────────── */
nav {
  background: var(--bg-base);
  border-bottom: 2px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 300;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.nav-inner {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  box-sizing: border-box;
  overflow: visible;
  min-width: 0;
}

/* Logo */
.logo {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  text-decoration: none;
}
.logo .acc { color: var(--accent); }

/* Search wrap — ocupa el espacio sobrante */
.nav-search-wrap {
  flex: 1;
  min-width: 0;
  position: relative;
}

.nav-search {
  width: 100%;
  display: flex;
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.nav-search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
.nav-search input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  padding: 10px 14px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 13px;
}
.nav-search input::placeholder { color: var(--text-faint); }

.nav-search button {
  flex-shrink: 0;
  background: var(--accent);
  border: none;
  padding: 0 16px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition);
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-body);
  white-space: nowrap;
}
.nav-search button:hover { background: var(--accent-hover); }

/* Search dropdown */
.search-dropdown {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 40px rgba(0,0,0,0.7);
  z-index: 500;
  overflow: hidden;
  max-height: 420px;
  overflow-y: auto;
}
.search-dropdown.open { display: block; }

.search-dd-header {
  padding: 8px 13px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--text-faint);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.search-dd-plat { color: var(--accent); font-size: 10px; font-weight: 700; }

.search-result-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 13px;
  border-bottom: 1px solid var(--border-faint);
  cursor: pointer;
  transition: background var(--transition);
}
.search-result-row:last-child { border-bottom: none; }
.search-result-row:hover { background: var(--bg-elevated); }
.search-result-row.no-result {
  cursor: default;
  justify-content: center;
  padding: 20px 13px;
  flex-direction: column;
  gap: 6px;
}
.search-result-row.no-result:hover { background: transparent; }

.sr-thumb {
  width: 36px;
  height: 50px;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid var(--border-medium);
  background: var(--bg-elevated);
  flex-shrink: 0;
}
.sr-info { flex: 1; min-width: 0; }
.sr-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}
.sr-name mark {
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: 2px;
  padding: 0 1px;
}
.sr-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}
.sr-price {
  font-size: 15px;
  font-weight: 900;
  color: var(--green);
  flex-shrink: 0;
  text-align: right;
}
.sr-disc {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #dc2626;
  padding: 1px 5px;
  border-radius: 2px;
  display: block;
  text-align: right;
  margin-top: 2px;
}
.sr-no-plat-icon { font-size: 32px; }
.sr-no-plat-title { font-size: 13px; font-weight: 700; color: var(--text-secondary); }
.sr-no-plat-sub { font-size: 11px; color: var(--text-faint); text-align: center; }

/* Nav links (desktop) — no se comprimen */
.nav-links {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.nav-links a {
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  transition: all var(--transition);
  white-space: nowrap;
}
.nav-links a:hover { color: var(--text-primary); background: var(--bg-elevated); }

.btn-login {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border-medium) !important;
  color: var(--text-secondary) !important;
}
.btn-reg {
  background: var(--accent) !important;
  color: #fff !important;
}
.btn-reg:hover { background: var(--accent-hover) !important; }

/* Avatar en móvil: oculto por defecto */
.nav-avatar-mobile {
  display: none;
  position: relative;
}

/* Hamburger */
.hamburger-btn {
  display: none;
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
  padding: 7px 11px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 18px;
  font-family: var(--font-body);
  flex-shrink: 0;
  line-height: 1;
  transition: all var(--transition);
}
.hamburger-btn:hover { border-color: var(--accent); color: var(--accent); }

/* Nav avatar */
.nav-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #b45309);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 900;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  border: 2px solid var(--accent);
  transition: transform var(--transition), box-shadow var(--transition);
}
.nav-avatar:hover {
  transform: scale(1.08);
  box-shadow: 0 0 0 4px var(--accent-dim);
}

/* Nav user menu */
.nav-user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 6px;
  min-width: 200px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.7);
  z-index: 400;
  display: none;
  animation: dropdown 0.15s ease;
}
@keyframes dropdown {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.nav-user-menu.open { display: block; }

.num-header {
  padding: 10px 10px 9px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 4px;
}
.num-name { font-family: var(--font-display); font-size: 13px; font-weight: 800; color: var(--text-primary); }
.num-email { font-size: 11px; color: var(--text-faint); }

.num-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: background var(--transition);
}
.num-item:hover { background: var(--bg-elevated); color: var(--text-primary); }
.num-item.danger { color: #ef4444; }
.num-item.danger:hover { background: var(--red-dim); }

/* Mobile menu */
.mobile-menu {
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  padding: 44px 14px 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  animation: slideDown 0.2s ease;
  position: relative;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.mm-close-btn {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 2.1em;
  font-weight: 700;
  z-index: 2100;
  cursor: pointer;
  padding: 0 8px;
  line-height: 1;
  transition: color var(--transition);
}
.mm-close-btn:hover { color: var(--accent); }

.mm-link {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 12px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--transition);
}
.mm-link:last-of-type { border-bottom: none; }
.mm-link:hover { background: var(--bg-elevated); color: var(--text-primary); }

.mm-btns {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}
.mm-btn-login {
  flex: 1;
  padding: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-display);
  border-radius: var(--radius-sm);
  text-align: center;
}
.mm-btn-reg {
  flex: 1;
  padding: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-display);
  border-radius: var(--radius-sm);
  text-align: center;
}

/* ── 900px: ocultar links menos importantes ─ */
@media (max-width: 900px) {
  /* Solo mostramos Tiendas y Ofertas, ocultamos Proximos y Blog */
  .nav-links a:nth-child(3),
  .nav-links a:nth-child(4) {
    display: none;
  }
}

/* ── 768px: tablet — ocultar nav-links, mostrar hamburguesa ─ */
@media (max-width: 768px) {
  .nav-inner {
    height: 50px;
    gap: 10px;
    padding: 0 12px;
  }
  .logo { font-size: 18px; }
  .nav-links { display: none; }
  .hamburger-btn { display: block; }
  .nav-avatar-mobile {
    display: flex;
    align-items: center;
  }
}

/* ── 480px ─ */
@media (max-width: 480px) {
  .nav-inner {
    height: 46px;
    padding: 0 10px;
    gap: 8px;
  }
  .logo { font-size: 16px; }
  .search-btn-label { display: none; }
  .nav-search button { padding: 0 12px; }
  .nav-search input { padding: 8px 10px; font-size: 12px; }
}

/* ── 360px ─ */
@media (max-width: 360px) {
  .logo { font-size: 14px; }
  .nav-inner { gap: 6px; padding: 0 8px; }
  .nav-search input::placeholder { font-size: 11px; }
}
</style>