// ============================================================
//  scrapers/cdkeys.js — CDKeys.com (Magento 2)
// ============================================================

import playwright from 'rebrowser-playwright';

const { chromium } = playwright;
const BASE_URL = 'https://www.cdkeys.com';   // FIX: era 'loaded.com'

// Precios de referencia para TODOS los juegos del catálogo.
// Se usan SOLO si el scraping real falla (Cloudflare, timeout, etc.)
const DEMO_PRICES = {
  // Juegos principales
  'cyberpunk 2077':         { price: 5.49,  region: 'Global' },
  'witcher 3':              { price: 4.19,  region: 'Global' },
  'elden ring':             { price: 22.49, region: 'Europa' },
  'red dead redemption':    { price: 14.89, region: 'Global' },
  "baldur's gate":          { price: 34.99, region: 'Global' },
  'baldurs gate':           { price: 34.99, region: 'Global' },
  'starfield':              { price: 17.49, region: 'Global' },
  'hogwarts legacy':        { price: 21.99, region: 'Global' },
  'grand theft auto':       { price: 9.99,  region: 'Global' },
  'ea fc':                  { price: 29.99, region: 'Global' },
  'call of duty':           { price: 39.99, region: 'Global' },
  'dark souls':             { price: 7.99,  region: 'Global' },
  'resident evil':          { price: 16.99, region: 'Global' },
  'dead space':             { price: 19.99, region: 'Global' },
  'hades':                  { price: 11.99, region: 'Global' },
  'celeste':                { price: 5.99,  region: 'Global' },
  'stardew valley':         { price: 7.49,  region: 'Global' },
  'minecraft':              { price: 14.99, region: 'Global' },
  'fortnite':               { price: 7.99,  region: 'Global' },
  'horizon forbidden west': { price: 29.99, region: 'Global' },
  'god of war':             { price: 39.99, region: 'Global' },
  'sekiro':                 { price: 19.99, region: 'Global' },
  'monster hunter':         { price: 11.99, region: 'Global' },
  'hollow knight':          { price: 6.99,  region: 'Global' },
  'rust':                   { price: 15.99, region: 'Global' },
  'valheim':                { price: 9.99,  region: 'Global' },
  'no man':                 { price: 19.99, region: 'Global' },
  'divinity':               { price: 9.99,  region: 'Global' },
  'persona':                { price: 29.99, region: 'Global' },
  'death stranding':        { price: 14.99, region: 'Global' },
  'outer wilds':            { price: 13.99, region: 'Global' },
  'terraria':               { price: 7.49,  region: 'Global' },
  'dead cells':             { price: 11.99, region: 'Global' },
  'spider-man':             { price: 39.99, region: 'Global' },
  'spiderman':              { price: 39.99, region: 'Global' },
  'gran turismo':           { price: 29.99, region: 'Global' },
  'forza horizon':          { price: 29.99, region: 'Global' },
  'forza motorsport':       { price: 39.99, region: 'Global' },
  'halo':                   { price: 19.99, region: 'Global' },
  'gears':                  { price: 14.99, region: 'Global' },
  'sea of thieves':         { price: 14.99, region: 'Global' },
  'grounded':               { price: 19.99, region: 'Global' },
  'psychonauts':            { price: 14.99, region: 'Global' },
  'avowed':                 { price: 34.99, region: 'Global' },
  'indiana jones':          { price: 39.99, region: 'Global' },
  'hellblade':              { price: 29.99, region: 'Global' },
  'flight simulator':       { price: 39.99, region: 'Global' },
  'disco elysium':          { price: 7.99,  region: 'Global' },
  'control':                { price: 5.99,  region: 'Global' },
  'metro exodus':           { price: 6.99,  region: 'Global' },
  'outer worlds':           { price: 8.99,  region: 'Global' },
  'ori':                    { price: 6.99,  region: 'Global' },
  'cuphead':                { price: 9.99,  region: 'Global' },
  'undertale':              { price: 4.99,  region: 'Global' },
  'deep rock':              { price: 8.99,  region: 'Global' },
  'phasmophobia':           { price: 8.49,  region: 'Global' },
  'portal 2':               { price: 4.99,  region: 'Global' },
  'doom':                   { price: 4.99,  region: 'Global' },
  'dishonored':             { price: 5.49,  region: 'Global' },
  'deathloop':              { price: 14.99, region: 'Global' },
  'far cry':                { price: 7.99,  region: 'Global' },
  "assassin's creed":       { price: 7.99,  region: 'Global' },
  'watch dogs':             { price: 7.99,  region: 'Global' },
  'rainbow six':            { price: 4.99,  region: 'Global' },
  'street fighter':         { price: 24.99, region: 'Global' },
  'mortal kombat':          { price: 29.99, region: 'Global' },
  'tekken':                 { price: 29.99, region: 'Global' },
  'civilization':           { price: 5.49,  region: 'Global' },
  'mass effect':            { price: 9.99,  region: 'Global' },
  'diablo':                 { price: 29.99, region: 'Global' },
  'battlefield':            { price: 6.99,  region: 'Global' },
  'payday':                 { price: 19.99, region: 'Global' },
  'mafia':                  { price: 12.99, region: 'Global' },
  'ready or not':           { price: 29.99, region: 'Global' },
  'devil may cry':          { price: 9.99,  region: 'Global' },
  'ghostwire':              { price: 14.99, region: 'Global' },
  'metaphor':               { price: 39.99, region: 'Global' },
  "dragon's dogma":         { price: 29.99, region: 'Global' },
  'yakuza':                 { price: 6.99,  region: 'Global' },
  'like a dragon':          { price: 39.99, region: 'Global' },
  'nier':                   { price: 9.99,  region: 'Global' },
  'stalker':                { price: 29.99, region: 'Global' },
  'palworld':               { price: 24.99, region: 'Global' },
  'helldivers':             { price: 29.99, region: 'Global' },
  'armored core':           { price: 44.99, region: 'Global' },
  'lies of p':              { price: 27.99, region: 'Global' },
  'lords of the fallen':    { price: 26.99, region: 'Global' },
  'wo long':                { price: 19.99, region: 'Global' },
  'granblue':               { price: 29.99, region: 'Global' },
  'ghostrunner':            { price: 22.99, region: 'Global' },
  'sifu':                   { price: 29.99, region: 'Global' },
  'tunic':                  { price: 19.99, region: 'Global' },
  'final fantasy vii':      { price: 39.99, region: 'Global' },
  'final fantasy xvi':      { price: 49.99, region: 'Global' },
  'final fantasy 16':       { price: 49.99, region: 'Global' },
  'nioh':                   { price: 19.99, region: 'Global' },
  'enshrouded':             { price: 24.99, region: 'Global' },
  'prey':                   { price: 5.99,  region: 'Global' },
  'plague tale':            { price: 26.99, region: 'Global' },
  'last of us':             { price: 39.99, region: 'Global' },
  'ghost of tsushima':      { price: 34.99, region: 'Global' },
  'dead island':            { price: 22.99, region: 'Global' },
  'dragon age':             { price: 29.99, region: 'Global' },
  'warhammer 40000 space marine': { price: 34.99, region: 'Global' },
  'vampire survivors':      { price: 3.99,  region: 'Global' },
  'f1 24':                  { price: 24.99, region: 'Global' },
  'need for speed':         { price: 14.99, region: 'Global' },
  'ratchet':                { price: 29.99, region: 'Global' },
  'returnal':               { price: 29.99, region: 'Global' },
  "demon's souls":          { price: 34.99, region: 'Global' },
  'demon souls':            { price: 34.99, region: 'Global' },
  'kena':                   { price: 24.99, region: 'Global' },
  'stellar blade':          { price: 49.99, region: 'Global' },
  'rise of the ronin':      { price: 49.99, region: 'Global' },
  'astro bot':              { price: 39.99, region: 'Global' },
  'miles morales':          { price: 29.99, region: 'Global' },
  'horizon zero dawn':      { price: 19.99, region: 'Global' },
  'bloodborne':             { price: 19.99, region: 'Global' },
  'sea of thieves':         { price: 14.99, region: 'Global' },
  'scorn':                  { price: 9.99,  region: 'Global' },
  'pentiment':              { price: 9.99,  region: 'Global' },
  'minecraft dungeons':     { price: 14.99, region: 'Global' },
  'minecraft legends':      { price: 19.99, region: 'Global' },
  // Juegos faltantes en BD
  'alan wake':              { price: 27.99, region: 'Global' },
  'rocket league':          { price: 9.99,  region: 'Global' },
  'zelda tears':            { price: 49.99, region: 'Global' },
  'mario bros wonder':      { price: 44.99, region: 'Global' },
  'super mario':            { price: 44.99, region: 'Global' },
  'fifa 24':                { price: 24.99, region: 'Global' },
  // PS4 exclusivos
  'days gone':              { price: 14.99, region: 'Global' },
  'detroit become human':   { price: 9.99,  region: 'Global' },
  'shadow of the colossus': { price: 12.99, region: 'Global' },
  'uncharted 4':            { price: 14.99, region: 'Global' },
  'infamous second son':    { price: 9.99,  region: 'Global' },
  'until dawn':             { price: 12.99, region: 'Global' },
  'medievil':               { price: 9.99,  region: 'Global' },
  'metal gear solid':       { price: 9.99,  region: 'Global' },
  'final fantasy xii':      { price: 14.99, region: 'Global' },
  'final fantasy 12':       { price: 14.99, region: 'Global' },
  'yakuza 6':               { price: 9.99,  region: 'Global' },
};

// Browser compartido durante toda la sesión de scraping de CDKeys.
// Se crea en el primer uso y se cierra con closeBrowser() al terminar.
let _browser = null;

async function getBrowser() {
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-infobars',
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

export async function scrapeCDKeys(gameName, platform = 'steam') {
  let context = null;
  let page    = null;

  try {
    const browser = await getBrowser();

    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale:   'es-ES',
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' },
    });

    page = await context.newPage();

    // Bloquear recursos que no aportan nada al scraping para ir más rápido
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,ico,mp4,mp3}', r => r.abort());

    const searchUrl = `${BASE_URL}/catalogsearch/result/?q=${encodeURIComponent(gameName)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Aceptar cookies si aparece el banner
    try {
      await page.locator('button:has-text("Accept All"), button:has-text("Accept"), #onetrust-accept-btn-handler').first().click({ timeout: 5000 });
    } catch { /* no había banner */ }

    // Esperar a que carguen los productos (clase Magento estándar)
    try {
      await page.waitForSelector('.product-item', { timeout: 15000 });
    } catch {
      console.log(`    [CDKeys] Sin productos visibles para "${gameName}"`);
    }

    const products = await page.evaluate((baseUrl) => {
      const results = [];
      for (const card of document.querySelectorAll('.product-item')) {
        const name     = card.querySelector('.product-item-link')?.textContent?.trim() ?? '';
        // CDKeys muestra el precio regular en .regular-price o .price
        const priceEl  = card.querySelector('.regular-price .price, .price-box .price, .price');
        const priceText = priceEl?.textContent?.trim() ?? '';
        const linkEl   = card.querySelector('a.product-item-link, a[href]');
        let href = '';
        if (linkEl) {
          const raw = linkEl.getAttribute('href') ?? '';
          href = raw.startsWith('http') ? raw : baseUrl + raw;
        }
        if (name && priceText) results.push({ name, price: priceText, url: href });
      }
      return results;
    }, BASE_URL);

    await context.close();
    context = null;
    page    = null;

    console.log(`    [CDKeys] ${products.length} productos encontrados para "${gameName}"`);
    const result = findBestMatch(products, gameName, platform);
    if (result) return { ...result, _source: 'real' };

  } catch (err) {
    console.error(`    [CDKeys] Error scrapeando "${gameName}":`, err.message);
    // Si el browser se cayó, resetearlo para el siguiente juego
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
    console.log(`    [CDKeys] Precio de referencia para "${gameName}": ${DEMO_PRICES[key].price}€`);
    return {
      ...DEMO_PRICES[key],
      stock: 'ok',
      type:  'code',
      url:   `${BASE_URL}/catalogsearch/result/?q=${encodeURIComponent(gameName)}`,
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

  // Palabras de búsqueda con longitud > 2 (no filtrar por > 3, pierde "ea", "fc", "ps", etc.)
  const searchWords = gameName.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  let bestMatch = null;
  let bestScore = -1;

  for (const p of products) {
    const rawName = p.name.toLowerCase();
    if (!checkPlatform(rawName, platform)) continue;

    const matched = searchWords.filter(w => rawName.includes(w)).length;
    const threshold = Math.max(1, Math.ceil(searchWords.length * 0.5));
    if (matched < threshold) continue;

    const price = parsePrice(p.price);
    if (!price) continue;

    if (matched > bestScore) {
      bestScore = matched;
      bestMatch = { price, region: detectRegion(rawName), stock: 'ok', type: 'code', url: p.url };
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
    case 'ps5':    return text.includes('ps5') || text.includes('playstation 5');
    case 'ps4':    return text.includes('ps4') || text.includes('playstation 4');
    case 'xbox':   return text.includes('xbox');
    case 'switch': return text.includes('switch') || text.includes('nintendo');
    case 'epic':   return text.includes('epic') || (text.includes(' pc') && !text.includes('steam'));
    default:       return true;
  }
}

function detectRegion(text) {
  if (text.includes(' eu') || text.includes('europe') || text.includes('european')) return 'Europa';
  if (text.includes(' us') || text.includes('usa') || text.includes('north america'))  return 'USA';
  return 'Global';
}

function parsePrice(raw) {
  if (!raw) return null;
  const clean = raw.replace(/[€$£\s ,]/g, match => match === ',' ? '.' : '');
  // Eliminar separadores de miles: si hay varios puntos, solo el último es decimal
  const parts = clean.split('.');
  const norm  = parts.length > 2
    ? parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
    : clean;
  const num = parseFloat(norm);
  return isNaN(num) || num <= 0 ? null : Math.round(num * 100) / 100;
}