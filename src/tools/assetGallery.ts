/**
 * Independent, persistent image-asset gallery storage.
 *
 * This module deliberately has no dependency on brush, mask, material, Matcap,
 * Triplanar, or renderer code. Consumers will request an asset by ID and
 * interpret it for their own purpose only after their integration phase.
 *
 * Original image blobs are preserved unchanged. Thumbnails and metadata are
 * derived records; importing or indexing never edits the user's source file.
 */

export const ASSET_GALLERY_DB = 'vue3d-asset-gallery';
export const ASSET_GALLERY_VERSION = 1;
export const ASSET_GALLERY_STORE = 'assets';

export type GalleryAssetCategory =
  | 'stencil'
  | 'brush-texture'
  | 'mask'
  | 'surface-texture'
  | 'matcap'
  | 'image-pattern';

export type GalleryAssetSource = 'import' | 'folder-scan' | 'bundled';

export interface GalleryAsset {
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
  original: Blob;
  thumbnail: Blob;
}

export interface GalleryAssetSummary extends Omit<GalleryAsset, 'original' | 'thumbnail'> {}

export const GALLERY_CATEGORIES: ReadonlyArray<{
  id: GalleryAssetCategory;
  label: string;
  description: string;
}> = [
  { id: 'stencil', label: 'Stencils', description: 'Brush stamp images; alpha is meaningful.' },
  { id: 'brush-texture', label: 'Brush Textures', description: 'Surface detail applied by brush behaviour.' },
  { id: 'mask', label: 'Masks', description: 'Images used to control where an effect is applied.' },
  { id: 'surface-texture', label: 'Surface Textures', description: 'Images suitable for material and triplanar projection.' },
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
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ASSET_GALLERY_STORE)) {
        const store = db.createObjectStore(ASSET_GALLERY_STORE, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('categories', 'categories', { unique: false, multiEntry: true });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
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

export async function importGalleryFiles(
  files: FileList | File[],
  categories: GalleryAssetCategory[] = ['surface-texture'],
): Promise<GalleryAssetSummary[]> {
  const selected = Array.from(files).filter(isSupportedImage);
  if (!selected.length) throw new Error('Choose PNG, JPEG, WebP, GIF, BMP or AVIF images.');

  const cleanCategories = Array.from(new Set(categories));
  if (!cleanCategories.length) throw new Error('Choose at least one gallery category.');

  const db = await openGalleryDb();
  const imported: GalleryAssetSummary[] = [];
  try {
    for (const file of selected) {
      const details = await readImageSize(file);
      const now = Date.now();
      const asset: GalleryAsset = {
        id: makeId(),
        name: file.name.replace(/\.[^.]+$/, ''),
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        width: details.width,
        height: details.height,
        categories: cleanCategories,
        source: 'import',
        averageColor: details.averageColor,
        createdAt: now,
        updatedAt: now,
        original: file.slice(0, file.size, file.type),
        thumbnail: details.thumbnail,
      };
      const tx = db.transaction(ASSET_GALLERY_STORE, 'readwrite');
      tx.objectStore(ASSET_GALLERY_STORE).put(asset);
      await transactionDone(tx);
      const { original: _original, thumbnail: _thumbnail, ...summary } = asset;
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
    const request = category
      ? tx.objectStore(ASSET_GALLERY_STORE).index('categories').getAll(category)
      : tx.objectStore(ASSET_GALLERY_STORE).getAll();
    const rows = await new Promise<GalleryAsset[]>((resolve, reject) => {
      request.onsuccess = () => resolve((request.result || []) as GalleryAsset[]);
      request.onerror = () => reject(request.error || new Error('Could not read gallery assets.'));
    });
    await transactionDone(tx);
    return rows
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .map(({ original: _original, thumbnail: _thumbnail, ...summary }) => summary);
  } finally {
    db.close();
  }
}

export async function getGalleryAsset(id: string): Promise<GalleryAsset | null> {
  const db = await openGalleryDb();
  try {
    const tx = db.transaction(ASSET_GALLERY_STORE, 'readonly');
    const request = tx.objectStore(ASSET_GALLERY_STORE).get(id);
    const result = await new Promise<GalleryAsset | null>((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as GalleryAsset | undefined) || null);
      request.onerror = () => reject(request.error || new Error('Could not load the selected gallery asset.'));
    });
    await transactionDone(tx);
    return result;
  } finally {
    db.close();
  }
}

export async function getGalleryThumbnail(id: string): Promise<Blob | null> {
  const asset = await getGalleryAsset(id);
  return asset?.thumbnail || null;
}

export async function getGalleryOriginal(id: string): Promise<Blob | null> {
  const asset = await getGalleryAsset(id);
  return asset?.original || null;
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
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const asset = request.result as GalleryAsset | undefined;
        if (!asset) { reject(new Error('The selected gallery asset no longer exists.')); return; }
        asset.categories = cleanCategories;
        asset.updatedAt = Date.now();
        store.put(asset);
        resolve();
      };
      request.onerror = () => reject(request.error || new Error('Could not update gallery categories.'));
    });
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function deleteGalleryAsset(id: string): Promise<void> {
  const db = await openGalleryDb();
  try {
    const tx = db.transaction(ASSET_GALLERY_STORE, 'readwrite');
    tx.objectStore(ASSET_GALLERY_STORE).delete(id);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export function galleryCategoryLabel(category: GalleryAssetCategory): string {
  return GALLERY_CATEGORIES.find(item => item.id === category)?.label || category;
}
