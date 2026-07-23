import { watermarkPdf } from '../lib/pdf/engine';
import { downloadBlob } from '../lib/pdf/download';
import { formatBytes } from '../lib/pdf/limits';
import { loadPdfFile } from '../lib/pdf/load';
import { renderPageThumbs, revokeUrls } from '../lib/pdf/preview';
import type { WatermarkPosition } from '../lib/pdf/types';
import { clearError, fillThumbGrid, setProcessing, setupDropZone, showError } from './ui';

let currentFile: File | null = null;
let thumbUrls: string[] = [];

function revokeThumbs(): void {
  revokeUrls(thumbUrls);
  thumbUrls = [];
}

export function initWatermark(): void {
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  const fileHint = document.getElementById('file-hint');
  const textEl = document.getElementById('wm-text') as HTMLInputElement | null;
  const opacityEl = document.getElementById('wm-opacity') as HTMLInputElement | null;
  const sizeEl = document.getElementById('wm-size') as HTMLInputElement | null;
  const posEl = document.getElementById('wm-position') as HTMLSelectElement | null;
  if (btn) btn.dataset.label = 'Download watermarked.pdf';

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
    if (!currentFile || !textEl || !opacityEl || !sizeEl || !posEl) return;
    setProcessing(btn, true);
    try {
      const blob = await watermarkPdf(currentFile, {
        text: textEl.value,
        opacity: Number(opacityEl.value),
        fontSize: Number(sizeEl.value),
        position: posEl.value as WatermarkPosition,
      });
      downloadBlob(blob, 'watermarked.pdf');
    } catch (e) {
      showError('drop-zone', e instanceof Error ? e.message : 'Watermark failed');
    } finally {
      setProcessing(btn, false);
      btn.disabled = !currentFile;
    }
  });
}
