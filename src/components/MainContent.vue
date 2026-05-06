<script setup>
import { ref, computed, onMounted } from 'vue'
import { applyGameCatalog, applyStoreCatalog } from '../services/mockCatalogDb'
import { fetchJuegos, fetchTiendas } from '../services/apiService'

const props = defineProps({
  currency: {
    type: String,
    default: 'EUR'
  },
  locale: {
    type: String,
    default: 'es'
  },
  selectedPlatform: {
    type: String,
    default: 'all'
  },
  selectedGenre: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['open-game', 'open-category', 'open-upcoming'])

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
    visitStore: 'Visitar tienda'
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
    visitStore: 'Visit store'
  }
}

function t(key) {
  return i18n[props.locale]?.[key] || i18n.es[key]
}

// TODO: featuredGames y newestGames comentados — datos vienen de la BD
// const featuredGames = [ ... ]
// const newestGames = [ ... ]

const featuredGames = ref([])
const newestGames = ref([])

// TODO: listGames hardcodeado comentado — datos vienen de la BD
// let listGames = [
//   { key: 'cyberpunk', ... },
const listGames = ref([])

/* BLOQUE COMENTADO — hardcoded original:
let _listGames_hardcoded = [
  {
    key: 'cyberpunk',
    name: 'Cyberpunk 2077',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg',
    platform: 'PC Steam',
    platformTag: 'Global',
    genre: 'Accion',
    price: 3.99,
    was: 59.99,
    discount: 93
  },
  {
    key: 'witcher3',
    name: 'The Witcher 3: Wild Hunt',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg',
    platform: 'PC Steam',
    platformTag: 'Global',
    genre: 'RPG',
    price: 1.99,
    was: 29.99,
    discount: 93
  },
  {
    key: 'darksouls3',
    name: 'Dark Souls III',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/library_600x900.jpg',
    platform: 'PC Steam / Xbox',
    platformTag: 'Verificado',
    genre: 'RPG',
    price: 3.49,
    was: 39.99,
    discount: 91
  },
  {
    key: 'rdr2',
    name: 'Red Dead Redemption 2',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg',
    platform: 'PC Steam / PS4 / Xbox',
    platformTag: 'Verificado',
    genre: 'Accion',
    price: 5.99,
    was: 59.99,
    discount: 90
  },
  {
    key: 'starfield',
    name: 'Starfield',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/library_600x900.jpg',
    platform: 'PC Steam / Xbox',
    platformTag: 'Verificado',
    genre: 'Accion',
    price: 6.99,
    was: 69.99,
    discount: 90
  },
  {
    key: 'minecraft',
    name: 'Minecraft',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/library_600x900.jpg',
    platform: 'PC / Xbox / Switch / Mobile',
    platformTag: 'Verificado',
    genre: 'Indie',
    price: 8.49,
    was: 24.99,
    discount: 66
  },
  {
    key: 'horizonfw',
    name: 'Horizon Forbidden West',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2420110/library_600x900.jpg',
    platform: 'PS5 / PS4 / PC',
    platformTag: 'Verificado',
    genre: 'Aventura',
    price: 18.99,
    was: 59.99,
    discount: 68
  },
  {
    key: 'gowr',
    name: 'God of War Ragnarok',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/library_600x900.jpg',
    platform: 'PS5 / PS4 / PC',
    platformTag: 'Verificado',
    genre: 'Accion',
    price: 22.99,
    was: 69.99,
    discount: 67
  },
  {
    key: 'bg3',
    name: 'Baldur\'s Gate 3',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900.jpg',
    platform: 'PC Steam / PS5',
    platformTag: 'Verificado',
    genre: 'RPG',
    price: 22.99,
    was: 59.99,
    discount: 62
  },
  {
    key: 'hades2',
    name: 'Hades II',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/library_600x900.jpg',
    platform: 'PC Steam',
    platformTag: 'Verificado',
    genre: 'Indie',
    price: 13.49,
    was: 26.99,
    discount: 50
  },
  {
    key: 'celeste',
    name: 'Celeste',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg',
    platform: 'PC Steam / Switch',
    platformTag: 'Verificado',
    genre: 'Indie',
    price: 1.99,
    was: 19.99,
    discount: 90
  },
  {
    key: 're4',
    name: 'Resident Evil 4 Remake',
    img: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg',
    platform: 'PC Steam / PS5',
    platformTag: 'Verificado',
    genre: 'Terror',
    price: 12.99,
    was: 49.99,
    discount: 74
  },
  {
    key: 'alanwake2',
    name: 'Alan Wake 2',
    img: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=900&q=80',
    platform: 'Epic Games / PS5 / Xbox',
    platformTag: 'Verificado',
    genre: 'Terror',
    price: 23.99,
    was: 49.99,
    discount: 52
  },
  {
    key: 'fortnite',
    name: 'Fortnite',
    img: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
    platform: 'Epic Games / PS5 / Xbox / Switch / PC',
    platformTag: 'Popular',
    genre: 'Accion',
    price: 4.99,
    was: 19.99,
    discount: 75
  },
  {
    key: 'rocketleague',
    name: 'Rocket League',
    img: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80',
    platform: 'Epic Games / PS5 / Xbox / Switch / PC',
    platformTag: 'Crossplay',
    genre: 'Deportes',
    price: 2.99,
    was: 19.99,
    discount: 85
  },
  {
    key: 'ffxvi',
    name: 'Final Fantasy XVI',
    img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
    platform: 'PS5',
    platformTag: 'Exclusivo',
    genre: 'RPG',
    price: 39.99,
    was: 79.99,
    discount: 50
  },
  {
    key: 'spiderman2',
    name: 'Marvel\'s Spider-Man 2',
    img: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=900&q=80',
    platform: 'PS5',
    platformTag: 'Exclusivo',
    genre: 'Accion',
    price: 49.99,
    was: 79.99,
    discount: 38
  },
  {
    key: 'haloinfinite',
    name: 'Halo Infinite',
    img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80',
    platform: 'Xbox / PC',
    platformTag: 'Game Pass',
    genre: 'FPS',
    price: 14.99,
    was: 59.99,
    discount: 75
  },
  {
    key: 'forzamotorsport',
    name: 'Forza Motorsport',
    img: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=900&q=80',
    platform: 'Xbox / PC',
    platformTag: 'Carreras',
    genre: 'Carreras',
    price: 29.99,
    was: 69.99,
    discount: 57
  },
  {
    key: 'zeldatotk',
    name: 'Zelda: Tears of the Kingdom',
    img: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
    platform: 'Switch',
    platformTag: 'Exclusivo',
    genre: 'Aventura',
    price: 49.99,
    was: 69.99,
    discount: 29
  },
  {
    key: 'mariowonder',
    name: 'Super Mario Bros. Wonder',
    img: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80',
    platform: 'Switch',
    platformTag: 'Exclusivo',
    genre: 'Aventura',
    price: 39.99,
    was: 59.99,
    discount: 33
  }
]

// TODO: createSyntheticPlatformGames comentado — juegos vienen de la BD
// function createSyntheticPlatformGames() { ... }
// listGames.push(...createSyntheticPlatformGames())
// listGames = applyGameCatalog(listGames)
*/

const upcomingGames = [
  {
    key: 'gta6',
    name: 'Grand Theft Auto VI',
    img: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1200&q=80',
    date: 'May 26, 2026',
    releaseDate: '2026-05-26T00:00:00Z',
    genre: 'Accion',
    price: 69.99
  },
  {
    key: 'witcher4',
    name: 'The Witcher 4',
    img: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
    date: 'Nov 18, 2026',
    releaseDate: '2026-11-18T00:00:00Z',
    genre: 'RPG',
    price: 59.99
  },
  {
    key: 'doom',
    name: 'DOOM: The Dark Ages',
    img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    date: 'Sep 10, 2026',
    releaseDate: '2026-09-10T00:00:00Z',
    genre: 'FPS',
    price: 59.99
  },
  {
    key: 'fable',
    name: 'Fable',
    img: 'https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&w=1200&q=80',
    date: 'Aug 20, 2026',
    releaseDate: '2026-08-20T00:00:00Z',
    genre: 'Aventura',
    price: 49.99
  }
]

// TODO: stores hardcodeado comentado — datos vienen de la BD
// let stores = [ ... ]
// stores = applyStoreCatalog(stores)
const stores = ref([])

const byDiscount   = computed(() => [...listGames.value].sort((a, b) => b.discount - a.discount))
const bySavings    = computed(() => [...listGames.value].sort((a, b) => (b.was - b.price) - (a.was - a.price)))
const byNewest     = computed(() => [...listGames.value].slice().reverse())

const topSellers   = computed(() => byDiscount.value)
const mostSearched = computed(() => bySavings.value.slice(0, 180))
const newReleases  = computed(() => byNewest.value.slice(0, 180))
const topRated     = computed(() => byDiscount.value.filter((g) => g.discount >= 45).slice(0, 180))

const over70       = computed(() => listGames.value.filter((g) => g.discount > 70))
const mid40to70    = computed(() => listGames.value.filter((g) => g.discount <= 70 && g.discount >= 40))
const under40      = computed(() => listGames.value.filter((g) => g.discount < 40))

const actionGames  = computed(() => listGames.value.filter((g) => g.genre === 'Accion'))
const rpgGames     = computed(() => listGames.value.filter((g) => g.genre === 'RPG'))
const indieGames   = computed(() => listGames.value.filter((g) => g.genre === 'Indie'))
const horrorGames  = computed(() => listGames.value.filter((g) => g.genre === 'Terror'))
const sportsGames  = computed(() => listGames.value.filter((g) => g.genre === 'Deportes' || g.genre === 'Carreras'))
const fpsGames     = computed(() => listGames.value.filter((g) => g.genre === 'FPS'))
const COLUMN_LIMIT = 7
const failedStoreLogos = ref({})

function fmt(price) {
  const num = parseFloat(price) || 0
  const normalized = props.currency === 'USD' ? num * USD_RATE : num
  const symbol = props.currency === 'USD' ? '$' : '€'
  return `${symbol} ${normalized.toFixed(2)}`
}

function discountBadge(value) {
  return `-${value}%`
}


function matchesPlatform(game) {
  if (props.selectedPlatform === 'all') {
    return true
  }
  const text = String(game?.platform || '').toLowerCase()
  if (props.selectedPlatform === 'steam') {
    return text.includes('steam') || text.includes('pc')
  }
  if (props.selectedPlatform === 'epic') {
    return text.includes('epic')
  }
  if (props.selectedPlatform === 'ps5') {
    return text.includes('ps5') || text.includes('playstation 5')
  }
  if (props.selectedPlatform === 'ps4') {
    return text.includes('ps4') || text.includes('playstation 4')
  }
  if (props.selectedPlatform === 'xbox') {
    return text.includes('xbox')
  }
  if (props.selectedPlatform === 'switch') {
    return text.includes('switch') || text.includes('nintendo')
  }
  return true
}

function matchesGenre(game) {
  if (!props.selectedGenre) return true
  // Normalize genre names for comparison (remove accents, case-insensitive)
  const normalize = (str) => str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return normalize(game.genre) === normalize(props.selectedGenre)
}

function filterGames(list) {
  return list.filter((g) => matchesPlatform(g) && matchesGenre(g))
}



function sectionGames(primaryList, fallbackList, limit) {
  const primary = filterGames(primaryList)
  if (primary.length) {
    return primary.slice(0, limit)
  }
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

function openCategoryPage(titleKey, list) {
  emit('open-category', {
    titleKey,
    games: list
  })
}

function openUpcomingPage() {
  emit('open-upcoming', {
    titleKey: 'upcoming',
    games: upcomingGames
  })
}

function markStoreLogoError(storeKey) {
  failedStoreLogos.value = {
    ...failedStoreLogos.value,
    [storeKey]: true
  }
}

function useLogo(storeKey) {
  return !failedStoreLogos.value[storeKey]
}

function openGame(game) {
  emit('open-game', game)
}

onMounted(async () => {
  try {
    const juegos = await fetchJuegos()
    const todos = applyGameCatalog(juegos)
    listGames.value    = todos
    featuredGames.value = todos.slice(0, 6)
    newestGames.value   = todos.slice(-4).reverse()
  } catch (e) {
    console.error('Error cargando juegos:', e)
  }
  try {
    const tiendas = await fetchTiendas()
    stores.value = applyStoreCatalog(tiendas).slice(0, 4)
  } catch (e) {
    console.error('Error cargando tiendas:', e)
  }
})
</script>

<template>
  <main id="mainContent" role="main">
    <section class="hero-banner">
      <div class="hero-text">
        <h1>{{ t('heroTitleA') }} <span>{{ t('heroTitleB') }}</span> {{ t('heroTitleC') }}</h1>
        <p>{{ t('heroText') }}</p>
      </div>
      <div class="hstats">
        <div class="hst">
          <span class="n">40+</span>
          <span class="l">{{ t('stores') }}</span>
        </div>
        <div class="hst">
          <span class="n">120k+</span>
          <span class="l">{{ t('offers') }}</span>
        </div>
        <div class="hst">
          <span class="n">5m</span>
          <span class="l">{{ t('updated') }}</span>
        </div>
      </div>
    </section>

    <div class="sec-head" id="secOfertas">
      <h2>{{ t('featured') }}</h2>
      <a href="#">{{ t('seeAll') }}</a>
    </div>

    <section class="cards-grid">
      <article
        v-for="game in sectionGames(featuredGames, listGames, 6)"
        :key="game.key"
        class="gcard"
        @click="openGame(game)"
      >
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
      <article
        v-for="game in sectionGames(newestGames, listGames, 4)"
        :key="game.key"
        class="gcard"
        @click="openGame(game)"
      >
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
        <div v-for="(game, i) in visibleGames('topSellers', topSellers)" :key="`sell-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('bestSellers', topSellers)">
          {{ t('seeMore') }}
        </button>
      </div>

      <div v-if="hasVisibleGames(mostSearched)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('mostSearched') }}</span>
          <span class="badge badge-blue">TREND</span>
        </div>
        <div v-for="(game, i) in visibleGames('mostSearched', mostSearched)" :key="`search-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('mostSearched', mostSearched)">
          {{ t('seeMore') }}
        </button>
      </div>

      <div v-if="hasVisibleGames(newReleases)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('releases') }}</span>
          <span class="badge badge-green">NEW</span>
        </div>
        <div v-for="(game, i) in visibleGames('newReleases', newReleases)" :key="`new-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('releases', newReleases)">
          {{ t('seeMore') }}
        </button>
      </div>

      <div v-if="hasVisibleGames(topRated)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('topRated') }}</span>
          <span class="badge badge-purple">TOP</span>
        </div>
        <div v-for="(game, i) in visibleGames('topRated', topRated)" :key="`rated-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('topRated', topRated)">
          {{ t('seeMore') }}
        </button>
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
        <div v-for="(game, i) in visibleGames('over70', over70)" :key="`over70-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('over70', over70)">
          {{ t('seeMore') }}
        </button>
      </div>

      <div v-if="hasVisibleGames(mid40to70)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('between40') }}</span>
          <span class="badge badge-orange">OFERTA</span>
        </div>
        <div v-for="(game, i) in visibleGames('mid40to70', mid40to70)" :key="`mid-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('between40', mid40to70)">
          {{ t('seeMore') }}
        </button>
      </div>

      <div v-if="hasVisibleGames(under40)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('under40') }}</span>
          <span class="badge badge-blue">DEAL</span>
        </div>
        <div v-for="(game, i) in visibleGames('under40', under40)" :key="`under40-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('under40', under40)">
          {{ t('seeMore') }}
        </button>
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
        <div v-for="(game, i) in visibleGames('actionGames', actionGames)" :key="`action-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('action', actionGames)">
          {{ t('seeMore') }}
        </button>
      </div>

      <div v-if="hasVisibleGames(rpgGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('rpg') }}</span>
          <span class="badge badge-purple">RPG</span>
        </div>
        <div v-for="(game, i) in visibleGames('rpgGames', rpgGames)" :key="`rpg-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('rpg', rpgGames)">
          {{ t('seeMore') }}
        </button>
      </div>

      <div v-if="hasVisibleGames(indieGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('indie') }}</span>
          <span class="badge badge-green">INDIE</span>
        </div>
        <div v-for="(game, i) in visibleGames('indieGames', indieGames)" :key="`indie-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('indie', indieGames)">
          {{ t('seeMore') }}
        </button>
      </div>
    </div>

    <div class="multi-col col3 adaptive-cols">
      <div v-if="hasVisibleGames(horrorGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('horror') }}</span>
          <span class="badge badge-red">HORROR</span>
        </div>
        <div v-for="(game, i) in visibleGames('horrorGames', horrorGames)" :key="`horror-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('horror', horrorGames)">
          {{ t('seeMore') }}
        </button>
      </div>

      <div v-if="hasVisibleGames(sportsGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('sports') }}</span>
          <span class="badge badge-green">SPORTS</span>
        </div>
        <div v-for="(game, i) in visibleGames('sportsGames', sportsGames)" :key="`sports-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('sports', sportsGames)">
          {{ t('seeMore') }}
        </button>
      </div>

      <div v-if="hasVisibleGames(fpsGames)" class="list-col">
        <div class="list-col-head">
          <span class="title">{{ t('fps') }}</span>
          <span class="badge badge-blue">FPS</span>
        </div>
        <div v-for="(game, i) in visibleGames('fpsGames', fpsGames)" :key="`fps-${game.key}`" class="ci" @click="openGame(game)">
          <span class="ci-rank" :class="{ g: i === 0, s: i === 1, b: i === 2 }">{{ i + 1 }}</span>
          <img :src="game.img" :alt="game.name" class="ci-thumb">
          <div class="ci-info">
            <div class="ci-name">{{ game.name }}</div>
            <div class="ci-meta">
              <span class="ptag">{{ game.platform }}</span>
              <span class="ptag">{{ game.platformTag }}</span>
            </div>
          </div>
          <div class="ci-price">
            <span class="ci-now">{{ fmt(game.price) }}</span>
            <span class="ci-was">{{ fmt(game.was) }}</span>
            <span class="ci-disc">{{ discountBadge(game.discount) }}</span>
          </div>
        </div>
        <button class="list-col-more" @click="openCategoryPage('fps', fpsGames)">
          {{ t('seeMore') }}
        </button>
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
            <img
              v-if="useLogo(store.key)"
              :src="store.logo"
              :alt="`Logo ${store.name}`"
              loading="lazy"
              @error="markStoreLogoError(store.key)"
            >
            <span v-else class="store-ico-fallback">{{ store.initials }}</span>
          </div>
          <div>
            <div class="store-name">{{ store.name }}</div>
            <div class="store-url">{{ store.url }}</div>
          </div>
          <span class="store-count">{{ store.count }}</span>
        </div>
        <div class="store-best-deal">
          <span class="store-deal-label">{{ t('bestDeal') }}</span>
          <span class="store-deal-name">{{ store.best }}</span>
          <span class="store-deal-disc">{{ store.disc }}</span>
          <span class="store-deal-price">{{ fmt(store.price) }}</span>
        </div>
        <a href="#" class="store-visit-btn">{{ t('visitStore') }}</a>
      </div>
    </div>
  </main>
</template>

