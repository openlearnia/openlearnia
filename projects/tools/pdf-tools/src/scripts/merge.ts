import { mergePdfs } from '../lib/pdf/engine';
import { downloadBlob } from '../lib/pdf/download';
import { formatBytes } from '../lib/pdf/limits';
import { loadPdfFile } from '../lib/pdf/load';
import { renderPageThumbs, revokeUrls } from '../lib/pdf/preview';
import { fillThumbGrid, setProcessing, setupDropZone, showError } from './ui';

let files: File[] = [];
let thumbUrls: string[] = [];

function revokeThumbs(): void {
  revokeUrls(thumbUrls);
  thumbUrls = [];
}

async function refreshThumbs(): Promise<void> {
  revokeThumbs();
  const urls: string[] = [];
  for (const file of files) {
    const loaded = await loadPdfFile(file);
    const first = await renderPageThumbs(loaded.bytes.buffer.slice(0), { maxPages: 1, scale: 0.3 });
    urls.push(...first);
  }
  thumbUrls = urls;
  fillThumbGrid('thumb-grid', urls);
}

function renderList(): void {
  const list = document.getElementById('file-list');
  const hint = document.getElementById('file-hint');
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  if (!list || !hint || !btn) return;

  list.replaceChildren();
  files.forEach((file, index) => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = `${file.name} (${formatBytes(file.size)})`;
    const actions = document.createElement('div');
    actions.className = 'file-actions';

    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'secondary';
    up.textContent = '↑';
    up.disabled = index === 0;
    up.addEventListener('click', () => {
      if (index === 0) return;
      [files[index - 1], files[index]] = [files[index], files[index - 1]];
      renderList();
      void refreshThumbs();
    });

    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'secondary';
    down.textContent = '↓';
    down.disabled = index === files.length - 1;
    down.addEventListener('click', () => {
      if (index >= files.length - 1) return;
      [files[index], files[index + 1]] = [files[index + 1], files[index]];
      renderList();
      void refreshThumbs();
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'secondary';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      files.splice(index, 1);
      renderList();
      void refreshThumbs();
    });

    actions.append(up, down, remove);
    li.append(name, actions);
    list.append(li);
  });

  hint.textContent =
    files.length < 2
      ? 'Select at least 2 PDFs'
      : `${files.length} PDFs ready to merge`;
  btn.disabled = files.length < 2;
}

export function initMerge(): void {
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  if (btn) btn.dataset.label = 'Download merged.pdf';

  setupDropZone(
    'drop-zone',
    async (picked) => {
      files = picked;
      renderList();
      try {
        await refreshThumbs();
      } catch (e) {
        showError('drop-zone', e instanceof Error ? e.message : 'Preview failed');
      }
    },
    { multiple: true },
  );

  btn?.addEventListener('click', async () => {
    if (files.length < 2) return;
    setProcessing(btn, true);
    try {
      const blob = await mergePdfs(files);
      downloadBlob(blob, 'merged.pdf');
    } catch (e) {
      showError('drop-zone', e instanceof Error ? e.message : 'Merge failed');
    } finally {
      setProcessing(btn, false);
      btn.disabled = files.length < 2;
    }
  });
}
