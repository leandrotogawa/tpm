import path from "node:path";

const DEFAULT_UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads");
const LEGACY_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export function getUploadsDir() {
  const configuredDir = process.env.UPLOADS_DIR?.trim();
  return configuredDir ? path.resolve(configuredDir) : DEFAULT_UPLOADS_DIR;
}

export function getLegacyUploadsDir() {
  return LEGACY_UPLOADS_DIR;
}

export function getUploadPublicUrl(filename: string) {
  return `/uploads/${encodeURIComponent(filename)}`;
}

export function resolveUploadFilePath(filename: string) {
  const safeFilename = path.basename(filename);
  return path.join(getUploadsDir(), safeFilename);
}
