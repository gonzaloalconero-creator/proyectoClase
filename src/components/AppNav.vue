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

const emit = defineEmits(['open-auth', 'open-game', 'logout', 'open-admin', 'open-history', 'open-blog', 'go-home', 'go-section'])

const isMobileMenuOpen = ref(false)

const labels = {
  es: {
    goHome: 'Ir al inicio',
    searchPlaceholder: 'Busca un juego, DLC o suscripcion...',
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
    searchPlaceholder: 'Search game, DLC or subscription...',
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

// Navegación a secciones: cierra páginas y hace scroll/hash
function goToSection(hash) {
  emit('go-section', hash)
  closeMobileMenu()
  // Pequeño delay para que Vue actualice el DOM antes del scroll
  setTimeout(() => {
    const el = document.querySelector(hash)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    else window.location.hash = hash
  }, 50)
}

function handleOutsideClick(e) {
  const wrap = searchWrapRef.value
  if (wrap && !wrap.contains(e.target)) closeSearchDropdown()
  const userWrap = userMenuRef.value
  if (userWrap && !userWrap.contains(e.target)) closeUserMenu()
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
      <a href="#" class="logo" style="cursor:pointer;" :title="t('goHome')" @click.prevent="emit('go-home')">CODE<span class="acc">KEYS</span></a>

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
          <button :aria-label="t('search')" @click="triggerSearch">🔍 {{ t('search') }}</button>
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
            <div class="num-item" role="menuitem">🔔 Mis alertas</div>
            <div class="num-item" role="menuitem" @click="openHistoryPage">📋 {{ t('history') }}</div>
            <div v-if="isAdmin" class="num-item" role="menuitem" @click="openAdminPanel">🛠️ Panel admin</div>
            <div class="num-item" role="menuitem">⚙️ Configuracion</div>
            <div class="num-item danger" role="menuitem" @click="doLogout">🚪 Cerrar sesion</div>
          </div>
        </div>
      </div>

      <button id="menuBtn" class="hamburger-btn" aria-label="Menú" :aria-expanded="isMobileMenuOpen ? 'true' : 'false'" @click.stop="handleMenuBtnClick">☰</button>
    </div>

    <div v-if="isMobileMenuOpen" id="mobileMenu" class="mobile-menu" role="navigation" @click.self="handleMobileMenuClick">
      <button class="mm-close-btn" aria-label="Cerrar menú" @click="closeMobileMenu">✕</button>
      <a href="#" class="mm-link" @click.prevent="goToSection('#secTiendas')">🏪 {{ t('stores') }}</a>
      <a href="#" class="mm-link" @click.prevent="goToSection('#secOfertas')">🔥 {{ t('deals') }}</a>
      <a href="#" class="mm-link" @click.prevent="goToSection('#secUpcoming')">🚀 {{ t('upcomingLong') }}</a>
      <a href="#" class="mm-link">🔔 {{ t('alerts') }}</a>
      <a href="#" class="mm-link" @click.prevent="emit('open-blog'); closeMobileMenu()">📝 {{ t('blog') }}</a>
      <div class="mm-btns">
        <a href="#" class="mm-btn-login" @click.prevent="openLogin; closeMobileMenu()">{{ t('login') }}</a>
        <a href="#" class="mm-btn-reg" @click.prevent="openRegister; closeMobileMenu()">{{ t('register') }}</a>
      </div>
    </div>
  </nav>
</template>