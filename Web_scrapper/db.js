// ============================================================
//  db.js — Conexión MySQL y actualización de ofertas
// ============================================================

import mysql from 'mysql2/promise';

// ── Configura aquí tus credenciales ─────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'codekeys',
  waitForConnections: true,
  connectionLimit: 5,
});

/**
 * Actualiza (o inserta) una oferta en la BD.
 * Llama al stored procedure sp_actualizar_precio si la oferta existe,
 * o hace un INSERT si es nueva.
 *
 * @param {Object} opts
 * @param {string} opts.slug       - Slug del juego (ej: 'cyberpunk')
 * @param {string} opts.storeCode  - Código de la tienda (ej: 'cdkeys')
 * @param {string} opts.platform   - Plataforma (ej: 'steam')
 * @param {number} opts.price      - Precio scrapeado
 * @param {string} opts.region     - Región (ej: 'Global', 'Europa')
 * @param {string} opts.stock      - Stock: 'ok' | 'low' | 'out'
 * @param {string} opts.tipo       - Tipo: 'code' | 'account'
 */
export async function updateOfferInDB({ slug, storeCode, platform, price, region, stock, tipo }) {
  const conn = await pool.getConnection();
  try {
    // Buscar IDs de juego, tienda y plataforma
    const [[game]]  = await conn.query('SELECT id FROM juegos     WHERE slug   = ?', [slug]);
    const [[store]] = await conn.query('SELECT id FROM tiendas    WHERE codigo = ?', [storeCode]);
    const [[plat]]  = await conn.query('SELECT id FROM plataformas WHERE codigo = ?', [platform]);

    if (!game || !store || !plat) {
      console.warn(`    ⚠️  Entidad no encontrada en BD: slug=${slug} store=${storeCode} plat=${platform}`);
      return;
    }

    // ¿Existe ya esta oferta?
    const [[existing]] = await conn.query(
      `SELECT id, precio FROM ofertas
       WHERE juego_id = ? AND tienda_id = ? AND plataforma_id = ? AND activa = 1
       LIMIT 1`,
      [game.id, store.id, plat.id]
    );

    if (existing) {
      // Actualizar precio usando el stored procedure (que guarda el historial automáticamente)
      await conn.query('CALL sp_actualizar_precio(?, ?)', [existing.id, price]);
    } else {
      // Insertar nueva oferta
      await conn.query(
        `INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [game.id, store.id, plat.id, tipo, region, stock, price]
      );
    }
  } finally {
    conn.release();
  }
}
