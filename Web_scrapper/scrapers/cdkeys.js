// ============================================================
//  scrapers/cdkeys.js
// ============================================================

import playwright from 'rebrowser-playwright';

const { chromium } = playwright;
const BASE_URL = 'https://www.loaded.com';

const DEMO_PRICES = {
  'cyberpunk 2077':        { price: 5.49,  region: 'Global' },
  'the witcher 3':         { price: 4.19,  region: 'Global' },
  'elden ring':            { price: 22.49, region: 'Europa' },
  'red dead redemption 2': { price: 14.89, region: 'Global' },
  "baldur's gate 3":       { price: 34.99, region: 'Global' },
  'starfield':             { price: 17.49, region: 'Global' },
  'hogwarts legacy':       { price: 21.99, region: 'Global' },
  'grand theft auto v':    { price: 9.99,  region: 'Global' },
  'resident evil 4':       { price: 21.99, region: 'Global' },
  'dark souls iii':        { price: 7.99,  region: 'Global' },
};

export async function scrapeCDKeys(gameName, platform = 'steam') {
  let browser = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await (await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'es-ES',
      viewport: { width: 1280, height: 800 },
    })).newPage();

    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf}', r => r.abort());

    const searchUrl = `${BASE_URL}/catalogsearch/result/?q=${encodeURIComponent(gameName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 45000 });

    // Aceptar cookies si aparece
    try {
      await page.waitForSelector('[data-tid="accept-btn"], button:has-text("Aceptar")', { timeout: 5000 });
      await page.click('[data-tid="accept-btn"], button:has-text("Aceptar")');
    } catch { /* no había banner */ }

    try {
      await page.waitForSelector('.product-item', { timeout: 10000 });
    } catch { /* timeout, intentamos igualmente */ }

    const products = await page.evaluate((baseUrl) => {
      const results = [];
      const cards = document.querySelectorAll('.product-item');
      for (const card of cards) {
        const name = card.querySelector('.product-item-link')?.textContent?.trim() || '';
        const priceText = card.querySelector('.price')?.textContent?.trim() || '';

        let href = '';
        const linkEl = card.querySelector('a.product-item-link, a[href]');
        if (linkEl) {
          const raw = linkEl.getAttribute('href');
          href = raw.startsWith('http') ? raw : baseUrl + raw;
        }

        if (name && priceText) {
          results.push({ name: name.toLowerCase(), price: priceText, fullText: name.toLowerCase(), url: href });
        }
      }
      return results;
    }, BASE_URL);

    await browser.close();
    browser = null;

    console.log(`    [CDKeys] ${products.length} productos encontrados`);
    const result = findBestMatch(products, gameName, platform);
    if (result) return { ...result, _source: 'real' };

  } catch (err) {
    console.error('    [CDKeys] Error:', err.message);
    if (browser) await browser.close().catch(() => {});
    browser = null;
  }

  // Fallback demo
  const key = Object.keys(DEMO_PRICES).find(k =>
    gameName.toLowerCase().split(' ').filter(w => w.length > 3).some(w => k.includes(w))
  );
  if (key) {
    console.log(`    [CDKeys] ⚠️  Sin resultado real — usando precio de referencia (${DEMO_PRICES[key].price}€)`);
    return {
      ...DEMO_PRICES[key],
      stock: 'ok',
      type: 'code',
      url: `${BASE_URL}/catalogsearch/result/?q=${encodeURIComponent(gameName)}`,
      _source: 'demo',
    };
  }

  return null;
}

function findBestMatch(products, gameName, platform) {
  if (!products?.length) return null;
  const nameWords = gameName.toLowerCase().split(' ').filter(w => w.length > 3);
  for (const p of products) {
    const rawName = p.name.toLowerCase();
    if (nameWords.filter(w => rawName.includes(w)).length < Math.ceil(nameWords.length * 0.6)) continue;
    if (!checkPlatform(rawName, platform)) continue;
    const price = parsePrice(p.price);
    if (!price) continue;
    const region = detectRegion(rawName);
    return { price, region, stock: 'ok', type: 'code', url: p.url };
  }
  return null;
}

function checkPlatform(text, platform) {
  switch (platform) {
    case 'steam':  return text.includes('steam') || text.includes('pc') || (!text.includes('playstation') && !text.includes('xbox') && !text.includes('nintendo'));
    case 'ps5':    return text.includes('ps5') || text.includes('playstation 5');
    case 'ps4':    return text.includes('ps4') || text.includes('playstation 4');
    case 'xbox':   return text.includes('xbox');
    case 'switch': return text.includes('switch') || text.includes('nintendo');
    default:       return true;
  }
}

function detectRegion(text) {
  if (text.includes(' eu') || text.includes('europe')) return 'Europa';
  if (text.includes(' us') || text.includes('usa'))    return 'USA';
  return 'Global';
}

function parsePrice(raw) {
  if (!raw) return null;
  const clean = raw.replace(/[€$£\s\u00a0]/g, '').replace(',', '.');
  const parts = clean.split('.');
  const norm  = parts.length > 2 ? parts.slice(0,-1).join('') + '.' + parts[parts.length-1] : clean;
  const num   = parseFloat(norm);
  return isNaN(num) || num <= 0 ? null : Math.round(num * 100) / 100;
}