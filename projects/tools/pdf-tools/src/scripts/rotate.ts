import { rotatePdf } from '../lib/pdf/engine';
import { downloadBlob } from '../lib/pdf/download';
import { formatBytes } from '../lib/pdf/limits';
import { loadPdfFile } from '../lib/pdf/load';
import { renderPageThumbs, revokeUrls } from '../lib/pdf/preview';
import type { RotateDegrees } from '../lib/pdf/types';
import { clearError, fillThumbGrid, setProcessing, setupDropZone, showError } from './ui';

let currentFile: File | null = null;
let thumbUrls: string[] = [];

function revokeThumbs(): void {
  revokeUrls(thumbUrls);
  thumbUrls = [];
}

export function initRotate(): void {
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  const degreesEl = document.getElementById('degrees') as HTMLSelectElement | null;
  const fileHint = document.getElementById('file-hint');
  if (btn) btn.dataset.label = 'Download rotated.pdf';

  setupDropZone('drop-zone', async ([file]) => {
    clearError('drop-zone');
    revokeThumbs();
    currentFile = file;
    try {
      const loaded = await loadPdfFile(file);
      if (fileHint) {
        fileHint.textContent = `${file.name} — ${loaded.pageCount} pages · ${formatBytes(file.size)}`;
      }
      thumbUrls = await renderPageThumbs(loaded.bytes.buffer.slice(0));
      fillThumbGrid('thumb-grid', thumbUrls);
      if (btn) btn.disabled = false;
    } catch (e) {
      currentFile = null;
      if (btn) btn.disabled = true;
      showError('drop-zone', e instanceof Error ? e.message : 'Could not read PDF.');
    }
  });

  btn?.addEventListener('click', async () => {
    if (!currentFile || !degreesEl) return;
    const degrees = Number(degreesEl.value) as RotateDegrees;
    if (![90, 180, 270].includes(degrees)) return;
    setProcessing(btn, true);
    try {
      const blob = await rotatePdf(currentFile, degrees);
      downloadBlob(blob, 'rotated.pdf');
    } catch (e) {
      showError('drop-zone', e instanceof Error ? e.message : 'Rotate failed');
    } finally {
      setProcessing(btn, false);
      btn.disabled = !currentFile;
    }
  });
}
