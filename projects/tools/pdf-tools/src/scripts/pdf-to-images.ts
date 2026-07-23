import JSZip from 'jszip';
import { downloadBlob } from '../lib/pdf/download';
import { formatBytes } from '../lib/pdf/limits';
import { loadPdfFile } from '../lib/pdf/load';
import { exportPagesAsImages, renderPageThumbs, revokeUrls } from '../lib/pdf/preview';
import { clearError, fillThumbGrid, setProcessing, setupDropZone, showError } from './ui';

let currentFile: File | null = null;
let pdfBytes: ArrayBuffer | null = null;
let thumbUrls: string[] = [];

function revokeThumbs(): void {
  revokeUrls(thumbUrls);
  thumbUrls = [];
}

export function initPdfToImages(): void {
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  const fileHint = document.getElementById('file-hint');
  const scaleEl = document.getElementById('export-scale') as HTMLSelectElement | null;
  if (btn) btn.dataset.label = 'Download pages.zip';

  setupDropZone('drop-zone', async ([file]) => {
    clearError('drop-zone');
    revokeThumbs();
    currentFile = file;
    try {
      const loaded = await loadPdfFile(file);
      pdfBytes = loaded.bytes.buffer.slice(0);
      if (fileHint) {
        fileHint.textContent = `${file.name} — ${loaded.pageCount} pages · ${formatBytes(file.size)}`;
      }
      thumbUrls = await renderPageThumbs(pdfBytes.slice(0));
      fillThumbGrid('thumb-grid', thumbUrls);
      if (btn) btn.disabled = false;
    } catch (e) {
      currentFile = null;
      pdfBytes = null;
      if (btn) btn.disabled = true;
      showError('drop-zone', e instanceof Error ? e.message : 'Could not read PDF.');
    }
  });

  btn?.addEventListener('click', async () => {
    if (!pdfBytes || !scaleEl) return;
    setProcessing(btn, true);
    try {
      const scale = Number(scaleEl.value) || 2;
      const blobs = await exportPagesAsImages(pdfBytes.slice(0), { scale });
      const zip = new JSZip();
      blobs.forEach((blob, i) => {
        const n = String(i + 1).padStart(3, '0');
        zip.file(`page-${n}.jpg`, blob);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'pages.zip');
    } catch (e) {
      showError('drop-zone', e instanceof Error ? e.message : 'Export failed');
    } finally {
      setProcessing(btn, false);
      btn.disabled = !pdfBytes;
    }
  });
}
