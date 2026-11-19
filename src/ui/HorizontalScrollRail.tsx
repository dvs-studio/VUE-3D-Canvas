import React, { useCallback, useEffect, useRef, useState } from 'react';

interface HorizontalScrollRailProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  railClassName?: string;
}

/** Touch-friendly horizontal scroller with a circular draggable thumb.
 * Native wheel, trackpad, keyboard and touch scrolling remain enabled.
 */
export const HorizontalScrollRail: React.FC<HorizontalScrollRailProps> = ({
  children, className = '', contentClassName = '', railClassName = '',
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ left: 0, thumb: 18, visible: false });
  const draggingRef = useRef(false);

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const rail = railRef.current;
    if (!viewport || !rail) return;
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const railWidth = rail.clientWidth;
    const thumb = Math.max(18, maxScroll > 0 ? railWidth * viewport.clientWidth / viewport.scrollWidth : railWidth);
    const travel = Math.max(0, railWidth - thumb);
    setMetrics({
      left: maxScroll > 0 ? (viewport.scrollLeft / maxScroll) * travel : 0,
      thumb,
      visible: maxScroll > 1,
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(viewport.firstElementChild || viewport);
    measure();
    return () => observer.disconnect();
  }, [measure, children]);

  const setFromClientX = (clientX: number) => {
    const viewport = viewportRef.current;
    const rail = railRef.current;
    if (!viewport || !rail) return;
    const rect = rail.getBoundingClientRect();
    const travel = Math.max(1, rect.width - metrics.thumb);
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const thumbLeft = Math.max(0, Math.min(travel, clientX - rect.left - metrics.thumb / 2));
    viewport.scrollLeft = (thumbLeft / travel) * maxScroll;
  };

  return (
    <div className={`relative min-w-0 ${className}`}>
      <div
        ref={viewportRef}
        onScroll={measure}
        className="w-full h-full overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        <div className={contentClassName}>{children}</div>
      </div>
      <div
        ref={railRef}
        className={`absolute left-2 right-2 bottom-0.5 h-1.5 rounded-full bg-[#1c1c1c]/70 ${railClassName}`}
        style={{ display: metrics.visible ? 'block' : 'none', touchAction: 'none' }}
        onPointerDown={e => {
          e.preventDefault();
          draggingRef.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={e => { if (draggingRef.current) setFromClientX(e.clientX); }}
        onPointerUp={() => { draggingRef.current = false; }}
        onPointerCancel={() => { draggingRef.current = false; }}
        aria-label="Horizontal scroll handle"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute top-1/2 -translate-y-1/2 rounded-full bg-[#8b8b8b] border border-[#d0d0d0] shadow cursor-grab active:cursor-grabbing"
          style={{ left: metrics.left, width: 14, height: 14, touchAction: 'none', pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
};
