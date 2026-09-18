/**
 * Vercel serverless entry point.
 *
 * `vercel.json` rewrites every `/api/*` request here and carries the original
 * path in `__path`, rather than relying on a `[...catchAll]` filename. That
 * convention resolved to a single dynamic segment on this project, so
 * `/api/health` reached the app while `/api/auth/register` was refused by the
 * router before the function ran — most of the API, unreachable.
 *
 * A rewrite replaces `req.url` with the destination, and Express routes on
 * `req.url`, so the original path is put back before the app sees it. The
 * reconstruction is skipped when `__path` is absent, which keeps this correct
 * whether or not the platform preserves the incoming URL.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../server/src/app.js';

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  const incoming = new URL(req.url ?? '/', 'http://localhost');
  const original = incoming.searchParams.get('__path');

  if (original !== null) {
    incoming.searchParams.delete('__path');
    const query = incoming.searchParams.toString();
    // `__path` never carries the leading slash; the capture group starts after
    // `/api/`.
    req.url = `/api/${original}${query ? `?${query}` : ''}`;
  }

  (app as unknown as NodeHandler)(req, res);
}

export const config = {
  // The Express app needs the raw request, not Vercel's parsed body.
  api: { bodyParser: false },
};
