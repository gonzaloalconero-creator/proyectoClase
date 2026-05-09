// scrapers/testCDKeys.js
import { scrapeCDKeys } from './cdkeys.js';
import { scrapeInstantGaming } from './instantgaming.js';

console.log('🟡 Probando CDKeys...');
const r1 = await scrapeCDKeys('The Witcher 3 Wild Hunt', 'steam');
console.log('CDKeys:', r1);

console.log('🟡 Probando Instant Gaming...');
const r2 = await scrapeInstantGaming('The Witcher 3 Wild Hunt', 'steam');
console.log('Instant Gaming:', r2);