//  CODEKEYS SCRAPER — Node.js
//  Tiendas: CDKeys, Instant Gaming, Eneba

import 'dotenv/config';

import { updateOfferInDB, closePool } from './db.js';
import { scrapeCDKeys }        from './scrapers/cdkeys.js';
import { scrapeInstantGaming } from './scrapers/instantgaming.js';
import { scrapeEneba }         from './scrapers/eneba.js';

// Juegos a scrapear (slug local => búsqueda en cada tienda) 
const GAMES = [
  { slug: 'cyberpunk',  search: 'Cyberpunk 2077',             platform: 'steam' },
  { slug: 'witcher3',   search: 'The Witcher 3 Wild Hunt',     platform: 'steam' },
  { slug: 'eldenring',  search: 'Elden Ring',                  platform: 'steam' },
  { slug: 'rdr2',       search: 'Red Dead Redemption 2',       platform: 'steam' },
  { slug: 'baldurs',    search: "Baldur's Gate 3",             platform: 'steam' },
  { slug: 'starfield',  search: 'Starfield',                   platform: 'steam' },
  { slug: 'hogwarts',   search: 'Hogwarts Legacy',             platform: 'steam' },
  { slug: 'gtav',       search: 'Grand Theft Auto V',          platform: 'steam' },
  { slug: 'eafc25',     search: 'EA FC 25',                    platform: 'steam' },
  { slug: 'cod',        search: 'Call of Duty Modern Warfare 3',platform: 'steam' },
  { slug: 'darksouls3', search: 'Dark Souls III',              platform: 'steam' },
  { slug: 're4',        search: 'Resident Evil 4 Remake',      platform: 'steam' },
  { slug: 'deadspace',  search: 'Dead Space Remake',           platform: 'steam' },
  { slug: 'hades2',     search: 'Hades II',                    platform: 'steam' },
  { slug: 'celeste',    search: 'Celeste',                     platform: 'steam' },
  { slug: 'stardew',    search: 'Stardew Valley',              platform: 'steam' },
  { slug: 'minecraft',  search: 'Minecraft',                   platform: 'xbox'  },
  { slug: 'fortnite',   search: 'Fortnite V-Bucks',            platform: 'ps5'   },
  { slug: 'horizon',    search: 'Horizon Forbidden West',      platform: 'ps5'   },
  { slug: 'godofwar',   search: 'God of War Ragnarok',         platform: 'ps5'   },
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
  // Para procesar un solo ciclo de scraping, descomentar estas líneas y comentar el setTimeout al final
  //console.log('\n Scraping completado');
  //process.exit(0);


// Para scrapear continuamente cada 5 minutos, dejar el pool abierto y re-lanzar run() con setTimeout
console.log('\n  Esperando 5 minutos para el siguiente ciclo...');
await closePool();
setTimeout(run, 5 * 60 * 1000);

}

run().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
