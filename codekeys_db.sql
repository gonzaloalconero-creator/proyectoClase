-- ============================================================
--  CodeKeys — Esquema completo de base de datos
--  Compatible con MySQL 8.0+ / AWS RDS MySQL / AWS Aurora MySQL
--  Autor: generado para proyecto CodeKeys
-- ============================================================

-- Crea la base de datos si no existe
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
-- Actualiza el precio de una oferta y guarda historial si cambió
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

  -- Solo guarda historial si el precio cambió
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
-- NOTA: la clave canónica de Instant Gaming es 'instantgaming' (igual que el scraper)
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
INSERT INTO juegos (slug, nombre, imagen_url, plataforma_texto, precio_base, precio_original, descuento, descripcion, scraper_activo, scraper_busqueda) VALUES
  ('cyberpunk',       'Cyberpunk 2077',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg', 'PC Steam',                       3.99,  59.99, 93, 'Un RPG futurista de mundo abierto desarrollado por CD Projekt Red.',                          1, 'Cyberpunk 2077'),
  ('witcher3',        'The Witcher 3: Wild Hunt',           'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg',  'PC Steam',                       1.99,  29.99, 93, 'Aventura epica de fantasia y monstruos, protagonizada por Geralt de Rivia.',                   1, 'The Witcher 3 Wild Hunt'),
  ('darksouls3',      'Dark Souls III',                     'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/library_600x900.jpg',  'PC Steam / Xbox',                3.49,  39.99, 91, 'RPG de accion con combate exigente desarrollado por FromSoftware.',                           1, 'Dark Souls III'),
  ('rdr2',            'Red Dead Redemption 2',              'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg', 'PC Steam / PS4 / Xbox',          5.99,  59.99, 90, 'Western de mundo abierto con una historia profunda y realista.',                               1, 'Red Dead Redemption 2'),
  ('starfield',       'Starfield',                          'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/library_600x900.jpg', 'PC Steam / Xbox',                6.99,  69.99, 90, 'RPG de ciencia ficcion y exploracion espacial de Bethesda.',                                  1, 'Starfield'),
  ('minecraft',       'Minecraft',                          'https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/library_600x900.jpg', 'PC / Xbox / Switch / Mobile',    8.49,  24.99, 66, 'Juego de construccion y supervivencia en un mundo de bloques.',                               0, NULL),
  ('horizonfw',       'Horizon Forbidden West',             'https://cdn.cloudflare.steamstatic.com/steam/apps/2420110/library_600x900.jpg', 'PS5 / PS4 / PC',                18.99,  59.99, 68, 'Aventura de accion en un mundo post-apocaliptico protagonizada por Aloy.',                    0, NULL),
  ('gowr',            'God of War Ragnarok',                'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/library_600x900.jpg', 'PS5 / PS4 / PC',                22.99,  69.99, 67, 'Continua la epica saga de Kratos y Atreus en la mitologia nordica.',                          0, NULL),
  ('bg3',             "Baldur's Gate 3",                    'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900.jpg', 'PC Steam / PS5',                22.99,  59.99, 62, 'RPG por turnos ambientado en el universo de Dungeons & Dragons.',                             1, "Baldur's Gate 3"),
  ('hades2',          'Hades II',                           'https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/library_600x900.jpg', 'PC Steam',                      13.49,  26.99, 50, 'Roguelike de accion ambientado en la mitologia griega.',                                      0, NULL),
  ('celeste',         'Celeste',                            'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg',  'PC Steam / Switch',              1.99,  19.99, 90, 'Juego de plataformas indie aclamado por critica y jugadores.',                                0, NULL),
  ('re4',             'Resident Evil 4 Remake',             'https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg', 'PC Steam / PS5',                12.99,  49.99, 74, 'Remake del clasico survival horror de Capcom.',                                              1, 'Resident Evil 4'),
  ('forza5',          'Forza Horizon 5',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/library_600x900.jpg', 'PC / Xbox',                     31.99,  49.99, 36, 'Juego de carreras en mundo abierto ambientado en Mexico.',                                    0, NULL),
  ('mw3',             'Call of Duty: MW3',                  'https://cdn.cloudflare.steamstatic.com/steam/apps/2519060/library_600x900.jpg', 'PC / PS5 / Xbox',               44.99,  69.99, 36, 'FPS multijugador de la saga Call of Duty.',                                                  0, NULL),
  ('fifa24',          'EA Sports FC 24',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900.jpg', 'PC / PS5 / Xbox',               25.99,  39.99, 35, 'La nueva entrega de la saga de futbol mas popular (edicion 2024).',                          0, NULL),
  ('alanwake2',       'Alan Wake 2',                        'https://cdn.cloudflare.steamstatic.com/steam/apps/1903290/library_600x900.jpg', 'Epic Games / PS5 / Xbox',       23.99,  49.99, 52, 'Thriller sobrenatural de la mano de Remedy Entertainment.',                                   0, NULL),
  ('fortnite',        'Fortnite',                           'https://cdn.cloudflare.steamstatic.com/steam/apps/1262420/library_600x900.jpg', 'Epic / PS5 / Xbox / Switch',     4.99,  19.99, 75, 'Battle Royale gratuito con actualizaciones constantes.',                                      0, NULL),
  ('rocketleague',    'Rocket League',                      'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900.jpg',  'Epic / PS5 / Xbox / Switch',     2.99,  19.99, 85, 'Futbol con coches cohete en arenas llenas de accion.',                                        0, NULL),
  ('ffxvi',           'Final Fantasy XVI',                  'https://cdn.cloudflare.steamstatic.com/steam/apps/2233880/library_600x900.jpg', 'PS5',                           39.99,  79.99, 50, 'La nueva entrega de la legendaria saga de rol japones.',                                      0, NULL),
  ('spiderman2',      "Marvel's Spider-Man 2",              'https://cdn.cloudflare.steamstatic.com/steam/apps/2507520/library_600x900.jpg', 'PS5',                           49.99,  79.99, 38, 'Secuela del aclamado juego de Spider-Man exclusivo de PlayStation.',                          0, NULL),
  ('haloinfinite',    'Halo Infinite',                      'https://cdn.cloudflare.steamstatic.com/steam/apps/1240440/library_600x900.jpg', 'Xbox / PC',                     14.99,  59.99, 75, 'Shooter en primera persona exclusivo de Xbox con campana y multijugador.',                    0, NULL),
  ('forzamotorsport', 'Forza Motorsport',                   'https://cdn.cloudflare.steamstatic.com/steam/apps/2440510/library_600x900.jpg', 'Xbox / PC',                     29.99,  69.99, 57, 'Simulador de carreras realista de Microsoft.',                                                0, NULL),
  ('zeldatotk',       'Zelda: Tears of the Kingdom',        'https://cdn.cloudflare.steamstatic.com/steam/apps/2357570/library_600x900.jpg', 'Switch',                        49.99,  69.99, 29, 'Continuacion epica de Breath of the Wild en Nintendo Switch.',                                0, NULL),
  ('mariowonder',     'Super Mario Bros. Wonder',           'https://cdn.cloudflare.steamstatic.com/steam/apps/2385200/library_600x900.jpg', 'Switch',                        39.99,  59.99, 33, 'Nueva aventura 2D de Mario con poderes magicos.',                                             0, NULL),
  ('eldenring',       'Elden Ring',                         'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg', 'PC Steam / PS5 / Xbox',         24.99,  59.99, 58, 'Accion y rol en un mundo abierto creado por FromSoftware y George R. R. Martin.',             1, 'Elden Ring'),
  ('hogwarts',        'Hogwarts Legacy',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/library_600x900.jpg',  'PC Steam / PS5 / Xbox',         19.99,  59.99, 67, 'Explora el mundo magico de Harry Potter en una nueva aventura RPG.',                          1, 'Hogwarts Legacy'),
  ('spiderman',       "Marvel's Spider-Man Remastered",     'https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/library_600x900.jpg', 'PC Steam / PS5',                23.49,  59.99, 61, 'Vive la experiencia de ser Spider-Man en esta remasterizacion de accion.',                    0, NULL),
  ('helldivers2',     'HELLDIVERS 2',                       'https://cdn.cloudflare.steamstatic.com/steam/apps/553850/library_600x900.jpg',  'PC Steam / PS5',                31.99,  39.99, 20, 'Shooter cooperativo de ciencia ficcion con accion frenetica.',                                0, NULL),
  ('dragonsdogma2',   "Dragon's Dogma 2",                   'https://cdn.cloudflare.steamstatic.com/steam/apps/2054970/library_600x900.jpg', 'PC Steam / PS5',                41.49,  69.99, 41, 'Secuela del aclamado RPG de accion y fantasia.',                                              0, NULL),
  ('fc25',            'EA SPORTS FC 25',                    'https://cdn.cloudflare.steamstatic.com/steam/apps/2669320/library_600x900.jpg', 'PC / PS5 / Xbox',               35.99,  69.99, 49, 'La nueva entrega de la saga de futbol mas popular (edicion 2025).',                          0, NULL),
  ('gow',             'God of War',                         'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/library_600x900.jpg', 'PC Steam / PS5',                17.99,  49.99, 64, 'Kratos regresa en una epica aventura de accion y mitologia.',                                 0, NULL),
  ('gtav',            'Grand Theft Auto V',                 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg',  'PC Steam / PS5 / Xbox',         14.99,  29.99, 50, 'El juego de mundo abierto mas vendido de la historia.',                                       1, 'Grand Theft Auto V')
ON DUPLICATE KEY UPDATE
  nombre          = VALUES(nombre),
  precio_base     = VALUES(precio_base),
  precio_original = VALUES(precio_original),
  descuento       = VALUES(descuento);

-- ── JUEGO_GENEROS ────────────────────────────────────────────
INSERT IGNORE INTO juego_generos (juego_id, genero_id)
SELECT j.id, g.id FROM juegos j JOIN generos g ON 1=1
WHERE (j.slug = 'cyberpunk'       AND g.nombre = 'Accion')
   OR (j.slug = 'witcher3'        AND g.nombre = 'RPG')
   OR (j.slug = 'darksouls3'      AND g.nombre = 'RPG')
   OR (j.slug = 'rdr2'            AND g.nombre = 'Accion')
   OR (j.slug = 'starfield'       AND g.nombre = 'Accion')
   OR (j.slug = 'minecraft'       AND g.nombre = 'Indie')
   OR (j.slug = 'horizonfw'       AND g.nombre = 'Aventura')
   OR (j.slug = 'gowr'            AND g.nombre = 'Accion')
   OR (j.slug = 'bg3'             AND g.nombre = 'RPG')
   OR (j.slug = 'hades2'          AND g.nombre = 'Indie')
   OR (j.slug = 'celeste'         AND g.nombre = 'Indie')
   OR (j.slug = 're4'             AND g.nombre = 'Terror')
   OR (j.slug = 'forza5'          AND g.nombre = 'Carreras')
   OR (j.slug = 'mw3'             AND g.nombre = 'FPS')
   OR (j.slug = 'fifa24'          AND g.nombre = 'Deportes')
   OR (j.slug = 'alanwake2'       AND g.nombre = 'Terror')
   OR (j.slug = 'fortnite'        AND g.nombre = 'Accion')
   OR (j.slug = 'rocketleague'    AND g.nombre = 'Deportes')
   OR (j.slug = 'ffxvi'           AND g.nombre = 'RPG')
   OR (j.slug = 'spiderman2'      AND g.nombre = 'Accion')
   OR (j.slug = 'haloinfinite'    AND g.nombre = 'FPS')
   OR (j.slug = 'forzamotorsport' AND g.nombre = 'Carreras')
   OR (j.slug = 'zeldatotk'       AND g.nombre = 'Aventura')
   OR (j.slug = 'mariowonder'     AND g.nombre = 'Aventura')
   OR (j.slug = 'eldenring'       AND g.nombre = 'RPG')
   OR (j.slug = 'hogwarts'        AND g.nombre = 'RPG')
   OR (j.slug = 'spiderman'       AND g.nombre = 'Accion')
   OR (j.slug = 'helldivers2'     AND g.nombre = 'Accion')
   OR (j.slug = 'dragonsdogma2'   AND g.nombre = 'RPG')
   OR (j.slug = 'fc25'            AND g.nombre = 'Deportes')
   OR (j.slug = 'gow'             AND g.nombre = 'Accion')
   OR (j.slug = 'gtav'            AND g.nombre = 'Accion');

-- ── USUARIO ADMIN (seed) ─────────────────────────────────────
-- AVISO: actualiza esta contraseña desde el backend con bcrypt
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
