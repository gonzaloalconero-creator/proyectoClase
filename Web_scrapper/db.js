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
 * Devuelve un Set con todos los slugs que existen en la tabla `juegos`.
 * Se llama una vez al inicio de cada ciclo para filtrar la lista de juegos
 * antes de scraping, evitando procesar juegos que no están en la BD.
 */
export async function getValidSlugs() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT slug FROM juegos');
    return new Set(rows.map(r => r.slug));
  } finally {
    conn.release();
  }
}

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
      `SELECT id FROM ofertas
       WHERE juego_id = ? AND tienda_id = ? AND plataforma_id = ? AND tipo = ? AND region = ? AND activa = 1
       LIMIT 1`,
      [game.id, store.id, plat.id, tipo, region]
    );

    if (existing) {
      await conn.query('CALL sp_actualizar_precio(?, ?)', [existing.id, price]);
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