// ============================================================
//  scrapers/cdkeys.js — v4 sin Playwright, solo demo fallback
// ============================================================

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL   = 'https://www.cdkeys.com';
const SEARCH_URL = `${BASE_URL}/catalogsearch/result/?q=`;

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9',
  'Referer':         'https://www.google.com/',
  'Sec-Fetch-Dest':  'document',
  'Sec-Fetch-Mode':  'navigate',
  'Sec-Fetch-Site':  'none',
  'Cache-Control':   'max-age=0',
};

const DEMO_PRICES = {
  'cyberpunk 2077':             { price: 5.49,  region: 'Global' },
  'the witcher 3':              { price: 4.19,  region: 'Global' },
  'elden ring':                 { price: 22.49, region: 'Europa' },
  'red dead redemption 2':      { price: 14.89, region: 'Global' },
  "baldur's gate 3":            { price: 34.99, region: 'Global' },
  'starfield':                  { price: 17.49, region: 'Global' },
  'hogwarts legacy':            { price: 21.99, region: 'Global' },
  'grand theft auto v':         { price: 9.99,  region: 'Global' },
  'resident evil 4':            { price: 21.99, region: 'Global' },
  'dark souls iii':             { price: 7.99,  region: 'Global' },
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function scrapeCDKeys(gameName, platform = 'steam') {
  try {
    const session = axios.create({ headers: HEADERS, timeout: 15000 });
    await session.get(BASE_URL).catch(() => {});
    await sleep(600 + Math.random() * 400);

    const { data: html } = await session.get(`${SEARCH_URL}${encodeURIComponent(gameName)}`);
    const $ = cheerio.load(html);
    let result = null;

    $('li.item.product.product-item, .product-item-info').each((_, el) => {
      if (result) return;
      const rawName  = $(el).find('.product-item-name, a').first().text().trim().toLowerCase();
      const rawPrice = $(el).find('[data-price-amount]').attr('data-price-amount')
        || $(el).find('.price').first().text();
      if (!rawName || !rawPrice) return;
      const words = gameName.toLowerCase().split(' ').filter(w => w.length > 3);
      if (words.filter(w => rawName.includes(w)).length < Math.ceil(words.length * 0.6)) return;
      const price = parsePrice(String(rawPrice));
      if (!price) return;
      result = { price, region: detectRegion(rawName), stock: 'ok', type: 'code', _source: 'real' };
    });

    if (result) return result;

  } catch (err) {
    if (err.response?.status !== 403) throw err;
  }

  // Fallback demo
  const key = Object.keys(DEMO_PRICES).find(k =>
    gameName.toLowerCase().split(' ').filter(w => w.length > 3).some(w => k.includes(w))
  );
  if (key) {
    console.log(`    [CDKeys] ⚠️  Cloudflare activo — usando precio de referencia (${DEMO_PRICES[key].price}€)`);
    return { ...DEMO_PRICES[key], stock: 'ok', type: 'code', _source: 'demo' };
  }

  return null;
}

function detectRegion(text) {
  if (text.includes(' eu') || text.includes('europe')) return 'Europa';
  if (text.includes(' us') || text.includes('usa'))    return 'USA';
  return 'Global';
}

function parsePrice(raw) {
  if (!raw) return null;
  const clean = raw.replace(/[€$£\s]/g, '').replace(',', '.');
  const parts = clean.split('.');
  const norm  = parts.length > 2 ? parts.slice(0,-1).join('') + '.' + parts[parts.length-1] : clean;
  const num   = parseFloat(norm);
  return isNaN(num) || num <= 0 ? null : Math.round(num * 100) / 100;
}