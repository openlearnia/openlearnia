import { deletePdfPages } from '../lib/pdf/engine';
import { downloadBlob } from '../lib/pdf/download';
import { formatBytes } from '../lib/pdf/limits';
import { loadPdfFile } from '../lib/pdf/load';
import { renderPageThumbs, revokeUrls } from '../lib/pdf/preview';
import { clearError, setProcessing, setupDropZone, showError } from './ui';

let currentFile: File | null = null;
let pageCount = 0;
let thumbUrls: string[] = [];
let marked = new Set<number>();

function revokeThumbs(): void {
  revokeUrls(thumbUrls);
  thumbUrls = [];
}

function updateHint(): void {
  const hint = document.getElementById('selection-hint');
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  if (!hint || !btn) return;
  if (!currentFile || pageCount < 1) {
    hint.textContent = '';
    btn.disabled = true;
    return;
  }
  const n = marked.size;
  if (n === 0) {
    hint.textContent = 'Click pages to mark them for deletion';
    btn.disabled = true;
    return;
  }
  if (n >= pageCount) {
    hint.textContent = 'Keep at least one page';
    btn.disabled = true;
    return;
  }
  hint.textContent = `${n} page${n === 1 ? '' : 's'} marked — ${pageCount - n} will remain`;
  btn.disabled = false;
}

function renderThumbs(): void {
  const grid = document.getElementById('thumb-grid');
  if (!grid) return;
  grid.replaceChildren();
  thumbUrls.forEach((url, i) => {
    const item = document.createElement('div');
    item.className = 'thumb-item' + (marked.has(i) ? ' marked-delete' : '');
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-pressed', marked.has(i) ? 'true' : 'false');
    const img = document.createElement('img');
    img.src = url;
    img.alt = `Page ${i + 1}`;
    const label = document.createElement('span');
    label.className = 'page-label';
    label.textContent = marked.has(i) ? `Page ${i + 1} · delete` : `Page ${i + 1}`;
    item.append(img, label);
    const toggle = () => {
      if (marked.has(i)) marked.delete(i);
      else marked.add(i);
      renderThumbs();
      updateHint();
    };
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
    grid.append(item);
  });
  grid.hidden = thumbUrls.length === 0;
}

export function initDelete(): void {
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  const fileHint = document.getElementById('file-hint');
  if (btn) btn.dataset.label = 'Download PDF';

  setupDropZone('drop-zone', async ([file]) => {
    clearError('drop-zone');
    revokeThumbs();
    marked = new Set();
    currentFile = file;
    try {
      const loaded = await loadPdfFile(file);
      pageCount = loaded.pageCount;
      if (fileHint) {
        fileHint.textContent = `${file.name} — ${pageCount} pages · ${formatBytes(file.size)}`;
      }
      thumbUrls = await renderPageThumbs(loaded.bytes.buffer.slice(0));
      renderThumbs();
      updateHint();
    } catch (e) {
      currentFile = null;
      pageCount = 0;
      showError('drop-zone', e instanceof Error ? e.message : 'Could not read PDF.');
      updateHint();
    }
  });

  btn?.addEventListener('click', async () => {
    if (!currentFile || marked.size === 0) return;
    setProcessing(btn, true);
    try {
      const blob = await deletePdfPages(currentFile, [...marked]);
      downloadBlob(blob, 'deleted-pages.pdf');
    } catch (e) {
      showError('drop-zone', e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setProcessing(btn, false);
      updateHint();
    }
  });
}
