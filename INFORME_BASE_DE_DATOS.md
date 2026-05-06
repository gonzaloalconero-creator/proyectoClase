# Informe de Base de Datos — CodeKeys

**Proyecto:** CodeKeys — Comparador de precios de videojuegos  
**Motor:** MySQL 8.0+ / AWS RDS MySQL / AWS Aurora MySQL  
**Fecha:** 06/05/2026  
**Archivo fuente:** `codekeys_db.sql`

---

## Tabla de contenidos

1. [Descripcion general](#1-descripcion-general)
2. [Especificaciones tecnicas](#2-especificaciones-tecnicas)
3. [Diagrama entidad-relacion](#3-diagrama-entidad-relacion)
4. [Tablas](#4-tablas)
5. [Relaciones y claves foraneas](#5-relaciones-y-claves-foraneas)
6. [Indices](#6-indices)
7. [Procedimientos almacenados](#7-procedimientos-almacenados)
8. [Datos iniciales (seed)](#8-datos-iniciales-seed)
9. [Capa de acceso a datos](#9-capa-de-acceso-a-datos)
10. [Configuracion de conexion](#10-configuracion-de-conexion)
11. [Decisiones de diseno](#11-decisiones-de-diseno)

---

## 1. Descripcion general

CodeKeys es una plataforma web que agrega y compara precios de claves digitales de videojuegos procedentes de multiples tiendas (CDKeys, Instant Gaming, Eneba, entre otras). La base de datos sustenta tres grandes funcionalidades:

- **Catalogo de juegos:** almacena titulos, generos, plataformas y sus metadatos.
- **Ofertas y precios:** registra el precio actual por tienda/plataforma y mantiene un historial completo de variaciones.
- **Usuarios:** gestiona cuentas, preferencias personales, favoritos, alertas de precio y el historial de navegacion.

---

## 2. Especificaciones tecnicas

| Parametro | Valor |
|---|---|
| Motor de almacenamiento | InnoDB |
| Version minima MySQL | 8.0 |
| Compatibilidad cloud | AWS RDS MySQL, AWS Aurora MySQL |
| Juego de caracteres | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |
| Numero de tablas | 13 |
| Stored procedures | 1 (`sp_actualizar_precio`) |
| ORM | Ninguno (queries directas con `mysql2/promise`) |
| Sistema de migraciones | Script SQL manual |

---

## 3. Diagrama entidad-relacion

```
plataformas ──────────────────────────────────────────┐
                                                       │ (1:N)
generos ──┐                                            │
          │ (N:M)                                      │
          └── juego_generos ──── juegos ──── ofertas ──┘
                                   │           │
                                   │           └── precio_historial
                                   │
                                   ├── juego_generos
                                   ├── user_favoritos ──── usuarios
                                   ├── sesiones_historial ─┘   │
                                   └── alertas_precio ──────────┤
                                                                │
                              tiendas ─── (ofertas.tienda_id)  │
                              blogs ──────────────────────────┘
                              user_preferencias ───────────────┘
```

**Leyenda de cardinalidades:**

| Relacion | Cardinalidad |
|---|---|
| `juegos` ↔ `generos` | N:M (via `juego_generos`) |
| `juegos` ↔ `tiendas` ↔ `plataformas` | N:M (via `ofertas`) |
| `ofertas` → `precio_historial` | 1:N |
| `usuarios` → `user_preferencias` | 1:1 |
| `usuarios` ↔ `juegos` (favoritos) | N:M (via `user_favoritos`) |
| `usuarios` → `sesiones_historial` | 1:N |
| `usuarios` → `alertas_precio` | 1:N |
| `usuarios` → `blogs` | 1:N |

---

## 4. Tablas

### 4.1 `plataformas`

Catalogo de plataformas de distribucion digital y consolas.

| Columna | Tipo | Nulo | PK/UK | Descripcion |
|---|---|---|---|---|
| `id` | INT AUTO_INCREMENT | NO | PK | Identificador unico |
| `codigo` | VARCHAR(50) | NO | UK | Codigo interno (e.g. `steam`, `ps5`) |
| `nombre` | VARCHAR(100) | NO | | Nombre legible (e.g. `PC Steam`) |
| `icono` | VARCHAR(10) | SI | | Emoji representativo |

---

### 4.2 `generos`

Catalogo de generos de videojuegos.

| Columna | Tipo | Nulo | PK/UK | Descripcion |
|---|---|---|---|---|
| `id` | INT AUTO_INCREMENT | NO | PK | Identificador unico |
| `nombre` | VARCHAR(80) | NO | UK | Nombre del genero (e.g. `RPG`, `FPS`) |

---

### 4.3 `juegos`

Tabla central del catalogo. Contiene los metadatos de cada titulo.

| Columna | Tipo | Nulo | PK/UK | Descripcion |
|---|---|---|---|---|
| `id` | INT AUTO_INCREMENT | NO | PK | Identificador unico |
| `slug` | VARCHAR(100) | NO | UK | Identificador URL-friendly (e.g. `cyberpunk`) |
| `nombre` | VARCHAR(200) | NO | | Titulo completo del juego |
| `imagen_url` | VARCHAR(500) | SI | | URL de la imagen de portada |
| `plataforma_texto` | VARCHAR(200) | SI | | Texto descriptivo de plataformas disponibles |
| `precio_base` | DECIMAL(10,2) | SI | | Precio actual mas bajo encontrado |
| `precio_original` | DECIMAL(10,2) | SI | | Precio de venta al publico recomendado |
| `descuento` | INT | SI | | Porcentaje de descuento calculado |
| `descripcion` | TEXT | SI | | Sinopsis del juego |
| `platform_tag` | VARCHAR(50) | SI | | Etiqueta de plataforma para filtros |
| `scraper_activo` | TINYINT(1) | SI | | `1` si el scraper rastrea este juego |
| `scraper_busqueda` | VARCHAR(200) | SI | | Termino de busqueda para el scraper |
| `activo` | TINYINT(1) | SI | | `1` si el juego esta visible en la web |
| `creado_en` | TIMESTAMP | SI | | Fecha de insercion |

---

### 4.4 `juego_generos`

Tabla de union N:M entre `juegos` y `generos`.

| Columna | Tipo | Nulo | PK | FK |
|---|---|---|---|---|
| `juego_id` | INT | NO | (parte) | → `juegos.id` CASCADE |
| `genero_id` | INT | NO | (parte) | → `generos.id` CASCADE |

---

### 4.5 `tiendas`

Catalogo de tiendas de claves digitales integradas en la plataforma.

| Columna | Tipo | Nulo | PK/UK | Descripcion |
|---|---|---|---|---|
| `id` | INT AUTO_INCREMENT | NO | PK | Identificador unico |
| `codigo` | VARCHAR(50) | NO | UK | Codigo interno (e.g. `cdkeys`, `instantgaming`) |
| `nombre` | VARCHAR(100) | NO | | Nombre de la tienda |
| `descripcion` | TEXT | SI | | Descripcion breve |
| `logo_url` | VARCHAR(300) | SI | | Ruta al logotipo |
| `rating` | DECIMAL(3,1) | SI | | Puntuacion media de los usuarios |
| `votos` | INT | SI | | Numero de valoraciones recibidas |
| `scraper_activo` | TINYINT(1) | SI | | `1` si hay scraper implementado |
| `url_base` | VARCHAR(300) | SI | | URL raiz de la tienda |
| `activa` | TINYINT(1) | SI | | `1` si la tienda esta visible en la web |

---

### 4.6 `ofertas`

Precio actual de cada juego en cada tienda y plataforma. La combinacion `(juego_id, tienda_id, plataforma_id, tipo, region)` es unica.

| Columna | Tipo | Nulo | PK/UK | Descripcion |
|---|---|---|---|---|
| `id` | INT AUTO_INCREMENT | NO | PK | Identificador unico |
| `juego_id` | INT | NO | | → `juegos.id` CASCADE |
| `tienda_id` | INT | NO | | → `tiendas.id` CASCADE |
| `plataforma_id` | INT | NO | | → `plataformas.id` CASCADE |
| `tipo` | VARCHAR(20) | SI | | Tipo de producto (`code`, `dlc`, etc.) |
| `region` | VARCHAR(50) | SI | | Region de validez (defecto: `Global`) |
| `stock` | VARCHAR(20) | SI | | Estado de disponibilidad (`ok`, `agotado`) |
| `precio` | DECIMAL(10,2) | NO | | Precio actual en EUR |
| `activa` | TINYINT(1) | SI | | `1` si la oferta esta disponible |
| `actualizado` | TIMESTAMP | NO | | Ultima actualizacion (auto-refresh) |

**Restriccion de unicidad:** `UNIQUE KEY uq_oferta (juego_id, tienda_id, plataforma_id, tipo, region)` — garantiza una sola fila por combinacion de juego, tienda, plataforma, tipo y region.

---

### 4.7 `precio_historial`

Registro inmutable de cada cambio de precio en una oferta.

| Columna | Tipo | Nulo | PK | Descripcion |
|---|---|---|---|---|
| `id` | INT AUTO_INCREMENT | NO | PK | Identificador unico |
| `oferta_id` | INT | NO | | → `ofertas.id` CASCADE |
| `precio_anterior` | DECIMAL(10,2) | NO | | Precio antes del cambio |
| `precio_nuevo` | DECIMAL(10,2) | NO | | Precio despues del cambio |
| `fecha_cambio` | TIMESTAMP | NO | | Momento del cambio |

---

### 4.8 `usuarios`

Cuentas de usuario del sistema.

| Columna | Tipo | Nulo | PK/UK | Descripcion |
|---|---|---|---|---|
| `id` | VARCHAR(60) | NO | PK | UUID o identificador alfanumerico |
| `nombre` | VARCHAR(100) | NO | | Nombre visible |
| `email` | VARCHAR(200) | NO | UK | Correo electronico (unico) |
| `password_hash` | VARCHAR(255) | NO | | Contrasena hasheada con bcrypt |
| `rol` | ENUM('admin','normal') | SI | | Rol de acceso |
| `activo` | TINYINT(1) | SI | | `1` si la cuenta esta habilitada |
| `creado_en` | TIMESTAMP | SI | | Fecha de registro |

---

### 4.9 `user_preferencias`

Preferencias personales de cada usuario. Relacion 1:1 con `usuarios`.

| Columna | Tipo | Nulo | PK | Descripcion |
|---|---|---|---|---|
| `usuario_id` | VARCHAR(60) | NO | PK/FK | → `usuarios.id` CASCADE |
| `tema` | VARCHAR(10) | SI | | Tema de interfaz (`dark`/`light`) |
| `moneda` | VARCHAR(5) | SI | | Moneda preferida (defecto: `EUR`) |
| `idioma` | VARCHAR(5) | SI | | Idioma preferido (defecto: `es`) |

---

### 4.10 `user_favoritos`

Juegos marcados como favoritos por cada usuario. Tabla N:M.

| Columna | Tipo | Nulo | PK | FK |
|---|---|---|---|---|
| `usuario_id` | VARCHAR(60) | NO | (parte) | → `usuarios.id` CASCADE |
| `juego_id` | INT | NO | (parte) | → `juegos.id` CASCADE |
| `creado_en` | TIMESTAMP | SI | | Fecha en que se marco como favorito |

---

### 4.11 `sesiones_historial`

Registro de las visitas de cada usuario a las paginas de juegos.

| Columna | Tipo | Nulo | PK | Descripcion |
|---|---|---|---|---|
| `id` | INT AUTO_INCREMENT | NO | PK | Identificador unico |
| `usuario_id` | VARCHAR(60) | NO | FK | → `usuarios.id` CASCADE |
| `juego_id` | INT | NO | FK | → `juegos.id` CASCADE |
| `visto_en` | TIMESTAMP | SI | | Fecha y hora de la visita |

---

### 4.12 `blogs`

Articulos de blog publicados por los administradores de la plataforma.

| Columna | Tipo | Nulo | PK | Descripcion |
|---|---|---|---|---|
| `id` | BIGINT AUTO_INCREMENT | NO | PK | Identificador unico |
| `titulo` | VARCHAR(300) | NO | | Titulo del articulo |
| `imagen_principal` | VARCHAR(500) | SI | | URL de la imagen de cabecera |
| `contenido` | LONGTEXT | NO | | Cuerpo del articulo (HTML/Markdown) |
| `autor_id` | VARCHAR(60) | SI | FK | → `usuarios.id` SET NULL al borrar |
| `publicado` | TINYINT(1) | SI | | `1` si el articulo es visible |
| `creado_en` | TIMESTAMP | SI | | Fecha de publicacion |
| `actualizado_en` | TIMESTAMP | SI | | Ultima modificacion (auto-refresh) |

---

### 4.13 `alertas_precio`

Alertas configuradas por los usuarios para recibir notificacion cuando un juego baje de un precio objetivo.

| Columna | Tipo | Nulo | PK | Descripcion |
|---|---|---|---|---|
| `id` | INT AUTO_INCREMENT | NO | PK | Identificador unico |
| `usuario_id` | VARCHAR(60) | NO | FK | → `usuarios.id` CASCADE |
| `juego_id` | INT | NO | FK | → `juegos.id` CASCADE |
| `precio_alerta` | DECIMAL(10,2) | NO | | Precio maximo deseado por el usuario |
| `activa` | TINYINT(1) | SI | | `1` si la alerta esta vigente |
| `creado_en` | TIMESTAMP | SI | | Fecha de creacion |

---

## 5. Relaciones y claves foraneas

| Clave foranea | Tabla origen | Columna | Tabla destino | Columna | ON DELETE |
|---|---|---|---|---|---|
| `fk_jg_juego` | `juego_generos` | `juego_id` | `juegos` | `id` | CASCADE |
| `fk_jg_genero` | `juego_generos` | `genero_id` | `generos` | `id` | CASCADE |
| `fk_of_juego` | `ofertas` | `juego_id` | `juegos` | `id` | CASCADE |
| `fk_of_tienda` | `ofertas` | `tienda_id` | `tiendas` | `id` | CASCADE |
| `fk_of_plat` | `ofertas` | `plataforma_id` | `plataformas` | `id` | CASCADE |
| `fk_ph_oferta` | `precio_historial` | `oferta_id` | `ofertas` | `id` | CASCADE |
| `fk_up_usuario` | `user_preferencias` | `usuario_id` | `usuarios` | `id` | CASCADE |
| `fk_uf_usuario` | `user_favoritos` | `usuario_id` | `usuarios` | `id` | CASCADE |
| `fk_uf_juego` | `user_favoritos` | `juego_id` | `juegos` | `id` | CASCADE |
| `fk_sh_usuario` | `sesiones_historial` | `usuario_id` | `usuarios` | `id` | CASCADE |
| `fk_sh_juego` | `sesiones_historial` | `juego_id` | `juegos` | `id` | CASCADE |
| `fk_bl_autor` | `blogs` | `autor_id` | `usuarios` | `id` | SET NULL |
| `fk_ap_usuario` | `alertas_precio` | `usuario_id` | `usuarios` | `id` | CASCADE |
| `fk_ap_juego` | `alertas_precio` | `juego_id` | `juegos` | `id` | CASCADE |

> La politica `ON DELETE CASCADE` garantiza integridad referencial: al eliminar un juego, todas sus ofertas, historial de precios, favoritos, sesiones y alertas asociadas se eliminan en cascada. La excepcion es `blogs.autor_id`, que pasa a `NULL` para conservar el contenido aunque se elimine el autor.

---

## 6. Indices

Ademas de los indices implicitos generados por las claves primarias y restricciones `UNIQUE`, se definen los siguientes indices explicitos para optimizar las consultas mas frecuentes:

| Indice | Tabla | Columnas | Proposito |
|---|---|---|---|
| `idx_ph_oferta` | `precio_historial` | `oferta_id` | Consultas de historial por oferta |
| `idx_ph_fecha` | `precio_historial` | `fecha_cambio` | Ordenacion y filtros temporales |
| `idx_sh_usuario` | `sesiones_historial` | `usuario_id` | Historial de navegacion por usuario |
| `idx_sh_visto` | `sesiones_historial` | `visto_en` | Ordenacion cronologica de visitas |

---

## 7. Procedimientos almacenados

### `sp_actualizar_precio(p_oferta_id INT, p_nuevo_precio DECIMAL(10,2))`

Actualiza el precio de una oferta y registra automaticamente el cambio en `precio_historial` solo si el precio vario.

**Logica:**

```
1. Lee el precio actual de la oferta indicada.
2. Si el precio actual existe Y difiere del nuevo precio:
      INSERT en precio_historial (precio_anterior, precio_nuevo).
3. UPDATE en ofertas con el nuevo precio y timestamp actual.
```

**Uso desde el scraper:**

```javascript
await pool.query('CALL sp_actualizar_precio(?, ?)', [ofertaId, nuevoPrecio]);
```

**Ventajas:** centraliza la logica de actualizacion de precios en la base de datos, asegura atomicidad y evita entradas duplicadas en el historial cuando el precio no cambia.

---

## 8. Datos iniciales (seed)

El script SQL incluye un conjunto de datos de arranque listo para desarrollo y produccion:

| Entidad | Cantidad | Detalle |
|---|---|---|
| Plataformas | 10 | Steam, Epic, PS5, PS4, PSN, Xbox, Switch, Origin, Ubisoft Connect, Mobile |
| Generos | 12 | Accion, RPG, FPS, Aventura, Estrategia, Simulacion, Deportes, Terror, Indie, Multijugador, Carreras, MMORPG |
| Tiendas | 10 | CDKeys, Instant Gaming, Eneba, Kinguin, G2A, Gamivo, HRKGame, MMOGA, Sologame, RoyalCDKeys |
| Juegos | 33 | Titulos AAA e indie de todas las plataformas principales |
| Relaciones juego-genero | 32 | Un genero principal por juego |
| Usuario administrador | 1 | `admin@codekeys.local` (contrasena a actualizar con bcrypt) |

Los inserts utilizan `ON DUPLICATE KEY UPDATE` para ser idempotentes: pueden ejecutarse multiples veces sin duplicar registros.

**Tiendas con scraper activo en el seed:**

| Tienda | Rating | Votos |
|---|---|---|
| Instant Gaming | 4.7 | 367 |
| CDKeys | 4.3 | 180 |
| Eneba | 4.2 | 319 |

**Juegos con scraper activo en el seed (10 titulos):**

`cyberpunk`, `witcher3`, `darksouls3`, `rdr2`, `starfield`, `bg3`, `re4`, `eldenring`, `hogwarts`, `gtav`

---

## 9. Capa de acceso a datos

### 9.1 Pool de conexiones — Backend (`backend/db.js`)

```javascript
// mysql2/promise con pool de 10 conexiones
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 10
});
```

### 9.2 Pool de conexiones — Scraper (`Web_scrapper/db.js`)

Pool reducido de 5 conexiones optimizado para operaciones de escritura masiva.

Funcion principal: `updateOfferInDB(gameSlug, storeName, platformCode, price)`

**Flujo interno:**

```
1. Obtiene juego_id por slug.
2. Obtiene tienda_id por codigo.
3. Obtiene plataforma_id por codigo.
4. Si la oferta ya existe  → CALL sp_actualizar_precio(oferta_id, nuevo_precio)
5. Si la oferta es nueva   → INSERT INTO ofertas (...)
```

### 9.3 Endpoints de la API (`backend/server.js`)

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/auth/register` | Registro de nuevo usuario (bcrypt) |
| POST | `/api/auth/login` | Autenticacion por email y contrasena |
| GET | `/api/juegos` | Lista todos los juegos con generos |
| GET | `/api/juegos/:slug` | Detalle de un juego por slug |
| GET | `/api/tiendas` | Lista de tiendas ordenadas por rating |
| GET | `/api/ofertas/:slug` | Ofertas de un juego agrupadas por tienda/plataforma |
| GET | `/api/precio-historial/:slug` | Historial de cambios de precio de un juego |
| GET | `/api/generos` | Lista todos los generos |
| GET | `/api/plataformas` | Lista todas las plataformas |

---

## 10. Configuracion de conexion

La conexion se configura mediante variables de entorno en archivos `.env`:

| Variable | Valor (produccion) | Descripcion |
|---|---|---|
| `DB_HOST` | `54.234.227.200` | IP del servidor AWS RDS |
| `DB_USER` | `codekeys_user` | Usuario de MySQL |
| `DB_PASS` | `Codekeys` | Contrasena |
| `DB_NAME` | `codekeys` | Nombre de la base de datos |

> El servidor de base de datos es una instancia AWS RDS accesible desde el backend desplegado en Docker. En desarrollo local se puede apuntar a `localhost` con una instancia MySQL local.

### Archivos `.env` que usan esta configuracion:

- [backend/.env](proyectoClase/backend/.env) — API REST
- [Web_scrapper/.env](proyectoClase/Web_scrapper/.env) — Sistema de scraping

---

## 11. Decisiones de diseno

### Sin ORM
Se opto por queries SQL directas con `mysql2/promise` en lugar de un ORM (Sequelize, TypeORM, Prisma). Esto ofrece mayor control sobre las consultas y evita la sobrecarga de abstraccion, a costa de gestionar manualmente las relaciones.

### Slug como identificador publico
Los juegos se identifican publicamente por `slug` (e.g. `cyberpunk`) en lugar de su `id` numerico. Esto hace las URLs legibles y permite referenciar juegos desde el scraper sin conocer el ID interno.

### Historial de precios mediante stored procedure
La logica de actualizacion de precios se centraliza en `sp_actualizar_precio` para garantizar atomicidad y evitar registros duplicados en `precio_historial` cuando el precio no varia. Esto desacopla la logica de negocio del codigo de aplicacion.

### Politica CASCADE generalizada
Todas las relaciones usan `ON DELETE CASCADE` para mantener integridad referencial sin dejar huerfanos. La unica excepcion es `blogs.autor_id`, que usa `SET NULL` para preservar el contenido del blog aunque el autor sea eliminado.

### ID de usuario como VARCHAR(60)
El campo `usuarios.id` es `VARCHAR(60)` en lugar de `INT AUTO_INCREMENT`, lo que permite usar UUIDs o identificadores externos (OAuth, JWT subject) sin depender de la secuencia de la base de datos.

### Campos `activo` / `activa`
Todas las entidades principales (`juegos`, `tiendas`, `ofertas`, `usuarios`, `alertas_precio`, `blogs`) incluyen un campo booleano de activacion. Esto permite ocultar registros sin eliminarlos, facilitando la moderacion y la recuperacion de datos.

### Charset utf8mb4
Se usa `utf8mb4` en lugar de `utf8` para soportar el rango completo de Unicode, incluyendo emojis (usados en los iconos de plataformas) y caracteres especiales de titulos de juegos internacionales.
