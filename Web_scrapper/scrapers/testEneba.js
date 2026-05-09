import { scrapeEneba } from './eneba.js';

console.log('🟡 Iniciando test...');

try {
  const r = await scrapeEneba('Elden Ring', 'steam');
  console.log('✅ Resultado:', r);
} catch (err) {
  console.error('❌ Error:', err);
}

console.log('🏁 Test terminado');