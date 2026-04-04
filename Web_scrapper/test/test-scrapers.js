// ============================================================
//  Prueba rápida sin necesitar la BD — solo imprime resultados
//  Uso: ejecutar node test/test-scrapers.js
// ============================================================

import { scrapeCDKeys }        from '../scrapers/cdkeys.js';
import { scrapeInstantGaming } from '../scrapers/instantgaming.js';
import { scrapeEneba }         from '../scrapers/eneba.js';

const TEST_GAME = 'The Witcher 3 Wild Hunt';
const PLATFORM  = 'steam';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTests() {
  console.log(`\n Probando scrapers con: "${TEST_GAME}" (${PLATFORM})\n`);

  // ── CDKeys ──
  console.log(' CDKeys...');
  try {
    const r = await scrapeCDKeys(TEST_GAME, PLATFORM);
    console.log('  Resultado:', r || ' Sin resultado');
  } catch (e) {
    console.error('   Error:', e.message);
  }

  await sleep(2000);

  // ── Instant Gaming ──
  console.log('\n📦 Instant Gaming...');
  try {
    const r = await scrapeInstantGaming(TEST_GAME, PLATFORM);
    console.log('  Resultado:', r || ' Sin resultado');
  } catch (e) {
    console.error('   Error:', e.message);
  }

  await sleep(2000);

  // ── Eneba ──
  console.log('\n Eneba (Playwright — puede tardar ~10s)...');
  try {
    const r = await scrapeEneba(TEST_GAME, PLATFORM);
    console.log('  Resultado:', r || ' Sin resultado');
  } catch (e) {
    console.error('   Error:', e.message);
  }

  console.log('\n Tests terminados');
}

runTests().catch(console.error);
