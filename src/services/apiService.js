const BASE = '/api'

function mapJuego(j) {
  return {
    key: j.slug,
    name: j.nombre,
    img: j.imagen_url,
    platform: j.plataforma_texto,
    price: parseFloat(j.precio_base) || 0,
    was: parseFloat(j.precio_original) || 0,
    discount: j.descuento || 0,
    desc: j.descripcion || '',
    platform_tag: j.platform_tag || null,
    genre: j.generos?.[0] || null,
    tags: j.generos || []
  }
}

function mapTienda(t) {
  return {
    key: t.codigo,
    name: t.nombre,
    desc: t.descripcion,
    logo: t.logo_url,
    logo_url: t.logo_url,
    rating: parseFloat(t.rating) || 0,
    votes: t.votos || 0,
    votos: t.votos || 0,
    url: t.url_base,
    initials: (t.nombre || '??').substring(0, 2).toUpperCase(),
    count: '—',
    best: '—',
    disc: '—',
    price: null
  }
}

export async function fetchJuegos() {
  const res = await fetch(`${BASE}/juegos`)
  if (!res.ok) throw new Error(`Error ${res.status} cargando juegos`)
  const data = await res.json()
  return data.map(mapJuego)
}

export async function fetchJuego(slug) {
  const res = await fetch(`${BASE}/juegos/${slug}`)
  if (!res.ok) throw new Error(`Error ${res.status} cargando juego`)
  const j = await res.json()
  return mapJuego(j)
}

export async function fetchTiendas() {
  const res = await fetch(`${BASE}/tiendas`)
  if (!res.ok) throw new Error(`Error ${res.status} cargando tiendas`)
  const data = await res.json()
  return data.map(mapTienda)
}

export async function fetchOfertas(slug) {
  const res = await fetch(`${BASE}/ofertas/${slug}`)
  if (!res.ok) throw new Error(`Error ${res.status} cargando ofertas`)
  return res.json()
}

export async function fetchPrecioHistorial(slug) {
  const res = await fetch(`${BASE}/precio-historial/${slug}`)
  if (!res.ok) throw new Error(`Error ${res.status} cargando historial`)
  return res.json()
}

export async function fetchGeneros() {
  const res = await fetch(`${BASE}/generos`)
  if (!res.ok) throw new Error(`Error ${res.status} cargando generos`)
  return res.json()
}
