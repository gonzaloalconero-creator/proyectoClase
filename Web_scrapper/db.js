// ============================================================
//  db.js — Conexión MySQL y actualización de ofertas
// ============================================================

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'codekeys',
  waitForConnections: true,
  connectionLimit: 5,
});

export async function closePool() {
  await pool.end();
}

/**
 * Actualiza (o inserta) una oferta en la BD.
 *
 * @param {Object} opts
 * @param {string} opts.slug       - Slug del juego (ej: 'cyberpunk')
 * @param {string} opts.storeCode  - Código de la tienda (ej: 'cdkeys')
 * @param {string} opts.platform   - Plataforma (ej: 'steam')
 * @param {number} opts.price      - Precio scrapeado
 * @param {string} opts.region     - Región (ej: 'Global', 'Europa')
 * @param {string} opts.stock      - Stock: 'ok' | 'low' | 'out'
 * @param {string} opts.tipo       - Tipo: 'code' | 'account'
 * @param {string} opts.url        - URL del producto en la tienda
 */
export async function updateOfferInDB({ slug, storeCode, platform, price, region, stock, tipo, url }) {
  const conn = await pool.getConnection();
  try {
    const [[game]]  = await conn.query('SELECT id FROM juegos      WHERE slug   = ?', [slug]);
    const [[store]] = await conn.query('SELECT id FROM tiendas     WHERE codigo = ?', [storeCode]);
    const [[plat]]  = await conn.query('SELECT id FROM plataformas WHERE codigo = ?', [platform]);

    if (!game || !store || !plat) {
      console.warn(`    Entidad no encontrada en BD: slug=${slug} store=${storeCode} plat=${platform}`);
      return;
    }

    const [[existing]] = await conn.query(
      `SELECT id, precio FROM ofertas
       WHERE juego_id = ? AND tienda_id = ? AND plataforma_id = ? AND activa = 1
       LIMIT 1`,
      [game.id, store.id, plat.id]
    );

    if (existing) {
      // Actualizar precio usando el stored procedure (guarda historial automáticamente)
      await conn.query('CALL sp_actualizar_precio(?, ?)', [existing.id, price]);
      // Actualizar también la URL del producto
      await conn.query(
        'UPDATE ofertas SET url_producto = ? WHERE id = ?',
        [url || null, existing.id]
      );
    } else {
      await conn.query(
        `INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, url_producto, precio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [game.id, store.id, plat.id, tipo, region, stock, url || null, price]
      );
    }
  } finally {
    conn.release();
  }
}