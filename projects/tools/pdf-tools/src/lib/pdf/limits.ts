export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_PAGES = 200;
export const MAX_IMAGE_DIMENSION = 8000;

export const PASSWORD_MESSAGE =
  "This PDF is password-protected. Unlock support isn't available yet — use an unlocked copy.";

export const CORRUPT_MESSAGE = "Couldn't read this PDF. It may be damaged.";

const ACCEPTED_TYPES = new Set(['application/pdf', 'application/x-pdf']);
const ACCEPTED_EXTENSIONS = /\.pdf$/i;

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
]);
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp)$/i;

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return `File exceeds ${formatBytes(MAX_FILE_BYTES)} limit (${formatBytes(file.size)}).`;
  }
  if (!ACCEPTED_TYPES.has(file.type) && !ACCEPTED_EXTENSIONS.test(file.name)) {
    return 'Unsupported file type. Use a PDF.';
  }
  return null;
}

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return `File exceeds ${formatBytes(MAX_FILE_BYTES)} limit (${formatBytes(file.size)}).`;
  }
  if (!IMAGE_TYPES.has(file.type) && !IMAGE_EXTENSIONS.test(file.name)) {
    return 'Unsupported image type. Use JPEG, PNG, WebP, GIF, or BMP.';
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
