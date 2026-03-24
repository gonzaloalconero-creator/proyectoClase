<script setup>
import { onMounted, ref, watch } from 'vue'
import TopBar from './components/TopBar.vue'
import AppNav from './components/AppNav.vue'
import PlatformTabs from './components/PlatformTabs.vue'
import PriceTicker from './components/PriceTicker.vue'
import LeftSidebar from './components/LeftSidebar.vue'
import MainContent from './components/MainContent.vue'
import CategoryGamesPage from './components/CategoryGamesPage.vue'
import UpcomingReleasesPage from './components/UpcomingReleasesPage.vue'
import RightSidebar from './components/RightSidebar.vue'
import SiteFooter from './components/SiteFooter.vue'
// import BlogList from './components/BlogList.vue'
import AuthModal from './components/AuthModal.vue'
import GameModal from './components/GameModal.vue'
import GameDetailPage from './components/GameDetailPage.vue'
import BlogPage from './pages/BlogPage.vue'

const blogPage = ref(false)

function openBlogPage() {
  blogPage.value = true
  adminPage.value = false
  historyPage.value = false
  categoryPage.value = null
  upcomingPage.value = null
  gameDetailPage.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeBlogPage() {
  blogPage.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const priceComparisonPage = ref(false)
function openPriceComparisonPage() {
  priceComparisonPage.value = true
  isGameOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closePriceComparisonPage() {
  priceComparisonPage.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
import AdminPanelPage from './components/AdminPanelPage.vue'
import HistoryPage from './components/HistoryPage.vue'
import { getSessionUser, logoutUser } from './services/mockAuthDb'
import { addVisitedGameToHistory, clearHistorySession, getSessionHistory } from './services/sessionHistoryDb'

const isAuthOpen = ref(false)
const authMode = ref('login')
const gameDetailPage = ref(false)
const selectedGame = ref(null)
const theme = ref('dark')
const currency = ref('EUR')
const locale = ref('es')
const selectedPlatform = ref('all')
const selectedGenre = ref(null)
const categoryPage = ref(null)
const upcomingPage = ref(null)
const historyPage = ref(false)
const adminPage = ref(false)
const currentUser = ref(null)
const catalogVersion = ref(0)
const sessionHistory = ref([])

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

watch(theme, (value) => {
  applyTheme(value)
  localStorage.setItem('codekeys-theme', value)
})

watch(currency, (value) => {
  localStorage.setItem('codekeys-currency', value)
})

watch(locale, (value) => {
  document.documentElement.setAttribute('lang', value)
  localStorage.setItem('codekeys-locale', value)
})

onMounted(() => {
  const saved = localStorage.getItem('codekeys-theme')
  if (saved === 'dark' || saved === 'light') {
    theme.value = saved
    applyTheme(saved)
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
    applyTheme(theme.value)
  }

  const savedCurrency = localStorage.getItem('codekeys-currency')
  if (savedCurrency === 'EUR' || savedCurrency === 'USD') {
    currency.value = savedCurrency
  }

  const savedLocale = localStorage.getItem('codekeys-locale')
  if (savedLocale === 'es' || savedLocale === 'en') {
    locale.value = savedLocale
  }

  currentUser.value = getSessionUser()
  sessionHistory.value = currentUser.value ? getSessionHistory(currentUser.value.id) : []

  document.documentElement.setAttribute('lang', locale.value)
})

function setCurrency(value) {
  currency.value = value
}

function toggleLocale() {
  locale.value = locale.value === 'es' ? 'en' : 'es'
}

function setPlatform(value) {
  selectedPlatform.value = value
}

function openCategoryPage(payload) {
  adminPage.value = false
  historyPage.value = false
  categoryPage.value = payload
  upcomingPage.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeCategoryPage() {
  adminPage.value = false
  historyPage.value = false
  categoryPage.value = null
  upcomingPage.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openUpcomingPage(payload) {
  adminPage.value = false
  historyPage.value = false
  upcomingPage.value = payload
  categoryPage.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openHistoryPage() {
  if (!currentUser.value) {
    openAuth('login')
    return
  }
  adminPage.value = false
  categoryPage.value = null
  upcomingPage.value = null
  historyPage.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeHistoryPage() {
  historyPage.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openAuth(mode = 'login') {
  authMode.value = mode
  isAuthOpen.value = true
}

function closeAuth() {
  isAuthOpen.value = false
}


function openGame(game) {
  if (currentUser.value?.id) {
    addVisitedGameToHistory(currentUser.value.id, game)
    sessionHistory.value = getSessionHistory(currentUser.value.id)
  }
  selectedGame.value = game
  gameDetailPage.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeGameDetailPage() {
  gameDetailPage.value = false
  selectedGame.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeGame() {
  isGameOpen.value = false
}

function onAuthenticated(user) {
  currentUser.value = user
  sessionHistory.value = getSessionHistory(user.id)
}

function onLogout() {
  logoutUser()
  clearHistorySession()
  currentUser.value = null
  sessionHistory.value = []
  historyPage.value = false
  adminPage.value = false
}

function openAdminPanel() {
  if (currentUser.value?.role !== 'admin') return
  adminPage.value = true
  historyPage.value = false
  categoryPage.value = null
  upcomingPage.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeAdminPanel() {
  adminPage.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onAdminCatalogUpdated() {
  catalogVersion.value += 1
}
</script>

<template>
  <TopBar
    :theme="theme"
    :currency="currency"
    :locale="locale"
    @toggle-theme="toggleTheme"
    @toggle-currency="setCurrency"
    @toggle-locale="toggleLocale"
  />
  <AppNav
    :key="`nav-${catalogVersion}`"
    :locale="locale"
    :selected-platform="selectedPlatform"
    :currency="currency"
    :current-user="currentUser"
    @open-auth="openAuth"
    @open-game="openGame"
    @open-history="openHistoryPage"
    @open-admin="openAdminPanel"
    @logout="onLogout"
    @open-blog="openBlogPage"
  />
  <PlatformTabs :selected="selectedPlatform" @select="setPlatform" />
  <PriceTicker :key="`ticker-${catalogVersion}`" :currency="currency" :locale="locale" />

  <div v-if="adminPage" class="page page-full">
    <AdminPanelPage
      :current-user="currentUser"
      @back="closeAdminPanel"
      @updated="onAdminCatalogUpdated"
    />
  </div>

  <div v-else-if="historyPage" class="page page-full">
    <HistoryPage
      :history="sessionHistory"
      :currency="currency"
      :locale="locale"
      @back="closeHistoryPage"
      @open-game="openGame"
    />
  </div>

  <div v-else-if="upcomingPage" class="page page-full">
    <UpcomingReleasesPage
      :releases="upcomingPage"
      :currency="currency"
      :locale="locale"
      @back="closeCategoryPage"
    />
  </div>

  <div v-else-if="categoryPage" class="page page-full">
    <CategoryGamesPage
      :category="categoryPage"
      :currency="currency"
      :locale="locale"
      :selected-platform="selectedPlatform"
      @open-game="openGame"
      @back="closeCategoryPage"
    />
  </div>

  <div v-else-if="gameDetailPage && selectedGame" class="page page-full">
    <GameDetailPage :game="selectedGame" @back="closeGameDetailPage" />
  </div>

  <div v-else-if="blogPage" class="page page-full">
    <BlogPage @back="closeBlogPage" />
  </div>
  <div v-else class="page">
    <LeftSidebar @genre-selected="selectedGenre = $event" />
    <MainContent
      :key="`catalog-${catalogVersion}`"
      :currency="currency"
      :locale="locale"
      :selected-platform="selectedPlatform"
      :selected-genre="selectedGenre"
      @open-game="openGame"
      @open-category="openCategoryPage"
      @open-upcoming="openUpcomingPage"
    />
    <RightSidebar :locale="locale" @open-auth="openAuth" />
  </div>


  <SiteFooter :locale="locale" />
  <AuthModal :open="isAuthOpen" :mode="authMode" @close="closeAuth" @authenticated="onAuthenticated" />
</template>
