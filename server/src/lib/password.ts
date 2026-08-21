import crypto from 'node:crypto';

/**
 * Password hashing with scrypt from Node's standard library — deliberately
 * memory-hard, so a leaked hash is expensive to attack, and with no native
 * build step the way bcrypt/argon2 would need.
 */
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_PARAMS: crypto.ScryptOptions = {
  N: 16_384, // CPU/memory cost
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

/** Encoded as `scrypt$N$r$p$salt$hash` so the cost can be raised later. */
export function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH);
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, SCRYPT_PARAMS, (error, derived) => {
      if (error) reject(error);
      else {
        resolve(
          `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$` +
            `${salt.toString('hex')}$${derived.toString('hex')}`,
        );
      }
    });
  });
}

export function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return Promise.resolve(false);

  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return Promise.resolve(false);

  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts;
  const options: crypto.ScryptOptions = {
    N: Number(nRaw),
    r: Number(rRaw),
    p: Number(pRaw),
    maxmem: 256 * 1024 * 1024,
  };
  if (!Number.isFinite(options.N) || !Number.isFinite(options.r) || !Number.isFinite(options.p)) {
    return Promise.resolve(false);
  }

  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, 'hex');
  } catch {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    crypto.scrypt(
      password.normalize('NFKC'),
      Buffer.from(saltHex, 'hex'),
      expected.length,
      options,
      (error, derived) => {
        if (error || derived.length !== expected.length) resolve(false);
        else resolve(crypto.timingSafeEqual(derived, expected));
      },
    );
  });
}

/**
 * Burns roughly the same time as a real verification. Called when no account
 * matches, so a failed login cannot be distinguished from an unknown address
 * by how long it takes.
 */
const DUMMY_HASH = crypto.randomBytes(KEY_LENGTH).toString('hex');
const DUMMY_SALT = crypto.randomBytes(SALT_LENGTH).toString('hex');
export function burnPasswordTime(password: string): Promise<boolean> {
  return verifyPassword(
    password,
    `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${DUMMY_SALT}$${DUMMY_HASH}`,
  );
}

export interface PasswordProblem {
  ok: boolean;
  message?: string;
}

/**
 * Length is the property that actually matters; a composition rule would only
 * push people toward `Passw0rd!`. Common and obviously weak choices are
 * rejected outright.
 */
const WEAK_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'qwertyui',
  'iloveyou', 'admin123', '11111111', '00000000', 'noafar123', 'password123',
]);

export function checkPasswordStrength(password: string, email?: string): PasswordProblem {
  const value = password.normalize('NFKC');
  if (value.length < 8) return { ok: false, message: 'گذرواژه باید حداقل ۸ نویسه باشد.' };
  if (value.length > 200) return { ok: false, message: 'گذرواژه بیش از حد طولانی است.' };
  if (WEAK_PASSWORDS.has(value.toLowerCase())) {
    return { ok: false, message: 'این گذرواژه بسیار ساده و قابل حدس است. گذرواژه دیگری انتخاب کنید.' };
  }
  if (/^(.)\1+$/.test(value)) {
    return { ok: false, message: 'گذرواژه نمی‌تواند تکرار یک نویسه باشد.' };
  }
  const localPart = email?.split('@')[0]?.toLowerCase();
  if (localPart && localPart.length >= 4 && value.toLowerCase().includes(localPart)) {
    return { ok: false, message: 'گذرواژه نباید شامل نشانی رایانامه شما باشد.' };
  }
  return { ok: true };
}

/** Reset tokens are stored hashed, so a database leak cannot be replayed. */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
