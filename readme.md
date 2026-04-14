#  Rasty

Rasty es una aplicación web de registro y seguimiento musical inspirada en Letterboxd. Permite a los usuarios registrar los álbumes que escuchan, valorarlos, escribir reseñas y compartir su actividad musical con otros usuarios.

## Características principales

- Registro e inicio de sesión con autenticación segura mediante Supabase Auth
- Búsqueda de álbumes por artista mediante la API de MusicBrainz
- Registro de escuchas con valoración (0.5–5 estrellas), reseña y canciones favoritas
- Previews de audio de 30 segundos mediante la iTunes Search API
- Perfil de usuario con estadísticas, álbumes favoritos y últimas escuchas
- Sistema social: seguir usuarios, feed de actividad y estadísticas de comunidad
- Diseño responsive y accesible (WCAG)

## Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Backend:** Node.js + Express
- **Base de datos y autenticación:** Supabase (PostgreSQL)
- **APIs externas:** MusicBrainz, Cover Art Archive, iTunes Search API, UI Avatars

## Requisitos previos

- Node.js v18 o superior
- npm v9 o superior
- Cuenta en Supabase (plan gratuito suficiente)
- Conexión a internet (para las APIs externas)

##  Instalación

### 1. Clonar el repositorio
git clone https://github.com/raulrasty/Rasty.git
cd rasty

### 2. Instalar dependencias
npm install

### 3. Configurar variables de entorno

Crea un archivo .env en la raíz del proyecto:

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
MUSICBRAINZ_USER_AGENT=RastyApp/1.0 (tu-email@ejemplo.com)
PORT=3000

### 4. Crear las tablas en Supabase

En el panel de Supabase ve a SQL Editor y ejecuta el script SQL incluido en el archivo database.sql del repositorio.

### 5. Arrancar el servidor
npm start

La aplicación estará disponible en http://localhost:3000

## Estructura del proyecto

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
│   └── *.html
├── .env
├── .gitignore
├── package.json
└── server.js

## 🌐 Rutas de la API

POST   /users/register          Registro de usuario
POST   /users/login             Inicio de sesión
GET    /users/:id               Obtener perfil
PUT    /users/:id               Actualizar perfil
GET    /albums/search-mb        Buscar álbumes en MusicBrainz
GET    /listens/:user_id        Escuchas de un usuario
POST   /listens                 Crear escucha
PUT    /listens/:id             Editar escucha
DELETE /listens/:id             Eliminar escucha
POST   /follows/:id             Seguir usuario
DELETE /follows/:id             Dejar de seguir
GET    /community/top-week      Álbumes más escuchados esta semana
GET    /community/top-rated     Álbumes mejor valorados

## Variables de entorno

SUPABASE_URL          URL de tu proyecto Supabase
SUPABASE_KEY          Service role key de Supabase
MUSICBRAINZ_USER_AGENT  Identificador para la API de MusicBrainz
PORT                  Puerto del servidor (por defecto 3000)

## Autor

Raúl Álvarez Tejero Pérez — 2026