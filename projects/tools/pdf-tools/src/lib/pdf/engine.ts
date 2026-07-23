import type {
  ImagePayload,
  RotateDegrees,
  WatermarkOptions,
  WorkerRequest,
  WorkerResponse,
} from './types';
import PdfWorker from './worker.ts?worker';

let worker: Worker | null = null;
let poolBusy = false;
const queue: Array<() => void> = [];

function getWorker(): Worker {
  if (!worker) worker = new PdfWorker();
  return worker;
}

function runInWorker(request: Omit<WorkerRequest, 'id'>): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const execute = () => {
      poolBusy = true;
      const id = crypto.randomUUID();
      const w = getWorker();

      const onMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== id) return;
        w.removeEventListener('message', onMessage);
        poolBusy = false;
        const next = queue.shift();
        if (next) next();

        if (event.data.ok) resolve(event.data.result.buffer);
        else reject(new Error(event.data.error));
      };

      w.addEventListener('message', onMessage);
      w.postMessage({ id, ...request } as WorkerRequest);
    };

    if (poolBusy) queue.push(execute);
    else execute();
  });
}

async function fileToBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export async function mergePdfs(files: File[]): Promise<Blob> {
  const buffers = await Promise.all(files.map(fileToBuffer));
  const buffer = await runInWorker({ type: 'merge', payload: { buffers } });
  return new Blob([buffer], { type: 'application/pdf' });
}

export async function splitPdf(file: File, start: number, end: number): Promise<Blob> {
  const buffer = await fileToBuffer(file);
  const out = await runInWorker({ type: 'split', payload: { buffer, start, end } });
  return new Blob([out], { type: 'application/pdf' });
}

export async function rotatePdf(file: File, degrees: RotateDegrees): Promise<Blob> {
  const buffer = await fileToBuffer(file);
  const out = await runInWorker({ type: 'rotate', payload: { buffer, degrees } });
  return new Blob([out], { type: 'application/pdf' });
}

export async function deletePdfPages(file: File, removeIndices: number[]): Promise<Blob> {
  const buffer = await fileToBuffer(file);
  const out = await runInWorker({ type: 'delete', payload: { buffer, removeIndices } });
  return new Blob([out], { type: 'application/pdf' });
}

export async function reorderPdfPages(file: File, order: number[]): Promise<Blob> {
  const buffer = await fileToBuffer(file);
  const out = await runInWorker({ type: 'reorder', payload: { buffer, order } });
  return new Blob([out], { type: 'application/pdf' });
}

export async function watermarkPdf(file: File, options: WatermarkOptions): Promise<Blob> {
  const buffer = await fileToBuffer(file);
  const out = await runInWorker({ type: 'watermark', payload: { buffer, options } });
  return new Blob([out], { type: 'application/pdf' });
}

export async function imagesToPdf(images: ImagePayload[]): Promise<Blob> {
  const out = await runInWorker({ type: 'imagesToPdf', payload: { images } });
  return new Blob([out], { type: 'application/pdf' });
}
