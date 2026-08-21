import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { env } from '../env.js';
import { query, queryOne } from '../db.js';
import { forbidden, unauthorized } from './http.js';
import { mapUser, type UserRow } from './mappers.js';

export interface SessionUser {
  id: string;
  phone: string;
  role: 'member' | 'operator' | 'admin';
  displayName: string;
  sessionId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

const SESSION_TTL_MS = env.sessionTtlDays * 24 * 60 * 60 * 1000;

interface TokenPayload {
  sub: string;
  sid: string;
}

export function signSessionToken(userId: string, sessionId: string): string {
  const payload: TokenPayload = { sub: userId, sid: sessionId };
  return jwt.sign(payload, env.sessionSecret, {
    algorithm: 'HS256',
    expiresIn: `${env.sessionTtlDays}d`,
    issuer: 'noafar',
    audience: 'noafar-web',
  });
}

function verifySessionToken(token: string): TokenPayload | null {
  try {
    // Pinning the algorithm blocks the "alg: none" and RS→HS confusion attacks.
    const decoded = jwt.verify(token, env.sessionSecret, {
      algorithms: ['HS256'],
      issuer: 'noafar',
      audience: 'noafar-web',
    });
    if (typeof decoded === 'string') return null;
    const { sub, sid } = decoded as jwt.JwtPayload & Partial<TokenPayload>;
    if (typeof sub !== 'string' || typeof sid !== 'string') return null;
    return { sub, sid };
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  req: Request,
): Promise<{ sessionId: string; token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const row = await queryOne<{ id: string }>(
    `INSERT INTO sessions (user_id, user_agent, ip, expires_at)
          VALUES ($1, $2, $3, $4)
       RETURNING id`,
    [
      userId,
      String(req.headers['user-agent'] ?? '').slice(0, 400),
      String(req.ip ?? '').slice(0, 100),
      expiresAt,
    ],
  );
  if (!row) throw new Error('ساخت نشست کاربر ناموفق بود.');
  return { sessionId: row.id, token: signSessionToken(userId, row.id), expiresAt };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(env.sessionCookieName, token, {
    httpOnly: true, // unreachable from JavaScript, so XSS cannot steal it
    secure: env.isProduction,
    sameSite: 'lax', // blocks cross-site form/AJAX submission of the cookie
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(env.sessionCookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await query(`UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`, [
    sessionId,
  ]);
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await query(`UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [
    userId,
  ]);
}

function readToken(req: Request): string | null {
  const cookieToken = req.cookies?.[env.sessionCookieName];
  if (typeof cookieToken === 'string' && cookieToken) return cookieToken;

  // Bearer is kept for non-browser clients (scripts, mobile) that cannot use
  // cookies; browsers never need it.
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim() || null;
  }
  return null;
}

async function loadSessionUser(req: Request): Promise<SessionUser | null> {
  const token = readToken(req);
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const row = await queryOne<{
    id: string;
    phone: string;
    role: SessionUser['role'];
    display_name: string;
    is_blocked: boolean;
  }>(
    `SELECT u.id, u.phone, u.role, u.display_name, u.is_blocked
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = $1
        AND s.user_id = $2
        AND s.revoked_at IS NULL
        AND s.expires_at > now()`,
    [payload.sid, payload.sub],
  );

  if (!row || row.is_blocked) return null;

  return {
    id: row.id,
    phone: row.phone,
    role: row.role,
    displayName: row.display_name,
    sessionId: payload.sid,
  };
}

/** Attaches `req.user` when a valid session exists; never rejects. */
export const attachUser: RequestHandler = (req, _res, next) => {
  loadSessionUser(req)
    .then((user) => {
      if (user) req.user = user;
      next();
    })
    .catch(next);
};

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  next();
}

export function requireRole(...roles: SessionUser['role'][]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}

export const requireOperator = requireRole('operator', 'admin');
export const requireAdmin = requireRole('admin');

// --------------------------------------------------------------- OTP -------

/**
 * Hashes the OTP with scrypt so a database leak does not expose live codes.
 * Node's built-in scrypt avoids a native bcrypt dependency.
 */
export function hashOtp(phone: string, code: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(`${phone}:${code}`, salt, 32);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export function verifyOtpHash(phone: string, code: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  try {
    const derived = crypto.scryptSync(`${phone}:${code}`, Buffer.from(saltHex, 'hex'), 32);
    const expected = Buffer.from(hashHex, 'hex');
    if (expected.length !== derived.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Cryptographically strong 5-digit code (matches the UI's 5-digit input). */
export function generateOtp(): string {
  return String(crypto.randomInt(0, 100_000)).padStart(5, '0');
}

export function publicUser(row: UserRow): Record<string, unknown> {
  return mapUser(row);
}
