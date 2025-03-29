import { Hono } from 'hono';
// import { basicAuth } from 'hono/basic-auth' // Removed example auth
// import { etag } from 'hono/etag' // Removed example etag
import { logger } from 'hono/logger'; // Added logger for visibility
import { poweredBy } from 'hono/powered-by';
import { prettyJSON } from 'hono/pretty-json';

// Import DB instance and type
import { db } from './database'; // Assuming index.ts inside ./database

// Import route modules
import { serve } from '@hono/node-server';
import { authRoutes } from './modules/auth/auth.route';
import { bancaRoutes } from './modules/banca/banca.route';
import { calendarRoutes } from './modules/calendar/calendar.route';
import { cursoRoutes } from './modules/curso/curso.route';
import { documentoRoutes } from './modules/documento/documento.route';
import { usuarioRoutes } from './modules/usuario/usuario.route';
import { AppVariables } from './types';

// Create Hono app with typed Variables
const app = new Hono<{ Variables: AppVariables }>();

// --- Middleware ---
app.use('*', poweredBy())
  .use('*', logger()) // Log all requests
  .use('*', prettyJSON()) // Pretty print all JSON responses

// Middleware to inject DB instance into context
app.use('*', async (c, next) => {
  c.set('db', db); // Set the imported db instance
  await next();
});

// --- Routes ---
app.get('/', (c) => c.json({ message: 'Server is running!' }))
  .route('/auth', authRoutes)
  .route('/banca', bancaRoutes)
  .route('/calendar', calendarRoutes)
  .route('/cursos', cursoRoutes)
  .route('/documentos', documentoRoutes)
  .route('/usuario', usuarioRoutes)

// --- Error Handling (Keep after routes potentially) ---
// Custom Not Found Message
app.notFound((c) => {
    return c.json({ message: 'Not Found', ok: false }, 404);
});

// Error handling
app.onError((err, c) => {
    console.error(`Server Error: ${err}`);
    return c.json({ message: 'Internal Server Error', ok: false }, 500);
});

// --- Server Start ---
serve({ fetch:app.fetch, port: 3000 });
console.log(" ✅ Server starting on port 3000...") 

export default app
