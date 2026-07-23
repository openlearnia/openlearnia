import { imagesToPdf } from '../lib/pdf/engine';
import { downloadBlob } from '../lib/pdf/download';
import { formatBytes } from '../lib/pdf/limits';
import {
  fileToImagePayload,
  setProcessing,
  setupImageDropZone,
  showError,
} from './ui';

let files: File[] = [];
let previewUrls: string[] = [];

function revokePreviews(): void {
  for (const url of previewUrls) URL.revokeObjectURL(url);
  previewUrls = [];
}

function renderList(): void {
  const list = document.getElementById('file-list');
  const hint = document.getElementById('file-hint');
  const grid = document.getElementById('thumb-grid');
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  if (!list || !hint || !grid || !btn) return;

  list.replaceChildren();
  revokePreviews();
  grid.replaceChildren();

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
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'secondary';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      files.splice(index, 1);
      renderList();
    });

    actions.append(up, down, remove);
    li.append(name, actions);
    list.append(li);

    const url = URL.createObjectURL(file);
    previewUrls.push(url);
    const item = document.createElement('div');
    item.className = 'thumb-item';
    const img = document.createElement('img');
    img.src = url;
    img.alt = file.name;
    const label = document.createElement('span');
    label.className = 'page-label';
    label.textContent = `Page ${index + 1}`;
    item.append(img, label);
    grid.append(item);
  });

  grid.hidden = files.length === 0;
  hint.textContent =
    files.length === 0 ? 'Select one or more images' : `${files.length} image${files.length === 1 ? '' : 's'} → PDF`;
  btn.disabled = files.length < 1;
}

export function initImagesToPdf(): void {
  const btn = document.getElementById('download-btn') as HTMLButtonElement | null;
  if (btn) btn.dataset.label = 'Download images.pdf';

  setupImageDropZone(
    'drop-zone',
    (picked) => {
      files = picked;
      renderList();
    },
    { multiple: true },
  );

  btn?.addEventListener('click', async () => {
    if (files.length < 1) return;
    setProcessing(btn, true);
    try {
      const images = [];
      for (const file of files) images.push(await fileToImagePayload(file));
      const blob = await imagesToPdf(images);
      downloadBlob(blob, 'images.pdf');
    } catch (e) {
      showError('drop-zone', e instanceof Error ? e.message : 'Convert failed');
    } finally {
      setProcessing(btn, false);
      btn.disabled = files.length < 1;
    }
  });
}
