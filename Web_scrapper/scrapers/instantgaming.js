// ============================================================
//  scrapers/instantgaming.js
//  Nota: Instant Gaming bloquea scraping automatizado con Cloudflare.
//  Se usa fallback de precios de referencia mientras no haya solución.
// ============================================================

const BASE_URL = 'https://www.instant-gaming.com';

const DEMO_PRICES = {
  'cyberpunk 2077':        { price: 8.99,  region: 'Europa' },
  'the witcher 3':         { price: 5.99,  region: 'Europa' },
  'elden ring':            { price: 26.99, region: 'Europa' },
  'red dead redemption 2': { price: 16.99, region: 'Europa' },
  "baldur's gate 3":       { price: 41.99, region: 'Europa' },
  'starfield':             { price: 22.99, region: 'Europa' },
  'hogwarts legacy':       { price: 19.99, region: 'Europa' },
  'grand theft auto v':    { price: 9.99,  region: 'Europa' },
  'resident evil 4':       { price: 16.99, region: 'Europa' },
  'dark souls iii':        { price: 9.49,  region: 'Europa' },
};

export async function scrapeInstantGaming(gameName, platform = 'steam') {
  const key = Object.keys(DEMO_PRICES).find(k =>
    gameName.toLowerCase().split(' ').filter(w => w.length > 3).some(w => k.includes(w))
  );

  if (key) {
    return {
      ...DEMO_PRICES[key],
      stock: 'ok',
      type: 'code',
      url: `${BASE_URL}/es/recherche/?q=${encodeURIComponent(gameName)}`,
      _source: 'demo',
    };
  }

  return null;
}