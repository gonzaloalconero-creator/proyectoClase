# Autenticación y Base de Datos — CodeKeys
## Guía de presentación paso a paso

**Proyecto:** CodeKeys — Comparador de precios de videojuegos  
**Responsable:** Autenticación + Base de Datos  
**Fecha de presentación:** Mayo 2026

---

## ÍNDICE

1. [Por qué se diseñó la base de datos así](#1-por-qué-se-diseñó-la-base-de-datos-así)
2. [Las tablas: qué son y por qué existen](#2-las-tablas-qué-son-y-por-qué-existen)
3. [Relaciones entre tablas: las claves foráneas](#3-relaciones-entre-tablas-las-claves-foráneas)
4. [El procedimiento almacenado sp_actualizar_precio](#4-el-procedimiento-almacenado-sp_actualizar_precio)
5. [Dónde vive la base de datos: AWS RDS](#5-dónde-vive-la-base-de-datos-aws-rds)
6. [Por qué se eligió bcrypt para las contraseñas](#6-por-qué-se-eligió-bcrypt-para-las-contraseñas)
7. [El registro de usuario paso a paso](#7-el-registro-de-usuario-paso-a-paso)
8. [El login de usuario paso a paso](#8-el-login-de-usuario-paso-a-paso)
9. [Cómo se guarda la sesión sin servidor](#9-cómo-se-guarda-la-sesión-sin-servidor)
10. [El logout: qué se limpia y por qué](#10-el-logout-qué-se-limpia-y-por-qué)
11. [Control de roles: admin vs normal](#11-control-de-roles-admin-vs-normal)
12. [El historial de sesión](#12-el-historial-de-sesión)
13. [El modal de autenticación en el frontend](#13-el-modal-de-autenticación-en-el-frontend)
14. [Limitaciones conocidas y por qué se aceptaron](#14-limitaciones-conocidas-y-por-qué-se-aceptaron)

---

## 1. Por qué se diseñó la base de datos así

### El problema que había que resolver

CodeKeys necesitaba almacenar información compleja: hay juegos que se venden en múltiples plataformas (un mismo juego puede tener versión para PC, PS5 y Xbox), cada plataforma la vende en distintas tiendas (CDKeys, Eneba, Instant Gaming...) y cada tienda puede tener distintos precios para el mismo juego. Además, hay que guardar el historial de cómo han cambiado esos precios con el tiempo.

Si se hubiera metido todo en una sola tabla "grande" habría muchísima información repetida. Por ejemplo: el nombre del juego "Cyberpunk 2077" aparecería en cada fila de cada tienda que lo vende, lo que dificulta actualizar datos y ocupa espacio innecesario.

### La solución: diseño relacional normalizado

Se optó por dividir la información en tablas especializadas, cada una con una responsabilidad concreta, y relacionarlas entre sí con claves foráneas. Este enfoque se llama **normalización** y es el estándar en diseño de bases de datos relacionales.

La regla que se siguió es: **cada dato se guarda en un único sitio**. Si hay que actualizar el nombre de una tienda, se cambia solo en la tabla `tiendas` y automáticamente se refleja en todos los precios que referencian esa tienda.

---

## 2. Las tablas: qué son y por qué existen

### `plataformas`

Almacena las plataformas de videojuego: PC Steam, Epic Games, PlayStation 5, Xbox, Nintendo Switch. Se creó como tabla independiente porque la misma plataforma aparece en miles de registros de precios. Centralizar los datos aquí evita repetir "PlayStation 5" en cientos de filas.

```sql
CREATE TABLE plataformas (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo    VARCHAR(20) NOT NULL UNIQUE,  -- 'steam', 'ps5', 'xbox'...
  nombre    VARCHAR(60) NOT NULL,          -- nombre legible
  icono     VARCHAR(10) NOT NULL,          -- emoji del icono
  color_hex VARCHAR(7)  NOT NULL DEFAULT '#f97316'
);
```

El campo `codigo` (steam, ps5, xbox...) es el que usa el frontend para filtrar. El campo `nombre` es lo que se muestra al usuario.

---

### `generos`

Almacena los géneros de juego: Acción, RPG, FPS, Terror, Indie... Existe por la misma razón que plataformas: evitar repetir "Acción" en cada juego de ese género.

---

### `juegos`

La tabla principal del catálogo. Cada fila es un juego diferente.

```sql
CREATE TABLE juegos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(60) NOT NULL UNIQUE,   -- identificador URL: 'cyberpunk', 'eldenring'
  nombre      VARCHAR(120) NOT NULL,
  imagen_url  TEXT,
  precio_orig DECIMAL(8,2) NOT NULL,         -- precio oficial de lanzamiento
  descuento   DECIMAL(5,2) DEFAULT 0,        -- % descuento máximo actual
  activo      TINYINT(1)   NOT NULL DEFAULT 1
);
```

El campo `slug` es clave: es el identificador que aparece en las URLs de la API (`/api/juegos/cyberpunk`). Usar palabras en lugar de números hace las rutas más legibles y permite buscar un juego directamente por su nombre.

El campo `activo` permite ocultar juegos sin borrarlos. Si un juego deja de tener ofertas se marca como inactivo y desaparece de la web, pero sus datos históricos se conservan.

---

### `tiendas`

Almacena las tiendas donde se venden los juegos: CDKeys, Eneba, Instant Gaming, G2A...

```sql
CREATE TABLE tiendas (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo   VARCHAR(30) NOT NULL UNIQUE,   -- 'cdkeys', 'eneba'...
  nombre   VARCHAR(80) NOT NULL,
  logo_url TEXT,
  url_base TEXT,                          -- URL de la tienda para enlazar al usuario
  rating   DECIMAL(3,1),                 -- puntuación media de usuarios
  votos    INT UNSIGNED DEFAULT 0,
  activa   TINYINT(1) NOT NULL DEFAULT 1
);
```

El campo `url_base` se añadió para que la página de detalle de cada juego pueda enlazar directamente a la tienda. Sin este campo habría que hardcodear las URLs en el frontend.

---

### `ofertas`

Esta es la tabla más importante del sistema. Registra el precio actual de cada juego en cada tienda para cada plataforma.

```sql
CREATE TABLE ofertas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  juego_id      INT UNSIGNED NOT NULL,   -- qué juego
  tienda_id     INT UNSIGNED NOT NULL,   -- en qué tienda
  plataforma_id INT UNSIGNED NOT NULL,   -- para qué plataforma
  tipo          ENUM('code','account'),  -- ¿es una key o una cuenta?
  region        VARCHAR(20) DEFAULT 'Global',
  stock         ENUM('ok','low','out'),  -- disponibilidad
  precio        DECIMAL(8,2) NOT NULL,
  activa        TINYINT(1) NOT NULL DEFAULT 1,
  actualizado   TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

La combinación (juego_id, tienda_id, plataforma_id) identifica de forma única una oferta. Cuando el scraper encuentra un precio nuevo para esa combinación, actualiza la fila existente en lugar de crear una nueva.

El campo `tipo` distingue entre claves de activación (la mayoría) y cuentas de usuario, que son tipos de producto distintos con implicaciones legales diferentes.

---

### `precio_historial`

Registra cada vez que cambia el precio de una oferta. Si Cyberpunk costaba 15€ en CDKeys y baja a 12€, se crea una fila nueva en esta tabla con el precio anterior y el nuevo.

```sql
CREATE TABLE precio_historial (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  oferta_id    INT UNSIGNED NOT NULL,
  precio_ant   DECIMAL(8,2) NOT NULL,   -- precio antes del cambio
  precio_nuevo DECIMAL(8,2) NOT NULL,   -- precio después del cambio
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Esta tabla es la que alimenta el gráfico de historial de precios que se ve en la página de cada juego. Sin ella no habría forma de saber si el precio actual es una ganga o siempre ha sido así.

---

### `juego_generos` (tabla intermedia N:M)

Un juego puede pertenecer a varios géneros (Elden Ring es Acción y RPG a la vez) y un género tiene muchos juegos. Esto es una relación muchos-a-muchos y se resuelve con una tabla intermedia que solo tiene dos columnas: el ID del juego y el ID del género.

```sql
CREATE TABLE juego_generos (
  juego_id  INT UNSIGNED NOT NULL,
  genero_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (juego_id, genero_id)
);
```

---

### `usuarios`

Almacena las cuentas de usuario registradas en la web.

```sql
CREATE TABLE usuarios (
  id             VARCHAR(60)  PRIMARY KEY,   -- formato: u_{timestamp}_{random}
  nombre         VARCHAR(100) NOT NULL,
  email          VARCHAR(200) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,      -- NUNCA la contraseña en texto plano
  rol            ENUM('admin','normal') DEFAULT 'normal',
  activo         TINYINT(1)   DEFAULT 1,
  creado_en      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

La columna `password_hash` es el núcleo de la seguridad: nunca se guarda la contraseña real, solo su hash bcrypt.

El `id` tiene formato `u_1715512345678_4821` (timestamp + número aleatorio) en lugar de un autoincremental entero. Esto tiene una ventaja: no revela cuántos usuarios tiene la plataforma. Un ID `u_5` indicaría que solo hay 5 usuarios registrados, lo cual es información que no se debe exponer.

---

### `user_preferencias`

Se crea automáticamente al registrarse. Relación 1 a 1 con `usuarios`. Almacena las preferencias del usuario: tema de interfaz, moneda y idioma.

```sql
CREATE TABLE user_preferencias (
  usuario_id VARCHAR(60) PRIMARY KEY,
  tema       VARCHAR(10) DEFAULT 'dark',
  moneda     VARCHAR(5)  DEFAULT 'EUR',
  idioma     VARCHAR(5)  DEFAULT 'es',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
```

Se separó de `usuarios` por buenas prácticas de diseño: la tabla `usuarios` tiene datos de identidad y acceso; la tabla `user_preferencias` tiene datos de configuración. Son responsabilidades distintas.

---

## 3. Relaciones entre tablas: las claves foráneas

Todas las relaciones entre tablas se definen con `FOREIGN KEY ... ON DELETE CASCADE`. La cláusula `ON DELETE CASCADE` significa que si se borra un juego, automáticamente se borran también todas sus ofertas y todo su historial de precios. Esto evita datos huérfanos (precios de juegos que ya no existen).

El diagrama de relaciones es el siguiente:

```
plataformas ──┐
              ├── ofertas ──── precio_historial
juegos ───────┤
              │
tiendas ──────┘

juegos ──── juego_generos ──── generos

usuarios ──── user_preferencias
```

---

## 4. El procedimiento almacenado sp_actualizar_precio

Este es el elemento más avanzado de la base de datos. Se trata de código SQL que vive dentro de la propia base de datos y se ejecuta como si fuera una función.

### Por qué se creó

Cuando el scraper detecta un precio nuevo para una oferta, hay que hacer dos cosas:
1. Actualizar el precio en la tabla `ofertas`
2. Si el precio ha cambiado respecto al anterior, guardar el registro histórico en `precio_historial`

Esto implica siempre dos operaciones relacionadas. Si se hicieran por separado desde el scraper y fallara la segunda, el historial quedaría incompleto. El procedimiento almacenado garantiza que ambas operaciones se hacen juntas de forma atómica.

### Cómo funciona

```sql
DELIMITER $$
CREATE PROCEDURE sp_actualizar_precio(
  IN p_oferta_id   INT UNSIGNED,
  IN p_precio_nuevo DECIMAL(8,2)
)
BEGIN
  DECLARE v_precio_ant DECIMAL(8,2);

  -- 1. Leer el precio actual
  SELECT precio INTO v_precio_ant
  FROM ofertas WHERE id = p_oferta_id;

  -- 2. Solo actuar si el precio ha cambiado
  IF v_precio_ant IS NOT NULL AND v_precio_ant <> p_precio_nuevo THEN

    -- 3. Registrar el cambio en el historial
    INSERT INTO precio_historial (oferta_id, precio_ant, precio_nuevo)
    VALUES (p_oferta_id, v_precio_ant, p_precio_nuevo);

    -- 4. Actualizar el precio actual
    UPDATE ofertas SET precio = p_precio_nuevo WHERE id = p_oferta_id;

  END IF;
END$$
DELIMITER ;
```

El scraper lo llama así:
```sql
CALL sp_actualizar_precio(42, 12.99);
```

En una sola línea, la base de datos comprueba si el precio cambió, lo registra en el historial y lo actualiza. La lógica vive en la base de datos, no en el código JavaScript del scraper.

---

## 5. Dónde vive la base de datos: AWS RDS

La base de datos no está en el mismo servidor que la aplicación web. Está en **AWS RDS (Relational Database Service)**, que es un servicio de bases de datos gestionado en la nube de Amazon.

### Por qué se usó RDS en lugar de un servidor propio

- **Disponibilidad:** AWS garantiza que la base de datos está disponible aunque se reinicie el servidor de la aplicación (EC2).
- **Backups automáticos:** RDS hace copias de seguridad diarias automáticamente sin que haya que configurar nada.
- **Mantenimiento:** AWS gestiona las actualizaciones de seguridad del motor de base de datos.
- **Separación de responsabilidades:** Si hay que escalar el servidor web o cambiarlo, la base de datos no se ve afectada.

La dirección de conexión (endpoint) es:
```
codekeys.cx0emg4ue44q.us-east-1.rds.amazonaws.com
```

Esta dirección, junto con el usuario y la contraseña, se guarda en el archivo `.env` del backend y nunca se sube a GitHub:

```
DB_HOST=codekeys.cx0emg4ue44q.us-east-1.rds.amazonaws.com
DB_USER=codekeys_user
DB_PASS=Codekeys
DB_NAME=codekeys
```

El backend crea un **pool de conexiones** a la base de datos (en `db.js`), lo que significa que no abre y cierra una conexión nueva en cada petición, sino que reutiliza un conjunto de conexiones ya abiertas. Esto mejora enormemente el rendimiento cuando hay múltiples usuarios simultáneos.

---

## 6. Por qué se eligió bcrypt para las contraseñas

### El problema de guardar contraseñas

Si se guardara la contraseña en texto plano en la base de datos ("password123"), cualquier persona con acceso a la base de datos podría ver las contraseñas de todos los usuarios. Si la base de datos sufre un ataque y se filtra, todas las contraseñas quedan expuestas.

### La solución: hashing

En lugar de guardar la contraseña, se guarda su **hash**: una cadena de caracteres generada por un algoritmo matemático que no se puede revertir. Si alguien ve el hash, no puede saber cuál era la contraseña original.

Pero no todos los algoritmos de hash son iguales. MD5 y SHA1, por ejemplo, son muy rápidos, lo que los hace vulnerables a ataques de fuerza bruta (probar millones de contraseñas por segundo). **bcrypt fue diseñado deliberadamente para ser lento**, lo que hace inviable el ataque de fuerza bruta.

### Cómo funciona bcrypt en el proyecto

En el **registro**, se llama a `bcrypt.hash(password, 10)`:

```javascript
const hash = await bcrypt.hash(password, 10)
```

El número `10` es el "coste" o rondas de sal. Significa que el algoritmo realiza 2^10 = 1024 iteraciones internas. Esto hace que calcular un hash tarde aproximadamente 100 milisegundos, que para un usuario humano es imperceptible, pero para un atacante que prueba millones de contraseñas se convierte en una barrera enorme.

El resultado es algo como:
```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhhG
```

Ese hash es lo único que se guarda en la base de datos. La contraseña original se descarta.

En el **login**, se usa `bcrypt.compare(password, hash)`:

```javascript
const valid = await bcrypt.compare(password, u.password_hash)
```

bcrypt re-ejecuta el algoritmo con la contraseña que introduce el usuario y compara el resultado con el hash guardado. Si coinciden, la contraseña es correcta. Nunca se descifra el hash; se vuelve a calcular y se compara.

---

## 7. El registro de usuario paso a paso

El proceso de crear una cuenta nueva pasa por tres capas del sistema:

### Paso 1: Validación en el frontend (AuthModal.vue)

Antes de enviar nada al servidor, el formulario valida los datos en el navegador del usuario:

```javascript
// Nombre mínimo 3 caracteres
if (name.value.trim().length < 3) {
  errorMessage.value = 'El nombre debe tener al menos 3 caracteres.'
  return
}

// Email debe contener @
if (!email.value.includes('@')) {
  errorMessage.value = 'Introduce un email valido.'
  return
}

// Contraseña mínimo 6 caracteres
if (password.value.length < 6) {
  errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.'
  return
}
```

Esta validación es solo una primera línea de defensa para dar feedback rápido al usuario. No es la validación definitiva porque cualquiera puede saltarse el frontend y hacer una petición directa a la API.

### Paso 2: Petición HTTP al backend (mockAuthDb.js)

Si la validación pasa, el servicio de autenticación del frontend envía los datos al backend:

```javascript
export async function registerUser({ name, email, password }) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
  const data = await res.json()
  if (data.ok) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))
    startHistorySession(data.user.id)
  }
  return data
}
```

### Paso 3: Lógica en el backend (server.js)

El backend recibe la petición y ejecuta la lógica real:

```javascript
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body

  // 1. Validación de campos obligatorios
  if (!name || !email || !password)
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' })

  // 2. Normalizar el email (minúsculas, sin espacios)
  const cleanEmail = email.trim().toLowerCase()

  // 3. Comprobar si el email ya existe
  const [existing] = await pool.query(
    'SELECT id FROM usuarios WHERE email = ?', [cleanEmail]
  )
  if (existing.length) return res.json({ ok: false, error: 'EMAIL_EXISTS' })

  // 4. Hashear la contraseña
  const hash = await bcrypt.hash(password, 10)

  // 5. Generar ID único
  const id = `u_${Date.now()}_${Math.floor(Math.random() * 100000)}`

  // 6. Insertar usuario
  await pool.query(
    'INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES (?, ?, ?, ?, ?)',
    [id, name.trim(), cleanEmail, hash, 'normal']
  )

  // 7. Crear fila de preferencias por defecto
  await pool.query('INSERT INTO user_preferencias (usuario_id) VALUES (?)', [id])

  // 8. Responder con los datos del usuario (SIN el hash)
  res.json({ ok: true, user: { id, name: name.trim(), email: cleanEmail, role: 'normal' } })
})
```

**Por qué se normaliza el email:** Para evitar que `Usuario@Email.COM` y `usuario@email.com` se traten como cuentas distintas. Se convierte siempre a minúsculas antes de guardarlo.

**Por qué se usa `?` en las consultas:** Son parámetros preparados que MySQL gestiona de forma segura. Esto previene ataques de inyección SQL, donde un atacante podría enviar caracteres especiales en el email para manipular la consulta SQL.

**Por qué se crean las preferencias automáticamente:** Para garantizar que siempre hay una fila en `user_preferencias` para cada usuario. Si no se hiciera en el registro, habría que comprobarlo en cada petición que necesite las preferencias, lo que complica el código.

### Paso 4: Guardar la sesión en el navegador

Si el backend responde con `ok: true`, el frontend guarda los datos del usuario en `localStorage`:

```javascript
localStorage.setItem('codekeys-session-user', JSON.stringify(data.user))
```

Lo que se guarda es un objeto como este:
```json
{
  "id": "u_1715512345678_4821",
  "name": "GamerPro99",
  "email": "gamer@email.com",
  "role": "normal"
}
```

Nótese que **no se guarda la contraseña ni el hash**, solo los datos de identidad necesarios para mostrar el nombre del usuario y comprobar su rol.

---

## 8. El login de usuario paso a paso

### Paso 1: Frontend

El usuario introduce email y contraseña. El formulario valida que no estén vacíos y llama a `loginUser()`.

### Paso 2: Petición al backend

```javascript
export async function loginUser({ email, password }) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (data.ok) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))
    startHistorySession(data.user.id)
  }
  return data
}
```

### Paso 3: Lógica en el backend

```javascript
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  const cleanEmail = email.trim().toLowerCase()

  // Buscar usuario activo por email
  const [rows] = await pool.query(
    'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = ? AND activo = 1',
    [cleanEmail]
  )

  // Si no existe, responder con el MISMO error que si la contraseña es incorrecta
  if (!rows.length) return res.json({ ok: false, error: 'INVALID_CREDENTIALS' })

  const u = rows[0]

  // Comparar la contraseña con el hash
  const valid = await bcrypt.compare(password, u.password_hash)

  // Si no coincide, mismo error
  if (!valid) return res.json({ ok: false, error: 'INVALID_CREDENTIALS' })

  // Si todo es correcto, devolver datos del usuario (SIN el hash)
  res.json({ ok: true, user: { id: u.id, name: u.nombre, email: u.email, role: u.rol } })
})
```

**Por qué el mismo error para "email no existe" y "contraseña incorrecta":** Si el servidor devolviera errores distintos para cada caso, un atacante podría enumerar qué emails están registrados probando distintas direcciones. Al devolver el mismo mensaje `INVALID_CREDENTIALS` en ambos casos, el atacante no puede distinguir si el email existe o no.

**Por qué se filtra por `activo = 1`:** Si un administrador desactiva una cuenta (cambia `activo` a 0 en la base de datos), el usuario ya no puede hacer login aunque tenga la contraseña correcta. Esto permite bloquear cuentas sin borrarlas.

---

## 9. Cómo se guarda la sesión sin servidor

### El enfoque tradicional: sesiones en servidor

En la mayoría de sistemas web tradicionales, cuando un usuario hace login el servidor crea una sesión (un registro en memoria o en base de datos) y le da al navegador una cookie con el ID de esa sesión. En cada petición siguiente, el navegador manda esa cookie y el servidor comprueba si es válida.

### El enfoque de CodeKeys: localStorage

CodeKeys usa un enfoque más sencillo y sin estado en el servidor: cuando el login es exitoso, los datos del usuario se guardan en `localStorage` del navegador. No hay cookies, no hay sesiones en el servidor, no hay tokens firmados.

```javascript
// Guardar al hacer login
localStorage.setItem('codekeys-session-user', JSON.stringify({
  id: 'u_123456_789',
  name: 'GamerPro',
  email: 'gamer@email.com',
  role: 'normal'
}))

// Recuperar al cargar la app (en App.vue, al montar)
const user = getSessionUser()

// La función getSessionUser lee del localStorage
export function getSessionUser() {
  const raw = localStorage.getItem('codekeys-session-user')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.id) return null
    return parsed
  } catch {
    return null
  }
}
```

En `App.vue`, al arrancar la aplicación, se ejecuta `getSessionUser()` en el hook `onMounted`. Si hay datos en localStorage, el usuario aparece como autenticado sin necesidad de hacer login de nuevo. Esto es lo que hace que la sesión persista aunque se cierre el navegador y se vuelva a abrir.

### Ventajas de este enfoque

- **Simplicidad:** No requiere gestión de sesiones en el backend. El servidor es completamente sin estado.
- **Sin round-trip al servidor:** La sesión se verifica localmente en el navegador, no hace falta preguntar al servidor si la sesión sigue siendo válida.
- **Escala fácilmente:** Como el servidor no guarda estado de sesión, se puede añadir más servidores sin sincronización entre ellos.

### El flujo completo cuando se recarga la página

```
1. El usuario abre la web
2. Vue monta App.vue
3. onMounted() ejecuta getSessionUser()
4. getSessionUser() lee localStorage['codekeys-session-user']
5. Si hay datos válidos → currentUser.value = { id, name, email, role }
6. La barra de navegación muestra el avatar del usuario
7. El usuario sigue autenticado
```

---

## 10. El logout: qué se limpia y por qué

El logout no es solo "olvidarse del usuario". Hay que limpiar todo lo que se guardó al iniciar sesión:

```javascript
// En App.vue
function onLogout() {
  logoutUser()           // limpia localStorage
  clearHistorySession()  // limpia el historial
  currentUser.value = null
  sessionHistory.value = []
  historyPage.value = false
  adminPage.value = false
}

// En mockAuthDb.js
export function logoutUser() {
  localStorage.removeItem('codekeys-session-user')
  clearHistorySession()
}

// En sessionHistoryDb.js
export function clearHistorySession() {
  localStorage.removeItem('codekeys-session-history-db')
}
```

### Por qué se cierra también el panel de admin y el historial

Cuando `currentUser` se pone a `null`, Vue re-renderiza la interfaz y los botones de "Panel admin" y "Historial" desaparecen. Pero si esas páginas ya estaban abiertas en ese momento, seguirían mostrándose aunque el usuario ya no estuviera autenticado. Por eso se fuerzan a `false` explícitamente.

### Limitación conocida del logout

Si el usuario tiene la web abierta en dos pestañas y hace logout en una, la otra pestaña sigue mostrando la sesión activa hasta que se recargue. Esto ocurre porque `localStorage` no dispara eventos reactivos entre pestañas en Vue 3 sin configuración adicional (habría que escuchar el evento `storage` de la Window API).

---

## 11. Control de roles: admin vs normal

El sistema tiene dos roles: `admin` y `normal`. El rol se guarda en la base de datos en la columna `rol` de la tabla `usuarios` y viaja al frontend cuando el usuario hace login.

### Dónde se comprueba el rol en el frontend

**En AppNav.vue** — para mostrar u ocultar la opción "Panel admin" en el menú:

```javascript
const isAdmin = computed(() => props.currentUser?.role === 'admin')
```

```html
<div v-if="isAdmin" class="num-item" @click="openAdminPanel">
  🛠️ Panel admin
</div>
```

**En App.vue** — para bloquear la apertura del panel aunque se intente por código:

```javascript
function openAdminPanel() {
  if (currentUser.value?.role !== 'admin') return  // bloqueo extra
  resetAllPages()
  adminPage.value = true
}
```

**En AdminPanelPage.vue** — para deshabilitar las acciones dentro del panel:

```javascript
const canManage = computed(() => props.currentUser?.role === 'admin')
```

### Limitación importante de seguridad

Esta comprobación de rol **solo existe en el frontend**. El backend no verifica el rol en ninguna ruta de la API. Esto significa que si alguien construye una petición HTTP directamente a la API sin pasar por el navegador, puede acceder a cualquier endpoint independientemente de su rol.

En un proyecto de producción real, cada ruta protegida del backend debería verificar que la petición viene de un usuario administrador, por ejemplo usando JWT (JSON Web Tokens) o sesiones en servidor. Para el alcance de este proyecto académico se asumió esta limitación de forma consciente.

---

## 12. El historial de sesión

El historial registra los juegos que el usuario visita durante su sesión. Se implementó en `sessionHistoryDb.js` usando `localStorage`.

### Estructura del historial en localStorage

```json
{
  "userId": "u_1715512345678_4821",
  "startedAt": "2026-05-18T10:30:00.000Z",
  "games": [
    {
      "key": "cyberpunk",
      "name": "Cyberpunk 2077",
      "img": "https://...",
      "platform": "PC Steam",
      "price": 12.99,
      "discount": 78,
      "viewedAt": "2026-05-18T10:35:00.000Z"
    }
  ]
}
```

### Cómo se añade una visita

Cada vez que el usuario hace clic en un juego, `App.vue` llama a `addVisitedGameToHistory`:

```javascript
function openGame(game) {
  if (currentUser.value?.id) {
    addVisitedGameToHistory(currentUser.value.id, game)
    sessionHistory.value = getSessionHistory(currentUser.value.id)
  }
  // ...abrir la página del juego
}
```

La función `addVisitedGameToHistory` aplica dos reglas:

1. **Sin duplicados:** Si el juego ya estaba en el historial, se elimina de su posición anterior y se añade al principio (el más reciente primero).
2. **Límite de 30 juegos:** Si ya hay 30 entradas, la más antigua desaparece al añadir una nueva.

```javascript
export function addVisitedGameToHistory(userId, game) {
  let history = readHistory()

  const entry = {
    key: game.key,
    name: game.name,
    img: game.img,
    platform: game.platform,
    price: game.price,
    discount: game.discount,
    viewedAt: new Date().toISOString()
  }

  // Eliminar si ya existe (para ponerlo al principio)
  const filtered = history.games.filter(item => item.key !== game.key)

  // Añadir al principio y limitar a 30
  history.games = [entry, ...filtered].slice(0, 30)

  writeHistory(history)
}
```

### Por qué el historial se vincula al userId

El historial se guarda con el `userId` del usuario. Si otro usuario inicia sesión en el mismo navegador, `getSessionHistory` comprueba que el `userId` del historial coincide con el usuario actual y devuelve una lista vacía si no coincide:

```javascript
export function getSessionHistory(userId) {
  const history = readHistory()
  if (!history || history.userId !== userId) return []
  return history.games
}
```

Esto evita que el historial de un usuario se mezcle con el de otro.

---

## 13. El modal de autenticación en el frontend

El componente `AuthModal.vue` es la interfaz de usuario para login y registro. Es un único componente que maneja ambas operaciones.

### Cómo recibe instrucciones de qué mostrar

El componente recibe dos props:
- `open`: booleano que controla si el modal está visible
- `mode`: cadena `'login'` o `'register'` que indica qué pestaña mostrar al abrir

Cuando `App.vue` llama a `openAuth('register')`, el modal se abre directamente en la pestaña de registro. Cuando llama a `openAuth('login')`, se abre en la de login.

### Los estados del formulario

El formulario tiene tres estados visualmente distintos:

1. **Estado normal:** El usuario puede escribir en los campos
2. **Estado cargando:** Mientras espera respuesta del servidor, el botón se deshabilita con `:disabled="loading"` para evitar envíos múltiples
3. **Estado error:** Se muestra un mensaje de error bajo el formulario

### El sistema de errores

Los códigos de error del backend se traducen a mensajes legibles para el usuario:

```javascript
if (!result.ok) {
  if (result.error === 'EMAIL_EXISTS') {
    errorMessage.value = 'Ese email ya esta registrado.'
    return
  }
  if (result.error === 'INVALID_CREDENTIALS') {
    errorMessage.value = 'Email o contraseña incorrectos.'
    return
  }
  errorMessage.value = 'No se pudo completar la acción.'
}
```

El error `INVALID_CREDENTIALS` muestra el mismo mensaje para "email no existe" y "contraseña incorrecta", exactamente igual que el backend, manteniendo la coherencia de seguridad.

### Cómo se comunica el éxito con el resto de la app

Cuando el login o registro es exitoso, el modal emite un evento al componente padre:

```javascript
emit('authenticated', result.user)
emit('close')
```

`App.vue` escucha este evento con `@authenticated="onAuthenticated"`:

```javascript
function onAuthenticated(user) {
  currentUser.value = user
  sessionHistory.value = getSessionHistory(user.id)
}
```

A partir de ese momento, `currentUser` tiene valor y toda la interfaz se actualiza reactivamente: aparece el avatar del usuario, desaparecen los botones de login y registro, aparecen las opciones del menú de usuario.

### El reseteo del formulario

Cada vez que el modal se abre, el formulario se resetea:

```javascript
watch(() => props.open, (value) => {
  if (value) resetForm()
})

function resetForm() {
  name.value = ''
  email.value = ''
  password.value = ''
  errorMessage.value = ''
}
```

Esto es necesario porque el componente no se destruye y recrea cada vez que se abre; Vue lo mantiene vivo en memoria para que la animación de apertura sea fluida. Sin el reseteo, los datos del intento anterior seguirían en el formulario.

---

## 14. Limitaciones conocidas y por qué se aceptaron

| Limitación | Por qué existe | Solución en producción real |
|---|---|---|
| **Sin JWT** | La sesión en localStorage no tiene firma criptográfica. Cualquiera que acceda al localStorage puede ver los datos del usuario. | Usar JWT firmados con clave secreta, o sesiones en servidor con cookies HttpOnly |
| **Sin expiración de sesión** | La sesión dura indefinidamente hasta hacer logout manual | Añadir un campo `expiresAt` al token y verificarlo en cada petición |
| **Sin rutas protegidas en backend** | El backend no verifica quién hace las peticiones | Middleware de autenticación que verifique el token en cada ruta privada |
| **Sin rate limiting** | Se pueden hacer intentos de login ilimitados | Limitar intentos por IP con una librería como `express-rate-limit` |
| **Sin verificación de email** | El email se acepta sin confirmar que existe | Enviar un email de confirmación con un enlace único |
| **Sin recuperación de contraseña** | No hay flujo de "olvidé mi contraseña" | Implementar envío de email con token temporal |
| **Sin HTTPS** | En el servidor de pruebas se usa HTTP | Configurar certificado SSL/TLS con Let's Encrypt en Traefik |
| **Sin 2FA** | No hay doble factor de autenticación | Integrar TOTP (Google Authenticator) o SMS |

Estas limitaciones se asumieron de forma consciente porque este es un proyecto académico con un tiempo de desarrollo limitado. Implementar todas las medidas de seguridad de un sistema en producción real requeriría semanas adicionales de trabajo. Lo importante es que se conocen, se entienden y se han documentado.

---

## RESUMEN PARA LA PRESENTACIÓN

**Sobre la base de datos:**
- Se diseñó con **13 tablas normalizadas** para evitar redundancia de datos
- Las tablas se relacionan con **claves foráneas ON DELETE CASCADE** para mantener la integridad
- El **procedimiento almacenado** `sp_actualizar_precio` garantiza que cada cambio de precio queda registrado en el historial de forma atómica
- Vive en **AWS RDS**, separada del servidor web, para mayor disponibilidad y seguridad

**Sobre la autenticación:**
- Las contraseñas se hashean con **bcrypt (10 rondas)** y nunca se almacenan en texto plano
- El login devuelve el **mismo error** tanto si el email no existe como si la contraseña es incorrecta (seguridad por opacidad)
- La sesión se persiste en **localStorage** sin JWT ni cookies, lo que simplifica el backend pero limita la seguridad
- El control de **roles (admin/normal)** existe en el frontend y parcialmente en el backend
- El **historial de navegación** se vincula al usuario y se limita a 30 entradas en localStorage
