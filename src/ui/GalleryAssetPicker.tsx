import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, Search } from 'lucide-react';
import {
  GalleryAssetCategory,
  GalleryAssetSummary,
  getGalleryOriginal,
  getGalleryThumbnail,
  listGalleryAssets,
} from '../tools/assetGallery';

export interface GalleryAssetPick {
  asset: GalleryAssetSummary;
  dataUrl: string;
}

interface GalleryAssetPickerProps {
  categories: GalleryAssetCategory[];
  onSelect: (selection: GalleryAssetPick) => void | Promise<void>;
  title?: string;
  imageMode?: boolean;
  compact?: boolean;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the gallery image.'));
    reader.onerror = () => reject(reader.error || new Error('Could not read the gallery image.'));
    reader.readAsDataURL(blob);
  });
}

/** Small shared accordion picker backed by the canonical IndexedDB gallery. */
export const GalleryAssetPicker: React.FC<GalleryAssetPickerProps> = ({
  categories,
  onSelect,
  title = 'Asset Gallery',
  imageMode = true,
  compact = true,
}) => {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<GalleryAssetSummary[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => () => Object.values(thumbnailUrls).forEach(url => URL.revokeObjectURL(url)), [thumbnailUrls]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const load = async () => {
      try {
        const all = await listGalleryAssets();
        const rows = all.filter(asset => asset.categories.some(category => categories.includes(category)));
        const urls: Record<string, string> = {};
        for (const asset of rows) {
          const blob = await getGalleryThumbnail(asset.id);
          if (!active) { Object.values(urls).forEach(url => URL.revokeObjectURL(url)); return; }
          if (blob) urls[asset.id] = URL.createObjectURL(blob);
        }
        if (!active) { Object.values(urls).forEach(url => URL.revokeObjectURL(url)); return; }
        setAssets(rows);
        setThumbnailUrls(urls);
        setError('');
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load the gallery.');
      }
    };
    void load();
    return () => { active = false; };
  }, [open, categories.join('|'), refreshToken]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return assets.filter(asset => !needle || asset.name.toLocaleLowerCase().includes(needle) || asset.originalName.toLocaleLowerCase().includes(needle));
  }, [assets, query]);

  const choose = async (asset: GalleryAssetSummary) => {
    setBusyId(asset.id);
    setError('');
    try {
      const original = await getGalleryOriginal(asset.id);
      if (!original) throw new Error('The original gallery image is missing.');
      await onSelect({ asset, dataUrl: await blobToDataUrl(original) });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not use this gallery image.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded border border-[#484848] bg-[#252525]">
      <button type="button" onClick={() => setOpen(value => !value)} className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-[10px] font-semibold text-[#ddd] hover:bg-[#303030]">
        <span>{title} · {assets.length} available</span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && (
        <div className="space-y-2 border-t border-[#444] p-2">
          <div className="flex gap-1">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#777]" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a gallery image…" className="w-full rounded border border-[#484848] bg-[#1b1b1b] py-1 pl-7 pr-2 text-[10px] text-white" />
            </div>
            <button type="button" onClick={() => setRefreshToken(value => value + 1)} title="Refresh gallery" className="rounded border border-[#484848] bg-[#303030] px-2 text-[#aaa] hover:text-white">
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
          {error && <p role="alert" className="text-[10px] text-[#fca5a5]">{error}</p>}
          {visible.length ? (
            <div className={`grid gap-1.5 ${compact ? 'grid-cols-5 sm:grid-cols-6' : 'grid-cols-4'} max-h-40 overflow-y-auto`}>
              {visible.map(asset => (
                <button key={asset.id} type="button" disabled={busyId !== null} onClick={() => void choose(asset)} title={asset.name}
                  className="group relative min-w-0 overflow-visible rounded border border-[#494949] bg-[#1d1d1d] text-left hover:border-[#80b9e8] disabled:opacity-50">
                  <span className="flex aspect-square items-center justify-center overflow-hidden rounded bg-[linear-gradient(45deg,#333_25%,transparent_25%,transparent_75%,#333_75%),linear-gradient(45deg,#333_25%,#252525_25%,#252525_75%,#333_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px]">
                    {thumbnailUrls[asset.id] ? <img src={thumbnailUrls[asset.id]} alt="" className="h-full w-full object-contain" loading="lazy" /> : <span className="text-[8px] text-[#777]">…</span>}
                  </span>
                  <span className="block truncate px-1 py-0.5 text-[8px] text-[#bbb]">{busyId === asset.id ? 'Loading…' : asset.name}</span>
                  {imageMode && thumbnailUrls[asset.id] && (
                    <span className="pointer-events-none absolute left-1/2 top-0 z-30 hidden w-36 -translate-x-1/2 -translate-y-full rounded border border-[#888] bg-[#151515] p-1 shadow-xl group-hover:block">
                      <img src={thumbnailUrls[asset.id]} alt={asset.name} className="max-h-36 w-full object-contain" />
                      <span className="block truncate pt-1 text-[9px] text-white">{asset.name}</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : <p className="py-3 text-center text-[10px] text-[#888]">No gallery images in this category yet.</p>}
        </div>
      )}
    </section>
  );
};

export default GalleryAssetPicker;
