// ============================================================
//  scrapers/eneba.js — v5 import correcto
// ============================================================

import playwright from 'playwright';

const { chromium } = playwright;
const BASE_URL = 'https://www.eneba.com';

const DEMO_PRICES = {
  'cyberpunk 2077':        { price: 6.19,  region: 'Europa' },
  'the witcher 3':         { price: 4.49,  region: 'Europa' },
  'elden ring':            { price: 24.99, region: 'Europa' },
  'red dead redemption 2': { price: 15.49, region: 'Europa' },
  "baldur's gate 3":       { price: 36.99, region: 'Europa' },
  'starfield':             { price: 18.99, region: 'Europa' },
  'hogwarts legacy':       { price: 23.49, region: 'Europa' },
  'grand theft auto v':    { price: 10.49, region: 'Europa' },
  'resident evil 4':       { price: 23.49, region: 'Europa' },
  'dark souls iii':        { price: 8.49,  region: 'Europa' },
};

export async function scrapeEneba(gameName, platform = 'steam') {
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

    const url = `${BASE_URL}/es/store/all?text=${encodeURIComponent(gameName)}`;
    console.log(`    [Eneba] Cargando página...`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(4000);

    const products = await page.evaluate(() => {
      const results = [];
      const selectors = [
        '[data-qa="product-card"]',
        '[class*="ProductCard"]:not([class*="Inner"])',
        '[class*="product-card"]',
        'article',
        'li[class*="product"]',
      ];

      let cards = [];
      for (const sel of selectors) {
        const found = document.querySelectorAll(sel);
        if (found.length >= 2) { cards = Array.from(found); break; }
      }

      if (!cards.length) {
        cards = Array.from(document.querySelectorAll('article, li, div[class*="card"]'))
          .filter(el => (el.textContent || '').includes('€'));
      }

      for (const card of cards) {
        let name = '';
        for (const sel of ['[data-qa="product-name"]','[class*="name"]','[class*="title"]','h3','h2','h4']) {
          const el = card.querySelector(sel);
          if (el?.textContent?.trim().length > 3) { name = el.textContent.trim(); break; }
        }

        let priceText = '';
        for (const sel of ['[data-qa="product-price"]','[class*="price"]','[class*="Price"]','[class*="amount"]']) {
          for (const el of card.querySelectorAll(sel)) {
            const t = el.textContent?.trim() || '';
            if (/[\d,.]+/.test(t) && t.includes('€')) { priceText = t; break; }
          }
          if (priceText) break;
        }

        if (name && priceText) {
          results.push({ name, price: priceText, fullText: (card.textContent || '').slice(0, 300) });
        }
      }
      return results;
    });

    await browser.close();
    browser = null;

    console.log(`    [Eneba] ${products.length} productos encontrados`);
    const result = findBestMatch(products, gameName, platform);
    if (result) return { ...result, _source: 'real' };

  } catch (err) {
    console.error('    [Eneba] Error:', err.message);
    if (browser) await browser.close().catch(() => {});
    browser = null;
  }

  // Fallback demo
  const key = Object.keys(DEMO_PRICES).find(k =>
    gameName.toLowerCase().split(' ').filter(w => w.length > 3).some(w => k.includes(w))
  );
  if (key) {
    console.log(`    [Eneba]   Sin resultado real — usando precio de referencia`);
    return { ...DEMO_PRICES[key], stock: 'ok', type: 'code', _source: 'demo' };
  }

  return null;
}

function findBestMatch(products, gameName, platform) {
  if (!products?.length) return null;
  const nameWords = gameName.toLowerCase().split(' ').filter(w => w.length > 3);
  for (const p of products) {
    const rawName = p.name.toLowerCase();
    const full    = p.fullText.toLowerCase();
    if (nameWords.filter(w => rawName.includes(w)).length < Math.ceil(nameWords.length * 0.6)) continue;
    if (!checkPlatform(rawName + ' ' + full, platform)) continue;
    const price = parsePrice(p.price);
    if (!price) continue;
    const stock  = full.includes('out of stock') ? 'out' : full.includes('low stock') ? 'low' : 'ok';
    const region = full.includes('europe') || full.includes(' eu ') ? 'Europa' : 'Global';
    return { price, region, stock, type: 'code' };
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

function parsePrice(raw) {
  if (!raw) return null;
  const clean = raw.replace(/[€$£\s]/g, '').replace(',', '.');
  const parts = clean.split('.');
  const norm  = parts.length > 2 ? parts.slice(0,-1).join('') + '.' + parts[parts.length-1] : clean;
  const num   = parseFloat(norm);
  return isNaN(num) || num <= 0 ? null : Math.round(num * 100) / 100;
}