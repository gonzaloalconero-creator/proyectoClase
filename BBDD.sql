-- ============================================================
--  CODEKEYS — Base de datos MySQL con PL/SQL
--  Proyecto: Comparador de precios de claves de juegos
-- ============================================================

-- ============================================================
--  1. CREACIÓN DE LA BASE DE DATOS
-- ============================================================
CREATE DATABASE IF NOT EXISTS codekeys;

USE codekeys;

drop database codekeys;
-- ============================================================
--  2. TABLAS PRINCIPALES
-- ============================================================

-- ── 2.1 Plataformas ─────────────────────────────────────────
CREATE TABLE plataformas (
  id         INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo     VARCHAR(20)   NOT NULL UNIQUE,
  nombre     VARCHAR(60)   NOT NULL,
  icono      VARCHAR(10)   NOT NULL,
  color_hex  VARCHAR(7)    NOT NULL DEFAULT '#f97316',
  creado_en  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 2.2 Géneros ─────────────────────────────────────────────
CREATE TABLE generos (
  id         INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo     VARCHAR(30)   NOT NULL UNIQUE,
  nombre     VARCHAR(60)   NOT NULL
);

-- ── 2.3 Juegos ──────────────────────────────────────────────
CREATE TABLE juegos (
  id          INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(60)   NOT NULL UNIQUE,
  nombre      VARCHAR(120)  NOT NULL,
  imagen_url  TEXT,
  precio_orig DECIMAL(8,2)  NOT NULL,
  activo      TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 2.4 Juego ↔ Plataforma (N:M) ────────────────────────────
CREATE TABLE juego_plataforma (
  juego_id      INT UNSIGNED NOT NULL,
  plataforma_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (juego_id, plataforma_id),
  CONSTRAINT fk_jp_juego FOREIGN KEY (juego_id)      REFERENCES juegos(id)      ON DELETE CASCADE,
  CONSTRAINT fk_jp_plat  FOREIGN KEY (plataforma_id) REFERENCES plataformas(id) ON DELETE CASCADE
);

-- ── 2.5 Tags de juego ───────────────────────────────────────
CREATE TABLE juego_tags (
  juego_id  INT          UNSIGNED NOT NULL,
  tag       VARCHAR(60)  NOT NULL,
  PRIMARY KEY (juego_id, tag),
  CONSTRAINT fk_tag_juego FOREIGN KEY (juego_id) REFERENCES juegos(id) ON DELETE CASCADE
);

-- ── 2.6 Tiendas ─────────────────────────────────────────────
CREATE TABLE tiendas (
  id         INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo     VARCHAR(30)   NOT NULL UNIQUE,
  nombre     VARCHAR(80)   NOT NULL,
  icono      VARCHAR(10),
  url        VARCHAR(120),
  activa     TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 2.7 Tienda ↔ Plataforma soportada ───────────────────────
CREATE TABLE tienda_plataforma (
  tienda_id     INT UNSIGNED NOT NULL,
  plataforma_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (tienda_id, plataforma_id),
  CONSTRAINT fk_tp_tienda FOREIGN KEY (tienda_id)     REFERENCES tiendas(id)     ON DELETE CASCADE,
  CONSTRAINT fk_tp_plat   FOREIGN KEY (plataforma_id) REFERENCES plataformas(id) ON DELETE CASCADE
);

-- ── 2.8 Ofertas (precios por tienda) ────────────────────────
CREATE TABLE ofertas (
  id             INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  juego_id       INT           UNSIGNED NOT NULL,
  tienda_id      INT           UNSIGNED NOT NULL,
  plataforma_id  INT           UNSIGNED NOT NULL,
  tipo           ENUM('code','account') NOT NULL DEFAULT 'code',
  region         VARCHAR(20)   NOT NULL DEFAULT 'Global',
  stock          ENUM('ok','low','out') NOT NULL DEFAULT 'ok',
  precio         DECIMAL(8,2)  NOT NULL,
  activa         TINYINT(1)    NOT NULL DEFAULT 1,
  actualizado_en TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  creado_en      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_oferta_juego  FOREIGN KEY (juego_id)      REFERENCES juegos(id)      ON DELETE CASCADE,
  CONSTRAINT fk_oferta_tienda FOREIGN KEY (tienda_id)     REFERENCES tiendas(id)     ON DELETE CASCADE,
  CONSTRAINT fk_oferta_plat   FOREIGN KEY (plataforma_id) REFERENCES plataformas(id) ON DELETE CASCADE
);

-- ── 2.9 Juego ↔ Género ──────────────────────────────────────
CREATE TABLE juego_genero (
  juego_id  INT UNSIGNED NOT NULL,
  genero_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (juego_id, genero_id),
  CONSTRAINT fk_jg_juego  FOREIGN KEY (juego_id)  REFERENCES juegos(id)   ON DELETE CASCADE,
  CONSTRAINT fk_jg_genero FOREIGN KEY (genero_id) REFERENCES generos(id)  ON DELETE CASCADE
);

-- Índices para acelerar búsquedas
CREATE INDEX idx_ofertas_juego_precio ON ofertas(juego_id, precio);
CREATE INDEX idx_ofertas_activa       ON ofertas(activa);
CREATE INDEX idx_ofertas_plataforma   ON ofertas(plataforma_id);

-- ── 2.10 Historial de precios ────────────────────────────────
CREATE TABLE historial_precios (
  id          INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  oferta_id   INT           UNSIGNED NOT NULL,
  precio_ant  DECIMAL(8,2)  NOT NULL,
  precio_nvo  DECIMAL(8,2)  NOT NULL,
  cambiado_en TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_oferta FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE CASCADE
);

-- ── 2.11 Usuarios (panel admin) ─────────────────────────────
CREATE TABLE usuarios (
  id             INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(120)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255)  NOT NULL,
  nombre         VARCHAR(80),
  rol            ENUM('admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  activo         TINYINT(1)    NOT NULL DEFAULT 1,
  ultimo_acceso  TIMESTAMP     NULL,
  creado_en      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
--  3. DATOS DE EJEMPLO — Plataformas
-- ============================================================
INSERT INTO plataformas (codigo, nombre, icono, color_hex) VALUES
  ('steam',  'PC Steam',        '🖥️', '#1b9cd4'),
  ('epic',   'Epic Games',      '🔵', '#2563eb'),
  ('ps5',    'PlayStation 5',   '🎮', '#003791'),
  ('ps4',    'PlayStation 4',   '🎮', '#003791'),
  ('xbox',   'Xbox',            '🟩', '#107c10'),
  ('switch', 'Nintendo Switch', '🔴', '#e60012'),
  ('mobile', 'Móvil',           '📱', '#6366f1');


-- ============================================================
--  4. DATOS DE EJEMPLO — Géneros
-- ============================================================
INSERT INTO generos (codigo, nombre) VALUES
  ('action',   'Acción'),
  ('rpg',      'RPG'),
  ('fps',      'FPS'),
  ('horror',   'Terror'),
  ('indie',    'Indie'),
  ('sports',   'Deportes'),
  ('strategy', 'Estrategia'),
  ('adventure','Aventura');


-- ============================================================
--  5. DATOS DE EJEMPLO — Tiendas
-- ============================================================
INSERT INTO tiendas (codigo, nombre, icono, url) VALUES
  ('steamkeys',     'SteamKeys',         '🟢', 'steamkeys.com'),
  ('cdkeys',        'CDKeys',            '🔑', 'cdkeys.com'),
  ('eneba',         'Eneba',             '⚡', 'eneba.com'),
  ('kinguin',       'Kinguin',           '👑', 'kinguin.net'),
  ('g2a',           'G2A',               '🛒', 'g2a.com'),
  ('offgamers',     'OffGamers',         '🔶', 'offgamers.com'),
  ('instantgaming', 'Instant Gaming',    '💜', 'instant-gaming.com'),
  ('fanatical',     'Fanatical',         '🔵', 'fanatical.com'),
  ('gamebillet',    'GameBillet',        '🟠', 'gamebillet.com'),
  ('gamesplanet',   'Gamesplanet',       '🟤', 'gamesplanet.com'),
  ('psstore',       'PlayStation Store', '🎮', 'store.playstation.com'),
  ('xboxstore',     'Xbox Store',        '🟩', 'xbox.com/games'),
  ('nintendoeshop', 'Nintendo eShop',    '🔴', 'eshop.nintendo.com'),
  ('epicstore',     'Epic Games Store',  '🔵', 'store.epicgames.com');


-- ============================================================
--  6. DATOS DE EJEMPLO — Tienda ↔ Plataforma soportada
-- ============================================================
INSERT INTO tienda_plataforma (tienda_id, plataforma_id)
SELECT t.id, p.id
FROM tiendas t, plataformas p
WHERE
  (t.codigo='steamkeys'     AND p.codigo='steam')  OR
  (t.codigo='cdkeys'        AND p.codigo='steam')  OR
  (t.codigo='cdkeys'        AND p.codigo='ps5')    OR
  (t.codigo='cdkeys'        AND p.codigo='ps4')    OR
  (t.codigo='cdkeys'        AND p.codigo='xbox')   OR
  (t.codigo='cdkeys'        AND p.codigo='switch') OR
  (t.codigo='eneba'         AND p.codigo='steam')  OR
  (t.codigo='eneba'         AND p.codigo='ps5')    OR
  (t.codigo='eneba'         AND p.codigo='xbox')   OR
  (t.codigo='kinguin'       AND p.codigo='steam')  OR
  (t.codigo='kinguin'       AND p.codigo='ps5')    OR
  (t.codigo='kinguin'       AND p.codigo='xbox')   OR
  (t.codigo='g2a'           AND p.codigo='steam')  OR
  (t.codigo='g2a'           AND p.codigo='ps5')    OR
  (t.codigo='g2a'           AND p.codigo='xbox')   OR
  (t.codigo='offgamers'     AND p.codigo='steam')  OR
  (t.codigo='instantgaming' AND p.codigo='steam')  OR
  (t.codigo='instantgaming' AND p.codigo='ps5')    OR
  (t.codigo='fanatical'     AND p.codigo='steam')  OR
  (t.codigo='gamebillet'    AND p.codigo='steam')  OR
  (t.codigo='gamesplanet'   AND p.codigo='steam')  OR
  (t.codigo='psstore'       AND p.codigo='ps5')    OR
  (t.codigo='psstore'       AND p.codigo='ps4')    OR
  (t.codigo='xboxstore'     AND p.codigo='xbox')   OR
  (t.codigo='nintendoeshop' AND p.codigo='switch') OR
  (t.codigo='epicstore'     AND p.codigo='epic');


-- ============================================================
--  7. DATOS DE EJEMPLO — Juegos
-- ============================================================
INSERT INTO juegos (slug, nombre, imagen_url, precio_orig) VALUES
  ('cyberpunk',  'Cyberpunk 2077',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg', 59.99),
  ('witcher3',   'The Witcher 3: Wild Hunt',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg',  29.99),
  ('eldenring',  'Elden Ring',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg', 59.99),
  ('rdr2',       'Red Dead Redemption 2',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg', 59.99),
  ('baldurs',    "Baldur's Gate 3",
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900.jpg', 59.99),
  ('starfield',  'Starfield',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/header.jpg',           69.99),
  ('hogwarts',   'Hogwarts Legacy',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/library_600x900.jpg',  59.99),
  ('gtav',       'GTA V',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg',  29.99),
  ('eafc25',     'EA FC 25',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900.jpg', 69.99),
  ('cod',        'Call of Duty: MW3',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/2481390/library_600x900.jpg', 69.99),
  ('darksouls3', 'Dark Souls III',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/library_600x900.jpg',  39.99),
  ('re4',        'Resident Evil 4 Remake',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg', 49.99),
  ('deadspace',  'Dead Space Remake',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1693980/library_600x900.jpg', 49.99),
  ('hades2',     'Hades II',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/library_600x900.jpg', 26.99),
  ('celeste',    'Celeste',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg',  19.99),
  ('stardew',    'Stardew Valley',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/library_600x900.jpg',  13.99),
  ('minecraft',  'Minecraft',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/library_600x900.jpg', 26.99),
  ('fortnite',   'Fortnite (V-Bucks 1000)',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1900883/header.jpg',            9.99),
  ('horizon',    'Horizon Forbidden West',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/2420110/library_600x900.jpg', 59.99),
  ('godofwar',   'God of War Ragnarök',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/library_600x900.jpg', 69.99);


-- ============================================================
--  8. RELACIONES JUEGO ↔ GÉNERO
-- ============================================================
INSERT INTO juego_genero (juego_id, genero_id)
SELECT j.id, g.id
FROM juegos j, generos g
WHERE
  (j.slug='cyberpunk'  AND g.codigo='action') OR
  (j.slug='witcher3'   AND g.codigo='rpg')    OR
  (j.slug='eldenring'  AND g.codigo='action') OR
  (j.slug='rdr2'       AND g.codigo='action') OR
  (j.slug='baldurs'    AND g.codigo='rpg')    OR
  (j.slug='starfield'  AND g.codigo='rpg')    OR
  (j.slug='hogwarts'   AND g.codigo='action') OR
  (j.slug='gtav'       AND g.codigo='action') OR
  (j.slug='eafc25'     AND g.codigo='sports') OR
  (j.slug='cod'        AND g.codigo='fps')    OR
  (j.slug='darksouls3' AND g.codigo='action') OR
  (j.slug='re4'        AND g.codigo='horror') OR
  (j.slug='deadspace'  AND g.codigo='horror') OR
  (j.slug='hades2'     AND g.codigo='indie')  OR
  (j.slug='celeste'    AND g.codigo='indie')  OR
  (j.slug='stardew'    AND g.codigo='indie')  OR
  (j.slug='minecraft'  AND g.codigo='indie')  OR
  (j.slug='fortnite'   AND g.codigo='fps')    OR
  (j.slug='horizon'    AND g.codigo='action') OR
  (j.slug='godofwar'   AND g.codigo='action');


-- ============================================================
--  9. RELACIONES JUEGO ↔ PLATAFORMA
-- ============================================================
INSERT INTO juego_plataforma (juego_id, plataforma_id)
SELECT j.id, p.id
FROM juegos j, plataformas p
WHERE
  (j.slug='cyberpunk'  AND p.codigo='steam')  OR
  (j.slug='witcher3'   AND p.codigo='steam')  OR
  (j.slug='eldenring'  AND p.codigo='steam')  OR
  (j.slug='eldenring'  AND p.codigo='ps5')    OR
  (j.slug='eldenring'  AND p.codigo='xbox')   OR
  (j.slug='rdr2'       AND p.codigo='steam')  OR
  (j.slug='rdr2'       AND p.codigo='ps4')    OR
  (j.slug='rdr2'       AND p.codigo='xbox')   OR
  (j.slug='baldurs'    AND p.codigo='steam')  OR
  (j.slug='baldurs'    AND p.codigo='ps5')    OR
  (j.slug='starfield'  AND p.codigo='steam')  OR
  (j.slug='starfield'  AND p.codigo='xbox')   OR
  (j.slug='hogwarts'   AND p.codigo='steam')  OR
  (j.slug='hogwarts'   AND p.codigo='ps5')    OR
  (j.slug='hogwarts'   AND p.codigo='xbox')   OR
  (j.slug='gtav'       AND p.codigo='steam')  OR
  (j.slug='gtav'       AND p.codigo='ps5')    OR
  (j.slug='gtav'       AND p.codigo='ps4')    OR
  (j.slug='gtav'       AND p.codigo='xbox')   OR
  (j.slug='eafc25'     AND p.codigo='steam')  OR
  (j.slug='eafc25'     AND p.codigo='ps5')    OR
  (j.slug='eafc25'     AND p.codigo='xbox')   OR
  (j.slug='cod'        AND p.codigo='steam')  OR
  (j.slug='cod'        AND p.codigo='ps5')    OR
  (j.slug='cod'        AND p.codigo='xbox')   OR
  (j.slug='darksouls3' AND p.codigo='steam')  OR
  (j.slug='darksouls3' AND p.codigo='xbox')   OR
  (j.slug='re4'        AND p.codigo='steam')  OR
  (j.slug='re4'        AND p.codigo='ps5')    OR
  (j.slug='deadspace'  AND p.codigo='steam')  OR
  (j.slug='deadspace'  AND p.codigo='ps5')    OR
  (j.slug='hades2'     AND p.codigo='steam')  OR
  (j.slug='celeste'    AND p.codigo='steam')  OR
  (j.slug='celeste'    AND p.codigo='switch') OR
  (j.slug='stardew'    AND p.codigo='steam')  OR
  (j.slug='stardew'    AND p.codigo='switch') OR
  (j.slug='minecraft'  AND p.codigo='xbox')   OR
  (j.slug='minecraft'  AND p.codigo='switch') OR
  (j.slug='fortnite'   AND p.codigo='ps5')    OR
  (j.slug='fortnite'   AND p.codigo='xbox')   OR
  (j.slug='fortnite'   AND p.codigo='switch') OR
  (j.slug='horizon'    AND p.codigo='ps5')    OR
  (j.slug='horizon'    AND p.codigo='ps4')    OR
  (j.slug='horizon'    AND p.codigo='steam')  OR
  (j.slug='godofwar'   AND p.codigo='ps5')    OR
  (j.slug='godofwar'   AND p.codigo='ps4')    OR
  (j.slug='godofwar'   AND p.codigo='steam');


-- ============================================================
--  10. OFERTAS (precios por tienda y plataforma)
-- ============================================================

-- Cyberpunk 2077 (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'steamkeys'    AS t_codigo, 'account' AS tipo, 'Global' AS region, 'ok'  AS stock, 3.99  AS precio UNION ALL
 SELECT 'kinguin',                  'account',         'Global',            'low',          4.20           UNION ALL
 SELECT 'cdkeys',                   'code',            'Global',            'ok',           5.49           UNION ALL
 SELECT 'eneba',                    'code',            'Europa',            'ok',           6.19           UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',           6.89           UNION ALL
 SELECT 'offgamers',                'code',            'Global',            'ok',           7.49           UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',           8.99           UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',           9.99           UNION ALL
 SELECT 'gamebillet',               'code',            'Europa',            'ok',           11.39          UNION ALL
 SELECT 'gamesplanet',              'code',            'Europa',            'low',          14.99) AS o
WHERE j.slug     = 'cyberpunk'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Elden Ring (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'kinguin'      AS t_codigo, 'account' AS tipo, 'Global' AS region, 'low' AS stock, 14.99 AS precio UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',           19.99          UNION ALL
 SELECT 'cdkeys',                   'code',            'Europa',            'ok',           22.49          UNION ALL
 SELECT 'eneba',                    'code',            'Europa',            'ok',           24.99          UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',           26.99          UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',           28.49          UNION ALL
 SELECT 'gamebillet',               'code',            'Europa',            'ok',           31.99          UNION ALL
 SELECT 'gamesplanet',              'code',            'Europa',            'ok',           34.99) AS o
WHERE j.slug     = 'eldenring'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Elden Ring (PS5)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'psstore' AS t_codigo, 'code' AS tipo, 'Europa' AS region, 'ok' AS stock, 39.99 AS precio UNION ALL
 SELECT 'eneba',               'code',         'Europa',            'ok',           29.99          UNION ALL
 SELECT 'cdkeys',              'code',         'Europa',            'ok',           27.99) AS o
WHERE j.slug     = 'eldenring'
  AND p.codigo   = 'ps5'
  AND t.codigo   = o.t_codigo;

-- Elden Ring (Xbox)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'xboxstore' AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok'  AS stock, 35.99 AS precio UNION ALL
 SELECT 'cdkeys',                'code',            'Global',            'ok',           25.99          UNION ALL
 SELECT 'kinguin',               'account',         'Global',            'low',          14.99) AS o
WHERE j.slug     = 'eldenring'
  AND p.codigo   = 'xbox'
  AND t.codigo   = o.t_codigo;

-- Baldur's Gate 3 (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'kinguin'      AS t_codigo, 'account' AS tipo, 'Global' AS region, 'ok' AS stock, 22.99 AS precio UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',          29.99          UNION ALL
 SELECT 'cdkeys',                   'code',            'Global',            'ok',          34.99          UNION ALL
 SELECT 'eneba',                    'code',            'Europa',            'ok',          36.99          UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',          39.99          UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          41.99) AS o
WHERE j.slug     = 'baldurs'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Baldur's Gate 3 (PS5)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'psstore' AS t_codigo, 'code' AS tipo, 'Europa' AS region, 'ok' AS stock, 49.99 AS precio UNION ALL
 SELECT 'cdkeys',              'code',         'Europa',            'ok',           38.99          UNION ALL
 SELECT 'eneba',               'code',         'Europa',            'ok',           41.99) AS o
WHERE j.slug     = 'baldurs'
  AND p.codigo   = 'ps5'
  AND t.codigo   = o.t_codigo;

-- God of War Ragnarök (PS5)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'kinguin'      AS t_codigo, 'account' AS tipo, 'Global' AS region, 'low' AS stock, 22.99 AS precio UNION ALL
 SELECT 'eneba',                    'code',            'Europa',            'ok',           29.99          UNION ALL
 SELECT 'cdkeys',                   'code',            'Global',            'ok',           32.99          UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',           28.99          UNION ALL
 SELECT 'psstore',                  'code',            'Europa',            'ok',           49.99          UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',           34.99          UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',           36.99) AS o
WHERE j.slug     = 'godofwar'
  AND p.codigo   = 'ps5'
  AND t.codigo   = o.t_codigo;

-- God of War Ragnarök (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code' AS tipo, 'Global' AS region, 'ok' AS stock, 34.99 AS precio UNION ALL
 SELECT 'fanatical',                'code',         'Global',            'ok',          37.99          UNION ALL
 SELECT 'instantgaming',            'code',         'Europa',            'ok',          36.49) AS o
WHERE j.slug     = 'godofwar'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- The Witcher 3 (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 4.99  AS precio UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          5.99           UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',          6.49           UNION ALL
 SELECT 'kinguin',                  'account',         'Global',            'ok',          3.99           UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',          7.49) AS o
WHERE j.slug     = 'witcher3'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Red Dead Redemption 2 (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 14.99 AS precio UNION ALL
 SELECT 'kinguin',                  'account',         'Global',            'ok',          9.99           UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          16.99          UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',          18.49) AS o
WHERE j.slug     = 'rdr2'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Red Dead Redemption 2 (PS4)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Europa', 'ok', 19.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 'rdr2'
  AND p.codigo = 'ps4'
  AND t.codigo = 'psstore';

-- Starfield (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok'  AS stock, 19.99 AS precio UNION ALL
 SELECT 'kinguin',                  'account',         'Global',            'low',          14.99          UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',           22.99          UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',           24.49          UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',           26.99) AS o
WHERE j.slug     = 'starfield'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Starfield (Xbox)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Global', 'ok', 21.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 'starfield'
  AND p.codigo = 'xbox'
  AND t.codigo = 'xboxstore';

-- Hogwarts Legacy (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 17.99 AS precio UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          19.99          UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',          21.49          UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',          22.99) AS o
WHERE j.slug     = 'hogwarts'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Hogwarts Legacy (PS5)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Europa', 'ok', 24.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 'hogwarts'
  AND p.codigo = 'ps5'
  AND t.codigo = 'psstore';

-- GTA V (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 8.99  AS precio UNION ALL
 SELECT 'kinguin',                  'account',         'Global',            'ok',          5.99           UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          9.99           UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',          11.49) AS o
WHERE j.slug     = 'gtav'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- GTA V (PS5)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Europa', 'ok', 14.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 'gtav'
  AND p.codigo = 'ps5'
  AND t.codigo = 'psstore';

-- EA FC 25 (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 29.99 AS precio UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          32.99          UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',          34.49          UNION ALL
 SELECT 'eneba',                    'code',            'Europa',            'ok',          31.99) AS o
WHERE j.slug     = 'eafc25'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- EA FC 25 (PS5)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Europa', 'ok', 39.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 'eafc25'
  AND p.codigo = 'ps5'
  AND t.codigo = 'psstore';

-- CoD MW3 (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 34.99 AS precio UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          37.99          UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',          39.49          UNION ALL
 SELECT 'kinguin',                  'account',         'Global',            'ok',          29.99) AS o
WHERE j.slug     = 'cod'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Dark Souls III (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok'  AS stock, 7.99  AS precio UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',           9.49           UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',           10.99          UNION ALL
 SELECT 'kinguin',                  'account',         'Global',            'low',          5.99) AS o
WHERE j.slug     = 'darksouls3'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Resident Evil 4 Remake (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 14.99 AS precio UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          16.99          UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',          18.49          UNION ALL
 SELECT 'g2a',                      'code',            'Global',            'ok',          19.99) AS o
WHERE j.slug     = 're4'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- RE4 (PS5)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Europa', 'ok', 24.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 're4'
  AND p.codigo = 'ps5'
  AND t.codigo = 'psstore';

-- Dead Space Remake (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 12.99 AS precio UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          14.99          UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',          16.49) AS o
WHERE j.slug     = 'deadspace'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Hades II (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'instantgaming' AS t_codigo, 'code' AS tipo, 'Europa' AS region, 'ok' AS stock, 19.99 AS precio UNION ALL
 SELECT 'fanatical',                 'code',         'Global',            'ok',          21.49          UNION ALL
 SELECT 'cdkeys',                    'code',         'Global',            'ok',          18.99) AS o
WHERE j.slug     = 'hades2'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Celeste (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'instantgaming' AS t_codigo, 'code' AS tipo, 'Europa' AS region, 'ok' AS stock, 7.99  AS precio UNION ALL
 SELECT 'fanatical',                 'code',         'Global',            'ok',          8.99           UNION ALL
 SELECT 'cdkeys',                    'code',         'Global',            'ok',          6.99) AS o
WHERE j.slug     = 'celeste'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Celeste (Switch)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Europa', 'ok', 11.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 'celeste'
  AND p.codigo = 'switch'
  AND t.codigo = 'nintendoeshop';

-- Stardew Valley (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'instantgaming' AS t_codigo, 'code' AS tipo, 'Europa' AS region, 'ok' AS stock, 6.99  AS precio UNION ALL
 SELECT 'cdkeys',                    'code',         'Global',            'ok',          5.99           UNION ALL
 SELECT 'fanatical',                 'code',         'Global',            'ok',          7.49) AS o
WHERE j.slug     = 'stardew'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;

-- Stardew Valley (Switch)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Europa', 'ok', 10.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 'stardew'
  AND p.codigo = 'switch'
  AND t.codigo = 'nintendoeshop';

-- Minecraft (Xbox)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Global', 'ok', 14.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 'minecraft'
  AND p.codigo = 'xbox'
  AND t.codigo = 'xboxstore';

-- Minecraft (Switch)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Europa', 'ok', 17.99
FROM juegos j, plataformas p, tiendas t
WHERE j.slug   = 'minecraft'
  AND p.codigo = 'switch'
  AND t.codigo = 'nintendoeshop';

-- Fortnite V-Bucks (PS5)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'  AS t_codigo, 'code' AS tipo, 'Global' AS region, 'ok' AS stock, 7.49 AS precio UNION ALL
 SELECT 'eneba',               'code',         'Europa',            'ok',          7.99) AS o
WHERE j.slug     = 'fortnite'
  AND p.codigo   = 'ps5'
  AND t.codigo   = o.t_codigo;

-- Horizon Forbidden West (PS5)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 24.99 AS precio UNION ALL
 SELECT 'eneba',                    'code',            'Europa',            'ok',          26.99          UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          28.49          UNION ALL
 SELECT 'psstore',                  'code',            'Europa',            'ok',          39.99) AS o
WHERE j.slug     = 'horizon'
  AND p.codigo   = 'ps5'
  AND t.codigo   = o.t_codigo;

-- Horizon Forbidden West (Steam)
INSERT INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, o.tipo, o.region, o.stock, o.precio
FROM juegos j, plataformas p, tiendas t,
(SELECT 'cdkeys'       AS t_codigo, 'code'    AS tipo, 'Global' AS region, 'ok' AS stock, 22.99 AS precio UNION ALL
 SELECT 'instantgaming',            'code',            'Europa',            'ok',          24.99          UNION ALL
 SELECT 'fanatical',                'code',            'Global',            'ok',          26.49) AS o
WHERE j.slug     = 'horizon'
  AND p.codigo   = 'steam'
  AND t.codigo   = o.t_codigo;


-- ============================================================
--  11. VISTAS ÚTILES
-- ============================================================

-- Vista: mejor precio por juego (globalmente)
CREATE OR REPLACE VIEW v_mejor_precio AS
SELECT
  j.id                                                          AS juego_id,
  j.slug,
  j.nombre,
  j.precio_orig,
  MIN(o.precio)                                                 AS mejor_precio,
  ROUND((j.precio_orig - MIN(o.precio)) / j.precio_orig * 100) AS descuento_pct,
  j.precio_orig - MIN(o.precio)                                 AS ahorro
FROM juegos j, ofertas o
WHERE o.juego_id = j.id
  AND o.activa   = 1
GROUP BY j.id, j.slug, j.nombre, j.precio_orig;

-- Vista: mejor precio por juego y plataforma
CREATE OR REPLACE VIEW v_precio_por_plataforma AS
SELECT
  j.id          AS juego_id,
  j.slug,
  j.nombre,
  p.codigo      AS plataforma,
  p.nombre      AS plataforma_nombre,
  t.nombre      AS tienda,
  t.url         AS tienda_url,
  o.tipo,
  o.region,
  o.stock,
  o.precio,
  ROUND((j.precio_orig - o.precio) / j.precio_orig * 100) AS descuento_pct
FROM ofertas o, juegos j, tiendas t, plataformas p
WHERE j.id     = o.juego_id
  AND t.id     = o.tienda_id
  AND p.id     = o.plataforma_id
  AND o.activa = 1
ORDER BY j.nombre, p.codigo, o.precio;

-- Vista: top 10 descuentos activos
CREATE OR REPLACE VIEW v_top_descuentos AS
SELECT
  j.nombre      AS juego,
  t.nombre      AS tienda,
  o.tipo,
  o.region,
  o.precio,
  j.precio_orig,
  ROUND((j.precio_orig - o.precio) / j.precio_orig * 100) AS descuento_pct,
  j.precio_orig - o.precio                                AS ahorro
FROM ofertas o, juegos j, tiendas t
WHERE j.id     = o.juego_id
  AND t.id     = o.tienda_id
  AND o.activa = 1
ORDER BY descuento_pct DESC
LIMIT 10;

-- Vista: géneros de cada juego
CREATE OR REPLACE VIEW v_juego_generos AS
SELECT
  j.slug,
  j.nombre                                                       AS juego,
  GROUP_CONCAT(g.nombre ORDER BY g.nombre SEPARATOR ', ')        AS generos
FROM juegos j, juego_genero jg, generos g
WHERE jg.juego_id  = j.id
  AND g.id         = jg.genero_id
GROUP BY j.id, j.slug, j.nombre;


-- ============================================================
--  12. STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- ── SP: Obtener todas las ofertas de un juego ordenadas por precio ──
CREATE PROCEDURE sp_ofertas_juego(
  IN  p_slug       VARCHAR(60),
  IN  p_plataforma VARCHAR(20)
)
BEGIN
  SELECT
    t.nombre      AS tienda,
    t.icono,
    t.url,
    p.codigo      AS plataforma,
    o.tipo,
    o.region,
    o.stock,
    o.precio,
    j.precio_orig,
    ROUND((j.precio_orig - o.precio) / j.precio_orig * 100) AS descuento_pct,
    o.actualizado_en
  FROM ofertas o, juegos j, tiendas t, plataformas p
  WHERE j.id     = o.juego_id
    AND t.id     = o.tienda_id
    AND p.id     = o.plataforma_id
    AND j.slug   = p_slug
    AND t.activa = 1
    AND o.activa = 1
    AND (p_plataforma IS NULL OR p.codigo = p_plataforma)
  ORDER BY o.precio ASC;
END$$

-- ── SP: Actualizar precio de una oferta ──
CREATE PROCEDURE sp_actualizar_precio(
  IN p_oferta_id  INT UNSIGNED,
  IN p_precio_nvo DECIMAL(8,2)
)
BEGIN
  DECLARE v_precio_ant DECIMAL(8,2);

  SELECT precio INTO v_precio_ant
  FROM ofertas WHERE id = p_oferta_id;

  IF v_precio_ant <> p_precio_nvo THEN
    UPDATE ofertas
    SET precio = p_precio_nvo
    WHERE id = p_oferta_id;

    SELECT 'Precio actualizado' AS resultado,
           v_precio_ant         AS precio_anterior,
           p_precio_nvo         AS precio_nuevo;
  ELSE
    SELECT 'Sin cambios' AS resultado;
  END IF;
END$$

-- ── SP: Buscar juegos por nombre ──
CREATE PROCEDURE sp_buscar_juegos(
  IN p_query       VARCHAR(100),
  IN p_plataforma  VARCHAR(20)
)
BEGIN
  SELECT
    j.slug,
    j.nombre,
    GROUP_CONCAT(DISTINCT g.nombre  ORDER BY g.nombre  SEPARATOR ', ') AS generos,
    j.imagen_url,
    j.precio_orig,
    mp.mejor_precio,
    mp.descuento_pct,
    GROUP_CONCAT(DISTINCT p.codigo  ORDER BY p.codigo  SEPARATOR ',')  AS plataformas
  FROM juegos j, juego_genero jg, generos g, v_mejor_precio mp, ofertas o, plataformas p
  WHERE jg.juego_id  = j.id
    AND g.id         = jg.genero_id
    AND mp.juego_id  = j.id
    AND o.juego_id   = j.id
    AND o.activa     = 1
    AND p.id         = o.plataforma_id
    AND j.nombre     LIKE CONCAT('%', p_query, '%')
    AND j.activo     = 1
    AND (p_plataforma IS NULL OR p.codigo = p_plataforma)
  GROUP BY j.id, j.slug, j.nombre, j.imagen_url, j.precio_orig,
           mp.mejor_precio, mp.descuento_pct
  ORDER BY mp.descuento_pct DESC;
END$$

-- ── SP: Top N ofertas por plataforma ──
CREATE PROCEDURE sp_top_ofertas(
  IN p_plataforma VARCHAR(20),
  IN p_limite     INT
)
BEGIN
  SET p_limite = IFNULL(p_limite, 10);

  SELECT
    j.slug,
    j.nombre,
    j.imagen_url,
    t.nombre      AS tienda,
    p.codigo      AS plataforma,
    o.tipo,
    o.precio,
    j.precio_orig,
    ROUND((j.precio_orig - o.precio) / j.precio_orig * 100) AS descuento_pct
  FROM ofertas o, juegos j, tiendas t, plataformas p
  WHERE j.id     = o.juego_id
    AND j.activo = 1
    AND t.id     = o.tienda_id
    AND t.activa = 1
    AND p.id     = o.plataforma_id
    AND o.activa = 1
    AND (p_plataforma IS NULL OR p.codigo = p_plataforma)
    AND o.precio = (
      SELECT MIN(o2.precio)
      FROM ofertas o2
      WHERE o2.juego_id      = o.juego_id
        AND o2.plataforma_id = o.plataforma_id
        AND o2.activa        = 1
    )
  ORDER BY descuento_pct DESC
  LIMIT p_limite;
END$$

DELIMITER ;


-- ============================================================
--  13. TRIGGERS
-- ============================================================

DELIMITER $$

-- Trigger: guardar historial automáticamente al actualizar precio
CREATE TRIGGER trg_historial_precio
BEFORE UPDATE ON ofertas
FOR EACH ROW
BEGIN
  IF OLD.precio <> NEW.precio THEN
    INSERT INTO historial_precios (oferta_id, precio_ant, precio_nvo)
    VALUES (OLD.id, OLD.precio, NEW.precio);
  END IF;
END$$

-- Trigger: rechazar precio 0 o negativo en INSERT
CREATE TRIGGER trg_validar_precio_insert
BEFORE INSERT ON ofertas
FOR EACH ROW
BEGIN
  IF NEW.precio <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El precio debe ser mayor que 0';
  END IF;
END$$

-- Trigger: rechazar precio 0 o negativo también en UPDATE
CREATE TRIGGER trg_validar_precio_update
BEFORE UPDATE ON ofertas
FOR EACH ROW
BEGIN
  IF NEW.precio <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El precio debe ser mayor que 0';
  END IF;
END$$

DELIMITER ;


-- ============================================================
--  14. DATOS DE EJEMPLO — Usuario admin inicial
-- ============================================================
INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES
  ('admin@codekeys.com',
   '$2b$12$KIXb/UcJqI.3g6bFt3Pj6OwE5mVvFiAbOlJlJwmC9YHkHzK5eASBi',
   'Administrador', 'admin');


-- ============================================================
--  15. CONSULTAS DE EJEMPLO
-- ============================================================

--  Todas las ofertas de Cyberpunk ordenadas por precio
CALL sp_ofertas_juego('cyberpunk', NULL);

--  Ofertas de Elden Ring solo para PS5
CALL sp_ofertas_juego('eldenring', 'ps5');

--  Top 10 descuentos globales
SELECT * FROM v_top_descuentos;

--  Mejor precio por juego
SELECT * FROM v_mejor_precio ORDER BY descuento_pct DESC;

--  Géneros de cada juego
SELECT * FROM v_juego_generos;

--  Buscar juegos que contengan "war"
CALL sp_buscar_juegos('war', NULL);

--  Top 6 ofertas para Steam
CALL sp_top_ofertas('steam', 6);

--  Actualizar precio de la oferta con id=1 a 4.99
CALL sp_actualizar_precio(1, 4.99);

--  Historial de cambios de precios
SELECT
  o.id     AS oferta_id,
  j.nombre AS juego,
  t.nombre AS tienda,
  h.precio_ant,
  h.precio_nvo,
  h.precio_ant - h.precio_nvo AS bajada,
  h.cambiado_en
FROM historial_precios h, ofertas o, juegos j, tiendas t
WHERE o.id  = h.oferta_id
  AND j.id  = o.juego_id
  AND t.id  = o.tienda_id
ORDER BY h.cambiado_en DESC;

--  Ver precios por plataforma
SELECT * FROM v_precio_por_plataforma WHERE slug = 'eldenring';
