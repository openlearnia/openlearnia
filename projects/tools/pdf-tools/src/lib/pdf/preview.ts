import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { CORRUPT_MESSAGE, MAX_PAGES, PASSWORD_MESSAGE } from './limits';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function renderPageThumbs(
  bytes: ArrayBuffer,
  opts: { maxPages?: number; scale?: number } = {},
): Promise<string[]> {
  const maxPages = opts.maxPages ?? MAX_PAGES;
  const scale = opts.scale ?? 0.35;
  const data = bytes.slice(0);

  let pdf: pdfjs.PDFDocumentProxy;
  try {
    pdf = await pdfjs.getDocument({ data, password: '' }).promise;
  } catch (err) {
    const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
    if (name === 'PasswordException') throw new Error(PASSWORD_MESSAGE);
    throw new Error(CORRUPT_MESSAGE);
  }

  const count = Math.min(pdf.numPages, maxPages);
  const urls: string[] = [];

  try {
    for (let i = 1; i <= count; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
      if (!blob) throw new Error('Thumbnail render failed');
      urls.push(URL.createObjectURL(blob));
    }
  } catch (err) {
    for (const url of urls) URL.revokeObjectURL(url);
    if (err instanceof Error && (err.message === PASSWORD_MESSAGE || err.message === CORRUPT_MESSAGE)) {
      throw err;
    }
    throw new Error(CORRUPT_MESSAGE);
  } finally {
    await pdf.destroy();
  }

  return urls;
}

export function revokeUrls(urls: string[]): void {
  for (const url of urls) URL.revokeObjectURL(url);
}

/** Full-resolution page exports for PDF → images (main thread; needs canvas). */
export async function exportPagesAsImages(
  bytes: ArrayBuffer,
  opts: { scale?: number; quality?: number } = {},
): Promise<Blob[]> {
  const scale = opts.scale ?? 2;
  const quality = opts.quality ?? 0.92;
  const data = bytes.slice(0);

  let pdf: pdfjs.PDFDocumentProxy;
  try {
    pdf = await pdfjs.getDocument({ data, password: '' }).promise;
  } catch (err) {
    const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
    if (name === 'PasswordException') throw new Error(PASSWORD_MESSAGE);
    throw new Error(CORRUPT_MESSAGE);
  }

  if (pdf.numPages > MAX_PAGES) {
    await pdf.destroy();
    throw new Error(`PDF exceeds ${MAX_PAGES} page limit (${pdf.numPages} pages).`);
  }

  const blobs: Blob[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality),
      );
      if (!blob) throw new Error('Page export failed');
      blobs.push(blob);
    }
  } catch (err) {
    if (err instanceof Error && (err.message === PASSWORD_MESSAGE || err.message === CORRUPT_MESSAGE)) {
      throw err;
    }
    throw new Error(CORRUPT_MESSAGE);
  } finally {
    await pdf.destroy();
  }

  return blobs;
}
