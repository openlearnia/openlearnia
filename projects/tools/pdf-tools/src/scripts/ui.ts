import { MAX_IMAGE_DIMENSION, validateFile, validateImageFile } from '../lib/pdf/limits';
import { loadPdfFile } from '../lib/pdf/load';
import type { ImagePayload } from '../lib/pdf/types';

export function showError(zoneId: string, message: string): void {
  const errorEl = document.getElementById(`${zoneId}-error`);
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

export function clearError(zoneId: string): void {
  const errorEl = document.getElementById(`${zoneId}-error`);
  if (!errorEl) return;
  errorEl.textContent = '';
  errorEl.hidden = true;
}

export function setProcessing(btn: HTMLButtonElement | null, busy: boolean): void {
  if (!btn) return;
  btn.disabled = busy;
  btn.textContent = busy ? 'Working…' : (btn.dataset.label ?? 'Download');
}

function bindDropZone(
  zoneId: string,
  handleFiles: (files: FileList | File[]) => void | Promise<void>,
): void {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(`${zoneId}-input`) as HTMLInputElement | null;
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer?.files.length) void handleFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', () => {
    if (input.files?.length) void handleFiles(input.files);
  });
}

export function setupDropZone(
  zoneId: string,
  onFiles: (files: File[]) => void | Promise<void>,
  options: { multiple?: boolean } = {},
): void {
  bindDropZone(zoneId, async (files) => {
    const list = Array.from(files);
    if (!list.length) return;
    clearError(zoneId);

    const valid: File[] = [];
    for (const file of list) {
      const err = validateFile(file);
      if (err) {
        showError(zoneId, err);
        return;
      }
      try {
        await loadPdfFile(file);
      } catch (e) {
        showError(zoneId, e instanceof Error ? e.message : 'Could not read PDF.');
        return;
      }
      valid.push(file);
    }

    await onFiles(options.multiple ? valid : [valid[0]]);
  });
}

export function setupImageDropZone(
  zoneId: string,
  onFiles: (files: File[]) => void | Promise<void>,
  options: { multiple?: boolean } = {},
): void {
  bindDropZone(zoneId, async (files) => {
    const list = Array.from(files);
    if (!list.length) return;
    clearError(zoneId);

    const valid: File[] = [];
    for (const file of list) {
      const err = validateImageFile(file);
      if (err) {
        showError(zoneId, err);
        return;
      }
      try {
        const bitmap = await createImageBitmap(file);
        const { width, height } = bitmap;
        bitmap.close();
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          showError(
            zoneId,
            `Image dimensions exceed ${MAX_IMAGE_DIMENSION}px (${width}×${height}).`,
          );
          return;
        }
      } catch {
        showError(zoneId, 'Could not read image file.');
        return;
      }
      valid.push(file);
    }

    await onFiles(options.multiple ? valid : [valid[0]]);
  });
}

/** Convert any accepted image to JPEG/PNG bytes for pdf-lib. */
export async function fileToImagePayload(file: File): Promise<ImagePayload> {
  if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name)) {
    return { buffer: await file.arrayBuffer(), mimeType: 'image/jpeg' };
  }
  if (file.type === 'image/png' || /\.png$/i.test(file.name)) {
    return { buffer: await file.arrayBuffer(), mimeType: 'image/png' };
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas unavailable');
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('Could not convert image.');
  return { buffer: await blob.arrayBuffer(), mimeType: 'image/png' };
}

export function fillThumbGrid(
  gridId: string,
  urls: string[],
  opts: { startPage?: number } = {},
): void {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const startPage = opts.startPage ?? 1;
  grid.replaceChildren();
  urls.forEach((url, i) => {
    const item = document.createElement('div');
    item.className = 'thumb-item';
    const img = document.createElement('img');
    img.src = url;
    img.alt = `Page ${startPage + i}`;
    const label = document.createElement('span');
    label.className = 'page-label';
    label.textContent = `Page ${startPage + i}`;
    item.append(img, label);
    grid.append(item);
  });
  grid.hidden = urls.length === 0;
}
