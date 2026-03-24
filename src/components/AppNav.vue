<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { applyGameCatalog } from '../services/mockCatalogDb'

const props = defineProps({
  locale: {
    type: String,
    default: 'es'
  },
  selectedPlatform: {
    type: String,
    default: 'all'
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  currentUser: {
    type: Object,
    default: null
  }
})


const emit = defineEmits(['open-auth', 'open-game', 'logout', 'open-admin', 'open-history', 'open-blog'])
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

const baseGameCatalog = [
  { key: 'cyberpunk', name: 'Cyberpunk 2077', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg', platform: 'PC Steam', price: 3.99, was: 59.99, discount: 93, tags: ['Accion'] },
  { key: 'witcher3', name: 'The Witcher 3: Wild Hunt', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg', platform: 'PC Steam', price: 1.99, was: 29.99, discount: 93, tags: ['RPG'] },
  { key: 'darksouls3', name: 'Dark Souls III', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/library_600x900.jpg', platform: 'PC Steam / Xbox', price: 3.49, was: 39.99, discount: 91, tags: ['RPG'] },
  { key: 'rdr2', name: 'Red Dead Redemption 2', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg', platform: 'PC Steam / PS4 / Xbox', price: 5.99, was: 59.99, discount: 90, tags: ['Accion'] },
  { key: 'starfield', name: 'Starfield', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/library_600x900.jpg', platform: 'PC Steam / Xbox', price: 6.99, was: 69.99, discount: 90, tags: ['Accion'] },
  { key: 'minecraft', name: 'Minecraft', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/library_600x900.jpg', platform: 'PC / Xbox / Switch / Mobile', price: 8.49, was: 24.99, discount: 66, tags: ['Indie'] },
  { key: 'horizonfw', name: 'Horizon Forbidden West', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2420110/library_600x900.jpg', platform: 'PS5 / PS4 / PC', price: 18.99, was: 59.99, discount: 68, tags: ['Aventura'] },
  { key: 'gowr', name: 'God of War Ragnarok', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/library_600x900.jpg', platform: 'PS5 / PS4 / PC', price: 22.99, was: 69.99, discount: 67, tags: ['Accion'] },
  { key: 'bg3', name: "Baldur's Gate 3", img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900.jpg', platform: 'PC Steam / PS5', price: 22.99, was: 59.99, discount: 62, tags: ['RPG'] },
  { key: 'hades2', name: 'Hades II', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/library_600x900.jpg', platform: 'PC Steam', price: 13.49, was: 26.99, discount: 50, tags: ['Indie'] },
  { key: 'celeste', name: 'Celeste', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg', platform: 'PC Steam / Switch', price: 1.99, was: 19.99, discount: 90, tags: ['Indie'] },
  { key: 're4', name: 'Resident Evil 4 Remake', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg', platform: 'PC Steam / PS5', price: 12.99, was: 49.99, discount: 74, tags: ['Terror'] },
  { key: 'forza5', name: 'Forza Horizon 5', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/library_600x900.jpg', platform: 'PC / Xbox', price: 31.99, was: 49.99, discount: 36, tags: ['Carreras'] },
  { key: 'mw3', name: 'Call of Duty: MW3', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2519060/library_600x900.jpg', platform: 'PC / PS5 / Xbox', price: 44.99, was: 69.99, discount: 36, tags: ['FPS'] },
  { key: 'fifa24', name: 'EA Sports FC 24', img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900.jpg', platform: 'PC / PS5 / Xbox', price: 25.99, was: 39.99, discount: 35, tags: ['Deportes'] },
  { key: 'alanwake2', name: 'Alan Wake 2', img: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=900&q=80', platform: 'Epic Games / PS5 / Xbox', price: 23.99, was: 49.99, discount: 52, tags: ['Terror'] },
  { key: 'fortnite', name: 'Fortnite', img: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80', platform: 'Epic Games / PS5 / Xbox / Switch / PC', price: 4.99, was: 19.99, discount: 75, tags: ['Accion'] },
  { key: 'rocketleague', name: 'Rocket League', img: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80', platform: 'Epic Games / PS5 / Xbox / Switch / PC', price: 2.99, was: 19.99, discount: 85, tags: ['Deportes'] },
  { key: 'ffxvi', name: 'Final Fantasy XVI', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', platform: 'PS5', price: 39.99, was: 79.99, discount: 50, tags: ['RPG'] },
  { key: 'spiderman2', name: "Marvel's Spider-Man 2", img: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=900&q=80', platform: 'PS5', price: 49.99, was: 79.99, discount: 38, tags: ['Accion'] },
  { key: 'haloinfinite', name: 'Halo Infinite', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', platform: 'Xbox / PC', price: 14.99, was: 59.99, discount: 75, tags: ['FPS'] },
  { key: 'forzamotorsport', name: 'Forza Motorsport', img: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=900&q=80', platform: 'Xbox / PC', price: 29.99, was: 69.99, discount: 57, tags: ['Carreras'] },
  { key: 'zeldatotk', name: 'Zelda: Tears of the Kingdom', img: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80', platform: 'Switch', price: 49.99, was: 69.99, discount: 29, tags: ['Aventura'] },
  { key: 'mariowonder', name: 'Super Mario Bros. Wonder', img: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80', platform: 'Switch', price: 39.99, was: 59.99, discount: 33, tags: ['Aventura'] }
]

function createSyntheticSearchGames() {
  const genres = ['Accion', 'RPG', 'Aventura', 'FPS', 'Indie', 'Deportes', 'Carreras', 'Terror']

  const platforms = [
    { key: 'steam', label: 'PC Steam', title: 'Steam Arena', seed: 3 },
    { key: 'epic', label: 'Epic Games / PC', title: 'Epic Legends', seed: 7 },
    { key: 'ps5', label: 'PS5', title: 'PlayStation Next', seed: 11 },
    { key: 'ps4', label: 'PS4', title: 'PlayStation Classic', seed: 13 },
    { key: 'xbox', label: 'Xbox / PC', title: 'Xbox Impact', seed: 17 },
    { key: 'switch', label: 'Switch', title: 'Switch Worlds', seed: 19 }
  ]

  const generated = []

  platforms.forEach((plat) => {
    for (let i = 1; i <= 100; i += 1) {
      const price = Number((5 + ((i * 7 + plat.seed) % 55) + (i % 3) * 0.49).toFixed(2))
      const was = Number((price * (1.25 + ((i + plat.seed) % 5) * 0.12)).toFixed(2))
      const discount = Math.max(10, Math.round((1 - price / was) * 100))
      const genre = genres[(i + plat.seed) % genres.length]
      const img = `https://picsum.photos/seed/${plat.key}-search-${String(i).padStart(3, '0')}/600/900`

      generated.push({
        key: `${plat.key}-extra-${String(i).padStart(3, '0')}`,
        name: `${plat.title} ${String(i).padStart(3, '0')}`,
        img,
        platform: plat.label,
        price,
        was,
        discount,
        tags: [genre]
      })
    }
  })

  return generated
}

const gameCatalog = applyGameCatalog([...baseGameCatalog, ...createSyntheticSearchGames()])

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
  const matches = gameCatalog.filter((g) => g.name.toLowerCase().includes(q))

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

function openLogin() {
  emit('open-auth', 'login')
}

function openRegister() {
  emit('open-auth', 'register')
}

const userInitials = computed(() => {
  if (!props.currentUser?.name) return 'U'
  const parts = props.currentUser.name.trim().split(/\s+/)
  return (parts[0]?.[0] || 'U').toUpperCase()
})

const isAdmin = computed(() => props.currentUser?.role === 'admin')

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

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

function handleOutsideClick(e) {
  const wrap = searchWrapRef.value
  if (wrap && !wrap.contains(e.target)) {
    closeSearchDropdown()
  }

  const userWrap = userMenuRef.value
  if (userWrap && !userWrap.contains(e.target)) {
    closeUserMenu()
  }
}


function handleMenuBtnClick(e) {
  e.stopPropagation()
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function handleMobileMenuClick(e) {
  // Cierra el menú si se hace click fuera del menú
  if (e.target.classList.contains('mobile-menu')) {
    closeMobileMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  // Cierra el menú móvil al navegar
  window.addEventListener('hashchange', closeMobileMenu)
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
      <a href="#" class="logo" style="cursor:pointer;" :title="t('goHome')">CODE<span class="acc">KEYS</span></a>

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
        <a href="#secTiendas">{{ t('stores') }}</a>
        <a href="#secOfertas">{{ t('deals') }}</a>
        <a href="#secUpcoming">🚀 {{ t('upcoming') }}</a>
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
      <a href="#secTiendas" class="mm-link" @click="closeMobileMenu">🏪 {{ t('stores') }}</a>
      <a href="#secOfertas" class="mm-link" @click="closeMobileMenu">🔥 {{ t('deals') }}</a>
      <a href="#secUpcoming" class="mm-link" @click="closeMobileMenu">🚀 {{ t('upcomingLong') }}</a>
      <a href="#" class="mm-link" @click="closeMobileMenu">🔔 {{ t('alerts') }}</a>
      <a href="#" class="mm-link" @click.prevent="emit('open-blog'); closeMobileMenu()">📝 {{ t('blog') }}</a>
      <div class="mm-btns">
        <a href="#" class="mm-btn-login" @click.prevent="openLogin; closeMobileMenu()">{{ t('login') }}</a>
        <a href="#" class="mm-btn-reg" @click.prevent="openRegister; closeMobileMenu()">{{ t('register') }}</a>
      </div>
    </div>
  </nav>
</template>

