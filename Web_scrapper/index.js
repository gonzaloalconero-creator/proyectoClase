//  CODEKEYS SCRAPER — Node.js
//  Tiendas: CDKeys, Instant Gaming, Eneba

import 'dotenv/config';

import { scrapeCDKeys }        from './scrapers/cdkeys.js';
import { scrapeInstantGaming } from './scrapers/instantgaming.js';
import { scrapeEneba }         from './scrapers/eneba.js';
import { updateOfferInDB }     from './db.js';

// ── Juegos a scrapear (slug local => búsqueda en cada tienda) ──
const GAMES = [
  { slug: 'cyberpunk',  search: 'Cyberpunk 2077',             platform: 'steam' },
  { slug: 'witcher3',   search: 'The Witcher 3 Wild Hunt',    platform: 'steam' },
  { slug: 'eldenring',  search: 'Elden Ring',                 platform: 'steam' },
  { slug: 'rdr2',       search: 'Red Dead Redemption 2',      platform: 'steam' },
  { slug: 'baldurs',    search: "Baldur's Gate 3",            platform: 'steam' },
  { slug: 'starfield',  search: 'Starfield',                  platform: 'steam' },
  { slug: 'hogwarts',   search: 'Hogwarts Legacy',            platform: 'steam' },
  { slug: 'gtav',       search: 'Grand Theft Auto V',         platform: 'steam' },
  { slug: 're4',        search: 'Resident Evil 4',            platform: 'steam' },
  { slug: 'darksouls3', search: 'Dark Souls III',             platform: 'steam' },
];

// ── Scrapers disponibles 
const SCRAPERS = [
  { id: 'cdkeys',        fn: scrapeCDKeys,        name: 'CDKeys'        },
  { id: 'instantgaming', fn: scrapeInstantGaming, name: 'Instant Gaming'},
  { id: 'eneba',         fn: scrapeEneba,         name: 'Eneba'         },
];

// ── Espera entre peticiones para no ser bloqueado 
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log(' CodeKeys scraper iniciado\n');

  for (const scraper of SCRAPERS) {
    console.log(`\n═══ ${scraper.name} ═══`);

    for (const game of GAMES) {
      try {
        console.log(`   Buscando: ${game.search}...`);
        const result = await scraper.fn(game.search, game.platform);

        if (!result) {
          console.log(`    Sin resultado para ${game.search}`);
          continue;
        }

        console.log(`   ${game.slug} → ${result.price}€ (${result.region})`);

        // Guardar en BD
        await updateOfferInDB({
          slug:       game.slug,
          storeCode:  scraper.id,
          platform:   game.platform,
          price:      result.price,
          region:     result.region || 'Global',
          stock:      result.stock  || 'ok',
          tipo:       result.type   || 'code',
        });

      } catch (err) {
        console.error(`   Error en ${scraper.name} / ${game.slug}:`, err.message);
      }

      // Pausa de 1-3s entre juegos para no activar rate limiting
      await sleep(1000 + Math.random() * 2000);
    }

    // Pausa extra entre tiendas
    await sleep(3000);
  }

  console.log('\n Scraping completado');
  process.exit(0);
}

run().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
