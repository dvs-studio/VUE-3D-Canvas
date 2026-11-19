const DB_NAME = 'vue3d-user-assets';
const STORE_NAME = 'models';
const MODEL_KEY = 'mountain-gizmo';

function openAssetDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB is unavailable')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open browser asset storage'));
  });
}

export async function loadMountainGizmoGLB(): Promise<ArrayBuffer | null> {
  const db = await openAssetDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(MODEL_KEY);
      request.onsuccess = () => resolve(request.result instanceof ArrayBuffer ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function saveMountainGizmoGLB(data: ArrayBuffer): Promise<void> {
  const db = await openAssetDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(data, MODEL_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not save Mountain GLB'));
      tx.onabort = () => reject(tx.error || new Error('Mountain GLB save was cancelled'));
    });
  } finally { db.close(); }
  window.dispatchEvent(new Event('vue3d-mountain-gizmo-updated'));
}

export async function clearMountainGizmoGLB(): Promise<void> {
  const db = await openAssetDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(MODEL_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not remove Mountain GLB'));
    });
  } finally { db.close(); }
  window.dispatchEvent(new Event('vue3d-mountain-gizmo-updated'));
}
