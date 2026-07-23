import { reorderPdfPages } from '../lib/pdf/engine';
import { downloadBlob } from '../lib/pdf/download';
import { formatBytes } from '../lib/pdf/limits';
import { loadPdfFile } from '../lib/pdf/load';
import { renderPageThumbs, revokeUrls } from '../lib/pdf/preview';
import { clearError, setProcessing, setupDropZone, showError } from './ui';

let currentFile: File | null = null;
/** Current display order as original 0-based indices. */
let order: number[] = [];
let thumbByIndex: string[] = [];

function revokeThumbs(): void {
  revokeUrls(thumbByIndex);
  thumbByIndex = [];
}

function renderThumbs(): void {
  const grid = document.getElementById('thumb-grid');
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  if (!grid) return;
  grid.replaceChildren();

  order.forEach((origIndex, displayPos) => {
    const item = document.createElement('div');
    item.className = 'thumb-item';
    const img = document.createElement('img');
    img.src = thumbByIndex[origIndex];
    img.alt = `Page ${origIndex + 1}`;
    const label = document.createElement('span');
    label.className = 'page-label';
    label.textContent = `#${displayPos + 1} · was ${origIndex + 1}`;
    const actions = document.createElement('div');
    actions.className = 'thumb-actions';

    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'secondary';
    up.textContent = '↑';
    up.disabled = displayPos === 0;
    up.addEventListener('click', () => {
      if (displayPos === 0) return;
      [order[displayPos - 1], order[displayPos]] = [order[displayPos], order[displayPos - 1]];
      renderThumbs();
    });

    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'secondary';
    down.textContent = '↓';
    down.disabled = displayPos === order.length - 1;
    down.addEventListener('click', () => {
      if (displayPos >= order.length - 1) return;
      [order[displayPos], order[displayPos + 1]] = [order[displayPos + 1], order[displayPos]];
      renderThumbs();
    });

    actions.append(up, down);
    item.append(img, label, actions);
    grid.append(item);
  });

  grid.hidden = order.length === 0;
  if (btn) btn.disabled = order.length < 2;
}

export function initReorder(): void {
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  const fileHint = document.getElementById('file-hint');
  if (btn) btn.dataset.label = 'Download reordered.pdf';

  setupDropZone('drop-zone', async ([file]) => {
    clearError('drop-zone');
    revokeThumbs();
    currentFile = file;
    try {
      const loaded = await loadPdfFile(file);
      if (fileHint) {
        fileHint.textContent = `${file.name} — ${loaded.pageCount} pages · ${formatBytes(file.size)}`;
      }
      thumbByIndex = await renderPageThumbs(loaded.bytes.buffer.slice(0));
      order = thumbByIndex.map((_, i) => i);
      renderThumbs();
    } catch (e) {
      currentFile = null;
      order = [];
      showError('drop-zone', e instanceof Error ? e.message : 'Could not read PDF.');
      renderThumbs();
    }
  });

  btn?.addEventListener('click', async () => {
    if (!currentFile || order.length < 2) return;
    setProcessing(btn, true);
    try {
      const blob = await reorderPdfPages(currentFile, order);
      downloadBlob(blob, 'reordered.pdf');
    } catch (e) {
      showError('drop-zone', e instanceof Error ? e.message : 'Reorder failed');
    } finally {
      setProcessing(btn, false);
      btn.disabled = order.length < 2;
    }
  });
}
