-- ============================================================
--  CodeKeys — Base de datos completa
--  Schema + Seed de juegos (20 por plataforma)
--  Compatible con MySQL 8.0+ / AWS RDS MySQL / AWS Aurora MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS codekeys
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE codekeys;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET foreign_key_checks = 0;

-- ─────────────────────────────────────────────────────────────
-- 1. PLATAFORMAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plataformas (
  id     INT          NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(50)  NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  icono  VARCHAR(10)  DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plat_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 2. GENEROS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generos (
  id     INT         NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_genero_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 3. JUEGOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS juegos (
  id               INT           NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(100)  NOT NULL,
  nombre           VARCHAR(200)  NOT NULL,
  imagen_url       VARCHAR(500)  DEFAULT NULL,
  plataforma_texto VARCHAR(200)  DEFAULT NULL,
  precio_base      DECIMAL(10,2) DEFAULT NULL,
  precio_original  DECIMAL(10,2) DEFAULT NULL,
  descuento        INT           DEFAULT 0,
  descripcion      TEXT          DEFAULT NULL,
  platform_tag     VARCHAR(50)   DEFAULT NULL,
  scraper_activo   TINYINT(1)    DEFAULT 0,
  scraper_busqueda VARCHAR(200)  DEFAULT NULL,
  activo           TINYINT(1)    DEFAULT 1,
  creado_en        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_juego_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 4. JUEGO_GENEROS (N:M)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS juego_generos (
  juego_id  INT NOT NULL,
  genero_id INT NOT NULL,
  PRIMARY KEY (juego_id, genero_id),
  FOREIGN KEY fk_jg_juego  (juego_id)  REFERENCES juegos(id)  ON DELETE CASCADE,
  FOREIGN KEY fk_jg_genero (genero_id) REFERENCES generos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 5. TIENDAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tiendas (
  id             INT           NOT NULL AUTO_INCREMENT,
  codigo         VARCHAR(50)   NOT NULL,
  nombre         VARCHAR(100)  NOT NULL,
  descripcion    TEXT          DEFAULT NULL,
  logo_url       VARCHAR(300)  DEFAULT NULL,
  rating         DECIMAL(3,1)  DEFAULT 0.0,
  votos          INT           DEFAULT 0,
  scraper_activo TINYINT(1)    DEFAULT 0,
  url_base       VARCHAR(300)  DEFAULT NULL,
  activa         TINYINT(1)    DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tienda_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 6. OFERTAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ofertas (
  id            INT           NOT NULL AUTO_INCREMENT,
  juego_id      INT           NOT NULL,
  tienda_id     INT           NOT NULL,
  plataforma_id INT           NOT NULL,
  tipo          VARCHAR(20)   DEFAULT 'code',
  region        VARCHAR(50)   DEFAULT 'Global',
  stock         VARCHAR(20)   DEFAULT 'ok',
  precio        DECIMAL(10,2) NOT NULL,
  activa        TINYINT(1)    DEFAULT 1,
  actualizado   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_oferta (juego_id, tienda_id, plataforma_id, tipo, region),
  FOREIGN KEY fk_of_juego  (juego_id)      REFERENCES juegos(id)      ON DELETE CASCADE,
  FOREIGN KEY fk_of_tienda (tienda_id)     REFERENCES tiendas(id)     ON DELETE CASCADE,
  FOREIGN KEY fk_of_plat   (plataforma_id) REFERENCES plataformas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 7. PRECIO_HISTORIAL
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS precio_historial (
  id              INT           NOT NULL AUTO_INCREMENT,
  oferta_id       INT           NOT NULL,
  precio_anterior DECIMAL(10,2) NOT NULL,
  precio_nuevo    DECIMAL(10,2) NOT NULL,
  fecha_cambio    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY fk_ph_oferta (oferta_id) REFERENCES ofertas(id) ON DELETE CASCADE,
  INDEX idx_ph_oferta (oferta_id),
  INDEX idx_ph_fecha  (fecha_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 8. USUARIOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id            VARCHAR(60)  NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(200) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('admin','normal') DEFAULT 'normal',
  activo        TINYINT(1)   DEFAULT 1,
  creado_en     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 9. USER_PREFERENCIAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferencias (
  usuario_id VARCHAR(60) NOT NULL,
  tema       VARCHAR(10) DEFAULT 'dark',
  moneda     VARCHAR(5)  DEFAULT 'EUR',
  idioma     VARCHAR(5)  DEFAULT 'es',
  PRIMARY KEY (usuario_id),
  FOREIGN KEY fk_up_usuario (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 10. USER_FAVORITOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favoritos (
  usuario_id VARCHAR(60) NOT NULL,
  juego_id   INT         NOT NULL,
  creado_en  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, juego_id),
  FOREIGN KEY fk_uf_usuario (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY fk_uf_juego   (juego_id)   REFERENCES juegos(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 11. SESIONES_HISTORIAL
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones_historial (
  id         INT         NOT NULL AUTO_INCREMENT,
  usuario_id VARCHAR(60) NOT NULL,
  juego_id   INT         NOT NULL,
  visto_en   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY fk_sh_usuario (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY fk_sh_juego   (juego_id)   REFERENCES juegos(id)   ON DELETE CASCADE,
  INDEX idx_sh_usuario (usuario_id),
  INDEX idx_sh_visto   (visto_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 12. BLOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blogs (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  titulo           VARCHAR(300) NOT NULL,
  imagen_principal VARCHAR(500) DEFAULT NULL,
  contenido        LONGTEXT     NOT NULL,
  autor_id         VARCHAR(60)  DEFAULT NULL,
  publicado        TINYINT(1)   DEFAULT 1,
  creado_en        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY fk_bl_autor (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 13. ALERTAS_PRECIO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alertas_precio (
  id            INT           NOT NULL AUTO_INCREMENT,
  usuario_id    VARCHAR(60)   NOT NULL,
  juego_id      INT           NOT NULL,
  precio_alerta DECIMAL(10,2) NOT NULL,
  activa        TINYINT(1)    DEFAULT 1,
  creado_en     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY fk_ap_usuario (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY fk_ap_juego   (juego_id)   REFERENCES juegos(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- STORED PROCEDURE: sp_actualizar_precio
-- ─────────────────────────────────────────────────────────────
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_actualizar_precio$$
CREATE PROCEDURE sp_actualizar_precio(
  IN p_oferta_id    INT,
  IN p_nuevo_precio DECIMAL(10,2)
)
BEGIN
  DECLARE v_precio_anterior DECIMAL(10,2);

  SELECT precio INTO v_precio_anterior
  FROM   ofertas
  WHERE  id = p_oferta_id;

  IF v_precio_anterior IS NOT NULL AND v_precio_anterior <> p_nuevo_precio THEN
    INSERT INTO precio_historial (oferta_id, precio_anterior, precio_nuevo)
    VALUES (p_oferta_id, v_precio_anterior, p_nuevo_precio);
  END IF;

  UPDATE ofertas
  SET    precio     = p_nuevo_precio,
         actualizado = CURRENT_TIMESTAMP
  WHERE  id = p_oferta_id;
END$$

DELIMITER ;

-- ============================================================
-- DATOS INICIALES (SEED)
-- ============================================================

-- ── PLATAFORMAS ─────────────────────────────────────────────
INSERT INTO plataformas (codigo, nombre, icono) VALUES
  ('steam',  'PC Steam',           '🖥️'),
  ('epic',   'Epic Games',         '🔵'),
  ('ps5',    'PlayStation 5',      '🎮'),
  ('ps4',    'PlayStation 4',      '🎮'),
  ('psn',    'PlayStation Network','🎮'),
  ('xbox',   'Xbox',               '🟩'),
  ('switch', 'Nintendo Switch',    '🔴'),
  ('origin', 'Origin / EA App',    '🟠'),
  ('uplay',  'Ubisoft Connect',    '🔵'),
  ('mobile', 'Mobile',             '📱')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ── GENEROS ─────────────────────────────────────────────────
INSERT INTO generos (nombre) VALUES
  ('Accion'),('RPG'),('FPS'),('Aventura'),('Estrategia'),
  ('Simulacion'),('Deportes'),('Terror'),('Indie'),
  ('Multijugador'),('Carreras'),('MMORPG')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ── TIENDAS ─────────────────────────────────────────────────
INSERT INTO tiendas (codigo, nombre, descripcion, logo_url, rating, votos, scraper_activo, url_base) VALUES
  ('cdkeys',        'CDKeys',          'Tienda de claves digitales con grandes descuentos',       '/logos/cdkeys.png',        4.3, 180, 1, 'https://www.cdkeys.com'),
  ('instantgaming', 'Instant Gaming',  'Tienda francesa especializada en juegos PC y consola',   '/logos/instantgaming.png', 4.7, 367, 1, 'https://www.instant-gaming.com'),
  ('eneba',         'Eneba',           'Marketplace europeo de claves digitales',                 '/logos/eneba.png',         4.2, 319, 1, 'https://www.eneba.com'),
  ('kinguin',       'Kinguin',         'Gran marketplace global de claves de videojuegos',        '/logos/kinguin.png',       4.0, 157, 0, 'https://www.kinguin.net'),
  ('g2a',           'G2A',             'Mayor marketplace mundial de claves digitales',           '/logos/g2a.png',           3.9,  63, 0, 'https://www.g2a.com'),
  ('gamivo',        'Gamivo',          'Tienda online de claves de juegos digitales',             '/logos/gamivo.png',        4.1, 210, 0, 'https://www.gamivo.com'),
  ('hrkgame',       'HRKGame',         'Tienda de videojuegos y software digitales',              '/logos/hrkgame.png',       3.8,  95, 0, 'https://www.hrkgame.com'),
  ('mmoga',         'MMOGA',           'Tienda de claves y divisas de videojuegos',               '/logos/mmoga.png',         3.7, 120, 0, 'https://www.mmoga.com'),
  ('sologame',      'Sologame',        'Tienda especializada en claves de PC',                    '/logos/sologame.png',      3.5,  80, 0, 'https://sologame.eu'),
  ('royalcdkeys',   'RoyalCDKeys',     'Claves digitales a precios competitivos',                 '/logos/royalcdkeys.png',   4.0,  60, 0, 'https://royalcdkeys.com')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), rating = VALUES(rating), votos = VALUES(votos);

-- ── JUEGOS ──────────────────────────────────────────────────
INSERT INTO juegos (slug, nombre, imagen_url, plataforma_texto, precio_base, precio_original, descuento, descripcion, platform_tag, scraper_activo, scraper_busqueda) VALUES
-- STEAM (20 juegos)
('cyberpunk',        'Cyberpunk 2077',                  'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg', 'PC Steam',    3.99,  59.99, 93, 'RPG futurista de mundo abierto de CD Projekt Red.',                          'steam', 1, 'Cyberpunk 2077'),
('witcher3',         'The Witcher 3: Wild Hunt',         'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg',  'PC Steam',    1.99,  29.99, 93, 'Aventura epica de fantasia protagonizada por Geralt de Rivia.',               'steam', 1, 'The Witcher 3 Wild Hunt'),
('darksouls3',       'Dark Souls III',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/library_600x900.jpg',  'PC Steam',    3.49,  39.99, 91, 'RPG de accion con combate exigente de FromSoftware.',                         'steam', 1, 'Dark Souls III'),
('rdr2',             'Red Dead Redemption 2',            'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg', 'PC Steam',    5.99,  59.99, 90, 'Western de mundo abierto con una historia profunda y realista.',               'steam', 1, 'Red Dead Redemption 2'),
('starfield',        'Starfield',                        'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/library_600x900.jpg', 'PC Steam',    6.99,  69.99, 90, 'RPG de ciencia ficcion y exploracion espacial de Bethesda.',                  'steam', 1, 'Starfield'),
('eldenring',        'Elden Ring',                       'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg', 'PC Steam',   14.99,  59.99, 75, 'Accion RPG en mundo abierto de FromSoftware y George R. R. Martin.',          'steam', 1, 'Elden Ring'),
('hogwarts',         'Hogwarts Legacy',                  'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/library_600x900.jpg',  'PC Steam',   17.99,  59.99, 70, 'Explora el mundo magico de Harry Potter en una nueva aventura RPG.',          'steam', 1, 'Hogwarts Legacy'),
('bg3',              "Baldur's Gate 3",                  'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900.jpg', 'PC Steam',   22.99,  59.99, 62, 'RPG por turnos ambientado en el universo de Dungeons and Dragons.',           'steam', 1, "Baldur's Gate 3"),
('re4',              'Resident Evil 4 Remake',           'https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg', 'PC Steam',   12.99,  49.99, 74, 'Remake del clasico survival horror de Capcom.',                               'steam', 1, 'Resident Evil 4'),
('gtav',             'Grand Theft Auto V',               'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg',  'PC Steam',    5.99,  29.99, 80, 'El juego de mundo abierto mas vendido de la historia.',                       'steam', 1, 'Grand Theft Auto V'),
('celeste',          'Celeste',                          'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg',  'PC Steam',    1.99,  19.99, 90, 'Juego de plataformas indie aclamado por critica y jugadores.',                'steam', 0, NULL),
('hades2',           'Hades II',                         'https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/library_600x900.jpg', 'PC Steam',   13.49,  26.99, 50, 'Roguelike de accion ambientado en la mitologia griega.',                      'steam', 0, NULL),
('stardew',          'Stardew Valley',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/library_600x900.jpg',  'PC Steam',    3.99,  13.99, 71, 'Juego de granja y vida en un pueblo encantador.',                             'steam', 0, NULL),
('deadspace',        'Dead Space Remake',                'https://cdn.cloudflare.steamstatic.com/steam/apps/1693980/library_600x900.jpg', 'PC Steam',    9.99,  49.99, 80, 'Remake del clasico survival horror de ciencia ficcion.',                      'steam', 0, NULL),
('horizonsteam',     'Horizon Forbidden West PC',        'https://cdn.cloudflare.steamstatic.com/steam/apps/2420110/library_600x900.jpg', 'PC Steam',   18.99,  59.99, 68, 'Aventura de accion en un mundo post-apocaliptico protagonizada por Aloy.',    'steam', 0, NULL),
('gowsteam',         'God of War PC',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/library_600x900.jpg', 'PC Steam',   17.99,  49.99, 64, 'Kratos regresa en una epica aventura de accion y mitologia.',                 'steam', 0, NULL),
('helldivers2',      'HELLDIVERS 2',                     'https://cdn.cloudflare.steamstatic.com/steam/apps/553850/library_600x900.jpg',  'PC Steam',   19.99,  39.99, 50, 'Shooter cooperativo de ciencia ficcion con accion frenetica.',                'steam', 0, NULL),
('spidermansteam',   "Marvel's Spider-Man Remastered",   'https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/library_600x900.jpg', 'PC Steam',   23.49,  59.99, 61, 'Vive la experiencia de ser Spider-Man en esta remasterizacion.',              'steam', 0, NULL),
('mw3steam',         'Call of Duty: MW3 PC',             'https://cdn.cloudflare.steamstatic.com/steam/apps/2519060/library_600x900.jpg', 'PC Steam',   34.99,  69.99, 50, 'FPS multijugador de la saga Call of Duty.',                                   'steam', 0, NULL),
('dragonsdogma2',    "Dragon's Dogma 2",                 'https://cdn.cloudflare.steamstatic.com/steam/apps/2054970/library_600x900.jpg', 'PC Steam',   41.49,  69.99, 41, 'Secuela del aclamado RPG de accion y fantasia de Capcom.',                    'steam', 0, NULL),

-- PS5 (20 juegos)
('gowr',             'God of War Ragnarok',              'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/library_600x900.jpg', 'PS5',        22.99,  69.99, 67, 'Continua la epica saga de Kratos y Atreus en la mitologia nordica.',          'ps5',   0, NULL),
('horizonps5',       'Horizon Forbidden West PS5',       'https://cdn.cloudflare.steamstatic.com/steam/apps/2420110/library_600x900.jpg', 'PS5',        18.99,  59.99, 68, 'Aventura de accion en un mundo post-apocaliptico protagonizada por Aloy.',    'ps5',   0, NULL),
('spiderman2',       "Marvel's Spider-Man 2",            'https://cdn.cloudflare.steamstatic.com/steam/apps/2507520/library_600x900.jpg', 'PS5',        49.99,  79.99, 38, 'Secuela del aclamado juego de Spider-Man exclusivo de PlayStation.',          'ps5',   0, NULL),
('ffxvi',            'Final Fantasy XVI',                'https://cdn.cloudflare.steamstatic.com/steam/apps/2233880/library_600x900.jpg', 'PS5',        39.99,  79.99, 50, 'La nueva entrega de la legendaria saga de rol japones.',                      'ps5',   0, NULL),
('bg3ps5',           "Baldur's Gate 3 PS5",              'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900.jpg', 'PS5',        38.99,  69.99, 44, 'RPG por turnos ambientado en el universo de Dungeons and Dragons.',           'ps5',   0, NULL),
('eldenringps5',     'Elden Ring PS5',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg', 'PS5',        27.99,  69.99, 60, 'Accion RPG en mundo abierto de FromSoftware y George R. R. Martin.',          'ps5',   0, NULL),
('re4ps5',           'Resident Evil 4 Remake PS5',       'https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg', 'PS5',        24.99,  59.99, 58, 'Remake del clasico survival horror de Capcom.',                               'ps5',   0, NULL),
('hogwartsps5',      'Hogwarts Legacy PS5',              'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/library_600x900.jpg',  'PS5',        24.99,  69.99, 64, 'Explora el mundo magico de Harry Potter en una nueva aventura RPG.',          'ps5',   0, NULL),
('gowps5',           'God of War PS5',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/library_600x900.jpg', 'PS5',        19.99,  49.99, 60, 'Kratos regresa en una epica aventura de accion y mitologia.',                 'ps5',   0, NULL),
('gtavps5',          'Grand Theft Auto V PS5',           'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg',  'PS5',        14.99,  34.99, 57, 'El juego de mundo abierto mas vendido de la historia.',                       'ps5',   0, NULL),
('deadspaceps5',     'Dead Space Remake PS5',            'https://cdn.cloudflare.steamstatic.com/steam/apps/1693980/library_600x900.jpg', 'PS5',        19.99,  59.99, 67, 'Remake del clasico survival horror de ciencia ficcion.',                      'ps5',   0, NULL),
('helldivers2ps5',   'HELLDIVERS 2 PS5',                 'https://cdn.cloudflare.steamstatic.com/steam/apps/553850/library_600x900.jpg',  'PS5',        24.99,  39.99, 38, 'Shooter cooperativo de ciencia ficcion con accion frenetica.',                'ps5',   0, NULL),
('spidermanps5',     "Marvel's Spider-Man Remastered PS5",'https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/library_600x900.jpg','PS5',        29.99,  59.99, 50, 'Vive la experiencia de ser Spider-Man en esta remasterizacion.',              'ps5',   0, NULL),
('mw3ps5',           'Call of Duty: MW3 PS5',            'https://cdn.cloudflare.steamstatic.com/steam/apps/2519060/library_600x900.jpg', 'PS5',        44.99,  69.99, 36, 'FPS multijugador de la saga Call of Duty.',                                   'ps5',   0, NULL),
('fc25ps5',          'EA SPORTS FC 25 PS5',              'https://cdn.cloudflare.steamstatic.com/steam/apps/2669320/library_600x900.jpg', 'PS5',        35.99,  69.99, 49, 'La nueva entrega de la saga de futbol mas popular.',                          'ps5',   0, NULL),
('fortnite',         'Fortnite V-Bucks 1000',            'https://cdn.cloudflare.steamstatic.com/steam/apps/1262420/library_600x900.jpg', 'PS5',         5.99,   9.99, 40, 'Paquete de 1000 V-Bucks para Fortnite.',                                      'ps5',   0, NULL),
('rdr2ps5',          'Red Dead Redemption 2 PS5',        'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg', 'PS5',        19.99,  59.99, 67, 'Western de mundo abierto con una historia profunda y realista.',               'ps5',   0, NULL),
('alanwake2ps5',     'Alan Wake 2 PS5',                  'https://cdn.cloudflare.steamstatic.com/steam/apps/1903290/library_600x900.jpg', 'PS5',        23.99,  49.99, 52, 'Thriller sobrenatural de la mano de Remedy Entertainment.',                   'ps5',   0, NULL),
('dragonsdogma2ps5', "Dragon's Dogma 2 PS5",             'https://cdn.cloudflare.steamstatic.com/steam/apps/2054970/library_600x900.jpg', 'PS5',        41.49,  69.99, 41, 'Secuela del aclamado RPG de accion y fantasia de Capcom.',                    'ps5',   0, NULL),
('tekken8',          'Tekken 8',                         'https://cdn.cloudflare.steamstatic.com/steam/apps/1778820/library_600x900.jpg', 'PS5',        34.99,  69.99, 50, 'El rey de los juegos de lucha regresa con graficos espectaculares.',           'ps5',   0, NULL),

-- XBOX (20 juegos)
('haloinfinite',     'Halo Infinite',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/1240440/library_600x900.jpg', 'Xbox',       14.99,  59.99, 75, 'Shooter exclusivo de Xbox con campana y multijugador.',                       'xbox',  0, NULL),
('forzamotorsport',  'Forza Motorsport',                 'https://cdn.cloudflare.steamstatic.com/steam/apps/2440510/library_600x900.jpg', 'Xbox',       29.99,  69.99, 57, 'Simulador de carreras realista de Microsoft.',                                'xbox',  0, NULL),
('forza5',           'Forza Horizon 5',                  'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/library_600x900.jpg', 'Xbox',       19.99,  49.99, 60, 'Juego de carreras en mundo abierto ambientado en Mexico.',                    'xbox',  0, NULL),
('starfieldxbox',    'Starfield Xbox',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/library_600x900.jpg', 'Xbox',       21.99,  69.99, 69, 'RPG de ciencia ficcion y exploracion espacial de Bethesda.',                  'xbox',  0, NULL),
('eldenringxbox',    'Elden Ring Xbox',                  'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg', 'Xbox',       25.99,  69.99, 63, 'Accion RPG en mundo abierto de FromSoftware y George R. R. Martin.',          'xbox',  0, NULL),
('hogwartsxbox',     'Hogwarts Legacy Xbox',             'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/library_600x900.jpg',  'Xbox',       19.99,  69.99, 71, 'Explora el mundo magico de Harry Potter en una nueva aventura RPG.',          'xbox',  0, NULL),
('gtavxbox',         'Grand Theft Auto V Xbox',          'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg',  'Xbox',       11.99,  34.99, 66, 'El juego de mundo abierto mas vendido de la historia.',                       'xbox',  0, NULL),
('mw3xbox',          'Call of Duty: MW3 Xbox',           'https://cdn.cloudflare.steamstatic.com/steam/apps/2519060/library_600x900.jpg', 'Xbox',       39.99,  69.99, 43, 'FPS multijugador de la saga Call of Duty.',                                   'xbox',  0, NULL),
('fc25xbox',         'EA SPORTS FC 25 Xbox',             'https://cdn.cloudflare.steamstatic.com/steam/apps/2669320/library_600x900.jpg', 'Xbox',       29.99,  69.99, 57, 'La nueva entrega de la saga de futbol mas popular.',                          'xbox',  0, NULL),
('minecraftxbox',    'Minecraft Xbox',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/library_600x900.jpg', 'Xbox',        8.49,  24.99, 66, 'Juego de construccion y supervivencia en un mundo de bloques.',               'xbox',  0, NULL),
('rdr2xbox',         'Red Dead Redemption 2 Xbox',       'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg', 'Xbox',       14.99,  59.99, 75, 'Western de mundo abierto con una historia profunda y realista.',               'xbox',  0, NULL),
('darksouls3xbox',   'Dark Souls III Xbox',              'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/library_600x900.jpg',  'Xbox',       12.99,  39.99, 68, 'RPG de accion con combate exigente de FromSoftware.',                         'xbox',  0, NULL),
('cyberpunkxbox',    'Cyberpunk 2077 Xbox',              'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg', 'Xbox',        7.99,  59.99, 87, 'RPG futurista de mundo abierto de CD Projekt Red.',                           'xbox',  0, NULL),
('alanwake2xbox',    'Alan Wake 2 Xbox',                 'https://cdn.cloudflare.steamstatic.com/steam/apps/1903290/library_600x900.jpg', 'Xbox',       23.99,  49.99, 52, 'Thriller sobrenatural de la mano de Remedy Entertainment.',                   'xbox',  0, NULL),
('tekken8xbox',      'Tekken 8 Xbox',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/1778820/library_600x900.jpg', 'Xbox',       34.99,  69.99, 50, 'El rey de los juegos de lucha regresa con graficos espectaculares.',           'xbox',  0, NULL),
('fortnitexbox',     'Fortnite V-Bucks 1000 Xbox',       'https://cdn.cloudflare.steamstatic.com/steam/apps/1262420/library_600x900.jpg', 'Xbox',        5.99,   9.99, 40, 'Paquete de 1000 V-Bucks para Fortnite.',                                      'xbox',  0, NULL),
('rocketleaguexbox', 'Rocket League Xbox',               'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900.jpg',  'Xbox',        2.99,  19.99, 85, 'Futbol con coches cohete en arenas llenas de accion.',                        'xbox',  0, NULL),
('dragonsdogma2xbox',"Dragon's Dogma 2 Xbox",            'https://cdn.cloudflare.steamstatic.com/steam/apps/2054970/library_600x900.jpg', 'Xbox',       41.49,  69.99, 41, 'Secuela del aclamado RPG de accion y fantasia de Capcom.',                    'xbox',  0, NULL),
('bg3xbox',          "Baldur's Gate 3 Xbox",             'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900.jpg', 'Xbox',       38.99,  69.99, 44, 'RPG por turnos ambientado en el universo de Dungeons and Dragons.',           'xbox',  0, NULL),
('fc25xbox2',        'EA FC 24 Xbox',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900.jpg', 'Xbox',       19.99,  39.99, 50, 'Edicion 2024 de la saga de futbol mas popular.',                              'xbox',  0, NULL),

-- SWITCH (20 juegos)
('zeldatotk',        'Zelda: Tears of the Kingdom',      'https://cdn.cloudflare.steamstatic.com/steam/apps/2357570/library_600x900.jpg', 'Switch',     49.99,  69.99, 29, 'Continuacion epica de Breath of the Wild en Nintendo Switch.',                'switch', 0, NULL),
('mariowonder',      'Super Mario Bros. Wonder',          'https://cdn.cloudflare.steamstatic.com/steam/apps/2385200/library_600x900.jpg', 'Switch',     39.99,  59.99, 33, 'Nueva aventura 2D de Mario con poderes magicos.',                             'switch', 0, NULL),
('celesteswitch',    'Celeste Switch',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg',  'Switch',      9.99,  19.99, 50, 'Juego de plataformas indie aclamado por critica y jugadores.',                'switch', 0, NULL),
('stardewswitch',    'Stardew Valley Switch',             'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/library_600x900.jpg',  'Switch',      7.99,  13.99, 43, 'Juego de granja y vida en un pueblo encantador.',                             'switch', 0, NULL),
('minecraftswitch',  'Minecraft Switch',                  'https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/library_600x900.jpg', 'Switch',     14.99,  29.99, 50, 'Juego de construccion y supervivencia en un mundo de bloques.',               'switch', 0, NULL),
('fortnitesw',       'Fortnite V-Bucks 1000 Switch',      'https://cdn.cloudflare.steamstatic.com/steam/apps/1262420/library_600x900.jpg', 'Switch',      5.99,   9.99, 40, 'Paquete de 1000 V-Bucks para Fortnite.',                                      'switch', 0, NULL),
('rocketleaguesw',   'Rocket League Switch',              'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900.jpg',  'Switch',      2.99,  19.99, 85, 'Futbol con coches cohete en arenas llenas de accion.',                        'switch', 0, NULL),
('mariokart8',       'Mario Kart 8 Deluxe',               'https://cdn.cloudflare.steamstatic.com/steam/apps/2357570/library_600x900.jpg', 'Switch',     39.99,  59.99, 33, 'El juego de carreras de karts mas popular de Nintendo.',                      'switch', 0, NULL),
('splatoon3',        'Splatoon 3',                        'https://cdn.cloudflare.steamstatic.com/steam/apps/2385200/library_600x900.jpg', 'Switch',     34.99,  59.99, 42, 'Shooter de accion con tinta de Nintendo.',                                    'switch', 0, NULL),
('animalcrossing',   'Animal Crossing: New Horizons',     'https://cdn.cloudflare.steamstatic.com/steam/apps/1262420/library_600x900.jpg', 'Switch',     34.99,  59.99, 42, 'Juego de vida social en una isla paradisiaca.',                               'switch', 0, NULL),
('pokemonvio',       'Pokemon Violeta',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900.jpg',  'Switch',     39.99,  59.99, 33, 'La nueva generacion de Pokemon en un mundo abierto.',                         'switch', 0, NULL),
('kirbyforgo',       'Kirby y la Tierra Olvidada',        'https://cdn.cloudflare.steamstatic.com/steam/apps/1778820/library_600x900.jpg', 'Switch',     34.99,  59.99, 42, 'Aventura 3D de Kirby en un mundo post-apocaliptico.',                         'switch', 0, NULL),
('metroiddread',     'Metroid Dread',                     'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/library_600x900.jpg', 'Switch',     34.99,  59.99, 42, 'Metroidvania de accion con Samus Aran.',                                      'switch', 0, NULL),
('smashultimatew',   'Super Smash Bros. Ultimate',        'https://cdn.cloudflare.steamstatic.com/steam/apps/553850/library_600x900.jpg',  'Switch',     39.99,  59.99, 33, 'El juego de lucha mas completo de Nintendo.',                                 'switch', 0, NULL),
('bayonetta3',       'Bayonetta 3',                       'https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/library_600x900.jpg', 'Switch',     29.99,  59.99, 50, 'Accion frenetica con la bruja mas estilosa del videojuego.',                  'switch', 0, NULL),
('xenoblade3',       'Xenoblade Chronicles 3',            'https://cdn.cloudflare.steamstatic.com/steam/apps/2507520/library_600x900.jpg', 'Switch',     34.99,  59.99, 42, 'JRPG epico de Monolith Soft con una historia emotiva.',                       'switch', 0, NULL),
('fireemblem',       'Fire Emblem Engage',                'https://cdn.cloudflare.steamstatic.com/steam/apps/2233880/library_600x900.jpg', 'Switch',     34.99,  59.99, 42, 'Estrategia por turnos de la saga Fire Emblem.',                               'switch', 0, NULL),
('pikmin4',          'Pikmin 4',                          'https://cdn.cloudflare.steamstatic.com/steam/apps/2054970/library_600x900.jpg', 'Switch',     34.99,  59.99, 42, 'Juego de estrategia y aventura con los pequenos Pikmin.',                     'switch', 0, NULL),
('zeldabotw',        'Zelda: Breath of the Wild',         'https://cdn.cloudflare.steamstatic.com/steam/apps/2440510/library_600x900.jpg', 'Switch',     34.99,  59.99, 42, 'Aventura de mundo abierto que revoluciono los juegos de Zelda.',              'switch', 0, NULL),
('luigimansion3',    'Luigi Mansion 3',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900.jpg', 'Switch',     29.99,  59.99, 50, 'Aventura de Luigi cazando fantasmas en un hotel encantado.',                  'switch', 0, NULL),

-- EPIC (20 juegos)
('fortniteepic',     'Fortnite V-Bucks 1000 Epic',        'https://cdn.cloudflare.steamstatic.com/steam/apps/1262420/library_600x900.jpg', 'Epic Games',  5.99,   9.99, 40, 'Paquete de 1000 V-Bucks para Fortnite.',                                      'epic',  0, NULL),
('rocketleagueepic', 'Rocket League Epic',                'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900.jpg',  'Epic Games',  2.99,  19.99, 85, 'Futbol con coches cohete en arenas llenas de accion.',                        'epic',  0, NULL),
('alanwake2epic',    'Alan Wake 2 Epic',                  'https://cdn.cloudflare.steamstatic.com/steam/apps/1903290/library_600x900.jpg', 'Epic Games', 23.99,  49.99, 52, 'Thriller sobrenatural de la mano de Remedy Entertainment.',                   'epic',  0, NULL),
('cyberpunkepic',    'Cyberpunk 2077 Epic',               'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg', 'Epic Games',  6.99,  59.99, 88, 'RPG futurista de mundo abierto de CD Projekt Red.',                           'epic',  0, NULL),
('eldenringepic',    'Elden Ring Epic',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg', 'Epic Games', 19.99,  59.99, 67, 'Accion RPG en mundo abierto de FromSoftware y George R. R. Martin.',          'epic',  0, NULL),
('mw3epic',          'Call of Duty: MW3 Epic',            'https://cdn.cloudflare.steamstatic.com/steam/apps/2519060/library_600x900.jpg', 'Epic Games', 34.99,  69.99, 50, 'FPS multijugador de la saga Call of Duty.',                                   'epic',  0, NULL),
('bg3epic',          "Baldur's Gate 3 Epic",              'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900.jpg', 'Epic Games', 29.99,  59.99, 50, 'RPG por turnos ambientado en el universo de Dungeons and Dragons.',           'epic',  0, NULL),
('rdr2epic',         'Red Dead Redemption 2 Epic',        'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg', 'Epic Games',  9.99,  59.99, 83, 'Western de mundo abierto con una historia profunda y realista.',               'epic',  0, NULL),
('hogwartsepic',     'Hogwarts Legacy Epic',              'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/library_600x900.jpg',  'Epic Games', 19.99,  59.99, 67, 'Explora el mundo magico de Harry Potter en una nueva aventura RPG.',          'epic',  0, NULL),
('fc25epic',         'EA SPORTS FC 25 Epic',              'https://cdn.cloudflare.steamstatic.com/steam/apps/2669320/library_600x900.jpg', 'Epic Games', 29.99,  69.99, 57, 'La nueva entrega de la saga de futbol mas popular.',                          'epic',  0, NULL),
('gtavepic',         'Grand Theft Auto V Epic',           'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg',  'Epic Games',  7.99,  29.99, 73, 'El juego de mundo abierto mas vendido de la historia.',                       'epic',  0, NULL),
('starfieldepic',    'Starfield Epic',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/library_600x900.jpg', 'Epic Games', 14.99,  69.99, 79, 'RPG de ciencia ficcion y exploracion espacial de Bethesda.',                  'epic',  0, NULL),
('re4epic',          'Resident Evil 4 Remake Epic',       'https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg', 'Epic Games', 14.99,  49.99, 70, 'Remake del clasico survival horror de Capcom.',                               'epic',  0, NULL),
('forza5epic',       'Forza Horizon 5 Epic',              'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/library_600x900.jpg', 'Epic Games', 19.99,  49.99, 60, 'Juego de carreras en mundo abierto ambientado en Mexico.',                    'epic',  0, NULL),
('celesteepic',      'Celeste Epic',                      'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg',  'Epic Games',  1.99,  19.99, 90, 'Juego de plataformas indie aclamado por critica y jugadores.',                'epic',  0, NULL),
('tekken8epic',      'Tekken 8 Epic',                     'https://cdn.cloudflare.steamstatic.com/steam/apps/1778820/library_600x900.jpg', 'Epic Games', 34.99,  69.99, 50, 'El rey de los juegos de lucha regresa con graficos espectaculares.',           'epic',  0, NULL),
('darksouls3epic',   'Dark Souls III Epic',               'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/library_600x900.jpg',  'Epic Games',  5.99,  39.99, 85, 'RPG de accion con combate exigente de FromSoftware.',                         'epic',  0, NULL),
('dragonsdogmaepic', "Dragon's Dogma 2 Epic",             'https://cdn.cloudflare.steamstatic.com/steam/apps/2054970/library_600x900.jpg', 'Epic Games', 41.49,  69.99, 41, 'Secuela del aclamado RPG de accion y fantasia de Capcom.',                    'epic',  0, NULL),
('hades2epic',       'Hades II Epic',                     'https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/library_600x900.jpg', 'Epic Games', 13.49,  26.99, 50, 'Roguelike de accion ambientado en la mitologia griega.',                      'epic',  0, NULL),
('helldivers2epic',  'HELLDIVERS 2 Epic',                 'https://cdn.cloudflare.steamstatic.com/steam/apps/553850/library_600x900.jpg',  'Epic Games', 19.99,  39.99, 50, 'Shooter cooperativo de ciencia ficcion con accion frenetica.',                'epic',  0, NULL)

ON DUPLICATE KEY UPDATE
  nombre          = VALUES(nombre),
  precio_base     = VALUES(precio_base),
  precio_original = VALUES(precio_original),
  descuento       = VALUES(descuento);

-- ── JUEGO_GENEROS ────────────────────────────────────────────
INSERT IGNORE INTO juego_generos (juego_id, genero_id)
SELECT j.id, g.id FROM juegos j JOIN generos g ON 1=1
WHERE
  (j.slug = 'cyberpunk'         AND g.nombre = 'Accion') OR
  (j.slug = 'witcher3'          AND g.nombre = 'RPG') OR
  (j.slug = 'darksouls3'        AND g.nombre = 'RPG') OR
  (j.slug = 'rdr2'              AND g.nombre = 'Accion') OR
  (j.slug = 'starfield'         AND g.nombre = 'RPG') OR
  (j.slug = 'eldenring'         AND g.nombre = 'RPG') OR
  (j.slug = 'hogwarts'          AND g.nombre = 'RPG') OR
  (j.slug = 'bg3'               AND g.nombre = 'RPG') OR
  (j.slug = 're4'               AND g.nombre = 'Terror') OR
  (j.slug = 'gtav'              AND g.nombre = 'Accion') OR
  (j.slug = 'celeste'           AND g.nombre = 'Indie') OR
  (j.slug = 'hades2'            AND g.nombre = 'Indie') OR
  (j.slug = 'stardew'           AND g.nombre = 'Indie') OR
  (j.slug = 'deadspace'         AND g.nombre = 'Terror') OR
  (j.slug = 'horizonsteam'      AND g.nombre = 'Aventura') OR
  (j.slug = 'gowsteam'          AND g.nombre = 'Accion') OR
  (j.slug = 'helldivers2'       AND g.nombre = 'Accion') OR
  (j.slug = 'spidermansteam'    AND g.nombre = 'Accion') OR
  (j.slug = 'mw3steam'          AND g.nombre = 'FPS') OR
  (j.slug = 'dragonsdogma2'     AND g.nombre = 'RPG') OR
  (j.slug = 'gowr'              AND g.nombre = 'Accion') OR
  (j.slug = 'horizonps5'        AND g.nombre = 'Aventura') OR
  (j.slug = 'spiderman2'        AND g.nombre = 'Accion') OR
  (j.slug = 'ffxvi'             AND g.nombre = 'RPG') OR
  (j.slug = 'bg3ps5'            AND g.nombre = 'RPG') OR
  (j.slug = 'eldenringps5'      AND g.nombre = 'RPG') OR
  (j.slug = 're4ps5'            AND g.nombre = 'Terror') OR
  (j.slug = 'hogwartsps5'       AND g.nombre = 'RPG') OR
  (j.slug = 'gowps5'            AND g.nombre = 'Accion') OR
  (j.slug = 'gtavps5'           AND g.nombre = 'Accion') OR
  (j.slug = 'deadspaceps5'      AND g.nombre = 'Terror') OR
  (j.slug = 'helldivers2ps5'    AND g.nombre = 'Accion') OR
  (j.slug = 'spidermanps5'      AND g.nombre = 'Accion') OR
  (j.slug = 'mw3ps5'            AND g.nombre = 'FPS') OR
  (j.slug = 'fc25ps5'           AND g.nombre = 'Deportes') OR
  (j.slug = 'fortnite'          AND g.nombre = 'Accion') OR
  (j.slug = 'rdr2ps5'           AND g.nombre = 'Accion') OR
  (j.slug = 'alanwake2ps5'      AND g.nombre = 'Terror') OR
  (j.slug = 'dragonsdogma2ps5'  AND g.nombre = 'RPG') OR
  (j.slug = 'tekken8'           AND g.nombre = 'Accion') OR
  (j.slug = 'haloinfinite'      AND g.nombre = 'FPS') OR
  (j.slug = 'forzamotorsport'   AND g.nombre = 'Carreras') OR
  (j.slug = 'forza5'            AND g.nombre = 'Carreras') OR
  (j.slug = 'starfieldxbox'     AND g.nombre = 'RPG') OR
  (j.slug = 'eldenringxbox'     AND g.nombre = 'RPG') OR
  (j.slug = 'hogwartsxbox'      AND g.nombre = 'RPG') OR
  (j.slug = 'gtavxbox'          AND g.nombre = 'Accion') OR
  (j.slug = 'mw3xbox'           AND g.nombre = 'FPS') OR
  (j.slug = 'fc25xbox'          AND g.nombre = 'Deportes') OR
  (j.slug = 'minecraftxbox'     AND g.nombre = 'Indie') OR
  (j.slug = 'rdr2xbox'          AND g.nombre = 'Accion') OR
  (j.slug = 'darksouls3xbox'    AND g.nombre = 'RPG') OR
  (j.slug = 'cyberpunkxbox'     AND g.nombre = 'Accion') OR
  (j.slug = 'alanwake2xbox'     AND g.nombre = 'Terror') OR
  (j.slug = 'tekken8xbox'       AND g.nombre = 'Accion') OR
  (j.slug = 'fortnitexbox'      AND g.nombre = 'Accion') OR
  (j.slug = 'rocketleaguexbox'  AND g.nombre = 'Deportes') OR
  (j.slug = 'dragonsdogma2xbox' AND g.nombre = 'RPG') OR
  (j.slug = 'bg3xbox'           AND g.nombre = 'RPG') OR
  (j.slug = 'fc25xbox2'         AND g.nombre = 'Deportes') OR
  (j.slug = 'zeldatotk'         AND g.nombre = 'Aventura') OR
  (j.slug = 'mariowonder'       AND g.nombre = 'Aventura') OR
  (j.slug = 'celesteswitch'     AND g.nombre = 'Indie') OR
  (j.slug = 'stardewswitch'     AND g.nombre = 'Indie') OR
  (j.slug = 'minecraftswitch'   AND g.nombre = 'Indie') OR
  (j.slug = 'fortnitesw'        AND g.nombre = 'Accion') OR
  (j.slug = 'rocketleaguesw'    AND g.nombre = 'Deportes') OR
  (j.slug = 'mariokart8'        AND g.nombre = 'Carreras') OR
  (j.slug = 'splatoon3'         AND g.nombre = 'Accion') OR
  (j.slug = 'animalcrossing'    AND g.nombre = 'Simulacion') OR
  (j.slug = 'pokemonvio'        AND g.nombre = 'RPG') OR
  (j.slug = 'kirbyforgo'        AND g.nombre = 'Aventura') OR
  (j.slug = 'metroiddread'      AND g.nombre = 'Accion') OR
  (j.slug = 'smashultimatew'    AND g.nombre = 'Accion') OR
  (j.slug = 'bayonetta3'        AND g.nombre = 'Accion') OR
  (j.slug = 'xenoblade3'        AND g.nombre = 'RPG') OR
  (j.slug = 'fireemblem'        AND g.nombre = 'Estrategia') OR
  (j.slug = 'pikmin4'           AND g.nombre = 'Estrategia') OR
  (j.slug = 'zeldabotw'         AND g.nombre = 'Aventura') OR
  (j.slug = 'luigimansion3'     AND g.nombre = 'Aventura') OR
  (j.slug = 'fortniteepic'      AND g.nombre = 'Accion') OR
  (j.slug = 'rocketleagueepic'  AND g.nombre = 'Deportes') OR
  (j.slug = 'alanwake2epic'     AND g.nombre = 'Terror') OR
  (j.slug = 'cyberpunkepic'     AND g.nombre = 'Accion') OR
  (j.slug = 'eldenringepic'     AND g.nombre = 'RPG') OR
  (j.slug = 'mw3epic'           AND g.nombre = 'FPS') OR
  (j.slug = 'bg3epic'           AND g.nombre = 'RPG') OR
  (j.slug = 'rdr2epic'          AND g.nombre = 'Accion') OR
  (j.slug = 'hogwartsepic'      AND g.nombre = 'RPG') OR
  (j.slug = 'fc25epic'          AND g.nombre = 'Deportes') OR
  (j.slug = 'gtavepic'          AND g.nombre = 'Accion') OR
  (j.slug = 'starfieldepic'     AND g.nombre = 'RPG') OR
  (j.slug = 're4epic'           AND g.nombre = 'Terror') OR
  (j.slug = 'forza5epic'        AND g.nombre = 'Carreras') OR
  (j.slug = 'celesteepic'       AND g.nombre = 'Indie') OR
  (j.slug = 'tekken8epic'       AND g.nombre = 'Accion') OR
  (j.slug = 'darksouls3epic'    AND g.nombre = 'RPG') OR
  (j.slug = 'dragonsdogmaepic'  AND g.nombre = 'RPG') OR
  (j.slug = 'hades2epic'        AND g.nombre = 'Indie') OR
  (j.slug = 'helldivers2epic'   AND g.nombre = 'Accion');

-- ── OFERTAS (una por juego en CDKeys como base) ──────────────
INSERT IGNORE INTO ofertas (juego_id, tienda_id, plataforma_id, tipo, region, stock, precio)
SELECT j.id, t.id, p.id, 'code', 'Global', 'ok', j.precio_base
FROM juegos j
JOIN tiendas t ON t.codigo = 'cdkeys'
JOIN plataformas p ON p.codigo = j.platform_tag
WHERE j.platform_tag IN ('steam','ps5','xbox','switch','epic');

-- ── USUARIO ADMIN ────────────────────────────────────────────
INSERT INTO usuarios (id, nombre, email, password_hash, rol)
VALUES ('admin_seed', 'Administrador', 'admin@codekeys.local', SHA2('admin123', 256), 'admin')
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO user_preferencias (usuario_id, tema, moneda, idioma)
VALUES ('admin_seed', 'dark', 'EUR', 'es')
ON DUPLICATE KEY UPDATE tema = VALUES(tema);

SET foreign_key_checks = 1;
-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
