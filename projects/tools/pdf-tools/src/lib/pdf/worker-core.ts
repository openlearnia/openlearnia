import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  RotationTypes,
} from 'pdf-lib';
import { CORRUPT_MESSAGE, MAX_PAGES, PASSWORD_MESSAGE } from './limits';
import type { ImagePayload, RotateDegrees, WatermarkOptions, WatermarkPosition } from './types';

async function loadEditable(bytes: Uint8Array): Promise<PDFDocument> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch {
    throw new Error(CORRUPT_MESSAGE);
  }
  if (doc.isEncrypted) {
    throw new Error(PASSWORD_MESSAGE);
  }
  const pageCount = doc.getPageCount();
  if (pageCount < 1) throw new Error(CORRUPT_MESSAGE);
  if (pageCount > MAX_PAGES) {
    throw new Error(`PDF exceeds ${MAX_PAGES} page limit (${pageCount} pages).`);
  }
  return doc;
}

export async function mergeBuffers(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (buffers.length < 2) throw new Error('Select at least 2 PDFs to merge.');
  const out = await PDFDocument.create();
  let totalPages = 0;

  for (const buffer of buffers) {
    const src = await loadEditable(new Uint8Array(buffer));
    totalPages += src.getPageCount();
    if (totalPages > MAX_PAGES) {
      throw new Error(`Merged PDF would exceed ${MAX_PAGES} pages.`);
    }
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) out.addPage(page);
  }

  return out.save();
}

export async function splitBuffer(
  buffer: ArrayBuffer,
  start: number,
  end: number,
): Promise<Uint8Array> {
  const src = await loadEditable(new Uint8Array(buffer));
  const pageCount = src.getPageCount();
  if (start < 0 || end < start || end >= pageCount) {
    throw new Error(`Pages must be between 1 and ${pageCount}.`);
  }
  const out = await PDFDocument.create();
  const indices = [];
  for (let i = start; i <= end; i++) indices.push(i);
  const pages = await out.copyPages(src, indices);
  for (const page of pages) out.addPage(page);
  return out.save();
}

export async function rotateBuffer(
  buffer: ArrayBuffer,
  delta: RotateDegrees,
): Promise<Uint8Array> {
  const doc = await loadEditable(new Uint8Array(buffer));
  for (const page of doc.getPages()) {
    const current = page.getRotation();
    const currentDeg =
      current.type === RotationTypes.Degrees ? current.angle : (current.angle * 180) / Math.PI;
    page.setRotation(degrees((((currentDeg + delta) % 360) + 360) % 360));
  }
  return doc.save();
}

export async function deletePagesBuffer(
  buffer: ArrayBuffer,
  removeIndices: number[],
): Promise<Uint8Array> {
  const src = await loadEditable(new Uint8Array(buffer));
  const pageCount = src.getPageCount();
  const remove = new Set(removeIndices);
  for (const i of remove) {
    if (!Number.isInteger(i) || i < 0 || i >= pageCount) {
      throw new Error(`Pages must be between 1 and ${pageCount}.`);
    }
  }
  if (remove.size === 0) throw new Error('Select at least one page to delete.');
  if (remove.size >= pageCount) throw new Error('Cannot delete every page — keep at least one.');

  const keep: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    if (!remove.has(i)) keep.push(i);
  }
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, keep);
  for (const page of pages) out.addPage(page);
  return out.save();
}

export async function reorderPagesBuffer(
  buffer: ArrayBuffer,
  order: number[],
): Promise<Uint8Array> {
  const src = await loadEditable(new Uint8Array(buffer));
  const pageCount = src.getPageCount();
  if (order.length !== pageCount) {
    throw new Error('Reorder list must include every page exactly once.');
  }
  const seen = new Set<number>();
  for (const i of order) {
    if (!Number.isInteger(i) || i < 0 || i >= pageCount || seen.has(i)) {
      throw new Error('Invalid page order.');
    }
    seen.add(i);
  }
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, order);
  for (const page of pages) out.addPage(page);
  return out.save();
}

function watermarkAnchor(
  position: WatermarkPosition,
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  fontSize: number,
): { x: number; y: number } {
  const pad = 36;
  switch (position) {
    case 'top-left':
      return { x: pad, y: pageHeight - pad - fontSize };
    case 'top-right':
      return { x: pageWidth - pad - textWidth, y: pageHeight - pad - fontSize };
    case 'bottom-left':
      return { x: pad, y: pad };
    case 'bottom-right':
      return { x: pageWidth - pad - textWidth, y: pad };
    case 'center':
    default:
      return {
        x: (pageWidth - textWidth) / 2,
        y: (pageHeight - fontSize) / 2,
      };
  }
}

export async function watermarkBuffer(
  buffer: ArrayBuffer,
  options: WatermarkOptions,
): Promise<Uint8Array> {
  const text = options.text.trim();
  if (!text) throw new Error('Enter watermark text.');
  const opacity = Math.min(1, Math.max(0.05, options.opacity));
  const fontSize = Math.min(96, Math.max(8, Math.round(options.fontSize)));

  const doc = await loadEditable(new Uint8Array(buffer));
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const { x, y } = watermarkAnchor(options.position, width, height, textWidth, fontSize);
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.45, 0.45, 0.45),
      opacity,
    });
  }

  return doc.save();
}

export async function imagesToPdfBuffer(images: ImagePayload[]): Promise<Uint8Array> {
  if (images.length < 1) throw new Error('Select at least one image.');
  if (images.length > MAX_PAGES) {
    throw new Error(`Too many images — max ${MAX_PAGES} pages.`);
  }

  const out = await PDFDocument.create();
  for (const image of images) {
    const bytes = new Uint8Array(image.buffer);
    const embedded =
      image.mimeType === 'image/jpeg'
        ? await out.embedJpg(bytes)
        : await out.embedPng(bytes);
    const page = out.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }
  return out.save();
}
