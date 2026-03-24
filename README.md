# Proyecto Clase

Este proyecto es una aplicación web desarrollada con Vue 3 y Vite, orientada a la gestión de un catálogo de videojuegos y tiendas. Incluye funcionalidades de administración, visualización por categorías, y control de acceso por roles.

## Características principales

- **Panel de administración**: CRUD de juegos y tiendas, acceso restringido a usuarios administradores.
- **Visualización por categorías**: Página dedicada para mostrar juegos por categoría.
- **Gestión de catálogo**: Almacenamiento local (localStorage) para persistencia de datos.
- **Diseño moderno**: Uso de variables CSS para unificar colores y estilos.
- **SPA (Single Page Application)**: Navegación fluida entre páginas sin recarga.

## Estructura del proyecto

```
├── index.html
├── package.json
├── README.md
├── vite.config.js
├── public/
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── style.css
│   ├── assets/
│   └── components/
│       ├── AdminPanelPage.vue
│       ├── CategoryGamesPage.vue
│       └── ...
```

## Instalación y ejecución

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Para construir la aplicación para producción:
   ```bash
   npm run build
   ```

## Uso

- Accede al panel de administración desde la ruta correspondiente (solo usuarios administradores).
- Visualiza juegos por categoría desde la página dedicada.
- Gestiona el catálogo de juegos y tiendas desde el panel de administración.

## Tecnologías utilizadas

- Vue 3
- Vite
- CSS Custom Properties
- localStorage

## Autor

- Proyecto realizado para fines educativos.

## Licencia

Este proyecto es de uso educativo y privado.

---

## Ejecutar con Docker + Traefik

1. Levantar servicios:

```bash
docker compose up -d --build
```

## Despliegue automatico en Debian (un solo comando)

Se incluye el script `deploy-debian.sh` para actualizar codigo y desplegar todo automaticamente:

```bash
chmod +x deploy-debian.sh
./deploy-debian.sh
```

El script hace esto en orden:

- `git pull --ff-only` de la rama actual.
- `docker compose build --pull` para refrescar imagenes.
- `docker compose up -d --remove-orphans` para aplicar cambios.

2. Abrir enlaces:

- App: http://proyecto.localhost
- App por IP del server: http://IP_DEL_SERVER
- Dashboard Traefik: http://localhost:8080
- Backend health: http://IP_DEL_SERVER/api/health

## Imágenes de frontend y backend

Al ejecutar `docker compose up -d --build` se crean ambas imágenes:

- Frontend: servicio `proyecto-clase`
- Backend: servicio `backend`

También puedes construirlas por separado:

```bash
docker compose build proyecto-clase backend
```

## Logs sencillos (frontend y backend)

Ver logs de ambos servicios en tiempo real:

```bash
docker compose logs -f proyecto-clase backend
```

Ver solo backend:

```bash
docker compose logs -f backend
```

Ver solo frontend:

```bash
docker compose logs -f proyecto-clase
```

## Enlaces personalizados

Puedes cambiar el host de la app con una variable de entorno antes de ejecutar compose:

```bash
TRAEFIK_APP_HOST=miapp.localhost docker compose up -d --build
```

## Detener servicios

```bash
docker compose down
```

