import { Router } from 'express';
import { handleUpload } from '@vercel/blob/client';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../env.js';
import { requireAuth, requireOperator } from '../lib/auth.js';
import { HttpError, asyncRoute, badRequest, forbidden, unauthorized } from '../lib/http.js';
import { clientIp, rateLimit } from '../lib/rateLimit.js';

export const uploadsRouter = Router();

export const UPLOAD_ROOT = path.resolve(process.cwd(), env.uploadDir);

/**
 * Creating the directory must never throw at import time: on a serverless host
 * the working directory is read-only, and a throw here would take down the
 * whole function rather than just the upload routes. Individual uploads still
 * fail loudly if the directory really is unusable.
 */
function ensureDir(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[noafar][uploads] ساخت پوشه «${dir}» ممکن نشد؛ بارگذاری فایل غیرفعال است. ` +
        `${error instanceof Error ? error.message : ''}`,
    );
    return false;
  }
}

const uploadsWritable = ensureDir(UPLOAD_ROOT);

/**
 * A writable directory is not the same as a durable one. On a serverless host
 * `/tmp` accepts writes and then disappears, so an upload would appear to
 * succeed and the file would be gone by the next request. Refusing is the
 * honest answer until real object storage is configured.
 */
const uploadsUsable = uploadsWritable && env.uploadsPersistent;

if (uploadsWritable && !env.uploadsPersistent) {
  // eslint-disable-next-line no-console
  console.warn(
    '[noafar][uploads] فضای ذخیره‌سازی پایدار نیست؛ بارگذاری فایل غیرفعال شد. ' +
      'برای فعال‌سازی، UPLOAD_DIR را روی یک volume دائمی تنظیم و UPLOADS_PERSISTENT=true کنید.',
  );
}

/**
 * Extension is derived from the MIME type we accept, never from the client's
 * filename — that removes path traversal and double-extension tricks.
 */
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const DOCUMENT_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/zip': '.zip',
};

const VIDEO_TYPES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

function makeStorage(subdir: string) {
  const dir = path.join(UPLOAD_ROOT, subdir);
  ensureDir(dir);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const allowed = { ...IMAGE_TYPES, ...DOCUMENT_TYPES, ...VIDEO_TYPES };
      const ext = allowed[file.mimetype] ?? '.bin';
      cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  });
}

function makeUploader(subdir: string, allowedTypes: Record<string, string>, maxBytes: number) {
  return multer({
    storage: makeStorage(subdir),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!allowedTypes[file.mimetype]) {
        cb(new Error('نوع فایل انتخابی پشتیبانی نمی‌شود.'));
        return;
      }
      cb(null, true);
    },
  });
}

/**
 * Where uploaded files go. Blob wins when it is configured: the browser talks
 * to object storage directly, so neither the wiped serverless disk nor the
 * 4.5 MB function-body cap is in the path, and a course video can actually be
 * uploaded. Disk is the self-hosted fallback.
 */
const BLOB_ENABLED = Boolean(env.blobToken);
type UploadKind = 'avatars' | 'submissions' | 'media';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const SUBMISSION_MAX_BYTES = 4 * 1024 * 1024;
/** Only meaningful for Blob: a lesson video has no business being 8 MB. */
const BLOB_MEDIA_MAX_BYTES = env.blobMediaMaxBytes;

const KIND_RULES: Record<UploadKind, { types: string[]; maxBytes: number; operatorOnly: boolean }> = {
  avatars: { types: Object.keys(IMAGE_TYPES), maxBytes: AVATAR_MAX_BYTES, operatorOnly: false },
  submissions: { types: Object.keys(IMAGE_TYPES), maxBytes: SUBMISSION_MAX_BYTES, operatorOnly: false },
  media: {
    types: [...Object.keys(IMAGE_TYPES), ...Object.keys(DOCUMENT_TYPES), ...Object.keys(VIDEO_TYPES)],
    maxBytes: BLOB_MEDIA_MAX_BYTES,
    operatorOnly: true,
  },
};

/** Lets the client pick its upload path without guessing. */
uploadsRouter.get('/config', (_req, res) => {
  res.json({
    mode: BLOB_ENABLED ? 'blob' : uploadsUsable ? 'disk' : 'disabled',
    // Names only — never the token. When uploads are off, this says whether
    // the store was never connected or its variable is named something else.
    tokenSource: env.blobTokenSource || null,
    candidateTokenVars: BLOB_ENABLED
      ? undefined
      : Object.keys(process.env).filter((n) => n.endsWith('_READ_WRITE_TOKEN')),
    // Which build is answering. A variable added after this deployment was
    // created is not in it, and the commit is how you tell.
    deployment: process.env.VERCEL_DEPLOYMENT_ID
      ? {
          commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || undefined,
          target: process.env.VERCEL_ENV || undefined,
        }
      : undefined,
    maxBytes: {
      avatar: AVATAR_MAX_BYTES,
      submission: SUBMISSION_MAX_BYTES,
      media: BLOB_ENABLED ? BLOB_MEDIA_MAX_BYTES : env.uploadMaxBytes,
    },
  });
});

/**
 * Issues a short-lived, single-upload token to the browser. Everything that
 * decides what may be uploaded — who the caller is, which folder, which types,
 * how large — is settled here on the server; the token carries those limits and
 * the storage service enforces them.
 */
if (BLOB_ENABLED) {
  uploadsRouter.post(
    '/blob',
    rateLimit({
      name: 'upload-blob-token',
      limit: 120,
      windowSeconds: 60 * 60,
      key: (req) => req.user?.id ?? clientIp(req),
    }),
    asyncRoute(async (req, res) => {
      const result = await handleUpload({
        token: env.blobToken,
        request: req,
        body: req.body as Parameters<typeof handleUpload>[0]['body'],
        onBeforeGenerateToken: async (pathname) => {
          const kind = pathname.split('/')[0] as UploadKind;
          const rules = KIND_RULES[kind];
          if (!rules) throw badRequest('مسیر بارگذاری معتبر نیست.');
          if (!req.user) throw unauthorized();
          if (rules.operatorOnly && req.user.role !== 'operator' && req.user.role !== 'admin') {
            throw forbidden();
          }
          return {
            allowedContentTypes: rules.types,
            maximumSizeInBytes: rules.maxBytes,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ userId: req.user.id, kind }),
          };
        },
        // Called by the storage service once the file lands, not by the
        // browser. Nothing here needs the session, and a throw would make the
        // upload look failed to the user, so it only records the outcome.
        onUploadCompleted: async ({ blob }) => {
          // eslint-disable-next-line no-console
          console.info('[noafar][uploads] فایل روی فضای ذخیره‌سازی ثبت شد:', blob.pathname);
        },
      });
      res.json(result);
    }),
  );
}

/** Rejects every disk upload with an explanation when there is nowhere to store one. */
uploadsRouter.use((_req, _res, next) => {
  if (BLOB_ENABLED || uploadsUsable) return next();
  next(
    new HttpError(
      503,
      'بارگذاری فایل روی این میزبان در دسترس نیست؛ فضای ذخیره‌سازی پایدار تنظیم نشده است. ' +
        'برای فعال‌سازی، BLOB_READ_WRITE_TOKEN را تنظیم کنید یا UPLOAD_DIR را روی یک volume دائمی ببرید.',
      'uploads_unavailable',
    ),
  );
});

const avatarUpload = makeUploader('avatars', IMAGE_TYPES, AVATAR_MAX_BYTES);
// Members may attach an image to their own idea/experience submission.
const submissionUpload = makeUploader('submissions', IMAGE_TYPES, SUBMISSION_MAX_BYTES);
const mediaUpload = makeUploader(
  'media',
  { ...IMAGE_TYPES, ...DOCUMENT_TYPES, ...VIDEO_TYPES },
  env.uploadMaxBytes,
);

function describe(file: Express.Multer.File, subdir: string) {
  const url = `/uploads/${subdir}/${path.basename(file.filename)}`;
  const type = IMAGE_TYPES[file.mimetype]
    ? 'image'
    : VIDEO_TYPES[file.mimetype]
      ? 'video'
      : file.mimetype === 'application/pdf'
        ? 'pdf'
        : 'document';
  return {
    id: path.parse(file.filename).name,
    type,
    url,
    fileName: file.originalname.slice(0, 200),
    fileSizeBytes: file.size,
  };
}

uploadsRouter.post(
  '/avatar',
  requireAuth,
  rateLimit({
    name: 'upload-avatar',
    limit: 20,
    windowSeconds: 60 * 60,
    key: (req) => req.user?.id ?? 'anon',
  }),
  avatarUpload.single('file'),
  asyncRoute(async (req, res) => {
    if (!req.file) throw badRequest('فایلی انتخاب نشده است.');
    res.status(201).json(describe(req.file, 'avatars'));
  }),
);

uploadsRouter.post(
  '/submission',
  requireAuth,
  rateLimit({
    name: 'upload-submission',
    limit: 30,
    windowSeconds: 60 * 60,
    key: (req) => req.user?.id ?? 'anon',
  }),
  submissionUpload.single('file'),
  asyncRoute(async (req, res) => {
    if (!req.file) throw badRequest('فایلی انتخاب نشده است.');
    res.status(201).json(describe(req.file, 'submissions'));
  }),
);

uploadsRouter.post(
  '/media',
  requireOperator,
  rateLimit({
    name: 'upload-media',
    limit: 120,
    windowSeconds: 60 * 60,
    key: (req) => req.user?.id ?? 'anon',
  }),
  mediaUpload.single('file'),
  asyncRoute(async (req, res) => {
    if (!req.file) throw badRequest('فایلی انتخاب نشده است.');
    res.status(201).json(describe(req.file, 'media'));
  }),
);
