// ============================================================
//  scrapers/instantgaming.js — Instant Gaming
//
//  Estrategia en dos capas:
//   1. Axios → endpoint JSON interno de IG (rápido, sin browser)
//   2. playwright-extra + stealth → bypass de Cloudflare con browser real
//   3. Precios de referencia como último recurso
// ============================================================

import axios   from 'axios';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

const BASE_URL = 'https://www.instant-gaming.com';

// Precios de referencia para TODOS los juegos — solo se usan si falla el scraping
const DEMO_PRICES = {
  'cyberpunk 2077':         { price: 8.99,  region: 'Europa' },
  'witcher 3':              { price: 5.99,  region: 'Europa' },
  'elden ring':             { price: 26.99, region: 'Europa' },
  'red dead redemption':    { price: 16.99, region: 'Europa' },
  "baldur's gate":          { price: 41.99, region: 'Europa' },
  'baldurs gate':           { price: 41.99, region: 'Europa' },
  'starfield':              { price: 22.99, region: 'Europa' },
  'hogwarts legacy':        { price: 19.99, region: 'Europa' },
  'grand theft auto':       { price: 9.99,  region: 'Europa' },
  'ea fc':                  { price: 34.99, region: 'Europa' },
  'call of duty':           { price: 44.99, region: 'Europa' },
  'dark souls':             { price: 9.49,  region: 'Europa' },
  'resident evil':          { price: 16.99, region: 'Europa' },
  'dead space':             { price: 22.99, region: 'Europa' },
  'hades':                  { price: 12.99, region: 'Europa' },
  'celeste':                { price: 7.99,  region: 'Europa' },
  'stardew valley':         { price: 8.99,  region: 'Europa' },
  'minecraft':              { price: 16.99, region: 'Europa' },
  'fortnite':               { price: 8.99,  region: 'Europa' },
  'horizon forbidden west': { price: 34.99, region: 'Europa' },
  'god of war':             { price: 44.99, region: 'Europa' },
  'sekiro':                 { price: 22.99, region: 'Europa' },
  'monster hunter':         { price: 13.99, region: 'Europa' },
  'hollow knight':          { price: 7.99,  region: 'Europa' },
  'rust':                   { price: 17.99, region: 'Europa' },
  'valheim':                { price: 11.99, region: 'Europa' },
  'no man':                 { price: 22.99, region: 'Europa' },
  'divinity':               { price: 11.99, region: 'Europa' },
  'persona':                { price: 34.99, region: 'Europa' },
  'death stranding':        { price: 16.99, region: 'Europa' },
  'outer wilds':            { price: 14.99, region: 'Europa' },
  'terraria':               { price: 8.49,  region: 'Europa' },
  'dead cells':             { price: 13.99, region: 'Europa' },
  'spider-man':             { price: 44.99, region: 'Europa' },
  'spiderman':              { price: 44.99, region: 'Europa' },
  'gran turismo':           { price: 34.99, region: 'Europa' },
  'forza horizon':          { price: 34.99, region: 'Europa' },
  'forza motorsport':       { price: 44.99, region: 'Europa' },
  'halo':                   { price: 22.99, region: 'Europa' },
  'gears':                  { price: 17.99, region: 'Europa' },
  'sea of thieves':         { price: 17.99, region: 'Europa' },
  'grounded':               { price: 22.99, region: 'Europa' },
  'psychonauts':            { price: 17.99, region: 'Europa' },
  'avowed':                 { price: 39.99, region: 'Europa' },
  'indiana jones':          { price: 44.99, region: 'Europa' },
  'hellblade':              { price: 34.99, region: 'Europa' },
  'flight simulator':       { price: 44.99, region: 'Europa' },
  'disco elysium':          { price: 9.99,  region: 'Europa' },
  'control':                { price: 7.99,  region: 'Europa' },
  'metro exodus':           { price: 8.99,  region: 'Europa' },
  'outer worlds':           { price: 11.99, region: 'Europa' },
  'ori':                    { price: 8.99,  region: 'Europa' },
  'cuphead':                { price: 11.99, region: 'Europa' },
  'undertale':              { price: 6.99,  region: 'Europa' },
  'deep rock':              { price: 11.99, region: 'Europa' },
  'phasmophobia':           { price: 9.99,  region: 'Europa' },
  'portal 2':               { price: 5.99,  region: 'Europa' },
  'doom':                   { price: 6.99,  region: 'Europa' },
  'dishonored':             { price: 7.49,  region: 'Europa' },
  'deathloop':              { price: 17.99, region: 'Europa' },
  'far cry':                { price: 9.99,  region: 'Europa' },
  "assassin's creed":       { price: 9.99,  region: 'Europa' },
  'watch dogs':             { price: 9.99,  region: 'Europa' },
  'rainbow six':            { price: 6.99,  region: 'Europa' },
  'street fighter':         { price: 27.99, region: 'Europa' },
  'mortal kombat':          { price: 34.99, region: 'Europa' },
  'tekken':                 { price: 34.99, region: 'Europa' },
  'civilization':           { price: 7.49,  region: 'Europa' },
  'mass effect':            { price: 12.99, region: 'Europa' },
  'diablo':                 { price: 34.99, region: 'Europa' },
  'battlefield':            { price: 8.99,  region: 'Europa' },
  'payday':                 { price: 22.99, region: 'Europa' },
  'mafia':                  { price: 14.99, region: 'Europa' },
  'ready or not':           { price: 34.99, region: 'Europa' },
  'devil may cry':          { price: 12.99, region: 'Europa' },
  'ghostwire':              { price: 17.99, region: 'Europa' },
  'metaphor':               { price: 44.99, region: 'Europa' },
  "dragon's dogma":         { price: 34.99, region: 'Europa' },
  'yakuza':                 { price: 8.99,  region: 'Europa' },
  'like a dragon':          { price: 44.99, region: 'Europa' },
  'nier':                   { price: 12.99, region: 'Europa' },
  'stalker':                { price: 34.99, region: 'Europa' },
  'palworld':               { price: 27.99, region: 'Europa' },
  'helldivers':             { price: 34.99, region: 'Europa' },
  'armored core':           { price: 49.99, region: 'Europa' },
  'lies of p':              { price: 31.99, region: 'Europa' },
  'lords of the fallen':    { price: 29.99, region: 'Europa' },
  'wo long':                { price: 22.99, region: 'Europa' },
  'granblue':               { price: 34.99, region: 'Europa' },
  'ghostrunner':            { price: 27.99, region: 'Europa' },
  'sifu':                   { price: 34.99, region: 'Europa' },
  'tunic':                  { price: 22.99, region: 'Europa' },
  'final fantasy vii':      { price: 44.99, region: 'Europa' },
  'final fantasy xvi':      { price: 54.99, region: 'Europa' },
  'final fantasy 16':       { price: 54.99, region: 'Europa' },
  'nioh':                   { price: 22.99, region: 'Europa' },
  'enshrouded':             { price: 27.99, region: 'Europa' },
  'prey':                   { price: 7.99,  region: 'Europa' },
  'plague tale':            { price: 29.99, region: 'Europa' },
  'last of us':             { price: 44.99, region: 'Europa' },
  'ghost of tsushima':      { price: 39.99, region: 'Europa' },
  'dead island':            { price: 27.99, region: 'Europa' },
  'dragon age':             { price: 34.99, region: 'Europa' },
  'warhammer 40000 space marine': { price: 39.99, region: 'Europa' },
  'vampire survivors':      { price: 4.99,  region: 'Europa' },
  'f1 24':                  { price: 27.99, region: 'Europa' },
  'need for speed':         { price: 17.99, region: 'Europa' },
  'ratchet':                { price: 34.99, region: 'Europa' },
  'returnal':               { price: 34.99, region: 'Europa' },
  "demon's souls":          { price: 39.99, region: 'Europa' },
  'demon souls':            { price: 39.99, region: 'Europa' },
  'kena':                   { price: 27.99, region: 'Europa' },
  'stellar blade':          { price: 54.99, region: 'Europa' },
  'rise of the ronin':      { price: 54.99, region: 'Europa' },
  'astro bot':              { price: 44.99, region: 'Europa' },
  'miles morales':          { price: 34.99, region: 'Europa' },
  'horizon zero dawn':      { price: 22.99, region: 'Europa' },
  'bloodborne':             { price: 22.99, region: 'Europa' },
  'scorn':                  { price: 12.99, region: 'Europa' },
  'pentiment':              { price: 12.99, region: 'Europa' },
  'minecraft dungeons':     { price: 17.99, region: 'Europa' },
  'minecraft legends':      { price: 22.99, region: 'Europa' },
  // Juegos faltantes en BD
  'alan wake':              { price: 31.99, region: 'Europa' },
  'rocket league':          { price: 11.99, region: 'Europa' },
  'zelda tears':            { price: 49.99, region: 'Europa' },
  'mario bros wonder':      { price: 46.99, region: 'Europa' },
  'super mario':            { price: 46.99, region: 'Europa' },
  'fifa 24':                { price: 26.99, region: 'Europa' },
  // PS4 exclusivos
  'days gone':              { price: 17.99, region: 'Europa' },
  'detroit become human':   { price: 12.99, region: 'Europa' },
  'shadow of the colossus': { price: 14.99, region: 'Europa' },
  'uncharted 4':            { price: 17.99, region: 'Europa' },
  'infamous second son':    { price: 12.99, region: 'Europa' },
  'until dawn':             { price: 14.99, region: 'Europa' },
  'medievil':               { price: 12.99, region: 'Europa' },
  'metal gear solid':       { price: 12.99, region: 'Europa' },
  'final fantasy xii':      { price: 17.99, region: 'Europa' },
  'final fantasy 12':       { price: 17.99, region: 'Europa' },
  'yakuza 6':               { price: 12.99, region: 'Europa' },
};

// Cabeceras que imitan un navegador Chrome real para el endpoint JSON
const AXIOS_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Referer':         BASE_URL + '/en/',
  'X-Requested-With':'XMLHttpRequest',
};

// Browser compartido durante toda la sesión de scraping de IG
let _browser = null;

async function getBrowser() {
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  return _browser;
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}

export async function scrapeInstantGaming(gameName, platform = 'steam') {
  // ── Capa 1: endpoint JSON interno de IG (sin browser, muy rápido) ──
  try {
    const result = await scrapeViaJson(gameName, platform);
    if (result) return result;
  } catch (err) {
    // Si Cloudflare devuelve 403/503 pasamos a la capa 2
    console.log(`    [IG] JSON endpoint no disponible (${err.response?.status ?? err.code}), probando browser...`);
  }

  // ── Capa 2: playwright-extra + stealth (bypass Cloudflare) ─────────
  let context = null;
  try {
    const browser = await getBrowser();

    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale:    'en-US',
      viewport:  { width: 1366, height: 768 },
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    });

    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,ico,mp4}', r => r.abort());

    const searchUrl = `${BASE_URL}/en/search/?q=${encodeURIComponent(gameName)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Esperar a que aparezca al menos un producto o un mensaje de "sin resultados"
    try {
      await page.waitForSelector('.item, .mainsearch, [class*="game"], .search-result', { timeout: 20000 });
    } catch {
      console.log(`    [IG] Timeout esperando productos para "${gameName}"`);
    }

    const products = await page.evaluate((baseUrl) => {
      const results = [];

      // Instant Gaming usa varias estructuras según la versión:
      //   - .item.mainsearch  (diseño clásico)
      //   - [class*="game"][data-gameid]  (diseño nuevo)
      const CARD_SELECTORS = ['.item.mainsearch', '.item[data-type]', '[class*="GameCard"]', 'article.game'];
      let cards = [];
      for (const sel of CARD_SELECTORS) {
        cards = Array.from(document.querySelectorAll(sel));
        if (cards.length) break;
      }

      for (const card of cards) {
        // Nombre: .name, h2, h3 o el primer texto grande
        const nameEl = card.querySelector('.name, h2.name, h3.name, [class*="title"], [class*="name"]');
        const name   = nameEl?.textContent?.trim() ?? '';

        // Precio: buscar el total o el primer precio con €
        const priceEl = card.querySelector('.price .total, .price, [class*="price"], .total');
        const rawPrice = priceEl?.textContent?.trim() ?? '';

        // URL del producto
        const linkEl = card.querySelector('a[href]') ?? (card.tagName === 'A' ? card : null);
        let href = '';
        if (linkEl) {
          const raw = linkEl.getAttribute('href') ?? '';
          href = raw.startsWith('http') ? raw : baseUrl + raw;
        }

        if (name && rawPrice) results.push({ name, price: rawPrice, url: href });
      }
      return results;
    }, BASE_URL);

    await context.close();
    context = null;

    console.log(`    [IG] ${products.length} productos encontrados para "${gameName}"`);
    const result = findBestMatch(products, gameName, platform);
    if (result) return { ...result, _source: 'real' };

  } catch (err) {
    console.error(`    [IG] Error scrapeando "${gameName}":`, err.message);
    if (!_browser?.isConnected()) {
      await _browser?.close().catch(() => {});
      _browser = null;
    }
  } finally {
    await context?.close().catch(() => {});
  }

  // ── Capa 3: precios de referencia ──────────────────────────────────
  const key = findDemoKey(gameName);
  if (key) {
    console.log(`    [IG] Precio de referencia para "${gameName}": ${DEMO_PRICES[key].price}€`);
    return {
      ...DEMO_PRICES[key],
      stock:   'ok',
      type:    'code',
      url:     `${BASE_URL}/en/search/?q=${encodeURIComponent(gameName)}`,
      _source: 'demo',
    };
  }

  return null;
}

// ─── endpoint JSON interno ───────────────────────────────────────────

async function scrapeViaJson(gameName, platform) {
  // IG expone un endpoint AJAX que devuelve JSON con los resultados de búsqueda.
  // Funciona sin renderizar JS y a veces esquiva el challenge de Cloudflare.
  const resp = await axios.get(`${BASE_URL}/igdb/search/`, {
    params:  { q: gameName, currency: 'EUR' },
    headers: AXIOS_HEADERS,
    timeout: 12000,
  });

  const data = resp.data;

  // Respuesta esperada: { products: [...] } o array directo
  const items = Array.isArray(data) ? data : (data?.products ?? data?.results ?? []);
  if (!items.length) return null;

  const products = items.map(item => ({
    name:  (item.name ?? item.title ?? '').toLowerCase(),
    price: String(item.price ?? item.best_price ?? ''),
    url:   item.url ? (item.url.startsWith('http') ? item.url : BASE_URL + item.url) : '',
  }));

  console.log(`    [IG] ${products.length} productos vía JSON para "${gameName}"`);
  const result = findBestMatch(products, gameName, platform);
  return result ? { ...result, _source: 'real-json' } : null;
}

// ─── helpers ────────────────────────────────────────────────

function findDemoKey(gameName) {
  const lower = gameName.toLowerCase();
  if (DEMO_PRICES[lower]) return lower;
  return Object.keys(DEMO_PRICES).find(k =>
    lower.includes(k) || k.split(' ').every(w => lower.includes(w))
  ) ?? null;
}

function findBestMatch(products, gameName, platform) {
  if (!products?.length) return null;
  const searchWords = gameName.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  let bestMatch = null;
  let bestScore = -1;

  for (const p of products) {
    const rawName = p.name.toLowerCase();
    if (!checkPlatform(rawName + ' ' + (p.url ?? ''), platform)) continue;

    const matched   = searchWords.filter(w => rawName.includes(w)).length;
    const threshold = Math.max(1, Math.ceil(searchWords.length * 0.5));
    if (matched < threshold) continue;

    const price = parsePrice(p.price);
    if (!price) continue;

    if (matched > bestScore) {
      bestScore = matched;
      const region = rawName.includes('global') ? 'Global'
        : (rawName.includes('europe') || rawName.includes(' eu')) ? 'Europa' : 'Europa';
      const stock  = rawName.includes('out of stock') ? 'out'
        : rawName.includes('low stock') ? 'low' : 'ok';
      bestMatch = { price, region, stock, type: 'code', url: p.url };
    }
  }
  return bestMatch;
}

function checkPlatform(text, platform) {
  switch (platform) {
    case 'steam':
      return text.includes('steam') || text.includes('/steam/')
        || (!text.includes('playstation') && !text.includes('xbox')
            && !text.includes('nintendo') && !text.includes('ps4') && !text.includes('ps5'));
    case 'ps5':    return text.includes('ps5') || text.includes('playstation-5') || text.includes('playstation 5');
    case 'ps4':    return text.includes('ps4') || text.includes('playstation-4') || text.includes('playstation 4');
    case 'xbox':   return text.includes('xbox');
    case 'switch': return text.includes('switch') || text.includes('nintendo');
    case 'epic':   return text.includes('epic') || (text.includes('/pc/') && !text.includes('steam'));
    default:       return true;
  }
}

function parsePrice(raw) {
  if (!raw) return null;
  const match = String(raw).match(/[\d]+[.,][\d]+/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(',', '.'));
  return isNaN(num) || num <= 0 ? null : Math.round(num * 100) / 100;
}