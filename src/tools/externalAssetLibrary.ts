/**
 * External image-library discovery for the browser/self-hosted painter.
 *
 * Directory enumeration is performed through the user's explicitly granted
 * File System Access API handle. Image decoding, dimension inspection,
 * thumbnail normalisation and colour sampling are delegated to a Web Worker
 * where createImageBitmap + OffscreenCanvas are supported.
 */
export type ExternalAssetKind = 'texture' | 'brush' | 'mask';

export interface ExternalAsset {
  id: string;
  name: string;
  kind: ExternalAssetKind;
  relativePath: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  averageColor: string;
}

interface AssetRecord {
  name: string;
  kind: ExternalAssetKind;
  relativePath: string;
  file: File;
}

interface ProcessedAsset {
  blob: Blob;
  width: number;
  height: number;
  averageColor: string;
  mimeType: string;
}

interface DirectoryHandleLike {
  name: string;
  values(): AsyncIterable<FileSystemHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirectoryHandleLike>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  queryPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
}

const DB_NAME = 'vue3d-external-assets';
const DB_STORE = 'handles';
const ROOT_KEY = 'asset-root';
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|bmp|avif)$/i;
const MAX_LIBRARY_EDGE = 1024;

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('Folder memory is unavailable in this browser.'));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open asset folder memory.'));
  });
}

async function saveRootHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(handle, ROOT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Could not remember the selected folder.'));
    tx.onabort = () => reject(tx.error || new Error('Folder memory transaction was cancelled.'));
  });
  db.close();
}

async function loadRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openHandleDb();
  const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const request = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(ROOT_KEY);
    request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle | undefined) || null);
    request.onerror = () => reject(request.error || new Error('Could not read the remembered folder.'));
  });
  db.close();
  return handle;
}

async function ensureReadPermission(handle: DirectoryHandleLike, request: boolean): Promise<boolean> {
  const current = await handle.queryPermission?.({ mode: 'read' });
  if (current === 'granted') return true;
  if (!request || !handle.requestPermission) return false;
  return (await handle.requestPermission({ mode: 'read' })) === 'granted';
}

async function collectAssets(root: DirectoryHandleLike): Promise<AssetRecord[]> {
  const records: AssetRecord[] = [];
  const visited = new Set<string>();
  const walk = async (directory: DirectoryHandleLike, path: string, inheritedKind?: ExternalAssetKind): Promise<void> => {
    for await (const entry of directory.values()) {
      const entryPath = path ? path + '/' + entry.name : entry.name;
      if (entry.kind === 'directory') {
        const lower = entry.name.toLowerCase();
        const matchedKind: ExternalAssetKind | undefined =
          lower.includes('texture') ? 'texture' :
          lower.includes('brush') ? 'brush' :
          lower.includes('mask') ? 'mask' : inheritedKind;
        const visitKey = entryPath.toLowerCase();
        if (visited.has(visitKey)) continue;
        visited.add(visitKey);
        const directoryHandle = await directory.getDirectoryHandle(entry.name);
        await walk(directoryHandle, entryPath, matchedKind);
      } else if (entry.kind === 'file' && inheritedKind && IMAGE_EXTENSIONS.test(entry.name)) {
        const file = await (await directory.getFileHandle(entry.name)).getFile();
        records.push({ name: file.name, kind: inheritedKind, relativePath: entryPath, file });
      }
    }
  };
  const rootName = root.name.toLowerCase();
  const rootKind: ExternalAssetKind | undefined = rootName.includes('texture') ? 'texture' : rootName.includes('brush') ? 'brush' : rootName.includes('mask') ? 'mask' : undefined;
  await walk(root, '', rootKind);
  return records;
}

function averageHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function processFilesInWorker(records: AssetRecord[]): Promise<ProcessedAsset[]> {
  return new Promise(resolve => {
    const fallback = async (): Promise<ProcessedAsset[]> => {
      const result: ProcessedAsset[] = [];
      for (const record of records) {
        try {
          const bitmap = await createImageBitmap(record.file);
          const scale = Math.min(1, MAX_LIBRARY_EDGE / Math.max(bitmap.width, bitmap.height));
          const width = Math.max(1, Math.round(bitmap.width * scale));
          const height = Math.max(1, Math.round(bitmap.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) { bitmap.close(); continue; }
          ctx.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();
          const pixels = ctx.getImageData(0, 0, Math.min(width, 64), Math.min(height, 64)).data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < pixels.length; i += 4) { r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count++; }
          const blob = await new Promise<Blob>((ok, no) => canvas.toBlob(value => value ? ok(value) : no(new Error('Image normalisation failed')), 'image/webp', 0.92));
          result.push({ blob, width, height, averageColor: averageHex(r / count, g / count, b / count), mimeType: blob.type || 'image/webp' });
        } catch (error) { console.warn('[External assets] Image processing skipped:', record.relativePath, error); }
      }
      return result;
    };

    if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof createImageBitmap === 'undefined' || typeof OffscreenCanvas === 'undefined') {
      fallback().then(resolve);
      return;
    }

    const source = `
      self.onmessage = async (event) => {
        const files = event.data || [];
        const output = [];
        for (const row of files) {
          try {
            const bitmap = await createImageBitmap(row.file);
            const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
            const width = Math.max(1, Math.round(bitmap.width * scale));
            const height = Math.max(1, Math.round(bitmap.height * scale));
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) { bitmap.close(); continue; }
            ctx.drawImage(bitmap, 0, 0, width, height);
            bitmap.close();
            const sampleWidth = Math.min(width, 64), sampleHeight = Math.min(height, 64);
            const pixels = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < pixels.length; i += 4) { r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count++; }
            const hex = '#' + [r / count, g / count, b / count].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
            const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.92 });
            output.push({ blob, width, height, averageColor: hex, mimeType: blob.type || 'image/webp' });
          } catch (error) {
            output.push({ error: String(error) });
          }
        }
        self.postMessage(output);
      };
    `;
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const worker = new Worker(url);
    const finish = (rows: ProcessedAsset[]) => { worker.terminate(); URL.revokeObjectURL(url); resolve(rows); };
    worker.onmessage = (event: MessageEvent<Array<ProcessedAsset | { error: string }>>) => {
      finish((event.data || []).filter((row): row is ProcessedAsset => !!row && 'blob' in row));
    };
    worker.onerror = () => { worker.terminate(); URL.revokeObjectURL(url); fallback().then(resolve); };
    worker.postMessage(records.map(record => ({ file: record.file })));
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read processed image.'));
    reader.onerror = () => reject(reader.error || new Error('Could not read processed image.'));
    reader.readAsDataURL(blob);
  });
}

async function scanHandle(handle: FileSystemDirectoryHandle, requestPermission: boolean): Promise<ExternalAsset[]> {
  if (!(await ensureReadPermission(handle as unknown as DirectoryHandleLike, requestPermission))) {
    throw new Error('Folder permission is not available. Choose the asset folder again to grant access.');
  }
  const records = await collectAssets(handle as unknown as DirectoryHandleLike);
  const processed = await processFilesInWorker(records);
  const result: ExternalAsset[] = [];
  let processedIndex = 0;
  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    const image = processed[processedIndex++];
    if (!image) continue;
    try {
      result.push({
        id: record.kind + ':' + record.relativePath,
        name: record.name.replace(/\.[^.]+$/, ''),
        kind: record.kind,
        relativePath: record.relativePath,
        dataUrl: await blobToDataUrl(image.blob),
        mimeType: image.mimeType,
        size: record.file.size,
        width: image.width,
        height: image.height,
        averageColor: image.averageColor,
      });
    } catch (error) { console.warn('[External assets] Skipping unreadable file:', record.relativePath, error); }
  }
  return result.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export async function chooseExternalAssetFolder(): Promise<ExternalAsset[]> {
  const picker = (window as Window & { showDirectoryPicker?: (options?: { mode?: 'read' }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  if (!picker) throw new Error('Folder scanning requires a browser with the File System Access API. Use the built-in image import as a fallback.');
  const handle = await picker.call(window, { mode: 'read' });
  await saveRootHandle(handle);
  return scanHandle(handle, true);
}

export async function scanRememberedExternalAssetFolder(): Promise<ExternalAsset[]> {
  const handle = await loadRootHandle();
  if (!handle) return [];
  return scanHandle(handle, false);
}
