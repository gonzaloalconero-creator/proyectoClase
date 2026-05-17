<script setup>
import { ref, computed, onMounted } from 'vue'
import { applyGameCatalog, applyStoreCatalog } from '../services/mockCatalogDb'
import { fetchJuegos, fetchTiendas, fetchTiendasAhorro } from '../services/apiService'
const props = defineProps({
  currency: { type: String, default: 'EUR' },
  locale: { type: String, default: 'es' },
  selectedPlatform: { type: String, default: 'all' },
  selectedGenre: { type: String, default: null }
})

const emit = defineEmits(['open-game', 'open-category', 'open-upcoming', 'platform-counts'])

const USD_RATE = 1.08

const i18n = {
  es: {
    heroTitleA: 'Compara precios de',
    heroTitleB: 'claves de juegos',
    heroTitleC: 'en segundos',
    heroText: 'Encuentra el mejor precio entre multiples tiendas, con ofertas actualizadas y descuentos reales para PC, PlayStation, Xbox y Switch.',
    stores: 'Tiendas',
    offers: 'Ofertas',
    updated: 'Actualizacion',
    featured: 'Ofertas destacadas',
    seeAll: 'Ver todas',
    latest: 'Ultimos anadidos',
    explore: 'Explorar',
    byPopularity: 'Por popularidad',
    seeMore: 'Ver mas',
    showLess: 'Ver menos',
    bestSellers: 'Mas vendidos',
    mostSearched: 'Mas buscados',
    releases: 'Lanzamientos',
    topRated: 'Mas valorados',
    biggestDiscounts: 'Mayores descuentos',
    over70: 'Mas del 70% dto.',
    between40: 'Entre 40% y 70%',
    under40: 'Menos del 40%',
    byTheme: 'Por tematica',
    action: 'Accion / Shooters',
    rpg: 'RPG / Aventura',
    indie: 'Indie',
    horror: 'Terror',
    sports: 'Deportes',
    fps: 'FPS / Multijugador',
    upcoming: 'Proximos lanzamientos',
    seeAllGames: 'Ver todos',
    comparedStores: 'Tiendas comparadas',
    from: 'Desde',
    notify: 'Avisarme',
    bestDeal: 'Mejor oferta',
    visitStore: 'Visitar tienda',
    genreUnavailableTitle: 'Categoria no disponible',
    genreUnavailableText: 'No hay juegos disponibles en el genero',
    genreUnavailableSub: 'Prueba con otra categoria o vuelve mas tarde.'
  },
  en: {
    heroTitleA: 'Compare prices of',
    heroTitleB: 'game keys',
    heroTitleC: 'in seconds',
    heroText: 'Find the best price across multiple stores, with updated offers and real discounts for PC, PlayStation, Xbox and Switch.',
    stores: 'Stores',
    offers: 'Offers',
    updated: 'Updated',
    featured: 'Featured deals',
    seeAll: 'See all',
    latest: 'Latest added',
    explore: 'Explore',
    byPopularity: 'By popularity',
    seeMore: 'See more',
    showLess: 'See less',
    bestSellers: 'Best sellers',
    mostSearched: 'Most searched',
    releases: 'Releases',
    topRated: 'Top rated',
    biggestDiscounts: 'Biggest discounts',
    over70: 'Over 70% off',
    between40: 'Between 40% and 70%',
    under40: 'Under 40%',
    byTheme: 'By theme',
    action: 'Action / Shooters',
    rpg: 'RPG / Adventure',
    indie: 'Indie',
    horror: 'Horror',
    sports: 'Sports',
    fps: 'FPS / Multiplayer',
    upcoming: 'Upcoming releases',
    seeAllGames: 'View all',
    comparedStores: 'Compared stores',
    from: 'From',
    notify: 'Notify me',
    bestDeal: 'Best deal',
    visitStore: 'Visit store',
    genreUnavailableTitle: 'Category unavailable',
    genreUnavailableText: 'There are no games available in the genre',
    genreUnavailableSub: 'Try another category or come back later.'
  }
}

function t(key) {
  return i18n[props.locale]?.[key] || i18n.es[key]
}
const ahorroMap = ref({})
const featuredGames = ref([])
const newestGames = ref([])
const listGames = ref([])
const stores = ref([])

// ── Slider ───────────────────────────────────────────────────
const sliderIndex = ref(0)
let sliderTimer = null

function sliderPrev() {
  sliderIndex.value = (sliderIndex.value - 1 + featuredGames.value.length) % featuredGames.value.length
}
function sliderNext() {
  sliderIndex.value = (sliderIndex.value + 1) % featuredGames.value.length
}
function sliderGo(i) {
  sliderIndex.value = i
}
function startSlider() {
  sliderTimer = setInterval(sliderNext, 4000)
}
function stopSlider() {
  clearInterval(sliderTimer)
}

const upcomingGames = [
  {
    key: 'gta6',
    name: 'Grand Theft Auto VI',
    img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2369390/header.jpg',
    date: 'May 26, 2026',
    releaseDate: '2026-05-26T00:00:00Z',
    genre: 'Accion',
    price: 69.99
  },
  {
    key: 'witcher4',
    name: 'The Witcher 4',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2094010/header.jpg',
    date: 'Nov 18, 2026',
    releaseDate: '2026-11-18T00:00:00Z',
    genre: 'RPG',
    price: 59.99
  },
  {
    key: 'doom-darkages',
    name: 'DOOM: The Dark Ages',
    img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2928659/header.jpg',
    date: 'May 15, 2026',
    releaseDate: '2026-05-15T00:00:00Z',
    genre: 'FPS',
    price: 59.99
  },
  {
    key: 'fable',
    name: 'Fable',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1236190/header.jpg',
    date: 'Aug 20, 2026',
    releaseDate: '2026-08-20T00:00:00Z',
    genre: 'Aventura',
    price: 49.99
  }
]

const byDiscount = computed(() => [...listGames.value].sort((a, b) => b.discount - a.discount))
const bySavings = computed(() => [...listGames.value].sort((a, b) => (b.was - b.price) - (a.was - a.price)))
const byNewest = computed(() => [...listGames.value].slice().reverse())

const topSellers = computed(() => byDiscount.value)
const mostSearched = computed(() => bySavings.value.slice(0, 180))
const newReleases = computed(() => byNewest.value.slice(0, 180))
const topRated = computed(() => byDiscount.value.filter(g => g.discount >= 45).slice(0, 180))

const over70 = computed(() => listGames.value.filter(g => g.discount > 70))
const mid40to70 = computed(() => listGames.value.filter(g => g.discount <= 70 && g.discount >= 40))
const under40 = computed(() => listGames.value.filter(g => g.discount < 40))

const actionGames = computed(() => listGames.value.filter(g => g.genre === 'Accion'))
const rpgGames = computed(() => listGames.value.filter(g => g.genre === 'RPG'))
const indieGames = computed(() => listGames.value.filter(g => g.genre === 'Indie'))
const horrorGames = computed(() => listGames.value.filter(g => g.genre === 'Terror'))
const sportsGames = computed(() => listGames.value.filter(g => g.genre === 'Deportes' || g.genre === 'Carreras'))
const fpsGames = computed(() => listGames.value.filter(g => g.genre === 'FPS'))

const COLUMN_LIMIT = 7
const failedStoreLogos = ref({})

function fmt(price) {
  const num = parseFloat(price) || 0
  const normalized = props.currency === 'USD' ? num * USD_RATE : num
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol} ${normalized.toFixed(2)}`
}

function discountBadge(value) { return `-${value}%` }

function matchesPlatform(game) {
  if (props.selectedPlatform === 'all') return true
  const text = String(game?.platform || '').toLowerCase()
  if (props.selectedPlatform === 'steam') return text.includes('steam') || text.includes('pc')
  if (props.selectedPlatform === 'epic') return text.includes('epic')
  if (props.selectedPlatform === 'ps5') return text.includes('ps5') || text.includes('playstation 5')
  if (props.selectedPlatform === 'ps4') return text.includes('ps4') || text.includes('playstation 4')
  if (props.selectedPlatform === 'xbox') return text.includes('xbox')
  if (props.selectedPlatform === 'switch') return text.includes('switch') || text.includes('nintendo')
  return true
}

function matchesGenre(game) {
  if (!props.selectedGenre) return true
  const normalize = str => str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return normalize(game.genre) === normalize(props.selectedGenre)
}

function filterGames(list) {
  return list.filter(g => matchesPlatform(g) && matchesGenre(g))
}

function sectionGames(primaryList, fallbackList, limit) {
  const primary = filterGames(primaryList)
  if (primary.length) return primary.slice(0, limit)
  return filterGames(fallbackList).slice(0, limit)
}

function visibleGames(columnKey, list) {
  return filterGames(list).slice(0, COLUMN_LIMIT)
}

function canExpand(list) {
  return filterGames(list).length > COLUMN_LIMIT
}

function hasVisibleGames(list) {
  return filterGames(list).length > 0
}

const hasAnyGames = computed(() => {
  if (!props.selectedGenre) return true
  return filterGames(listGames.value).length > 0
})

function openCategoryPage(titleKey, list) {
  emit('open-category', { titleKey, games: list })
}

function openUpcomingPage() {
  emit('open-upcoming', { titleKey: 'upcoming', games: upcomingGames })
}

function markStoreLogoError(storeKey) {
  failedStoreLogos.value = { ...failedStoreLogos.value, [storeKey]: true }
}

function useLogo(storeKey) {
  return !failedStoreLogos.value[storeKey]
}

function openGame(game) {
  emit('open-game', game)
}
function storeAhorro(storeKey) {
  const data = ahorroMap.value[storeKey]
  if (!data || !data.ahorroMedio) return null
  return data.ahorroMedio
}

function storeTotalJuegos(storeKey) {
  const data = ahorroMap.value[storeKey]
  if (!data) return '—'
  return data.totalJuegos.toLocaleString('es-ES')
}
// ── Conteos por plataforma ───────────────────────────────────
function calcPlatformCounts(juegos) {
  const counts = { steam: 0, epic: 0, ps5: 0, ps4: 0, xbox: 0, switch: 0 }
  juegos.forEach(g => {
    const tag = (g.platform_tag || '').toLowerCase()
    const txt = (g.platform || '').toLowerCase()
    if (tag === 'steam' || txt.includes('steam')) counts.steam++
    if (tag === 'epic' || txt.includes('epic')) counts.epic++
    if (tag === 'ps5' || txt.includes('ps5')) counts.ps5++
    if (tag === 'ps4' || txt.includes('ps4')) counts.ps4++
    if (tag === 'xbox' || txt.includes('xbox')) counts.xbox++
    if (tag === 'switch' || txt.includes('switch')) counts.switch++
  })
  return counts
}

onMounted(async () => {
  try {
    const juegos = await fetchJuegos()
    const todos = applyGameCatalog(juegos)
    listGames.value = todos
    featuredGames.value = todos.slice(0, 6)
    newestGames.value = todos.slice(-4).reverse()
    emit('platform-counts', calcPlatformCounts(todos))
    startSlider()
  } catch (e) {
    console.error('Error cargando juegos:', e)
  }
  try {
    const tiendas = await fetchTiendas()
    stores.value = applyStoreCatalog(tiendas).slice(0, 4)
  } catch (e) {
    console.error('Error cargando tiendas:', e)
  }
  try {
    const ahorro = await fetchTiendasAhorro()
    ahorro.forEach(a => {
      ahorroMap.value[a.storeKey] = {
        ahorroMedio: parseFloat(a.ahorroMedio) || 0,
        totalJuegos: a.totalJuegos || 0
      }
    })
  } catch (e) {
    console.error('Error cargando ahorro tiendas:', e)
  }
})
</script>

<template>
  <main id="mainContent" role="main">

    <!-- ── GÉNERO SIN RESULTADOS ─────────────────────────────────────── -->
    <div v-if="selectedGenre && !hasAnyGames" class="genre-empty">
      <div class="genre-empty-icon">🎮</div>
      <div class="genre-empty-title">{{ t('genreUnavailableTitle') }}</div>
      <div class="genre-empty-text">
        {{ t('genreUnavailableText') }} <strong>{{ selectedGenre }}</strong>.<br>
        {{ t('genreUnavailableSub') }}
      </div>
    </div>

    <!-- ── SLIDER ────────────────────────────────────────────────────── -->
    <div v-if="featuredGames.length" class="hero-slider" @mouseenter="stopSlider" @mouseleave="startSlider">
      <div class="hs-track" :style="{ transform: `translateX(-${sliderIndex * 100}%)` }">
        <div v-for="game in featuredGames" :key="game.key" class="hs-slide" @click="openGame(game)">
          <img :src="game.img" :alt="game.name" class="hs-img">
          <div class="hs-overlay">
            <div class="hs-info">
              <span class="hs-platform">{{ game.platform }}</span>
              <div class="hs-name">{{ game.name }}</div>
              <div class="hs-prices">
                <span class="hs-price">{{ fmt(game.price) }}</span>
                <span class="hs-was">{{ fmt(game.was) }}</span>
                <span class="hs-disc">-{{ game.discount }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="hs-btn hs-prev" @click.stop="sliderPrev">&#10094;</button>
      <button class="hs-btn hs-next" @click.stop="sliderNext">&#10095;</button>

      <div class="hs-dots">
        <span v-for="(_, i) in featuredGames" :key="i" class="hs-dot" :class="{ active: i === sliderIndex }"
          @click.stop="sliderGo(i)"></span>
      </div>
    </div>

    <!-- ── HERO BANNER ───────────────────────────────────────────────── -->
    <section class="hero-banner">
      <div class="hero-text">
        <h1>{{ t('heroTitleA') }} <span>{{ t('heroTitleB') }}</span> {{ t('heroTitleC') }}</h1>
        <p>{{ t('heroText') }}</p>
      </div>
      <div class="hstats">
        <div class="hst"><span class="n">40+</span><span class="l">{{ t('stores') }}</span></div>
        <div class="hst"><span class="n">120k+</span><span class="l">{{ t('offers') }}</span></div>
        <div class="hst"><span class="n">5m</span><span class="l">{{ t('updated') }}</span></div>
      </div>
    </section>

    <div class="sec-head" id="secOfertas">
      <h2>{{ t('featured') }}</h2>
      <a href="#">{{ t('seeAll') }}</a>
    </div>

    <section class="cards-grid">
      <article v-for="game in sectionGames(featuredGames, listGames, 6)" :key="game.key" class="gcard"
        @click="openGame(game)">
        <img :src="game.img" :alt="game.name" class="gcard-img">
        <span class="gcard-platform">{{ game.platform }}</span>
        <span class="gcard-disc">{{ game.discount }}</span>
        <div class="gcard-overlay">
          <div class="gcard-name">{{ game.name }}</div>
          <div>
            <span class="gcard-price">{{ fmt(game.price) }}</span>
            <span class="gcard-was">{{ fmt(game.was) }}</span>
          </div>
        </div>
      </article>
    </section>

    <div class="sec-head">
      <h2>{{ t('latest') }}</h2>
      <a href="#">{{ t('explore') }}</a>
    </div>

    <section class="cards-grid g4" style="margin-bottom:20px;">
      <article v-for="game in sectionGames(newestGames, listGames, 4)" :key="game.key" class="gcard"
        @click="openGame(game)">
        <img :src="game.img" :alt="game.name" class="gcard-img">
        <span class="gcard-platform">{{ game.platform }}</span>
        <span class="gcard-disc">{{ game.discount }}</span>
        <div class="gcard-overlay">
          <div class="gcard-name">{{ game.name }}</div>
          <div>
            <span class="gcard-price">{{ fmt(game.price) }}</span>
            <span class="gcard-was">{{ fmt(game.was) }}</span>
          </div>
        </div>
      </article>
    </section>

    <div class="sec-head">
      <h2>{{ t('byPopularity') }}</h2>
      <a href="#">{{ t('seeMore') }}</a>
    </div>

    <div class="multi-col col4 adaptive-cols">
      <div v-if="hasVisibleGames(topSellers)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('bestSellers') }}</span>
          <span class="badge badge-orange">HOT</span>
        </div>
        <div v-for="(game, i) in visibleGames('topSellers', topSellers)" :key="`sell-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('bestSellers', topSellers)">{{ t('seeMore') }}</button>
      </div>

      <div v-if="hasVisibleGames(mostSearched)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('mostSearched') }}</span>
          <span class="badge badge-blue">TREND</span>
        </div>
        <div v-for="(game, i) in visibleGames('mostSearched', mostSearched)" :key="`search-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('mostSearched', mostSearched)">{{ t('seeMore')
          }}</button>
      </div>

      <div v-if="hasVisibleGames(newReleases)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('releases') }}</span>
          <span class="badge badge-green">NEW</span>
        </div>
        <div v-for="(game, i) in visibleGames('newReleases', newReleases)" :key="`new-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('releases', newReleases)">{{ t('seeMore') }}</button>
      </div>

      <div v-if="hasVisibleGames(topRated)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('topRated') }}</span>
          <span class="badge badge-purple">TOP</span>
        </div>
        <div v-for="(game, i) in visibleGames('topRated', topRated)" :key="`rated-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('topRated', topRated)">{{ t('seeMore') }}</button>
      </div>
    </div>

    <div class="sec-head" id="secOfertas">
      <h2>{{ t('biggestDiscounts') }}</h2>
      <a href="#">{{ t('seeAll') }}</a>
    </div>

    <div class="multi-col col3 adaptive-cols">
      <div v-if="hasVisibleGames(over70)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('over70') }}</span>
          <span class="badge badge-red">BRUTAL</span>
        </div>
        <div v-for="(game, i) in visibleGames('over70', over70)" :key="`over70-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('over70', over70)">{{ t('seeMore') }}</button>
      </div>

      <div v-if="hasVisibleGames(mid40to70)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('between40') }}</span>
          <span class="badge badge-orange">OFERTA</span>
        </div>
        <div v-for="(game, i) in visibleGames('mid40to70', mid40to70)" :key="`mid-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('between40', mid40to70)">{{ t('seeMore') }}</button>
      </div>

      <div v-if="hasVisibleGames(under40)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('under40') }}</span>
          <span class="badge badge-blue">DEAL</span>
        </div>
        <div v-for="(game, i) in visibleGames('under40', under40)" :key="`under40-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('under40', under40)">{{ t('seeMore') }}</button>
      </div>
    </div>

    <div class="sec-head">
      <h2>{{ t('byTheme') }}</h2>
      <a href="#">{{ t('explore') }}</a>
    </div>

    <div class="multi-col col3 adaptive-cols" style="margin-bottom:10px;">
      <div v-if="hasVisibleGames(actionGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('action') }}</span>
          <span class="badge badge-red">FPS</span>
        </div>
        <div v-for="(game, i) in visibleGames('actionGames', actionGames)" :key="`action-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('action', actionGames)">{{ t('seeMore') }}</button>
      </div>

      <div v-if="hasVisibleGames(rpgGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('rpg') }}</span>
          <span class="badge badge-purple">RPG</span>
        </div>
        <div v-for="(game, i) in visibleGames('rpgGames', rpgGames)" :key="`rpg-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('rpg', rpgGames)">{{ t('seeMore') }}</button>
      </div>

      <div v-if="hasVisibleGames(indieGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('indie') }}</span>
          <span class="badge badge-green">INDIE</span>
        </div>
        <div v-for="(game, i) in visibleGames('indieGames', indieGames)" :key="`indie-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('indie', indieGames)">{{ t('seeMore') }}</button>
      </div>
    </div>

    <div class="multi-col col3 adaptive-cols">
      <div v-if="hasVisibleGames(horrorGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('horror') }}</span>
          <span class="badge badge-red">HORROR</span>
        </div>
        <div v-for="(game, i) in visibleGames('horrorGames', horrorGames)" :key="`horror-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('horror', horrorGames)">{{ t('seeMore') }}</button>
      </div>

      <div v-if="hasVisibleGames(sportsGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('sports') }}</span>
          <span class="badge badge-green">SPORTS</span>
        </div>
        <div v-for="(game, i) in visibleGames('sportsGames', sportsGames)" :key="`sports-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('sports', sportsGames)">{{ t('seeMore') }}</button>
      </div>

      <div v-if="hasVisibleGames(fpsGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('fps') }}</span>
          <span class="badge badge-blue">FPS</span>
        </div>
        <div v-for="(game, i) in visibleGames('fpsGames', fpsGames)" :key="`fps-${game.key}`" class="ci"
          @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta"><span class="ptag">{{ game.platform }}</span></div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('fps', fpsGames)">{{ t('seeMore') }}</button>
      </div>
    </div>

    <div class="sec-head" id="secUpcoming" style="margin-top:28px;">
      <h2>{{ t('upcoming') }}</h2>
      <a href="#" @click.prevent="openUpcomingPage">{{ t('seeAllGames') }}</a>
    </div>

    <div class="upcoming-grid">
      <div v-for="game in upcomingGames" :key="game.key" class="upcoming-card">
        <div class="upcoming-img-wrap">
          <img :src="game.img" :alt="game.name">
          <span class="upcoming-date-badge">{{ game.date }}</span>
        </div>
        <div class="upcoming-body">
          <div class="upcoming-name">{{ game.name }}</div>
          <div class="upcoming-meta">
            <span class="upcoming-genre">{{ game.genre }}</span>
          </div>
          <div class="upcoming-footer">
            <span class="upcoming-price-label">{{ t('from') }}</span>
            <span class="upcoming-price">{{ fmt(game.price) }}</span>
            <button class="upcoming-alert-btn">{{ t('notify') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="sec-head" id="secTiendas" style="margin-top:28px;">
      <h2>{{ t('comparedStores') }}</h2>
    </div>

    <div class="stores-grid">
      <div v-for="store in stores" :key="store.key" class="store-card">
        <div class="store-card-head">
          <div class="store-ico">
            <img v-if="useLogo(store.key)" :src="store.logo" :alt="`Logo ${store.name}`" loading="lazy"
              @error="markStoreLogoError(store.key)">
            <span v-else class="store-ico-fallback">{{ store.initials }}</span>
          </div>
          <div class="store-head-info">
            <div class="store-name">{{ store.name }}</div>
            <div class="store-url">{{ store.url }}</div>
          </div>
          <span class="store-count">{{ storeTotalJuegos(store.key) }} juegos</span>
        </div>

        <div class="store-saving-block">
          <template v-if="storeAhorro(store.key)">
            <div class="store-saving-bar-wrap">
              <div class="store-saving-bar" :style="{ width: Math.min(storeAhorro(store.key), 100) + '%' }"></div>
            </div>
            <div class="store-saving-meta">
              <span class="store-saving-label">Ahorro medio</span>
              <span class="store-saving-value">-{{ storeAhorro(store.key) }}%</span>
            </div>
          </template>
          <template v-else>
            <div class="store-saving-empty">Sin datos de ahorro aún</div>
          </template>
        </div>

        <a :href="store.url || '#'" target="_blank" rel="noopener" class="store-visit-btn">
          {{ t('visitStore') }}
        </a>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ── Slider ─────────────────────────────────────────────────── */
.hero-slider {
  position: relative;
  width: 100%;
  /* aspect-ratio mantiene proporciones tipo banner de juego (aprox 4:1) */
  aspect-ratio: 4 / 1;
  min-height: 180px;
  max-height: 320px;
  overflow: hidden;
  border-radius: var(--radius-lg);
  margin-bottom: 14px;
  cursor: pointer;
  background: var(--bg-elevated);
}

.hs-track {
  display: flex;
  height: 100%;
  transition: transform 0.5s ease;
}

.hs-slide {
  flex: 0 0 100%;
  position: relative;
  height: 100%;
}

.hs-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

.hs-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.1) 60%, transparent 100%);
  display: flex;
  align-items: flex-end;
  padding: 24px;
}

.hs-info {
  max-width: 55%;
}

.hs-platform {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 6px;
}

.hs-name {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  margin-bottom: 8px;
  line-height: 1.1;
}

.hs-prices {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.hs-price {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  color: var(--green);
}

.hs-was {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: line-through;
}

.hs-disc {
  background: #dc2626;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
}

.hs-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 2;
}

.hs-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.hs-prev {
  left: 10px;
}

.hs-next {
  right: 10px;
}

.hs-dots {
  position: absolute;
  bottom: 12px;
  right: 16px;
  display: flex;
  gap: 6px;
  z-index: 2;
}

.hs-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 0.2s;
}

.hs-dot.active {
  background: var(--accent);
}

.store-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.store-head-info {
  flex: 1;
  min-width: 0;
}
.store-saving-block {
  margin-bottom: 14px;
}
.store-saving-bar-wrap {
  height: 6px;
  background: var(--border-medium, #2a2a3a);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 6px;
}
.store-saving-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent, #f97316), #f97316cc);
  border-radius: 99px;
  transition: width 0.6s ease;
}
.store-saving-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.store-saving-label {
  font-size: 11px;
  color: var(--text-faint);
}
.store-saving-value {
  font-size: 15px;
  font-weight: 800;
  color: var(--accent, #f97316);
}
.store-saving-empty {
  font-size: 11px;
  color: var(--text-faint);
  padding: 8px 0;
}
.store-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-faint);
  white-space: nowrap;
}
</style>