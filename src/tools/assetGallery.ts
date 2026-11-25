/**
 * Independent, persistent image-asset gallery storage.
 *
 * This module has no dependency on brush, mask, material, Matcap, Triplanar,
 * or renderer code. Consumers will request an asset by ID and interpret it
 * for their own purpose only after their integration phase.
 *
 * Metadata, original images and thumbnails are stored separately so gallery
 * browsing never loads every full-resolution source image into memory.
 */

export const ASSET_GALLERY_DB = 'vue3d-asset-gallery';
export const ASSET_GALLERY_VERSION = 3;
export const ASSET_GALLERY_STORE = 'assets';
const ORIGINALS_STORE = 'originals';
const THUMBNAILS_STORE = 'thumbnails';

export type GalleryAssetCategory =
  | 'stencil'
  | 'brush-texture'
  | 'mask'
  | 'surface-texture'
  | 'matcap'
  | 'image-pattern';

export type GalleryAssetSource = 'import' | 'folder-scan' | 'bundled';

export interface GalleryAssetSummary {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  categories: GalleryAssetCategory[];
  source: GalleryAssetSource;
  sourcePath?: string;
  averageColor: string;
  createdAt: number;
  updatedAt: number;
}

export interface GalleryAsset extends GalleryAssetSummary {
  original: Blob;
  thumbnail: Blob;
}

export const GALLERY_CATEGORIES: ReadonlyArray<{
  id: GalleryAssetCategory;
  label: string;
  description: string;
}> = [
  { id: 'stencil', label: 'Stencils', description: 'Brush stamp images; alpha is meaningful.' },
  { id: 'brush-texture', label: 'Brush Textures', description: 'Surface detail applied by brush behaviour.' },
  { id: 'mask', label: 'Masks', description: 'Images used to control where an effect is applied.' },
  { id: 'surface-texture', label: 'Surface Textures', description: 'Images suitable for material and triplanar use.' },
  { id: 'matcap', label: 'Matcaps', description: 'Images interpreted by the Matcap shading system.' },
  { id: 'image-pattern', label: 'Image Patterns', description: 'Raster patterns; distinct from mathematical patterns.' },
];

export const GALLERY_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/avif',
] as const;

const MAX_THUMBNAIL_EDGE = 320;
const ACCEPTED_EXTENSIONS = /\.(png|jpe?g|webp|gif|bmp|avif)$/i;

interface BlobRecord { id: string; blob: Blob; }

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'asset-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function openGalleryDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Persistent gallery storage is unavailable in this browser.'));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ASSET_GALLERY_DB, ASSET_GALLERY_VERSION);
    request.onupgradeneeded = event => {
      const db = request.result;
      const tx = request.transaction;
      let assets: IDBObjectStore;
      if (!db.objectStoreNames.contains(ASSET_GALLERY_STORE)) {
        assets = db.createObjectStore(ASSET_GALLERY_STORE, { keyPath: 'id' });
        assets.createIndex('name', 'name', { unique: false });
        assets.createIndex('categories', 'categories', { unique: false, multiEntry: true });
        assets.createIndex('updatedAt', 'updatedAt', { unique: false });
        assets.createIndex('sourcePath', 'sourcePath', { unique: false });
      } else {
        assets = tx!.objectStore(ASSET_GALLERY_STORE);
        if (!assets.indexNames.contains('sourcePath')) assets.createIndex('sourcePath', 'sourcePath', { unique: false });
      }
      if (!db.objectStoreNames.contains(ORIGINALS_STORE)) db.createObjectStore(ORIGINALS_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(THUMBNAILS_STORE)) db.createObjectStore(THUMBNAILS_STORE, { keyPath: 'id' });

      // Migrate the early single-record schema without discarding already imported assets.
      if ((event as IDBVersionChangeEvent).oldVersion > 0 && (event as IDBVersionChangeEvent).oldVersion < 2) {
        const cursorRequest = assets.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const row = cursor.value as GalleryAssetSummary & { original?: Blob; thumbnail?: Blob };
          if (row.original) tx!.objectStore(ORIGINALS_STORE).put({ id: row.id, blob: row.original } satisfies BlobRecord);
          if (row.thumbnail) tx!.objectStore(THUMBNAILS_STORE).put({ id: row.id, blob: row.thumbnail } satisfies BlobRecord);
          delete row.original;
          delete row.thumbnail;
          cursor.update(row);
          cursor.continue();
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open the asset gallery.'));
    request.onblocked = () => reject(new Error('The asset gallery is blocked by another open tab. Close older app tabs and retry.'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Gallery storage transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('Gallery storage transaction was cancelled.'));
  });
}

function readImageSize(blob: Blob): Promise<{ width: number; height: number; thumbnail: Blob; averageColor: string }> {
  return new Promise((resolve, reject) => {
    if (typeof createImageBitmap !== 'function') {
      reject(new Error('This browser cannot create image previews. Use a current browser with image decoding support.'));
      return;
    }
    createImageBitmap(blob).then(async bitmap => {
      try {
        const scale = Math.min(1, MAX_THUMBNAIL_EDGE / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Could not create a thumbnail canvas.');
        context.clearRect(0, 0, width, height);
        context.drawImage(bitmap, 0, 0, width, height);

        const sampleWidth = Math.min(width, 64);
        const sampleHeight = Math.min(height, 64);
        const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
        let red = 0, green = 0, blue = 0, count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] === 0) continue;
          red += pixels[i]; green += pixels[i + 1]; blue += pixels[i + 2]; count++;
        }
        const hex = count
          ? '#' + [red / count, green / count, blue / count].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
          : '#808080';
        const thumbnail = await new Promise<Blob>((ok, no) => {
          canvas.toBlob(value => value ? ok(value) : no(new Error('Could not encode the gallery thumbnail.')), 'image/webp', 0.86);
        });
        resolve({ width: bitmap.width, height: bitmap.height, thumbnail, averageColor: hex });
      } catch (error) {
        reject(error);
      } finally {
        bitmap.close();
      }
    }).catch(reject);
  });
}

function isSupportedImage(file: File): boolean {
  return GALLERY_IMAGE_TYPES.includes(file.type as typeof GALLERY_IMAGE_TYPES[number]) ||
    ACCEPTED_EXTENSIONS.test(file.name);
}

function requestResult<T>(request: IDBRequest<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error(message));
  });
}

export interface GalleryImportOptions {
  source?: GalleryAssetSource;
  sourcePathForFile?: (file: File) => string | undefined;
  categoriesForFile?: (file: File) => GalleryAssetCategory[];
}

export async function importGalleryFiles(
  files: FileList | File[],
  categories: GalleryAssetCategory[] = ['surface-texture'],
  options: GalleryImportOptions = {},
): Promise<GalleryAssetSummary[]> {
  const selected = Array.from(files).filter(isSupportedImage);
  if (!selected.length) throw new Error('Choose PNG, JPEG, WebP, GIF, BMP or AVIF images.');

  const db = await openGalleryDb();
  const imported: GalleryAssetSummary[] = [];
  try {
    for (const file of selected) {
      const cleanCategories = Array.from(new Set(options.categoriesForFile?.(file) || categories));
      if (!cleanCategories.length) continue;
      const details = await readImageSize(file);
      const now = Date.now();
      const summary: GalleryAssetSummary = {
        id: makeId(),
        name: file.name.replace(/\.[^.]+$/, ''),
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        width: details.width,
        height: details.height,
        categories: cleanCategories,
        source: options.source || 'import',
        sourcePath: options.sourcePathForFile?.(file),
        averageColor: details.averageColor,
        createdAt: now,
        updatedAt: now,
      };
      const tx = db.transaction([ASSET_GALLERY_STORE, ORIGINALS_STORE, THUMBNAILS_STORE], 'readwrite');
      tx.objectStore(ASSET_GALLERY_STORE).put(summary);
      tx.objectStore(ORIGINALS_STORE).put({ id: summary.id, blob: file.slice(0, file.size, file.type) } satisfies BlobRecord);
      tx.objectStore(THUMBNAILS_STORE).put({ id: summary.id, blob: details.thumbnail } satisfies BlobRecord);
      await transactionDone(tx);
      imported.push(summary);
    }
  } finally {
    db.close();
  }
  return imported;
}

export async function listGalleryAssets(category?: GalleryAssetCategory): Promise<GalleryAssetSummary[]> {
  const db = await openGalleryDb();
  try {
    const tx = db.transaction(ASSET_GALLERY_STORE, 'readonly');
    const store = tx.objectStore(ASSET_GALLERY_STORE);
    const request = category
      ? store.index('categories').getAll(category)
      : store.getAll();
    const rows = await requestResult(request, 'Could not read gallery assets.');
    await transactionDone(tx);
    return (rows as GalleryAssetSummary[])
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  } finally {
    db.close();
  }
}

export async function getGalleryAsset(id: string): Promise<GalleryAsset | null> {
  const db = await openGalleryDb();
  try {
    const tx = db.transaction([ASSET_GALLERY_STORE, ORIGINALS_STORE, THUMBNAILS_STORE], 'readonly');
    const metadataRequest = tx.objectStore(ASSET_GALLERY_STORE).get(id);
    const originalRequest = tx.objectStore(ORIGINALS_STORE).get(id);
    const thumbnailRequest = tx.objectStore(THUMBNAILS_STORE).get(id);
    const [metadata, original, thumbnail] = await Promise.all([
      requestResult(metadataRequest, 'Could not load gallery metadata.'),
      requestResult(originalRequest, 'Could not load the original image.'),
      requestResult(thumbnailRequest, 'Could not load the gallery thumbnail.'),
    ]);
    await transactionDone(tx);
    if (!metadata || !(original as BlobRecord | undefined)?.blob || !(thumbnail as BlobRecord | undefined)?.blob) return null;
    return {
      ...(metadata as GalleryAssetSummary),
      original: (original as BlobRecord).blob,
      thumbnail: (thumbnail as BlobRecord).blob,
    };
  } finally {
    db.close();
  }
}

export async function getGalleryThumbnail(id: string): Promise<Blob | null> {
  const db = await openGalleryDb();
  try {
    const tx = db.transaction(THUMBNAILS_STORE, 'readonly');
    const row = await requestResult(tx.objectStore(THUMBNAILS_STORE).get(id), 'Could not load the gallery thumbnail.') as BlobRecord | undefined;
    await transactionDone(tx);
    return row?.blob || null;
  } finally {
    db.close();
  }
}

export async function getGalleryOriginal(id: string): Promise<Blob | null> {
  const db = await openGalleryDb();
  try {
    const tx = db.transaction(ORIGINALS_STORE, 'readonly');
    const row = await requestResult(tx.objectStore(ORIGINALS_STORE).get(id), 'Could not load the original image.') as BlobRecord | undefined;
    await transactionDone(tx);
    return row?.blob || null;
  } finally {
    db.close();
  }
}

export async function updateGalleryAssetCategories(
  id: string,
  categories: GalleryAssetCategory[],
): Promise<void> {
  const cleanCategories = Array.from(new Set(categories));
  if (!cleanCategories.length) throw new Error('An asset must belong to at least one category.');
  const db = await openGalleryDb();
  try {
    const tx = db.transaction(ASSET_GALLERY_STORE, 'readwrite');
    const store = tx.objectStore(ASSET_GALLERY_STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      const asset = request.result as GalleryAssetSummary | undefined;
      if (!asset) { tx.abort(); return; }
      asset.categories = cleanCategories;
      asset.updatedAt = Date.now();
      store.put(asset);
    };
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function deleteGalleryAsset(id: string): Promise<void> {
  const db = await openGalleryDb();
  try {
    const tx = db.transaction([ASSET_GALLERY_STORE, ORIGINALS_STORE, THUMBNAILS_STORE], 'readwrite');
    tx.objectStore(ASSET_GALLERY_STORE).delete(id);
    tx.objectStore(ORIGINALS_STORE).delete(id);
    tx.objectStore(THUMBNAILS_STORE).delete(id);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export function galleryCategoryLabel(category: GalleryAssetCategory): string {
  return GALLERY_CATEGORIES.find(item => item.id === category)?.label || category;
}
