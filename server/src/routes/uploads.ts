import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../env.js';
import { requireAuth, requireOperator } from '../lib/auth.js';
import { asyncRoute, badRequest } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';

export const uploadsRouter = Router();

export const UPLOAD_ROOT = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

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

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function makeStorage(subdir: string) {
  const dir = path.join(UPLOAD_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });
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

const avatarUpload = makeUploader('avatars', IMAGE_TYPES, AVATAR_MAX_BYTES);
// Members may attach an image to their own idea/experience submission.
const submissionUpload = makeUploader('submissions', IMAGE_TYPES, 4 * 1024 * 1024);
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
