Backend de GeoSchools (Express + MySQL)

Resumen
- API modular en Express, lista para consumir desde el frontend.
- Conexión MySQL con mysql2/promise.
- Rutas implementadas bajo `/api` y CORS con credenciales habilitadas.
- Scripts SQL con esquema e inserts mínimos.

Endpoints
- GET `/api/departments` -> `[{ department_id, name }]`
- GET `/api/municipalities?department_id=1` -> `[{ municipality_id, name }]`
- GET `/api/schools?q=&department_id=&municipality_id=&sector=&page=&limit=` -> `{ items:[...], total: N }`
- GET `/api/schools/:id` -> `{ school_id, name, sector, address_text, level_name, municipality_id, municipality_name, geom:{ type:'Point', coordinates:[lng,lat] }, reviews:[...] }`
- GET `/api/favorites` -> `[{ school_id, name, ...}]`
- POST `/api/favorites { school_id }`
- DELETE `/api/favorites/:school_id`

Requisitos
- Node.js 18+
- MySQL 8.x

Configuración
1) Copia `.env.example` a `.env` y ajusta credenciales y CORS
2) Crea la base de datos y corre los scripts:
   - `sql/schema.sql`
   - `sql/seed.sql`
3) Instala dependencias y levanta el servidor:
   ```bash
   cd backend
   npm install
   npm start
   ```

Variables .env
- `PORT` (default 8080)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `CORS_ORIGIN` (p.ej. `http://localhost:5500` o deja vacío para reflejar origen)

Notas
- El frontend por defecto usa `http://localhost:8080/api` (configurable en `assets/js/services/config.js` o desde la UI).
- Favoritos usan `user_id=1` por simplicidad (sin autenticación).