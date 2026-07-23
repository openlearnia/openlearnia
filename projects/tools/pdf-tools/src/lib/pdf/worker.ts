import {
  deletePagesBuffer,
  imagesToPdfBuffer,
  mergeBuffers,
  reorderPagesBuffer,
  rotateBuffer,
  splitBuffer,
  watermarkBuffer,
} from './worker-core';
import type { WorkerRequest, WorkerResponse } from './types';

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    let bytes: Uint8Array;
    if (msg.type === 'merge') {
      bytes = await mergeBuffers(msg.payload.buffers);
    } else if (msg.type === 'split') {
      bytes = await splitBuffer(msg.payload.buffer, msg.payload.start, msg.payload.end);
    } else if (msg.type === 'rotate') {
      bytes = await rotateBuffer(msg.payload.buffer, msg.payload.degrees);
    } else if (msg.type === 'delete') {
      bytes = await deletePagesBuffer(msg.payload.buffer, msg.payload.removeIndices);
    } else if (msg.type === 'reorder') {
      bytes = await reorderPagesBuffer(msg.payload.buffer, msg.payload.order);
    } else if (msg.type === 'watermark') {
      bytes = await watermarkBuffer(msg.payload.buffer, msg.payload.options);
    } else if (msg.type === 'imagesToPdf') {
      bytes = await imagesToPdfBuffer(msg.payload.images);
    } else {
      throw new Error('Unknown worker request');
    }
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const response: WorkerResponse = { id: msg.id, ok: true, result: { buffer } };
    self.postMessage(response, [buffer]);
  } catch (err) {
    const response: WorkerResponse = {
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : 'Processing failed',
    };
    self.postMessage(response);
  }
};
