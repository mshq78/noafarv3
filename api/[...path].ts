/**
 * Vercel serverless entry point.
 *
 * Vercel routes every `/api/*` request to this catch-all function, which hands
 * it to the same Express app the self-hosted server runs. The app is created
 * once per instance; the schema is applied on the first request it serves.
 */
import { app } from '../server/src/app.js';

export default app;

export const config = {
  // The Express app needs the raw request, not Vercel's parsed body.
  api: { bodyParser: false },
};
