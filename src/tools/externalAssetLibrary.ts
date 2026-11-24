/**
 * External asset folder discovery for the self-hosted painter.
 *
 * The user chooses a root folder once. We retain its directory handle in
 * IndexedDB (where supported), recursively inspect folders whose names
 * contain "texture", "brush", or "mask" without case sensitivity, and use a
 * small Web Worker to classify/sort the discovered image records.
 *
 * Browser security note: the File System Access API requires explicit user
 * permission. This module never attempts to bypass that permission boundary.
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
}

interface AssetRecord {
  name: string;
  kind: ExternalAssetKind;
  relativePath: string;
  file: File;
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

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Folder memory is unavailable in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) {
        request.result.createObjectStore(DB_STORE);
      }
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
        const directoryHandle = await root.getDirectoryHandle.call(directory, entry.name);
        const visitKey = entryPath.toLowerCase();
        if (visited.has(visitKey)) continue;
        visited.add(visitKey);
        await walk(directoryHandle, entryPath, matchedKind);
      } else if (entry.kind === 'file' && inheritedKind && IMAGE_EXTENSIONS.test(entry.name)) {
        const fileHandle = await directory.getFileHandle(entry.name);
        const file = await fileHandle.getFile();
        records.push({ name: file.name, kind: inheritedKind, relativePath: entryPath, file });
      }
    }
  };

  const rootName = root.name.toLowerCase();
  const rootKind: ExternalAssetKind | undefined = rootName.includes('texture') ? 'texture' : rootName.includes('brush') ? 'brush' : rootName.includes('mask') ? 'mask' : undefined;
  await walk(root, '', rootKind);
  return records;
}

function classifyInWorker(records: Array<{ name: string; kind: ExternalAssetKind; relativePath: string; size: number; mimeType: string }>): Promise<number[]> {
  return new Promise((resolve) => {
    if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
      resolve(records.map((_, index) => index).sort((a, b) =>
        records[a].kind.localeCompare(records[b].kind) ||
        records[a].relativePath.localeCompare(records[b].relativePath, undefined, { sensitivity: 'base' })
      ));
      return;
    }

    const source = `
      self.onmessage = (event) => {
        const rows = event.data || [];
        const order = rows.map((_, index) => index);
        order.sort((a, b) => {
          const left = rows[a], right = rows[b];
          return left.kind.localeCompare(right.kind) ||
            left.relativePath.localeCompare(right.relativePath, undefined, { sensitivity: 'base' });
        });
        self.postMessage(order);
      };
    `;
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const worker = new Worker(url);
    worker.onmessage = (event: MessageEvent<number[]>) => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(Array.isArray(event.data) ? event.data : records.map((_, index) => index));
    };
    worker.onerror = () => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(records.map((_, index) => index));
    };
    worker.postMessage(records.map(({ name, kind, relativePath, size, mimeType }) => ({ name, kind, relativePath, size, mimeType })));
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read ' + file.name));
    reader.onerror = () => reject(reader.error || new Error('Could not read ' + file.name));
    reader.readAsDataURL(file);
  });
}

async function scanHandle(handle: FileSystemDirectoryHandle, requestPermission: boolean): Promise<ExternalAsset[]> {
  if (!(await ensureReadPermission(handle, requestPermission))) {
    throw new Error('Folder permission is not available. Choose the asset folder again to grant access.');
  }
  const records = await collectAssets(handle as unknown as DirectoryHandleLike);
  const order = await classifyInWorker(records.map(({ name, kind, relativePath, file }) => ({
    name, kind, relativePath, size: file.size, mimeType: file.type,
  })));
  const result: ExternalAsset[] = [];
  for (const index of order) {
    const record = records[index];
    if (!record) continue;
    try {
      result.push({
        id: record.kind + ':' + record.relativePath,
        name: record.name.replace(/\.[^.]+$/, ''),
        kind: record.kind,
        relativePath: record.relativePath,
        dataUrl: await readAsDataUrl(record.file),
        mimeType: record.file.type || 'application/octet-stream',
        size: record.file.size,
      });
    } catch (error) {
      console.warn('[External assets] Skipping unreadable file:', record.relativePath, error);
    }
  }
  return result;
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
