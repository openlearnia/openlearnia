export type RotateDegrees = 90 | 180 | 270;

export type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  position: WatermarkPosition;
}

export interface ImagePayload {
  buffer: ArrayBuffer;
  mimeType: 'image/jpeg' | 'image/png';
}

export type WorkerRequest =
  | {
      id: string;
      type: 'merge';
      payload: { buffers: ArrayBuffer[] };
    }
  | {
      id: string;
      type: 'split';
      payload: { buffer: ArrayBuffer; start: number; end: number };
    }
  | {
      id: string;
      type: 'rotate';
      payload: { buffer: ArrayBuffer; degrees: RotateDegrees };
    }
  | {
      id: string;
      type: 'delete';
      payload: { buffer: ArrayBuffer; removeIndices: number[] };
    }
  | {
      id: string;
      type: 'reorder';
      payload: { buffer: ArrayBuffer; order: number[] };
    }
  | {
      id: string;
      type: 'watermark';
      payload: { buffer: ArrayBuffer; options: WatermarkOptions };
    }
  | {
      id: string;
      type: 'imagesToPdf';
      payload: { images: ImagePayload[] };
    };

export type WorkerResponse =
  | { id: string; ok: true; result: { buffer: ArrayBuffer } }
  | { id: string; ok: false; error: string };
