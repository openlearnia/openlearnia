import { splitPdf } from '../lib/pdf/engine';
import { downloadBlob } from '../lib/pdf/download';
import { formatBytes } from '../lib/pdf/limits';
import { loadPdfFile } from '../lib/pdf/load';
import { parsePageRange } from '../lib/pdf/ranges';
import { renderPageThumbs, revokeUrls } from '../lib/pdf/preview';
import { clearError, fillThumbGrid, setProcessing, setupDropZone, showError } from './ui';

let currentFile: File | null = null;
let pageCount = 0;
let thumbUrls: string[] = [];

function revokeThumbs(): void {
  revokeUrls(thumbUrls);
  thumbUrls = [];
}

function showRangeError(message: string | null): void {
  const el = document.getElementById('range-error');
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.hidden = false;
}

function updateSelectionHint(): void {
  const hint = document.getElementById('selection-hint');
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  const fromEl = document.getElementById('from-page') as HTMLInputElement | null;
  const toEl = document.getElementById('to-page') as HTMLInputElement | null;
  if (!hint || !btn || !fromEl || !toEl) return;

  if (!currentFile || pageCount < 1) {
    hint.textContent = '';
    btn.disabled = true;
    showRangeError(null);
    return;
  }

  const from = Number(fromEl.value);
  const to = Number(toEl.value);
  const parsed = parsePageRange(from, to, pageCount);
  if (typeof parsed === 'string') {
    hint.textContent = '';
    btn.disabled = true;
    showRangeError(parsed);
    return;
  }

  showRangeError(null);
  const count = parsed.end - parsed.start + 1;
  hint.textContent = `Will extract ${count} page${count === 1 ? '' : 's'}`;
  btn.disabled = false;
}

export function initSplit(): void {
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  const fromEl = document.getElementById('from-page') as HTMLInputElement | null;
  const toEl = document.getElementById('to-page') as HTMLInputElement | null;
  const fileHint = document.getElementById('file-hint');
  if (btn) btn.dataset.label = 'Download split.pdf';

  setupDropZone('drop-zone', async ([file]) => {
    clearError('drop-zone');
    revokeThumbs();
    currentFile = file;
    try {
      const loaded = await loadPdfFile(file);
      pageCount = loaded.pageCount;
      if (fileHint) {
        fileHint.textContent = `${file.name} — ${pageCount} pages · ${formatBytes(file.size)}`;
      }
      if (fromEl) {
        fromEl.value = '1';
        fromEl.max = String(pageCount);
      }
      if (toEl) {
        toEl.value = String(pageCount);
        toEl.max = String(pageCount);
      }
      thumbUrls = await renderPageThumbs(loaded.bytes.buffer.slice(0));
      fillThumbGrid('thumb-grid', thumbUrls);
      updateSelectionHint();
    } catch (e) {
      currentFile = null;
      pageCount = 0;
      showError('drop-zone', e instanceof Error ? e.message : 'Could not read PDF.');
      updateSelectionHint();
    }
  });

  fromEl?.addEventListener('input', updateSelectionHint);
  toEl?.addEventListener('input', updateSelectionHint);

  btn?.addEventListener('click', async () => {
    if (!currentFile || !fromEl || !toEl) return;
    const parsed = parsePageRange(Number(fromEl.value), Number(toEl.value), pageCount);
    if (typeof parsed === 'string') {
      showRangeError(parsed);
      return;
    }
    setProcessing(btn, true);
    try {
      const blob = await splitPdf(currentFile, parsed.start, parsed.end);
      downloadBlob(blob, 'split.pdf');
    } catch (e) {
      showError('drop-zone', e instanceof Error ? e.message : 'Split failed');
    } finally {
      setProcessing(btn, false);
      updateSelectionHint();
    }
  });
}
