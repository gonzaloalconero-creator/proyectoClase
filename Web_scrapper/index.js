// ============================================================
//  CodeKeys Scraper — Node.js
//  Tiendas: CDKeys, Instant Gaming, Eneba
// ============================================================

import 'dotenv/config';

import { updateOfferInDB, closePool, getValidSlugs }           from './db.js';
import { scrapeCDKeys,        closeBrowser as closeCDKeys }    from './scrapers/cdkeys.js';
import { scrapeInstantGaming, closeBrowser as closeIG }        from './scrapers/instantgaming.js';
import { scrapeEneba,         closeBrowser as closeEneba }     from './scrapers/eneba.js';

// ─── Catálogo de juegos ──────────────────────────────────────────────
// Cada entrada requiere que el slug exista en `juegos` y la plataforma en
// `plataformas`. Las entradas sin match en BD se omiten automáticamente.
// Los slugs se reutilizan entre plataformas: el mismo juego puede tener
// ofertas en steam, xbox y ps5 compartiendo el mismo slug de juego.

const GAMES = [

  // ══════════════════════════════════════════════════════════════════
  //  STEAM (100)
  // ══════════════════════════════════════════════════════════════════

  // — RPG / Acción-RPG ───────────────────────────────────────────────
  { slug: 'cyberpunk',       search: 'Cyberpunk 2077',                     platform: 'steam' },
  { slug: 'witcher3',        search: 'The Witcher 3 Wild Hunt',             platform: 'steam' },
  { slug: 'eldenring',       search: 'Elden Ring',                          platform: 'steam' },
  { slug: 'rdr2',            search: 'Red Dead Redemption 2',               platform: 'steam' },
  { slug: 'bg3',         search: "Baldur's Gate 3",                     platform: 'steam' },
  { slug: 'starfield',       search: 'Starfield',                           platform: 'steam' },
  { slug: 'hogwarts',        search: 'Hogwarts Legacy',                     platform: 'steam' },
  { slug: 'sekiro',          search: 'Sekiro Shadows Die Twice',            platform: 'steam' },
  { slug: 'darksouls3',      search: 'Dark Souls III',                      platform: 'steam' },
  { slug: 'hades',           search: 'Hades',                               platform: 'steam' },
  { slug: 'hades2',          search: 'Hades II',                            platform: 'steam' },
  { slug: 'divinity2',       search: 'Divinity Original Sin 2',             platform: 'steam' },
  { slug: 'persona5',        search: 'Persona 5 Royal',                     platform: 'steam' },
  { slug: 'persona3reload',  search: 'Persona 3 Reload',                    platform: 'steam' },
  { slug: 'metaphor',        search: 'Metaphor ReFantazio',                 platform: 'steam' },
  { slug: 'dragonsdogma2',   search: "Dragon's Dogma 2",                    platform: 'steam' },
  { slug: 'masseffectle',    search: 'Mass Effect Legendary Edition',       platform: 'steam' },
  { slug: 'diablo4',         search: 'Diablo IV',                           platform: 'steam' },
  { slug: 'nierautomata',    search: 'NieR Automata',                       platform: 'steam' },
  { slug: 'outerworlds',     search: 'The Outer Worlds',                    platform: 'steam' },

  // — Shooter / Acción ───────────────────────────────────────────────
  { slug: 'mw3',             search: 'Call of Duty Modern Warfare 3',       platform: 'steam' },
  { slug: 'codbo6',          search: 'Call of Duty Black Ops 6',            platform: 'steam' },
  { slug: 'doom2016',        search: 'DOOM 2016',                           platform: 'steam' },
  { slug: 'doometernal',     search: 'DOOM Eternal',                        platform: 'steam' },
  { slug: 'deathloop',       search: 'Deathloop',                           platform: 'steam' },
  { slug: 'dishonored2',     search: 'Dishonored 2',                        platform: 'steam' },
  { slug: 'prey2017',        search: 'Prey 2017',                           platform: 'steam' },
  { slug: 'ghostwire',       search: 'Ghostwire Tokyo',                     platform: 'steam' },
  { slug: 'rainbowsix',      search: 'Rainbow Six Siege',                   platform: 'steam' },
  { slug: 'battlefield2042', search: 'Battlefield 2042',                    platform: 'steam' },
  { slug: 'helldivers2',     search: 'Helldivers 2',                        platform: 'steam' },
  { slug: 'readyornot',      search: 'Ready or Not',                        platform: 'steam' },

  // — Aventura / Open World ──────────────────────────────────────────
  { slug: 'gtav',            search: 'Grand Theft Auto V',                  platform: 'steam' },
  { slug: 'farcry6',         search: 'Far Cry 6',                           platform: 'steam' },
  { slug: 'farcry5',         search: 'Far Cry 5',                           platform: 'steam' },
  { slug: 'acorigins',       search: "Assassin's Creed Origins",            platform: 'steam' },
  { slug: 'acodyssey',       search: "Assassin's Creed Odyssey",            platform: 'steam' },
  { slug: 'acvalhalla',      search: "Assassin's Creed Valhalla",           platform: 'steam' },
  { slug: 'watchdogslegion', search: 'Watch Dogs Legion',                   platform: 'steam' },
  { slug: 'deathstrand',     search: 'Death Stranding',                     platform: 'steam' },
  { slug: 'ghostoftsushima', search: 'Ghost of Tsushima',                   platform: 'steam' },
  { slug: 'plaguerequiem',   search: 'A Plague Tale Requiem',               platform: 'steam' },
  { slug: 'plagueinnocence', search: 'A Plague Tale Innocence',             platform: 'steam' },
  { slug: 'dragonageveilguard', search: 'Dragon Age The Veilguard',         platform: 'steam' },
  { slug: 'likedragoninfwealth', search: 'Like a Dragon Infinite Wealth',   platform: 'steam' },
  { slug: 'yakuza0',         search: 'Yakuza 0',                            platform: 'steam' },

  // — Horror / Survival ──────────────────────────────────────────────
  { slug: 're4',             search: 'Resident Evil 4 Remake',              platform: 'steam' },
  { slug: 're2',             search: 'Resident Evil 2 Remake',              platform: 'steam' },
  { slug: 're3',             search: 'Resident Evil 3 Remake',              platform: 'steam' },
  { slug: 're8',             search: 'Resident Evil Village',               platform: 'steam' },
  { slug: 'deadspace',       search: 'Dead Space Remake',                   platform: 'steam' },
  { slug: 'deadisland2',     search: 'Dead Island 2',                       platform: 'steam' },
  { slug: 'phasmophobia',    search: 'Phasmophobia',                        platform: 'steam' },

  // — Soulslike / Acción dura ────────────────────────────────────────
  { slug: 'armored6',        search: 'Armored Core VI',                     platform: 'steam' },
  { slug: 'liesp',           search: 'Lies of P',                           platform: 'steam' },
  { slug: 'lordsfallen',     search: 'Lords of the Fallen 2023',            platform: 'steam' },
  { slug: 'wolong',          search: 'Wo Long Fallen Dynasty',              platform: 'steam' },
  { slug: 'nioh2',           search: 'Nioh 2 Complete Edition',             platform: 'steam' },
  { slug: 'stalker2',        search: 'STALKER 2 Heart of Chornobyl',        platform: 'steam' },

  // — Lucha / Deportes ───────────────────────────────────────────────
  { slug: 'fc25',          search: 'EA FC 25',                            platform: 'steam' },
  { slug: 'sf6',             search: 'Street Fighter 6',                    platform: 'steam' },
  { slug: 'mk1',             search: 'Mortal Kombat 1',                     platform: 'steam' },
  { slug: 'tekken8',         search: 'Tekken 8',                            platform: 'steam' },
  { slug: 'f124',            search: 'F1 24',                               platform: 'steam' },
  { slug: 'nfsunbound',      search: 'Need for Speed Unbound',              platform: 'steam' },

  // — Monster Hunter ─────────────────────────────────────────────────
  { slug: 'mhworld',         search: 'Monster Hunter World',                platform: 'steam' },
  { slug: 'mhrise',          search: 'Monster Hunter Rise',                 platform: 'steam' },
  { slug: 'mhwilds',         search: 'Monster Hunter Wilds',                platform: 'steam' },

  // — Estrategia / Simulación ────────────────────────────────────────
  { slug: 'civ6',            search: "Sid Meier's Civilization VI",         platform: 'steam' },
  { slug: 'payday3',         search: 'Payday 3',                            platform: 'steam' },
  { slug: 'warhammer40ksm2', search: 'Warhammer 40000 Space Marine 2',      platform: 'steam' },

  // — Plataformas / Indie ────────────────────────────────────────────
  { slug: 'celeste',         search: 'Celeste',                             platform: 'steam' },
  { slug: 'hollowknight',    search: 'Hollow Knight',                       platform: 'steam' },
  { slug: 'deadcells',       search: 'Dead Cells',                          platform: 'steam' },
  { slug: 'cuphead',         search: 'Cuphead',                             platform: 'steam' },
  { slug: 'undertale',       search: 'Undertale',                           platform: 'steam' },
  { slug: 'ori2',            search: 'Ori and the Will of the Wisps',       platform: 'steam' },
  { slug: 'tunic',           search: 'Tunic',                               platform: 'steam' },
  { slug: 'sifu',            search: 'Sifu',                                platform: 'steam' },
  { slug: 'ghostrunner2',    search: 'Ghostrunner 2',                       platform: 'steam' },

  // — Multijugador / Sandbox ─────────────────────────────────────────
  { slug: 'stardew',         search: 'Stardew Valley',                      platform: 'steam' },
  { slug: 'terraria',        search: 'Terraria',                            platform: 'steam' },
  { slug: 'rust',            search: 'Rust',                                platform: 'steam' },
  { slug: 'valheim',         search: 'Valheim',                             platform: 'steam' },
  { slug: 'nomannsky',       search: 'No Mans Sky',                         platform: 'steam' },
  { slug: 'deeprock',        search: 'Deep Rock Galactic',                  platform: 'steam' },
  { slug: 'palworld',        search: 'Palworld',                            platform: 'steam' },
  { slug: 'enshrouded',      search: 'Enshrouded',                          platform: 'steam' },
  { slug: 'vampiresurvivors',search: 'Vampire Survivors',                   platform: 'steam' },

  // — Narrativos / Puzzle ────────────────────────────────────────────
  { slug: 'disco',           search: 'Disco Elysium The Final Cut',         platform: 'steam' },
  { slug: 'outerwilds',      search: 'Outer Wilds',                         platform: 'steam' },
  { slug: 'portal2',         search: 'Portal 2',                            platform: 'steam' },
  { slug: 'control',         search: 'Control Ultimate Edition',            platform: 'steam' },
  { slug: 'metro',           search: 'Metro Exodus',                        platform: 'steam' },

  // — JRPG / Final Fantasy ───────────────────────────────────────────
  { slug: 'ff7remake',       search: 'Final Fantasy VII Remake Intergrade', platform: 'steam' },
  { slug: 'granblue',        search: 'Granblue Fantasy Relink',             platform: 'steam' },

  // — Sony exclusivos portados a PC ──────────────────────────────────
  { slug: 'spiderman',     search: "Marvel's Spider-Man Remastered",      platform: 'steam' },
  { slug: 'tlou1',           search: 'The Last of Us Part I',               platform: 'steam' },
  { slug: 'mafia1',          search: 'Mafia Definitive Edition',            platform: 'steam' },
  { slug: 'dmc5',            search: 'Devil May Cry 5',                     platform: 'steam' },
  { slug: 'alanwake2',      search: 'Alan Wake 2',                          platform: 'steam' },
  { slug: 'fifa24',         search: 'FIFA 24',                              platform: 'steam' },

  // ══════════════════════════════════════════════════════════════════
  //  XBOX (100) — Exclusivos Xbox/PC primero, luego cross-platform
  // ══════════════════════════════════════════════════════════════════

  // — Exclusivos Xbox ────────────────────────────────────────────────
  { slug: 'minecraft',       search: 'Minecraft',                           platform: 'xbox' },
  { slug: 'forza5',          search: 'Forza Horizon 5',                     platform: 'xbox' },
  { slug: 'forza4',          search: 'Forza Horizon 4',                     platform: 'xbox' },
  { slug: 'forzamotorsport', search: 'Forza Motorsport 2023',               platform: 'xbox' },
  { slug: 'haloinfinite',            search: 'Halo Infinite',                       platform: 'xbox' },
  { slug: 'halomcc',         search: 'Halo The Master Chief Collection',    platform: 'xbox' },
  { slug: 'gears5',          search: 'Gears 5',                             platform: 'xbox' },
  { slug: 'gears4',          search: 'Gears of War 4',                      platform: 'xbox' },
  { slug: 'seaofthieves',    search: 'Sea of Thieves',                      platform: 'xbox' },
  { slug: 'grounded',        search: 'Grounded',                            platform: 'xbox' },
  { slug: 'psychonauts2',    search: 'Psychonauts 2',                       platform: 'xbox' },
  { slug: 'avowed',          search: 'Avowed',                              platform: 'xbox' },
  { slug: 'indianajones',    search: 'Indiana Jones and the Great Circle',  platform: 'xbox' },
  { slug: 'hellblade2',      search: 'Senua Saga Hellblade II',             platform: 'xbox' },
  { slug: 'flightsim2024',   search: 'Microsoft Flight Simulator 2024',    platform: 'xbox' },
  { slug: 'scorn',           search: 'Scorn',                               platform: 'xbox' },
  { slug: 'pentiment',       search: 'Pentiment',                           platform: 'xbox' },
  { slug: 'minecraftdung',   search: 'Minecraft Dungeons',                  platform: 'xbox' },
  { slug: 'minecraftleg',    search: 'Minecraft Legends',                   platform: 'xbox' },

  // — Cross-platform Xbox ────────────────────────────────────────────
  { slug: 'eldenring',       search: 'Elden Ring Xbox',                     platform: 'xbox' },
  { slug: 'rdr2',            search: 'Red Dead Redemption 2 Xbox',          platform: 'xbox' },
  { slug: 'gtav',            search: 'Grand Theft Auto V Xbox',             platform: 'xbox' },
  { slug: 'cyberpunk',       search: 'Cyberpunk 2077 Xbox',                 platform: 'xbox' },
  { slug: 'witcher3',        search: 'The Witcher 3 Wild Hunt Xbox',        platform: 'xbox' },
  { slug: 'hogwarts',        search: 'Hogwarts Legacy Xbox',                platform: 'xbox' },
  { slug: 'starfield',       search: 'Starfield Xbox',                      platform: 'xbox' },
  { slug: 'bg3',         search: "Baldur's Gate 3 Xbox",                platform: 'xbox' },
  { slug: 'mw3',             search: 'Call of Duty Modern Warfare 3 Xbox',  platform: 'xbox' },
  { slug: 'codbo6',          search: 'Call of Duty Black Ops 6 Xbox',       platform: 'xbox' },
  { slug: 'fc25',          search: 'EA FC 25 Xbox',                       platform: 'xbox' },
  { slug: 'darksouls3',      search: 'Dark Souls III Xbox',                 platform: 'xbox' },
  { slug: 're4',             search: 'Resident Evil 4 Remake Xbox',         platform: 'xbox' },
  { slug: 're2',             search: 'Resident Evil 2 Remake Xbox',         platform: 'xbox' },
  { slug: 're3',             search: 'Resident Evil 3 Remake Xbox',         platform: 'xbox' },
  { slug: 're8',             search: 'Resident Evil Village Xbox',          platform: 'xbox' },
  { slug: 'deadspace',       search: 'Dead Space Remake Xbox',              platform: 'xbox' },
  { slug: 'sekiro',          search: 'Sekiro Shadows Die Twice Xbox',       platform: 'xbox' },
  { slug: 'mhworld',         search: 'Monster Hunter World Xbox',           platform: 'xbox' },
  { slug: 'mhrise',          search: 'Monster Hunter Rise Xbox',            platform: 'xbox' },
  { slug: 'mhwilds',         search: 'Monster Hunter Wilds Xbox',           platform: 'xbox' },
  { slug: 'hades',           search: 'Hades Xbox',                          platform: 'xbox' },
  { slug: 'hades2',          search: 'Hades II Xbox',                       platform: 'xbox' },
  { slug: 'stardew',         search: 'Stardew Valley Xbox',                 platform: 'xbox' },
  { slug: 'dmc5',            search: 'Devil May Cry 5 Xbox',                platform: 'xbox' },
  { slug: 'deathloop',       search: 'Deathloop Xbox',                      platform: 'xbox' },
  { slug: 'farcry6',         search: 'Far Cry 6 Xbox',                      platform: 'xbox' },
  { slug: 'farcry5',         search: 'Far Cry 5 Xbox',                      platform: 'xbox' },
  { slug: 'acvalhalla',      search: "Assassin's Creed Valhalla Xbox",      platform: 'xbox' },
  { slug: 'acodyssey',       search: "Assassin's Creed Odyssey Xbox",       platform: 'xbox' },
  { slug: 'acorigins',       search: "Assassin's Creed Origins Xbox",       platform: 'xbox' },
  { slug: 'watchdogslegion', search: 'Watch Dogs Legion Xbox',              platform: 'xbox' },
  { slug: 'rainbowsix',      search: 'Rainbow Six Siege Xbox',              platform: 'xbox' },
  { slug: 'diablo4',         search: 'Diablo IV Xbox',                      platform: 'xbox' },
  { slug: 'battlefield2042', search: 'Battlefield 2042 Xbox',               platform: 'xbox' },
  { slug: 'payday3',         search: 'Payday 3 Xbox',                       platform: 'xbox' },
  { slug: 'sf6',             search: 'Street Fighter 6 Xbox',               platform: 'xbox' },
  { slug: 'mk1',             search: 'Mortal Kombat 1 Xbox',                platform: 'xbox' },
  { slug: 'tekken8',         search: 'Tekken 8 Xbox',                       platform: 'xbox' },
  { slug: 'civ6',            search: "Sid Meier's Civilization VI Xbox",    platform: 'xbox' },
  { slug: 'masseffectle',    search: 'Mass Effect Legendary Edition Xbox',  platform: 'xbox' },
  { slug: 'nierautomata',    search: 'NieR Automata Xbox',                  platform: 'xbox' },
  { slug: 'doom2016',        search: 'DOOM 2016 Xbox',                      platform: 'xbox' },
  { slug: 'doometernal',     search: 'DOOM Eternal Xbox',                   platform: 'xbox' },
  { slug: 'dishonored2',     search: 'Dishonored 2 Xbox',                   platform: 'xbox' },
  { slug: 'cuphead',         search: 'Cuphead Xbox',                        platform: 'xbox' },
  { slug: 'deeprock',        search: 'Deep Rock Galactic Xbox',             platform: 'xbox' },
  { slug: 'valheim',         search: 'Valheim Xbox',                        platform: 'xbox' },
  { slug: 'rust',            search: 'Rust Console Edition Xbox',           platform: 'xbox' },
  { slug: 'persona5',        search: 'Persona 5 Royal Xbox',                platform: 'xbox' },
  { slug: 'persona3reload',  search: 'Persona 3 Reload Xbox',               platform: 'xbox' },
  { slug: 'dragonsdogma2',   search: "Dragon's Dogma 2 Xbox",               platform: 'xbox' },
  { slug: 'metaphor',        search: 'Metaphor ReFantazio Xbox',            platform: 'xbox' },
  { slug: 'armored6',        search: 'Armored Core VI Xbox',                platform: 'xbox' },
  { slug: 'liesp',           search: 'Lies of P Xbox',                      platform: 'xbox' },
  { slug: 'wolong',          search: 'Wo Long Fallen Dynasty Xbox',         platform: 'xbox' },
  { slug: 'granblue',        search: 'Granblue Fantasy Relink Xbox',        platform: 'xbox' },
  { slug: 'stalker2',        search: 'STALKER 2 Heart of Chornobyl Xbox',   platform: 'xbox' },
  { slug: 'ghostrunner2',    search: 'Ghostrunner 2 Xbox',                  platform: 'xbox' },
  { slug: 'sifu',            search: 'Sifu Xbox',                           platform: 'xbox' },
  { slug: 'ghostwire',       search: 'Ghostwire Tokyo Xbox',                platform: 'xbox' },
  { slug: 'plaguerequiem',   search: 'A Plague Tale Requiem Xbox',          platform: 'xbox' },
  { slug: 'plagueinnocence', search: 'A Plague Tale Innocence Xbox',        platform: 'xbox' },
  { slug: 'deathstrand',     search: 'Death Stranding Xbox',                platform: 'xbox' },
  { slug: 'warhammer40ksm2', search: 'Warhammer 40000 Space Marine 2 Xbox', platform: 'xbox' },
  { slug: 'f124',            search: 'F1 24 Xbox',                          platform: 'xbox' },
  { slug: 'nfsunbound',      search: 'Need for Speed Unbound Xbox',         platform: 'xbox' },
  { slug: 'deadisland2',     search: 'Dead Island 2 Xbox',                  platform: 'xbox' },
  { slug: 'ori2',            search: 'Ori and the Will of the Wisps Xbox',  platform: 'xbox' },
  { slug: 'control',         search: 'Control Ultimate Edition Xbox',       platform: 'xbox' },
  { slug: 'outerworlds',     search: 'The Outer Worlds Xbox',               platform: 'xbox' },
  { slug: 'likedragoninfwealth', search: 'Like a Dragon Infinite Wealth Xbox', platform: 'xbox' },
  { slug: 'dragonageveilguard', search: 'Dragon Age The Veilguard Xbox',    platform: 'xbox' },
  { slug: 'prey2017',        search: 'Prey 2017 Xbox',                      platform: 'xbox' },
  { slug: 'metro',           search: 'Metro Exodus Xbox',                   platform: 'xbox' },
  { slug: 'mafia1',          search: 'Mafia Definitive Edition Xbox',       platform: 'xbox' },
  { slug: 'outerwilds',      search: 'Outer Wilds Xbox',                    platform: 'xbox' },
  { slug: 'vampiresurvivors',search: 'Vampire Survivors Xbox',              platform: 'xbox' },
  { slug: 'enshrouded',      search: 'Enshrouded Xbox',                     platform: 'xbox' },
  { slug: 'yakuza0',         search: 'Yakuza 0 Xbox',                       platform: 'xbox' },
  { slug: 'tunic',           search: 'Tunic Xbox',                          platform: 'xbox' },
  { slug: 'alanwake2',      search: 'Alan Wake 2 Xbox',                     platform: 'xbox' },
  { slug: 'rocketleague',   search: 'Rocket League Xbox',                   platform: 'xbox' },
  { slug: 'fifa24',         search: 'FIFA 24 Xbox',                         platform: 'xbox' },

  // ══════════════════════════════════════════════════════════════════
  //  PS5 (100) — Exclusivos Sony primero, luego cross-platform
  // ══════════════════════════════════════════════════════════════════

  // — Exclusivos Sony ────────────────────────────────────────────────
  { slug: 'spiderman2',      search: 'Marvel Spider-Man 2',                 platform: 'ps5' },
  { slug: 'gt7',             search: 'Gran Turismo 7',                      platform: 'ps5' },
  { slug: 'horizonfw',         search: 'Horizon Forbidden West PS5',          platform: 'ps5' },
  { slug: 'gowr',        search: 'God of War Ragnarok',                 platform: 'ps5' },
  { slug: 'spiderman',     search: "Marvel's Spider-Man Remastered PS5",  platform: 'ps5' },
  { slug: 'ghostoftsushima', search: "Ghost of Tsushima Director's Cut PS5", platform: 'ps5' },
  { slug: 'tlou1',           search: 'The Last of Us Part I PS5',           platform: 'ps5' },
  { slug: 'tlou2',           search: 'The Last of Us Part II Remastered',   platform: 'ps5' },
  { slug: 'ratchet',         search: 'Ratchet and Clank Rift Apart',        platform: 'ps5' },
  { slug: 'returnal',        search: 'Returnal PS5',                        platform: 'ps5' },
  { slug: 'demossouls',      search: "Demon's Souls Remake",                platform: 'ps5' },
  { slug: 'ff7rebirth',      search: 'Final Fantasy VII Rebirth',           platform: 'ps5' },
  { slug: 'ffxvi',            search: 'Final Fantasy XVI',                   platform: 'ps5' },
  { slug: 'kena',            search: 'Kena Bridge of Spirits PS5',          platform: 'ps5' },
  { slug: 'stellarblade',    search: 'Stellar Blade',                       platform: 'ps5' },
  { slug: 'riseofonin',      search: 'Rise of the Ronin',                   platform: 'ps5' },
  { slug: 'astrobot',        search: 'Astro Bot',                           platform: 'ps5' },
  { slug: 'spidermanmm',     search: "Spider-Man Miles Morales PS5",        platform: 'ps5' },
  { slug: 'gow',       search: 'God of War PS4',                      platform: 'ps5' },
  { slug: 'horizonzd',       search: 'Horizon Zero Dawn Remastered',        platform: 'ps5' },
  { slug: 'bloodborne',      search: 'Bloodborne PS4',                      platform: 'ps5' },
  { slug: 'fortnite',        search: 'Fortnite V-Bucks',                    platform: 'ps5' },
  { slug: 'ff7remake',       search: 'Final Fantasy VII Remake Intergrade PS5', platform: 'ps5' },

  // — Cross-platform PS5 ─────────────────────────────────────────────
  { slug: 'eldenring',       search: 'Elden Ring PS5',                      platform: 'ps5' },
  { slug: 'rdr2',            search: 'Red Dead Redemption 2 PS4',           platform: 'ps5' },
  { slug: 'gtav',            search: 'Grand Theft Auto V PS5',              platform: 'ps5' },
  { slug: 'cyberpunk',       search: 'Cyberpunk 2077 PS5',                  platform: 'ps5' },
  { slug: 'witcher3',        search: 'The Witcher 3 Wild Hunt PS4',         platform: 'ps5' },
  { slug: 'hogwarts',        search: 'Hogwarts Legacy PS5',                 platform: 'ps5' },
  { slug: 'bg3',         search: "Baldur's Gate 3 PS5",                 platform: 'ps5' },
  { slug: 'mw3',             search: 'Call of Duty Modern Warfare 3 PS5',   platform: 'ps5' },
  { slug: 'codbo6',          search: 'Call of Duty Black Ops 6 PS5',        platform: 'ps5' },
  { slug: 'fc25',          search: 'EA FC 25 PS5',                        platform: 'ps5' },
  { slug: 'darksouls3',      search: 'Dark Souls III PS4',                  platform: 'ps5' },
  { slug: 're4',             search: 'Resident Evil 4 Remake PS5',          platform: 'ps5' },
  { slug: 're2',             search: 'Resident Evil 2 Remake PS4',          platform: 'ps5' },
  { slug: 're3',             search: 'Resident Evil 3 Remake PS4',          platform: 'ps5' },
  { slug: 're8',             search: 'Resident Evil Village PS5',           platform: 'ps5' },
  { slug: 'deadspace',       search: 'Dead Space Remake PS5',               platform: 'ps5' },
  { slug: 'sekiro',          search: 'Sekiro Shadows Die Twice PS4',        platform: 'ps5' },
  { slug: 'mhworld',         search: 'Monster Hunter World PS4',            platform: 'ps5' },
  { slug: 'mhrise',          search: 'Monster Hunter Rise PS5',             platform: 'ps5' },
  { slug: 'mhwilds',         search: 'Monster Hunter Wilds PS5',            platform: 'ps5' },
  { slug: 'hades',           search: 'Hades PS4',                           platform: 'ps5' },
  { slug: 'hades2',          search: 'Hades II PS5',                        platform: 'ps5' },
  { slug: 'stardew',         search: 'Stardew Valley PS4',                  platform: 'ps5' },
  { slug: 'dmc5',            search: 'Devil May Cry 5 Special Edition PS5', platform: 'ps5' },
  { slug: 'deathloop',       search: 'Deathloop PS5',                       platform: 'ps5' },
  { slug: 'farcry6',         search: 'Far Cry 6 PS5',                       platform: 'ps5' },
  { slug: 'farcry5',         search: 'Far Cry 5 PS4',                       platform: 'ps5' },
  { slug: 'acvalhalla',      search: "Assassin's Creed Valhalla PS5",       platform: 'ps5' },
  { slug: 'acodyssey',       search: "Assassin's Creed Odyssey PS4",        platform: 'ps5' },
  { slug: 'acorigins',       search: "Assassin's Creed Origins PS4",        platform: 'ps5' },
  { slug: 'watchdogslegion', search: 'Watch Dogs Legion PS5',               platform: 'ps5' },
  { slug: 'rainbowsix',      search: 'Rainbow Six Siege PS5',               platform: 'ps5' },
  { slug: 'diablo4',         search: 'Diablo IV PS5',                       platform: 'ps5' },
  { slug: 'battlefield2042', search: 'Battlefield 2042 PS5',                platform: 'ps5' },
  { slug: 'payday3',         search: 'Payday 3 PS5',                        platform: 'ps5' },
  { slug: 'sf6',             search: 'Street Fighter 6 PS5',                platform: 'ps5' },
  { slug: 'mk1',             search: 'Mortal Kombat 1 PS5',                 platform: 'ps5' },
  { slug: 'tekken8',         search: 'Tekken 8 PS5',                        platform: 'ps5' },
  { slug: 'civ6',            search: "Sid Meier's Civilization VI PS4",     platform: 'ps5' },
  { slug: 'masseffectle',    search: 'Mass Effect Legendary Edition PS4',   platform: 'ps5' },
  { slug: 'nierautomata',    search: 'NieR Automata PS4',                   platform: 'ps5' },
  { slug: 'doom2016',        search: 'DOOM 2016 PS4',                       platform: 'ps5' },
  { slug: 'doometernal',     search: 'DOOM Eternal PS5',                    platform: 'ps5' },
  { slug: 'dishonored2',     search: 'Dishonored 2 PS4',                    platform: 'ps5' },
  { slug: 'deeprock',        search: 'Deep Rock Galactic PS4',              platform: 'ps5' },
  { slug: 'persona5',        search: 'Persona 5 Royal PS5',                 platform: 'ps5' },
  { slug: 'persona3reload',  search: 'Persona 3 Reload PS5',                platform: 'ps5' },
  { slug: 'dragonsdogma2',   search: "Dragon's Dogma 2 PS5",                platform: 'ps5' },
  { slug: 'metaphor',        search: 'Metaphor ReFantazio PS5',             platform: 'ps5' },
  { slug: 'armored6',        search: 'Armored Core VI PS5',                 platform: 'ps5' },
  { slug: 'liesp',           search: 'Lies of P PS5',                       platform: 'ps5' },
  { slug: 'wolong',          search: 'Wo Long Fallen Dynasty PS5',          platform: 'ps5' },
  { slug: 'granblue',        search: 'Granblue Fantasy Relink PS5',         platform: 'ps5' },
  { slug: 'ghostrunner2',    search: 'Ghostrunner 2 PS5',                   platform: 'ps5' },
  { slug: 'sifu',            search: 'Sifu PS5',                            platform: 'ps5' },
  { slug: 'ghostwire',       search: 'Ghostwire Tokyo PS5',                 platform: 'ps5' },
  { slug: 'plaguerequiem',   search: 'A Plague Tale Requiem PS5',           platform: 'ps5' },
  { slug: 'plagueinnocence', search: 'A Plague Tale Innocence PS4',         platform: 'ps5' },
  { slug: 'deathstrand',     search: 'Death Stranding Directors Cut PS5',   platform: 'ps5' },
  { slug: 'helldivers2',     search: 'Helldivers 2 PS5',                    platform: 'ps5' },
  { slug: 'warhammer40ksm2', search: 'Warhammer 40000 Space Marine 2 PS5',  platform: 'ps5' },
  { slug: 'f124',            search: 'F1 24 PS5',                           platform: 'ps5' },
  { slug: 'nfsunbound',      search: 'Need for Speed Unbound PS5',          platform: 'ps5' },
  { slug: 'deadisland2',     search: 'Dead Island 2 PS5',                   platform: 'ps5' },
  { slug: 'control',         search: 'Control Ultimate Edition PS5',        platform: 'ps5' },
  { slug: 'likedragoninfwealth', search: 'Like a Dragon Infinite Wealth PS5', platform: 'ps5' },
  { slug: 'dragonageveilguard', search: 'Dragon Age The Veilguard PS5',     platform: 'ps5' },
  { slug: 'nioh2',           search: 'Nioh 2 Complete Edition PS5',         platform: 'ps5' },
  { slug: 'metro',           search: 'Metro Exodus PS5',                    platform: 'ps5' },
  { slug: 'mafia1',          search: 'Mafia Definitive Edition PS4',        platform: 'ps5' },
  { slug: 'yakuza0',         search: 'Yakuza 0 PS4',                        platform: 'ps5' },
  { slug: 'outerworlds',     search: 'The Outer Worlds PS4',                platform: 'ps5' },
  { slug: 'vampiresurvivors',search: 'Vampire Survivors PS5',               platform: 'ps5' },
  { slug: 'deadcells',       search: 'Dead Cells PS4',                      platform: 'ps5' },
  { slug: 'tunic',           search: 'Tunic PS5',                           platform: 'ps5' },
  { slug: 'stalker2',        search: 'STALKER 2 PS5',                       platform: 'ps5' },
  { slug: 'lostjudgment',   search: 'Lost Judgment PS5',                   platform: 'ps5' },
  { slug: 'alanwake2',      search: 'Alan Wake 2 PS5',                      platform: 'ps5' },
  { slug: 'rocketleague',   search: 'Rocket League PS5',                    platform: 'ps5' },
  { slug: 'fifa24',         search: 'FIFA 24 PS5',                          platform: 'ps5' },

  // ══════════════════════════════════════════════════════════════════
  //  PS4 (20) — Exclusivos y clásicos de la generación PS4
  // ══════════════════════════════════════════════════════════════════
  { slug: 'spidermanps4',    search: "Marvel's Spider-Man PS4",             platform: 'ps4' },
  { slug: 'horizonzdps4',    search: 'Horizon Zero Dawn PS4',               platform: 'ps4' },
  { slug: 'godofwar2018',    search: 'God of War PS4 2018',                 platform: 'ps4' },
  { slug: 'tlou2ps4',        search: 'The Last of Us Part II PS4',          platform: 'ps4' },
  { slug: 'tlouremasteredps4', search: 'The Last of Us Remastered PS4',     platform: 'ps4' },
  { slug: 'ghosttsushimaps4', search: 'Ghost of Tsushima PS4',              platform: 'ps4' },
  { slug: 'daysgone',        search: 'Days Gone PS4',                       platform: 'ps4' },
  { slug: 'detroit',         search: 'Detroit Become Human PS4',            platform: 'ps4' },
  { slug: 'shadowcolossus',  search: 'Shadow of the Colossus PS4',          platform: 'ps4' },
  { slug: 'ratchet2016',     search: 'Ratchet and Clank PS4 2016',          platform: 'ps4' },
  { slug: 'uncharted4',      search: 'Uncharted 4 A Thiefs End PS4',        platform: 'ps4' },
  { slug: 'infamouss',       search: 'inFamous Second Son PS4',             platform: 'ps4' },
  { slug: 'untildawn',       search: 'Until Dawn PS4',                      platform: 'ps4' },
  { slug: 'medievil',        search: 'MediEvil PS4',                        platform: 'ps4' },
  { slug: 'nioh1',           search: 'Nioh Complete Edition PS4',           platform: 'ps4' },
  { slug: 'bloodborne',      search: 'Bloodborne PS4',                      platform: 'ps4' },
  { slug: 'darksoulsrem',    search: 'Dark Souls Remastered PS4',           platform: 'ps4' },
  { slug: 'mgs5',            search: 'Metal Gear Solid V The Phantom Pain PS4', platform: 'ps4' },
  { slug: 'ff12',            search: 'Final Fantasy XII The Zodiac Age PS4', platform: 'ps4' },
  { slug: 'yakuza6',         search: 'Yakuza 6 The Song of Life PS4',       platform: 'ps4' },

  // ══════════════════════════════════════════════════════════════════
  //  EPIC GAMES — juegos vendidos como claves Epic
  // ══════════════════════════════════════════════════════════════════
  { slug: 'alanwake2',      search: 'Alan Wake 2 Epic Games',               platform: 'epic' },
  { slug: 'rocketleague',   search: 'Rocket League Epic Games',             platform: 'epic' },
  { slug: 'fortnite',       search: 'Fortnite V-Bucks Epic',                platform: 'epic' },
  { slug: 'cyberpunk',      search: 'Cyberpunk 2077 Epic Games PC',         platform: 'epic' },
  { slug: 'eldenring',      search: 'Elden Ring Epic Games PC',             platform: 'epic' },
  { slug: 'hogwarts',       search: 'Hogwarts Legacy Epic Games PC',        platform: 'epic' },
  { slug: 'bg3',            search: "Baldur's Gate 3 Epic Games PC",        platform: 'epic' },
  { slug: 'gtav',           search: 'Grand Theft Auto V Epic Games PC',     platform: 'epic' },
  { slug: 'rdr2',           search: 'Red Dead Redemption 2 Epic Games PC',  platform: 'epic' },
  { slug: 'witcher3',       search: 'The Witcher 3 Epic Games PC',          platform: 'epic' },
  { slug: 'dragonsdogma2',  search: "Dragon's Dogma 2 Epic Games PC",       platform: 'epic' },
  { slug: 'helldivers2',    search: 'Helldivers 2 Epic Games PC',           platform: 'epic' },
  { slug: 'fc25',           search: 'EA FC 25 Epic Games PC',               platform: 'epic' },
  { slug: 'fifa24',         search: 'FIFA 24 Epic Games PC',                platform: 'epic' },

  // ══════════════════════════════════════════════════════════════════
  //  NINTENDO SWITCH — juegos vendidos como claves Switch
  // ══════════════════════════════════════════════════════════════════
  { slug: 'zeldatotk',      search: 'Zelda Tears of the Kingdom Nintendo Switch', platform: 'switch' },
  { slug: 'mariowonder',    search: 'Super Mario Bros Wonder Nintendo Switch',     platform: 'switch' },
  { slug: 'minecraft',      search: 'Minecraft Nintendo Switch',                   platform: 'switch' },
  { slug: 'rocketleague',   search: 'Rocket League Nintendo Switch',               platform: 'switch' },
  { slug: 'celeste',        search: 'Celeste Nintendo Switch',                     platform: 'switch' },
  { slug: 'hades2',         search: 'Hades II Nintendo Switch',                    platform: 'switch' },
  { slug: 'eldenring',      search: 'Elden Ring Nintendo Switch',                  platform: 'switch' },
  { slug: 'hogwarts',       search: 'Hogwarts Legacy Nintendo Switch',             platform: 'switch' },
  { slug: 'fc25',           search: 'EA FC 25 Nintendo Switch',                    platform: 'switch' },
  { slug: 'fifa24',         search: 'FIFA 24 Nintendo Switch',                     platform: 'switch' },
];

const SCRAPERS = [
  { id: 'cdkeys',        fn: scrapeCDKeys,        closeFn: closeCDKeys,  name: 'CDKeys'         },
  { id: 'instantgaming', fn: scrapeInstantGaming, closeFn: closeIG,      name: 'Instant Gaming' },
  { id: 'eneba',         fn: scrapeEneba,         closeFn: closeEneba,   name: 'Eneba'          },
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Ciclo de scraping ───────────────────────────────────────────────

async function scrapeAll() {
  const startTs = Date.now();
  const byPlatform = GAMES.reduce((acc, g) => { acc[g.platform] = (acc[g.platform] ?? 0) + 1; return acc; }, {});
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`  Ciclo iniciado: ${new Date().toLocaleString('es-ES')}`);
  console.log(`  Catálogo: ${GAMES.length} entradas — Steam:${byPlatform.steam ?? 0} Xbox:${byPlatform.xbox ?? 0} PS5:${byPlatform.ps5 ?? 0} Epic:${byPlatform.epic ?? 0} Switch:${byPlatform.switch ?? 0}`);
  console.log(`${'═'.repeat(55)}`);

  // Consultar la BD una sola vez para saber qué slugs existen realmente.
  let validSlugs;
  try {
    validSlugs = await getValidSlugs();
  } catch (err) {
    console.error('No se pudo conectar a la BD para obtener los slugs:', err.message);
    console.error('Abortando ciclo — comprueba la conexión MySQL.');
    return;
  }

  const games = GAMES.filter(g => {
    if (validSlugs.has(g.slug)) return true;
    console.log(`  [BD] Juego "${g.slug}" no existe en la tabla juegos — omitido`);
    return false;
  });

  if (!games.length) {
    console.log('  Ningún juego del catálogo existe en la BD. Ciclo vacío.');
    return;
  }

  const filtered = games.reduce((acc, g) => { acc[g.platform] = (acc[g.platform] ?? 0) + 1; return acc; }, {});
  console.log(`  Válidos en BD: ${games.length} — Steam:${filtered.steam ?? 0} Xbox:${filtered.xbox ?? 0} PS5:${filtered.ps5 ?? 0} Epic:${filtered.epic ?? 0} Switch:${filtered.switch ?? 0}\n`);

  for (const scraper of SCRAPERS) {
    console.log(`\n── ${scraper.name} (${games.length} consultas) ──`);

    for (const game of games) {
      try {
        console.log(`  › [${game.platform.toUpperCase()}] ${game.search}`);
        const result = await scraper.fn(game.search, game.platform);

        if (!result) {
          console.log(`    Sin resultado`);
          continue;
        }

        const sourceTag = result._source === 'real' ? '✓real' : result._source === 'real-json' ? '✓json' : '~demo';
        console.log(`    ${game.slug} → ${result.price}€ (${result.region}) [${sourceTag}]`);

        await updateOfferInDB({
          slug:      game.slug,
          storeCode: scraper.id,
          platform:  game.platform,
          price:     result.price,
          region:    result.region  ?? 'Global',
          stock:     result.stock   ?? 'ok',
          tipo:      result.type    ?? 'code',
          url:       result.url     ?? null,
        });

      } catch (err) {
        console.error(`    Error en ${scraper.name}/${game.slug}:`, err.message);
      }

      await sleep(1200 + Math.random() * 1800);
    }

    await scraper.closeFn();
    console.log(`  Browser de ${scraper.name} cerrado.`);
    await sleep(4000);
  }

  const elapsed = Math.round((Date.now() - startTs) / 1000);
  console.log(`\n  Ciclo completado en ${elapsed}s — ${games.length * SCRAPERS.length} consultas.`);
}

// ─── Bucle principal ─────────────────────────────────────────────────

const INTERVAL_MS = 5 * 60 * 1000;

async function run() {
  while (true) {
    try {
      await scrapeAll();
    } catch (err) {
      console.error('Error inesperado en el ciclo de scraping:', err);
    }
    console.log(`\nPróximo ciclo en ${INTERVAL_MS / 60000} minutos...`);
    await sleep(INTERVAL_MS);
  }
}

// ─── Cierre ordenado ─────────────────────────────────────────────────

async function shutdown() {
  console.log('\nCerrando scraper...');
  await closeCDKeys();
  await closeIG();
  await closeEneba();
  await closePool();
  process.exit(0);
}

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

run().catch(err => {
  console.error('Error fatal al arrancar:', err);
  process.exit(1);
});