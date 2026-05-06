import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import pool from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000
const imagesDir = path.resolve(__dirname, '../imagenes')

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
}

app.use(morgan(':date[iso] :method :url :status :response-time ms'))
app.use(express.json())
app.use('/imagenes', express.static(imagesDir))

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', time: new Date().toISOString() })
})

app.get('/api/info', (_req, res) => {
  res.json({ message: 'Backend activo', imagesPath: imagesDir })
})

// ── Auth ─────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' })

  try {
    const cleanEmail = email.trim().toLowerCase()
    const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [cleanEmail])
    if (existing.length) return res.json({ ok: false, error: 'EMAIL_EXISTS' })

    const hash = await bcrypt.hash(password, 10)
    const id = `u_${Date.now()}_${Math.floor(Math.random() * 100000)}`

    await pool.query(
      'INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES (?, ?, ?, ?, ?)',
      [id, name.trim(), cleanEmail, hash, 'normal']
    )
    await pool.query('INSERT INTO user_preferencias (usuario_id) VALUES (?)', [id])

    res.json({ ok: true, user: { id, name: name.trim(), email: cleanEmail, role: 'normal' } })
  } catch (err) {
    console.error('/api/auth/register:', err.message)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' })

  try {
    const cleanEmail = email.trim().toLowerCase()
    const [rows] = await pool.query(
      'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = ? AND activo = 1',
      [cleanEmail]
    )
    if (!rows.length) return res.json({ ok: false, error: 'INVALID_CREDENTIALS' })

    const u = rows[0]
    const valid = await bcrypt.compare(password, u.password_hash)
    if (!valid) return res.json({ ok: false, error: 'INVALID_CREDENTIALS' })

    res.json({ ok: true, user: { id: u.id, name: u.nombre, email: u.email, role: u.rol } })
  } catch (err) {
    console.error('/api/auth/login:', err.message)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

// ── Juegos ───────────────────────────────────────────────────
app.get('/api/juegos', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT j.*, GROUP_CONCAT(g.nombre ORDER BY g.nombre SEPARATOR ',') AS generos_raw
      FROM juegos j
      LEFT JOIN juego_generos jg ON jg.juego_id = j.id
      LEFT JOIN generos g ON g.id = jg.genero_id
      WHERE j.activo = 1
      GROUP BY j.id
      ORDER BY j.descuento DESC
    `)
    res.json(rows.map(r => ({ ...r, generos: r.generos_raw ? r.generos_raw.split(',') : [] })))
  } catch (err) {
    console.error('/api/juegos:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/juegos/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT j.*, GROUP_CONCAT(g.nombre ORDER BY g.nombre SEPARATOR ',') AS generos_raw
      FROM juegos j
      LEFT JOIN juego_generos jg ON jg.juego_id = j.id
      LEFT JOIN generos g ON g.id = jg.genero_id
      WHERE j.slug = ? AND j.activo = 1
      GROUP BY j.id
    `, [req.params.slug])
    if (!rows.length) return res.status(404).json({ error: 'Juego no encontrado' })
    const j = rows[0]
    res.json({ ...j, generos: j.generos_raw ? j.generos_raw.split(',') : [] })
  } catch (err) {
    console.error('/api/juegos/:slug:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Tiendas ──────────────────────────────────────────────────
app.get('/api/tiendas', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tiendas WHERE activa = 1 ORDER BY rating DESC'
    )
    res.json(rows)
  } catch (err) {
    console.error('/api/tiendas:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Ofertas por juego ────────────────────────────────────────
app.get('/api/ofertas/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.codigo   AS storeKey,
        t.nombre   AS storeName,
        t.logo_url AS storeLogo,
        t.rating,
        t.votos    AS votes,
        p.codigo   AS platformKey,
        p.nombre   AS platformName,
        o.tipo,
        o.region,
        o.stock,
        o.precio   AS price,
        o.actualizado
      FROM ofertas o
      JOIN tiendas    t ON t.id = o.tienda_id
      JOIN plataformas p ON p.id = o.plataforma_id
      JOIN juegos     j ON j.id = o.juego_id
      WHERE j.slug = ? AND o.activa = 1
      ORDER BY o.precio ASC
    `, [req.params.slug])
    res.json(rows)
  } catch (err) {
    console.error('/api/ofertas/:slug:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Historial de precios ─────────────────────────────────────
app.get('/api/precio-historial/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.nombre        AS storeName,
        ph.precio_nuevo AS price,
        ph.fecha_cambio AS date
      FROM precio_historial ph
      JOIN ofertas o ON o.id = ph.oferta_id
      JOIN tiendas t ON t.id = o.tienda_id
      JOIN juegos  j ON j.id = o.juego_id
      WHERE j.slug = ?
      ORDER BY t.nombre, ph.fecha_cambio ASC
    `, [req.params.slug])

    const byStore = {}
    rows.forEach(r => {
      if (!byStore[r.storeName]) byStore[r.storeName] = { storeName: r.storeName, prices: [] }
      byStore[r.storeName].prices.push({ price: parseFloat(r.price), date: r.date })
    })
    res.json(Object.values(byStore))
  } catch (err) {
    console.error('/api/precio-historial/:slug:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Géneros ──────────────────────────────────────────────────
app.get('/api/generos', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM generos ORDER BY nombre')
    res.json(rows)
  } catch (err) {
    console.error('/api/generos:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Plataformas ──────────────────────────────────────────────
app.get('/api/plataformas', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM plataformas ORDER BY nombre')
    res.json(rows)
  } catch (err) {
    console.error('/api/plataformas:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(port, '0.0.0.0', () => {
  console.log(`[backend] running on http://0.0.0.0:${port}`)
  console.log(`[backend] serving images from ${imagesDir}`)
})
