# 🎵 Rasty

Rasty es una aplicación web de registro y seguimiento musical inspirada en Letterboxd. Permite a los usuarios registrar los álbumes que escuchan, valorarlos, escribir reseñas y compartir su actividad musical con otros usuarios.

🌐 **Demo en producción:** [rasty.up.railway.app](https://rasty.up.railway.app)

## 🚀 Características principales

- Registro e inicio de sesión con autenticación segura mediante Supabase Auth
- Búsqueda de álbumes por artista mediante la API de MusicBrainz
- Registro de escuchas con valoración (0.5–5 estrellas), reseña y canciones favoritas
- Previews de audio de 30 segundos mediante la iTunes Search API
- Perfil de usuario con estadísticas, álbumes favoritos y últimas escuchas
- Sistema social: seguir usuarios, feed de actividad y estadísticas de comunidad
- Sistema de roles: usuarios normales y administradores
- Diseño responsive y accesible (WCAG)
- Page loader animado en todas las páginas

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Backend:** Node.js + Express
- **Base de datos y autenticación:** Supabase (PostgreSQL)
- **Despliegue:** Railway
- **APIs externas:** MusicBrainz, Cover Art Archive, iTunes Search API, UI Avatars

## 📋 Requisitos previos

- Node.js v18 o superior
- npm v9 o superior
- Cuenta en Supabase (plan gratuito suficiente)
- Conexión a internet (para las APIs externas)

## ⚙️ Instalación en local

### 1. Clonar el repositorio

    git clone https://github.com/raulrasty/Rasty.git
    cd rasty

### 2. Instalar dependencias

    npm install

### 3. Configurar variables de entorno

Crea un archivo .env en la raíz del proyecto:

    SUPABASE_URL=https://tu-proyecto.supabase.co
    SUPABASE_KEY=tu-service-role-key
    SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
    MUSICBRAINZ_USER_AGENT=RastyApp/1.0 (tu-email@ejemplo.com)
    JWT_SECRET=tu-clave-secreta
    PORT=3000

⚠️ Nunca subas el archivo .env al repositorio. Está incluido en .gitignore.

### 4. Crear las tablas en Supabase

En el panel de Supabase ve a SQL Editor y ejecuta el script incluido en database.sql.

### 5. Arrancar el servidor

    npm start

La aplicación estará disponible en http://localhost:3000

Para desarrollo con recarga automática usa npm run dev

## 🚀 Despliegue en Railway

1. Conecta el repositorio de GitHub en railway.app
2. Railway detecta Node.js automáticamente y ejecuta npm start
3. Añade las variables de entorno en la pestaña Variables
4. Railway genera un dominio público automáticamente
5. Cada push a main desencadena un redespliegue automático

## 📁 Estructura del proyecto

    rasty/
    ├── config/
    │   └── supabaseClient.js
    ├── controllers/
    ├── middleware/
    │   └── requireAuth.js
    ├── routes/
    ├── services/
    ├── public/
    │   ├── css/
    │   ├── js/
    │   │   └── config.js
    │   └── *.html
    ├── components/
    │   └── header.html
    ├── database.sql
    ├── .env
    ├── .gitignore
    ├── package.json
    └── server.js

## 🌐 Rutas de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /users/register | Registro de usuario |
| POST | /users/login | Inicio de sesión |
| GET | /users/search | Buscar usuarios |
| GET | /users/:id | Obtener perfil |
| PUT | /users/:id | Actualizar perfil |
| DELETE | /users/me | Eliminar cuenta propia |
| DELETE | /users/:id | Eliminar cuenta (solo admin) |
| GET | /albums/search-mb | Buscar álbumes en MusicBrainz |
| GET | /listens/:user_id | Escuchas de un usuario |
| GET | /listens/paginated/:user_id | Escuchas paginadas |
| POST | /listens | Crear escucha |
| PUT | /listens/:id | Editar escucha |
| DELETE | /listens/:id | Eliminar escucha |
| POST | /follows/:id | Seguir usuario |
| DELETE | /follows/:id | Dejar de seguir |
| GET | /album-ratings/:id/average | Media de valoraciones |
| GET | /community/top-week | Álbumes más escuchados esta semana |
| GET | /community/top-rated | Álbumes mejor valorados |
| GET | /community/following-activity | Actividad de seguidos |

## 🔒 Variables de entorno

|          Variable         |     Descripción                         |
|---------------------------|-----------------------------------------|
|         SUPABASE_URL      | URL de tu proyecto Supabase             |
|         SUPABASE_KEY      | Service role key de Supabase            |
| SUPABASE_SERVICE_ROLE_KEY | Service role key (admin)                |
|    MUSICBRAINZ_USER_AGENT | Identificador para la API de MusicBrainz|
|        JWT_SECRET         | Clave secreta para tokens JWT           |
|            PORT           | Puerto del servidor (por defecto 3000)  |

## 👑 Sistema de roles

Rasty tiene dos roles: user (por defecto) y admin. Para dar permisos de administrador ejecuta en el SQL Editor de Supabase:

    UPDATE users SET role = 'admin' WHERE username = 'tu-username';

## 👤 Autor

Raúl Álvarez Tejero — Proyecto Final de Ciclo DAW 2024-2025