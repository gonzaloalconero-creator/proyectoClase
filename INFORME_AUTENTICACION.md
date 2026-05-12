# Informe de Autenticación — CodeKeys

**Proyecto:** CodeKeys — Comparador de precios de videojuegos  
**Fecha:** 12/05/2026  
**Tecnologías:** Vue 3 · Express · MySQL · bcryptjs · localStorage

---

## Tabla de contenidos

1. [Descripcion general](#1-descripcion-general)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Backend — Rutas de autenticacion](#3-backend--rutas-de-autenticacion)
4. [Base de datos — Usuarios](#4-base-de-datos--usuarios)
5. [Frontend — Servicio de autenticacion](#5-frontend--servicio-de-autenticacion)
6. [Frontend — Componente AuthModal](#6-frontend--componente-authmodal)
7. [Gestion de sesion global](#7-gestion-de-sesion-global)
8. [Control de acceso por rol](#8-control-de-acceso-por-rol)
9. [Historial de sesion](#9-historial-de-sesion)
10. [Almacenamiento en el cliente](#10-almacenamiento-en-el-cliente)
11. [Flujo completo de login y registro](#11-flujo-completo-de-login-y-registro)
12. [Limitaciones actuales](#12-limitaciones-actuales)

---

## 1. Descripcion general

El sistema de autenticacion de CodeKeys es una implementacion propia sin librerias de sesion externas. Se basa en tres pilares:

- **Backend:** Express valida credenciales y hashea contraseñas con `bcryptjs`
- **Base de datos:** MySQL almacena usuarios con contraseña hasheada y rol asignado
- **Frontend:** Vue 3 gestiona la sesion del usuario en `localStorage` sin token firmado

No se usan JWT, cookies ni sesiones en servidor. La sesion persiste en el navegador del usuario de forma indefinida hasta que se hace logout.

---

## 2. Arquitectura del sistema

```
┌──────────────────────────────────────────────┐
│                  FRONTEND (Vue 3)            │
│                                              │
│  AuthModal.vue  ──►  mockAuthDb.js           │
│  (UI login/reg)       (fetch + localStorage) │
│                              │               │
│  App.vue  ◄──────────────────┘               │
│  (estado global de sesion)                   │
│                                              │
│  AppNav.vue  (avatar, menu, logout)          │
└──────────────────────────────────────────────┘
                     │
              fetch POST /api/auth/*
                     │
┌──────────────────────────────────────────────┐
│              BACKEND (Express)               │
│                                              │
│  POST /api/auth/register                     │
│  POST /api/auth/login                        │
│                                              │
│  bcryptjs.hash()  /  bcryptjs.compare()      │
└──────────────────────────────────────────────┘
                     │
              Query SQL (mysql2)
                     │
┌──────────────────────────────────────────────┐
│             BASE DE DATOS (MySQL)            │
│                                              │
│  tabla: usuarios                             │
│  tabla: user_preferencias                    │
└──────────────────────────────────────────────┘
```

---

## 3. Backend — Rutas de autenticacion

**Archivo:** `backend/server.js`  
**Dependencia principal:** `bcryptjs ^3.0.3`

### POST `/api/auth/register`

Crea una cuenta nueva en el sistema.

**Flujo:**
1. Valida que `name`, `email` y `password` esten presentes
2. Comprueba que el email no este ya registrado en la BD
3. Hashea la contraseña con `bcrypt.hash(password, 10)` — 10 rondas de sal
4. Genera un ID unico con formato `u_{timestamp}_{random4digitos}`
5. Inserta el usuario en la tabla `usuarios` con `rol = 'normal'`
6. Crea automaticamente una fila en `user_preferencias` con valores por defecto
7. Devuelve los datos del usuario creado

**Respuesta exitosa:**
```json
{
  "ok": true,
  "user": {
    "id": "u_1715512345678_4821",
    "name": "Nombre Usuario",
    "email": "usuario@email.com",
    "role": "normal"
  }
}
```

**Codigos de error:**
| Codigo | Significado |
|---|---|
| `MISSING_FIELDS` | Falta nombre, email o contraseña |
| `EMAIL_EXISTS` | El email ya esta registrado |
| `SERVER_ERROR` | Error interno del servidor |

---

### POST `/api/auth/login`

Autentica a un usuario existente.

**Flujo:**
1. Valida que `email` y `password` esten presentes
2. Busca al usuario en la BD por email con `activo = 1`
3. Compara la contraseña con `bcrypt.compare(password, hash)`
4. Si es correcta devuelve los datos del usuario
5. Si falla devuelve `INVALID_CREDENTIALS` (mismo error para email inexistente y contraseña incorrecta, por seguridad)

**Respuesta exitosa:**
```json
{
  "ok": true,
  "user": {
    "id": "u_1715512345678_4821",
    "nombre": "Nombre Usuario",
    "email": "usuario@email.com",
    "rol": "normal"
  }
}
```

**Codigos de error:**
| Codigo | Significado |
|---|---|
| `MISSING_FIELDS` | Falta email o contraseña |
| `INVALID_CREDENTIALS` | Email no existe o contraseña incorrecta |
| `SERVER_ERROR` | Error interno del servidor |

---

### Notas de seguridad del backend

- Las contraseñas **nunca se almacenan en texto plano**, siempre como hash bcrypt
- El endpoint de login **no distingue** entre "email no existe" y "contraseña incorrecta" — devuelve el mismo error en ambos casos para evitar enumeracion de usuarios
- **No hay middleware de autenticacion**: las rutas del backend no estan protegidas por token
- **No hay rate limiting**: no hay limite de intentos de login fallidos

---

## 4. Base de datos — Usuarios

### Tabla `usuarios`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | VARCHAR(60) | Formato `u_{timestamp}_{random}` |
| `nombre` | VARCHAR(100) | Nombre del usuario |
| `email` | VARCHAR(200) UNIQUE | Correo electronico (unico) |
| `password_hash` | VARCHAR(255) | Hash bcrypt de la contraseña |
| `rol` | ENUM('admin','normal') | Rol de acceso |
| `activo` | TINYINT(1) | `1` habilitado, `0` deshabilitado |
| `creado_en` | TIMESTAMP | Fecha de registro |

### Tabla `user_preferencias`

Se crea automaticamente al registrarse. Relacion 1:1 con `usuarios`.

| Columna | Valor por defecto | Descripcion |
|---|---|---|
| `usuario_id` | — | FK → usuarios.id (CASCADE) |
| `tema` | `dark` | Tema de interfaz |
| `moneda` | `EUR` | Moneda preferida |
| `idioma` | `es` | Idioma preferido |

### Usuario administrador (seed)

El script SQL incluye un usuario admin inicial:

| Campo | Valor |
|---|---|
| ID | `admin_seed` |
| Email | `admin@codekeys.local` |
| Rol | `admin` |
| Contraseña | Hasheada con SHA2 en seed — **reemplazar con bcrypt desde el backend** |

---

## 5. Frontend — Servicio de autenticacion

**Archivo:** `src/services/mockAuthDb.js`

Es el puente entre la UI y el backend. Gestiona las peticiones HTTP y el almacenamiento de la sesion en `localStorage`.

**Clave de localStorage:** `codekeys-session-user`

### `registerUser({ name, email, password })`

```
1. POST /api/auth/register con los datos del formulario
2. Si ok → guarda el usuario en localStorage
3. Si ok → inicia sesion de historial para ese usuario
4. Devuelve la respuesta del servidor
```

### `loginUser({ email, password })`

```
1. POST /api/auth/login con email y contraseña
2. Si ok → guarda el usuario en localStorage
3. Si ok → inicia sesion de historial para ese usuario
4. Devuelve la respuesta del servidor
```

### `getSessionUser()`

Lee el usuario del `localStorage` y lo devuelve. Si no existe o el JSON esta corrupto devuelve `null`. Se llama al montar la aplicacion para recuperar la sesion existente.

### `logoutUser()`

Elimina la clave `codekeys-session-user` del `localStorage` y limpia el historial de sesion.

---

## 6. Frontend — Componente AuthModal

**Archivo:** `src/components/AuthModal.vue`

Modal con dos pestañas: **Login** y **Register**.

### Props

| Prop | Tipo | Descripcion |
|---|---|---|
| `open` | Boolean | Muestra u oculta el modal |
| `mode` | String | `'login'` o `'register'` |

### Eventos emitidos

| Evento | Payload | Cuando se emite |
|---|---|---|
| `@close` | — | Al cerrar el modal |
| `@authenticated` | `{ id, name, email, role }` | Tras login o registro exitoso |

### Validaciones del formulario (lado cliente)

| Campo | Regla |
|---|---|
| Nombre | Minimo 3 caracteres |
| Email | Debe contener `@` |
| Contraseña | Minimo 6 caracteres |

### Mensajes de error al usuario

| Codigo del servidor | Mensaje mostrado |
|---|---|
| `EMAIL_EXISTS` | "Ese email ya esta registrado." |
| `INVALID_CREDENTIALS` | "Email o contraseña incorrectos." |
| Cualquier otro error | "Error al iniciar sesion. Intentalo de nuevo." |

### Estados del modal

- **Estado normal:** formulario editable
- **Estado cargando:** boton deshabilitado mientras espera respuesta del servidor
- **Estado error:** muestra mensaje de error bajo el formulario

---

## 7. Gestion de sesion global

**Archivo:** `src/App.vue`

`App.vue` es el componente raiz y gestiona el estado de autenticacion para toda la aplicacion.

### Inicializacion al arrancar

Al montar la app se ejecuta `getSessionUser()` para recuperar del `localStorage` cualquier sesion previa. Si existe, el usuario aparece como autenticado sin necesidad de hacer login de nuevo.

### Al autenticarse (`onAuthenticated`)

```
1. Actualiza currentUser con los datos del usuario
2. Carga el historial de navegacion de ese usuario
3. Propaga el estado hacia todos los componentes hijos via props
```

### Al hacer logout (`onLogout`)

```
1. Llama a logoutUser() → borra localStorage
2. Limpia el historial de sesion
3. Pone currentUser a null
4. Cierra el panel de admin y el historial si estaban abiertos
5. Redirige a la vista principal
```

---

## 8. Control de acceso por rol

Hay dos roles disponibles: `admin` y `normal`.

### Donde se comprueba el rol

| Archivo | Comprobacion | Efecto |
|---|---|---|
| `App.vue` | `currentUser?.role !== 'admin'` | Bloquea apertura del panel admin |
| `AppNav.vue` | `computed isAdmin` | Muestra u oculta la opcion "Panel admin" en el menu |
| `AdminPanelPage.vue` | `computed canManage` | Habilita o deshabilita acciones de administracion |

### Limitacion importante

La verificacion de rol **solo existe en el frontend**. El backend no comprueba el rol en ninguna ruta, por lo que cualquier peticion directa a la API evitaria este control. Las rutas del backend no estan protegidas.

---

## 9. Historial de sesion

**Archivo:** `src/services/sessionHistoryDb.js`  
**Clave de localStorage:** `codekeys-session-history-db`

Al autenticarse se inicia una sesion de historial vinculada al `usuario_id`. Cada vez que el usuario visita la pagina de un juego se registra una entrada con:

| Campo | Descripcion |
|---|---|
| `key` | Slug del juego |
| `name` | Nombre del juego |
| `img` | URL de la imagen |
| `platform` | Plataforma |
| `price` | Precio en el momento de la visita |
| `viewedAt` | Timestamp ISO de la visita |

Se conservan como maximo los **30 ultimos juegos visitados** por sesion. El historial se borra al hacer logout.

---

## 10. Almacenamiento en el cliente

Toda la persistencia del lado cliente usa `localStorage`. No se usan cookies ni `sessionStorage`.

| Clave | Contenido | Se borra al hacer logout |
|---|---|---|
| `codekeys-session-user` | Objeto usuario `{ id, name, email, role }` | Si |
| `codekeys-session-history-db` | Historial de juegos visitados | Si |
| `codekeys-theme` | Tema seleccionado (`dark`/`light`) | No |
| `codekeys-currency` | Moneda seleccionada | No |
| `codekeys-locale` | Idioma seleccionado | No |
| `codekeys-favorites` | Juegos marcados como favoritos | No |
| `blogs` | Posts del blog (panel admin) | No |

---

## 11. Flujo completo de login y registro

### Registro

```
Usuario rellena formulario (nombre, email, contraseña)
        │
        ▼
AuthModal valida campos client-side (longitud, formato email)
        │
        ▼
mockAuthDb.registerUser() → POST /api/auth/register
        │
        ▼
Backend comprueba campos presentes
        │
        ├── Email ya existe → { ok: false, code: 'EMAIL_EXISTS' }
        │         │
        │         ▼
        │   AuthModal muestra "Ese email ya esta registrado"
        │
        └── Email libre → bcrypt.hash(password, 10)
                  │
                  ▼
            INSERT INTO usuarios + INSERT INTO user_preferencias
                  │
                  ▼
            { ok: true, user: { id, name, email, role } }
                  │
                  ▼
            localStorage.setItem('codekeys-session-user', JSON)
                  │
                  ▼
            App.vue recibe evento @authenticated → usuario autenticado
```

### Login

```
Usuario introduce email y contraseña
        │
        ▼
mockAuthDb.loginUser() → POST /api/auth/login
        │
        ▼
Backend busca usuario por email con activo = 1
        │
        ├── No encontrado → { ok: false, code: 'INVALID_CREDENTIALS' }
        │
        └── Encontrado → bcrypt.compare(password, hash)
                  │
                  ├── No coincide → { ok: false, code: 'INVALID_CREDENTIALS' }
                  │
                  └── Coincide → { ok: true, user: { ... } }
                            │
                            ▼
                      localStorage.setItem('codekeys-session-user', JSON)
                            │
                            ▼
                      App.vue recibe evento @authenticated → usuario autenticado
```

### Logout

```
Usuario pulsa "Cerrar sesion" en el menu de AppNav
        │
        ▼
AppNav emite evento @logout
        │
        ▼
App.vue ejecuta onLogout()
        │
        ▼
localStorage.removeItem('codekeys-session-user')
localStorage.removeItem('codekeys-session-history-db')
        │
        ▼
currentUser = null → la UI vuelve al estado de no autenticado
```

---

## 12. Limitaciones actuales

| Limitacion | Descripcion |
|---|---|
| **Sin JWT** | No hay token firmado. El servidor no puede verificar si una peticion viene de un usuario autenticado |
| **Sin sesiones en servidor** | El backend no tiene estado de sesion. Cualquiera con los datos del usuario puede suplantar su sesion |
| **Sin expiracion de sesion** | La sesion en localStorage dura indefinidamente hasta hacer logout manual |
| **Sin rutas protegidas en backend** | Todas las rutas de la API son publicas. El control de rol solo existe en el frontend |
| **Sin rate limiting** | No hay limite de intentos de login fallidos |
| **Sin verificacion de email** | El email se acepta sin confirmar que existe |
| **Sin recuperacion de contraseña** | No hay flujo de "olvidé mi contraseña" |
| **Sin CSRF protection** | No hay tokens anti-CSRF |
| **Sin 2FA** | No hay autenticacion de dos factores |
| **Logout solo local** | Al hacer logout solo se borra localStorage. Si hubiera otra pestana abierta seguiria autenticado hasta recargar |
