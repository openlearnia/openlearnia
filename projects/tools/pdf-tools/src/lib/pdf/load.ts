import { PDFDocument } from 'pdf-lib';
import { CORRUPT_MESSAGE, MAX_PAGES, PASSWORD_MESSAGE } from './limits';

export interface LoadedPdf {
  bytes: Uint8Array;
  pageCount: number;
}

export async function loadPdfBytes(bytes: ArrayBuffer): Promise<LoadedPdf> {
  const copy = new Uint8Array(bytes.slice(0));
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(copy, { ignoreEncryption: true });
  } catch {
    throw new Error(CORRUPT_MESSAGE);
  }

  if (doc.isEncrypted) {
    throw new Error(PASSWORD_MESSAGE);
  }

  const pageCount = doc.getPageCount();
  if (pageCount < 1) {
    throw new Error(CORRUPT_MESSAGE);
  }
  if (pageCount > MAX_PAGES) {
    throw new Error(`PDF exceeds ${MAX_PAGES} page limit (${pageCount} pages).`);
  }

  return { bytes: copy, pageCount };
}

export async function loadPdfFile(file: File): Promise<LoadedPdf> {
  const buffer = await file.arrayBuffer();
  return loadPdfBytes(buffer);
}
