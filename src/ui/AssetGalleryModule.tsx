import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteGalleryAsset,
  GALLERY_CATEGORIES,
  GalleryAssetCategory,
  GalleryAssetSummary,
  importGalleryFiles,
  listGalleryAssets,
  getGalleryThumbnail,
} from '../tools/assetGallery';

type GalleryFilter = GalleryAssetCategory | 'all';

export interface AssetGalleryModuleProps {
  /** Optional selection notification for a future consumer; this module is not mounted yet. */
  onAssetSelected?: (asset: GalleryAssetSummary) => void;
  className?: string;
}

/**
 * Standalone gallery surface. It intentionally is not mounted by App.tsx:
 * renderer and tool integrations are a later, separately tested phase.
 */
export const AssetGalleryModule: React.FC<AssetGalleryModuleProps> = ({ onAssetSelected, className = '' }) => {
  const [assets, setAssets] = useState<GalleryAssetSummary[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [importCategories, setImportCategories] = useState<GalleryAssetCategory[]>(['surface-texture']);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const rows = await listGalleryAssets();
    setAssets(rows);
    const nextUrls: Record<string, string> = {};
    for (const asset of rows) {
      const blob = await getGalleryThumbnail(asset.id);
      if (blob) nextUrls[asset.id] = URL.createObjectURL(blob);
    }
    setThumbnailUrls(nextUrls);
    setSelectedId(current => current && rows.some(row => row.id === current) ? current : rows[0]?.id || null);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const rows = await listGalleryAssets();
        if (!active) return;
        setAssets(rows);
        const nextUrls: Record<string, string> = {};
        for (const asset of rows) {
          const blob = await getGalleryThumbnail(asset.id);
          if (!active) {
            Object.values(nextUrls).forEach(url => URL.revokeObjectURL(url));
            return;
          }
          if (blob) nextUrls[asset.id] = URL.createObjectURL(blob);
        }
        setThumbnailUrls(nextUrls);
        setSelectedId(rows[0]?.id || null);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load the asset gallery.');
      }
    };
    void load();
    return () => { active = false; };
    // Initial load only; refresh owns subsequent reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    Object.values(thumbnailUrls).forEach(url => URL.revokeObjectURL(url));
  }, [thumbnailUrls]);

  const visibleAssets = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return assets.filter(asset => {
      const matchesCategory = filter === 'all' || asset.categories.includes(filter);
      const matchesQuery = !needle || asset.name.toLocaleLowerCase().includes(needle) ||
        asset.originalName.toLocaleLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [assets, filter, query]);

  const selectedAsset = assets.find(asset => asset.id === selectedId) || null;

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = input.files;
    if (!files?.length) return;
    setBusy(true);
    setError('');
    try {
      await importGalleryFiles(files, importCategories);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Image import failed.');
    } finally {
      setBusy(false);
      input.value = '';
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    setBusy(true);
    setError('');
    try {
      await deleteGalleryAsset(selectedAsset.id);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not remove the gallery entry.');
    } finally {
      setBusy(false);
    }
  };

  const toggleImportCategory = (category: GalleryAssetCategory) => {
    setImportCategories(current => current.includes(category)
      ? current.length > 1 ? current.filter(item => item !== category) : current
      : [...current, category]);
  };

  return (
    <section className={`flex h-full min-h-[420px] flex-col overflow-hidden rounded-md border border-[#484848] bg-[#292929] text-[#d7d7d7] ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#444] bg-[#333] px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Asset Gallery</h2>
          <p className="text-[11px] text-[#aaa]">Independent image library · originals preserved</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="rounded border border-[#5b7893] bg-[#365b7b] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#416d91] disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Import images'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif" multiple className="hidden" onChange={handleImport} />
      </header>

      <div className="border-b border-[#444] px-3 py-2">
        <div className="mb-2 flex flex-wrap gap-1">
          {GALLERY_CATEGORIES.map(category => (
            <label key={category.id} className="flex cursor-pointer items-center gap-1 rounded border border-[#4b4b4b] bg-[#242424] px-2 py-1 text-[10px] hover:border-[#6c8ba8]">
              <input type="checkbox" checked={importCategories.includes(category.id)} onChange={() => toggleImportCategory(category.id)} />
              {category.label}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => setFilter('all')} className={`rounded px-2 py-1 text-[11px] ${filter === 'all' ? 'bg-[#426987] text-white' : 'bg-[#222] text-[#bbb]'}`}>All</button>
          {GALLERY_CATEGORIES.map(category => (
            <button key={category.id} type="button" onClick={() => setFilter(category.id)} title={category.description} className={`rounded px-2 py-1 text-[11px] ${filter === category.id ? 'bg-[#426987] text-white' : 'bg-[#222] text-[#bbb]'}`}>
              {category.label}
            </button>
          ))}
        </div>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search gallery…" className="mt-2 w-full rounded border border-[#4b4b4b] bg-[#1e1e1e] px-2 py-1.5 text-xs text-white outline-none focus:border-[#6c8ba8]" />
      </div>

      {error && <div role="alert" className="border-b border-[#754b4b] bg-[#3a2525] px-3 py-2 text-xs text-[#ffc4c4]">{error}</div>}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(180px,240px)]">
        <div className="min-h-0 overflow-y-auto p-2">
          {visibleAssets.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2">
              {visibleAssets.map(asset => (
                <button key={asset.id} type="button" onClick={() => { setSelectedId(asset.id); onAssetSelected?.(asset); }} className={`min-w-0 overflow-hidden rounded border text-left ${selectedId === asset.id ? 'border-[#80b9e8] bg-[#354b5e]' : 'border-[#454545] bg-[#222] hover:border-[#777]'}`}>
                  <div className="flex aspect-square items-center justify-center overflow-hidden bg-[linear-gradient(45deg,#333_25%,transparent_25%,transparent_75%,#333_75%),linear-gradient(45deg,#333_25%,#252525_25%,#252525_75%,#333_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]">
                    {thumbnailUrls[asset.id] ? <img src={thumbnailUrls[asset.id]} alt="" className="h-full w-full object-contain" loading="lazy" /> : <span className="text-[10px] text-[#888]">Preview</span>}
                  </div>
                  <div className="truncate px-1.5 py-1 text-[10px]">{asset.name}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-center text-xs text-[#999]">
              <span>No matching images</span>
              <span>Import images to begin building the shared library.</span>
            </div>
          )}
        </div>

        <aside className="flex min-h-0 flex-col border-l border-[#444] bg-[#242424] p-2">
          <div className="mb-2 text-[11px] font-semibold text-[#eee]">Asset details</div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded border border-[#454545] bg-[#1b1b1b]">
            {selectedAsset && thumbnailUrls[selectedAsset.id]
              ? <img src={thumbnailUrls[selectedAsset.id]} alt={selectedAsset.name} className="h-full w-full object-contain" />
              : <span className="text-[10px] text-[#777]">Select an image</span>}
          </div>
          {selectedAsset ? (
            <div className="mt-2 min-h-0 space-y-1 overflow-y-auto text-[10px]">
              <div className="break-words font-semibold text-white">{selectedAsset.name}</div>
              <div className="break-all text-[#999]">{selectedAsset.originalName}</div>
              <div>{selectedAsset.width} × {selectedAsset.height}</div>
              <div>{(selectedAsset.size / 1024).toFixed(1)} KB · {selectedAsset.mimeType || 'Unknown format'}</div>
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedAsset.categories.map(category => <span key={category} className="rounded bg-[#3b3b3b] px-1.5 py-0.5">{GALLERY_CATEGORIES.find(item => item.id === category)?.label || category}</span>)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-white/20" style={{ backgroundColor: selectedAsset.averageColor }} />
                <span className="text-[#aaa]">{selectedAsset.averageColor}</span>
              </div>
              <button type="button" disabled={busy} onClick={handleDelete} className="mt-2 w-full rounded border border-[#714949] bg-[#492c2c] px-2 py-1.5 text-[10px] text-[#ffd0d0] hover:bg-[#603737] disabled:opacity-50">Remove from gallery</button>
            </div>
          ) : <p className="mt-2 text-[10px] text-[#888]">Choose an image to inspect its metadata.</p>}
        </aside>
      </div>
      <footer className="border-t border-[#444] bg-[#303030] px-3 py-1.5 text-[10px] text-[#999]">
        {assets.length} stored asset{assets.length === 1 ? '' : 's'} · Procedural patterns remain a separate system
      </footer>
    </section>
  );
};

export default AssetGalleryModule;
