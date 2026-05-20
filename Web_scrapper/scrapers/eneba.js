// ============================================================
//  scrapers/eneba.js — Eneba (marketplace React SPA)
//
//  Problema anterior: usaba la clase CSS ".L5ErLT" que es un
//  hash de CSS Modules y cambia en cada redeploy del frontend.
//
//  Solución: detectar precios por contenido de texto (patrón €)
//  y nombres por aria-label de los botones "Añadir al carrito",
//  que son atributos semánticos estables.
// ============================================================

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

const BASE_URL = 'https://www.eneba.com';

// Precios de referencia para TODOS los juegos del catálogo
const DEMO_PRICES = {
  'cyberpunk 2077':         { price: 6.19,  region: 'Europa' },
  'witcher 3':              { price: 4.49,  region: 'Europa' },
  'elden ring':             { price: 24.99, region: 'Europa' },
  'red dead redemption':    { price: 15.49, region: 'Europa' },
  "baldur's gate":          { price: 36.99, region: 'Europa' },
  'baldurs gate':           { price: 36.99, region: 'Europa' },
  'starfield':              { price: 18.99, region: 'Europa' },
  'hogwarts legacy':        { price: 23.49, region: 'Europa' },
  'grand theft auto':       { price: 10.49, region: 'Europa' },
  'ea fc':                  { price: 32.99, region: 'Europa' },
  'call of duty':           { price: 42.99, region: 'Europa' },
  'dark souls':             { price: 8.49,  region: 'Europa' },
  'resident evil':          { price: 23.49, region: 'Europa' },
  'dead space':             { price: 21.49, region: 'Europa' },
  'hades':                  { price: 11.49, region: 'Europa' },
  'celeste':                { price: 6.99,  region: 'Europa' },
  'stardew valley':         { price: 7.99,  region: 'Europa' },
  'minecraft':              { price: 15.99, region: 'Europa' },
  'fortnite':               { price: 8.49,  region: 'Europa' },
  'horizon forbidden west': { price: 32.99, region: 'Europa' },
  'god of war':             { price: 42.99, region: 'Europa' },
  'sekiro':                 { price: 21.99, region: 'Europa' },
  'monster hunter':         { price: 12.99, region: 'Europa' },
  'hollow knight':          { price: 7.49,  region: 'Europa' },
  'rust':                   { price: 16.99, region: 'Europa' },
  'valheim':                { price: 10.99, region: 'Europa' },
  'no man':                 { price: 21.99, region: 'Europa' },
  'divinity':               { price: 10.99, region: 'Europa' },
  'persona':                { price: 32.99, region: 'Europa' },
  'death stranding':        { price: 15.99, region: 'Europa' },
  'outer wilds':            { price: 13.49, region: 'Europa' },
  'terraria':               { price: 7.99,  region: 'Europa' },
  'dead cells':             { price: 12.49, region: 'Europa' },
  'spider-man':             { price: 42.99, region: 'Europa' },
  'spiderman':              { price: 42.99, region: 'Europa' },
  'gran turismo':           { price: 32.99, region: 'Europa' },
  'forza horizon':          { price: 32.99, region: 'Europa' },
  'forza motorsport':       { price: 42.99, region: 'Europa' },
  'halo':                   { price: 21.99, region: 'Europa' },
  'gears':                  { price: 16.99, region: 'Europa' },
  'sea of thieves':         { price: 16.99, region: 'Europa' },
  'grounded':               { price: 21.99, region: 'Europa' },
  'psychonauts':            { price: 16.99, region: 'Europa' },
  'avowed':                 { price: 38.99, region: 'Europa' },
  'indiana jones':          { price: 42.99, region: 'Europa' },
  'hellblade':              { price: 32.99, region: 'Europa' },
  'flight simulator':       { price: 42.99, region: 'Europa' },
  'disco elysium':          { price: 8.99,  region: 'Europa' },
  'control':                { price: 6.99,  region: 'Europa' },
  'metro exodus':           { price: 7.99,  region: 'Europa' },
  'outer worlds':           { price: 10.99, region: 'Europa' },
  'ori':                    { price: 7.99,  region: 'Europa' },
  'cuphead':                { price: 10.99, region: 'Europa' },
  'undertale':              { price: 5.99,  region: 'Europa' },
  'deep rock':              { price: 10.99, region: 'Europa' },
  'phasmophobia':           { price: 9.49,  region: 'Europa' },
  'portal 2':               { price: 5.49,  region: 'Europa' },
  'doom':                   { price: 5.99,  region: 'Europa' },
  'dishonored':             { price: 6.49,  region: 'Europa' },
  'deathloop':              { price: 16.99, region: 'Europa' },
  'far cry':                { price: 8.99,  region: 'Europa' },
  "assassin's creed":       { price: 8.99,  region: 'Europa' },
  'watch dogs':             { price: 8.99,  region: 'Europa' },
  'rainbow six':            { price: 5.99,  region: 'Europa' },
  'street fighter':         { price: 26.99, region: 'Europa' },
  'mortal kombat':          { price: 32.99, region: 'Europa' },
  'tekken':                 { price: 32.99, region: 'Europa' },
  'civilization':           { price: 6.49,  region: 'Europa' },
  'mass effect':            { price: 11.99, region: 'Europa' },
  'diablo':                 { price: 32.99, region: 'Europa' },
  'battlefield':            { price: 7.99,  region: 'Europa' },
  'payday':                 { price: 21.99, region: 'Europa' },
  'mafia':                  { price: 13.99, region: 'Europa' },
  'ready or not':           { price: 32.99, region: 'Europa' },
  'devil may cry':          { price: 11.99, region: 'Europa' },
  'ghostwire':              { price: 16.99, region: 'Europa' },
  'metaphor':               { price: 42.99, region: 'Europa' },
  "dragon's dogma":         { price: 32.99, region: 'Europa' },
  'yakuza':                 { price: 7.99,  region: 'Europa' },
  'like a dragon':          { price: 42.99, region: 'Europa' },
  'nier':                   { price: 11.99, region: 'Europa' },
  'stalker':                { price: 32.99, region: 'Europa' },
  'palworld':               { price: 26.99, region: 'Europa' },
  'helldivers':             { price: 32.99, region: 'Europa' },
  'armored core':           { price: 47.99, region: 'Europa' },
  'lies of p':              { price: 29.99, region: 'Europa' },
  'lords of the fallen':    { price: 28.99, region: 'Europa' },
  'wo long':                { price: 21.99, region: 'Europa' },
  'granblue':               { price: 32.99, region: 'Europa' },
  'ghostrunner':            { price: 25.99, region: 'Europa' },
  'sifu':                   { price: 32.99, region: 'Europa' },
  'tunic':                  { price: 21.99, region: 'Europa' },
  'final fantasy vii':      { price: 42.99, region: 'Europa' },
  'final fantasy xvi':      { price: 52.99, region: 'Europa' },
  'final fantasy 16':       { price: 52.99, region: 'Europa' },
  'nioh':                   { price: 21.99, region: 'Europa' },
  'enshrouded':             { price: 25.99, region: 'Europa' },
  'prey':                   { price: 6.99,  region: 'Europa' },
  'plague tale':            { price: 28.99, region: 'Europa' },
  'last of us':             { price: 42.99, region: 'Europa' },
  'ghost of tsushima':      { price: 37.99, region: 'Europa' },
  'dead island':            { price: 25.99, region: 'Europa' },
  'dragon age':             { price: 32.99, region: 'Europa' },
  'warhammer 40000 space marine': { price: 37.99, region: 'Europa' },
  'vampire survivors':      { price: 4.49,  region: 'Europa' },
  'f1 24':                  { price: 25.99, region: 'Europa' },
  'need for speed':         { price: 16.99, region: 'Europa' },
  'ratchet':                { price: 32.99, region: 'Europa' },
  'returnal':               { price: 32.99, region: 'Europa' },
  "demon's souls":          { price: 37.99, region: 'Europa' },
  'demon souls':            { price: 37.99, region: 'Europa' },
  'kena':                   { price: 25.99, region: 'Europa' },
  'stellar blade':          { price: 52.99, region: 'Europa' },
  'rise of the ronin':      { price: 52.99, region: 'Europa' },
  'astro bot':              { price: 42.99, region: 'Europa' },
  'miles morales':          { price: 32.99, region: 'Europa' },
  'horizon zero dawn':      { price: 21.99, region: 'Europa' },
  'bloodborne':             { price: 21.99, region: 'Europa' },
  'scorn':                  { price: 10.99, region: 'Europa' },
  'pentiment':              { price: 10.99, region: 'Europa' },
  'minecraft dungeons':     { price: 16.99, region: 'Europa' },
  'minecraft legends':      { price: 21.99, region: 'Europa' },
  // Juegos faltantes en BD
  'alan wake':              { price: 29.99, region: 'Europa' },
  'rocket league':          { price: 10.49, region: 'Europa' },
  'zelda tears':            { price: 49.99, region: 'Europa' },
  'mario bros wonder':      { price: 45.99, region: 'Europa' },
  'super mario':            { price: 45.99, region: 'Europa' },
  'fifa 24':                { price: 25.99, region: 'Europa' },
  // PS4 exclusivos
  'days gone':              { price: 16.99, region: 'Europa' },
  'detroit become human':   { price: 11.99, region: 'Europa' },
  'shadow of the colossus': { price: 13.99, region: 'Europa' },
  'uncharted 4':            { price: 16.99, region: 'Europa' },
  'infamous second son':    { price: 11.99, region: 'Europa' },
  'until dawn':             { price: 13.99, region: 'Europa' },
  'medievil':               { price: 11.99, region: 'Europa' },
  'metal gear solid':       { price: 11.99, region: 'Europa' },
  'final fantasy xii':      { price: 16.99, region: 'Europa' },
  'final fantasy 12':       { price: 16.99, region: 'Europa' },
  'yakuza 6':               { price: 11.99, region: 'Europa' },
};

// Browser compartido durante toda la sesión de scraping de Eneba
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

export async function scrapeEneba(gameName, platform = 'steam') {
  let context = null;

  try {
    const browser = await getBrowser();

    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale:    'es-ES',
      viewport:  { width: 1280, height: 800 },
      extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' },
    });

    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,ico,mp4}', r => r.abort());

    const searchUrl = `${BASE_URL}/es/store/all?text=${encodeURIComponent(gameName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 45000 });

    // Aceptar cookies si aparece el banner
    try {
      await page.locator('button:has-text("Aceptar"), button:has-text("Accept all"), [id*="accept"]').first().click({ timeout: 5000 });
      await page.waitForTimeout(800);
    } catch { /* sin banner */ }

    // Esperar a que cargue el contenido React
    try {
      await page.waitForSelector(
        'button[aria-label], [data-testid*="product"], [data-testid*="auction"], article',
        { timeout: 20000 }
      );
    } catch {
      console.log(`    [Eneba] Timeout esperando productos para "${gameName}"`);
    }

    const products = await page.evaluate((baseUrl) => {
      const results = [];

      // ── Estrategia A: botones "Añadir al carrito" (atributo semántico estable) ──
      const cartButtons = Array.from(
        document.querySelectorAll('button[aria-label]')
      ).filter(btn => {
        const label = btn.getAttribute('aria-label') ?? '';
        return label.toLowerCase().includes('añadir') || label.toLowerCase().includes('add to cart');
      });

      for (const btn of cartButtons) {
        const label = btn.getAttribute('aria-label') ?? '';
        const name  = label.replace(/^(añadir al carrito|add to cart)\s*[-–:]\s*/i, '').trim();
        if (!name) continue;

        // Subir por el DOM para encontrar el contenedor de la tarjeta
        let container = btn.parentElement;
        let priceText = '';
        let href      = '';

        for (let depth = 0; depth < 12 && container; depth++) {
          // Buscar precio por patrón de texto "XX,XX €" o "€ XX,XX"
          if (!priceText) {
            priceText = findPriceInElement(container);
          }
          // Buscar URL del producto
          if (!href) {
            const linkEl = container.querySelector('a[href*="/es/"], a[href*="/en/"]')
              ?? (container.tagName === 'A' && (container.getAttribute('href')?.includes('/es/') || container.getAttribute('href')?.includes('/en/')) ? container : null);
            if (linkEl) {
              const raw = linkEl.getAttribute('href') ?? '';
              href = raw.startsWith('http') ? raw : baseUrl + raw;
            }
          }
          if (priceText && href) break;
          container = container.parentElement;
        }

        if (name && priceText) {
          results.push({ name, price: priceText, url: href });
        }
      }

      // ── Estrategia B: data-testid (si Eneba los expone) ──
      if (!results.length) {
        const cards = document.querySelectorAll('[data-testid*="product"], [data-testid*="auction"], article');
        for (const card of cards) {
          const nameEl  = card.querySelector('[data-testid*="name"], h3, h2, [class*="title"]');
          const name    = nameEl?.textContent?.trim() ?? '';
          const priceText = findPriceInElement(card);
          const linkEl  = card.querySelector('a[href]');
          let href = '';
          if (linkEl) {
            const raw = linkEl.getAttribute('href') ?? '';
            href = raw.startsWith('http') ? raw : baseUrl + raw;
          }
          if (name && priceText) results.push({ name, price: priceText, url: href });
        }
      }

      return results;

      // Busca el primer texto con patrón de precio (€) dentro del elemento dado
      function findPriceInElement(el) {
        if (!el) return '';
        // Iterar nodos de texto buscando patrón de precio
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent?.trim() ?? '';
          if (/\d+[.,]\d+\s*€/.test(text) || /€\s*\d+[.,]\d+/.test(text)) {
            return text;
          }
        }
        return '';
      }
    }, BASE_URL);

    await context.close();
    context = null;

    // Eliminar duplicados por URL
    const unique = [...new Map(products.map(p => [p.url || p.name, p])).values()];
    console.log(`    [Eneba] ${unique.length} productos encontrados para "${gameName}"`);

    const result = findBestMatch(unique, gameName, platform);
    if (result) return { ...result, _source: 'real' };

  } catch (err) {
    console.error(`    [Eneba] Error scrapeando "${gameName}":`, err.message);
    if (!_browser?.isConnected()) {
      await _browser?.close().catch(() => {});
      _browser = null;
    }
  } finally {
    await context?.close().catch(() => {});
  }

  // Fallback a precios de referencia
  const key = findDemoKey(gameName);
  if (key) {
    console.log(`    [Eneba] Precio de referencia para "${gameName}": ${DEMO_PRICES[key].price}€`);
    return {
      ...DEMO_PRICES[key],
      stock:   'ok',
      type:    'code',
      url:     `${BASE_URL}/es/store/all?text=${encodeURIComponent(gameName)}`,
      _source: 'demo',
    };
  }

  return null;
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
      const nameL  = rawName;
      const stock  = nameL.includes('out of stock') ? 'out' : nameL.includes('low stock') ? 'low' : 'ok';
      const region = nameL.includes('global') ? 'Global'
        : (nameL.includes('europe') || nameL.includes(' eu')) ? 'Europa' : 'Global';
      bestMatch = { price, region, stock, type: 'code', url: p.url };
    }
  }
  return bestMatch;
}

function checkPlatform(text, platform) {
  switch (platform) {
    case 'steam':
      return text.includes('steam') || text.includes(' pc')
        || (!text.includes('playstation') && !text.includes('xbox')
            && !text.includes('nintendo') && !text.includes('ps4') && !text.includes('ps5'));
    case 'ps5':    return text.includes('ps5') || text.includes('playstation-5') || text.includes('playstation 5');
    case 'ps4':    return text.includes('ps4') || text.includes('playstation-4') || text.includes('playstation 4');
    case 'xbox':   return text.includes('xbox');
    case 'switch': return text.includes('switch') || text.includes('nintendo');
    case 'epic':   return text.includes('epic') || (text.includes(' pc') && !text.includes('steam'));
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