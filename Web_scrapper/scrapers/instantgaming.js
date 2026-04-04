// ============================================================
//  scrapers/instantgaming.js — v3
//  Mismo enfoque: intentar real, fallback a demo si 403
// ============================================================

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.instant-gaming.com';

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9',
  'Referer':         'https://www.google.com/',
  'Sec-Fetch-Dest':  'document',
  'Sec-Fetch-Mode':  'navigate',
  'Sec-Fetch-Site':  'none',
};

const DEMO_PRICES = {
  'cyberpunk 2077':             { price: 8.99,  region: 'Europa' },
  'the witcher 3':              { price: 5.99,  region: 'Europa' },
  'elden ring':                 { price: 26.99, region: 'Europa' },
  'red dead redemption 2':      { price: 16.99, region: 'Europa' },
  "baldur's gate 3":            { price: 41.99, region: 'Europa' },
  'starfield':                  { price: 22.99, region: 'Europa' },
  'hogwarts legacy':            { price: 19.99, region: 'Europa' },
  'grand theft auto v':         { price: 9.99,  region: 'Europa' },
  'resident evil 4':            { price: 16.99, region: 'Europa' },
  'dark souls iii':             { price: 9.49,  region: 'Europa' },
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function scrapeInstantGaming(gameName, platform = 'steam') {
  const searchUrls = [
    `${BASE_URL}/es/recherche/?q=${encodeURIComponent(gameName)}`,
    `${BASE_URL}/es/?igr_search=${encodeURIComponent(gameName)}`,
  ];

  for (const url of searchUrls) {
    try {
      await sleep(400 + Math.random() * 400);
      const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      const $ = cheerio.load(html);
      const result = extractResult($, gameName, platform);
      if (result) return { ...result, _source: 'real' };
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) continue;
      throw err;
    }
  }

  // Fallback demo
  const key = Object.keys(DEMO_PRICES).find(k =>
    gameName.toLowerCase().split(' ').filter(w => w.length > 3).some(w => k.includes(w))
  );

  if (key) {
    const demo = DEMO_PRICES[key];
    console.log(`    [IG]   Bloqueado — usando precio de referencia (${demo.price}€)`);
    return { ...demo, stock: 'ok', type: 'code', _source: 'demo' };
  }

  return null;
}

function extractResult($, gameName, platform) {
  let result = null;
  const selectors = ['.item.maingame', '.item', '[class*="game-card"]', 'article'];

  for (const sel of selectors) {
    if (result) break;
    $(sel).each((_, el) => {
      if (result) return;
      const rawName  = $(el).find('.title, .name, h2, h3').first().text().trim().toLowerCase();
      const rawPrice = $(el).find('[class*="price"]:not([class*="old"]), .amount').first().text().trim();
      if (!rawName || !rawPrice) return;
      const words = gameName.toLowerCase().split(' ').filter(w => w.length > 3);
      if (words.filter(w => rawName.includes(w)).length < Math.ceil(words.length * 0.6)) return;
      const price = parsePrice(rawPrice);
      if (!price) return;
      result = { price, region: 'Europa', stock: 'ok', type: 'code' };
    });
  }
  return result;
}

function parsePrice(raw) {
  if (!raw) return null;
  const clean = raw.replace(/[€$£\s]/g, '').replace(',', '.');
  const parts = clean.split('.');
  const norm  = parts.length > 2 ? parts.slice(0,-1).join('') + '.' + parts[parts.length-1] : clean;
  const num   = parseFloat(norm);
  return isNaN(num) || num <= 0 ? null : Math.round(num * 100) / 100;
}