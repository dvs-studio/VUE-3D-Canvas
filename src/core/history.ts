/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Normalized Undo & Redo History Manager
 * Created by Victory Ukpong
 * 
 * Normalized runtime undo/redo stack (up to 30 states) for smooth in-session editing,
 * with strict 3-state ring buffer extraction dedicated specifically for .xblend project saving.
 */

import { Layer, UndoSnapshot } from './types';
import { WasmMemoryEngine } from './wasmMemoryEngine';

export class UndoRingBuffer {
  public static readonly MAX_RUNTIME_STATES = 30; // Normalized history depth
  public static readonly XBLEND_SAVE_STATES = 3;  // Strict 3-state budget for .xblend saving

  private stack: UndoSnapshot[] = [];
  private currentIndex = -1;
  private listeners: (() => void)[] = [];

  constructor() {
    this.reset();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public reset() {
    this.stack = [];
    this.currentIndex = -1;
    this.notify();
  }

  /**
   * Pushes a new state onto the normalized undo history stack.
   */
  public pushState(description: string, layers: Layer[]) {
    const memory = WasmMemoryEngine.getInstance();

    // If we branched by undoing earlier, truncate future states
    if (this.currentIndex < this.stack.length - 1) {
      const discarded = this.stack.slice(this.currentIndex + 1);
      discarded.forEach(snap => {
        snap.layerData.forEach(ld => {
          memory.unregisterBuffer(ld.imageData.data.byteLength);
        });
      });
      this.stack = this.stack.slice(0, this.currentIndex + 1);
    }

    // Capture layer snapshots
    const layerData = layers.map(layer => {
      const w = layer.canvas.width;
      const h = layer.canvas.height;
      const originalData = layer.ctx.getImageData(0, 0, w, h);

      // Clone pixel data
      const copyData = layer.ctx.createImageData(w, h);
      copyData.data.set(originalData.data);

      memory.registerBuffer(copyData.data.byteLength);

      return {
        id: layer.id,
        imageData: copyData,
      };
    });

    const snapshot: UndoSnapshot = {
      id: `state_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      description,
      layerData,
    };

    this.stack.push(snapshot);
    this.currentIndex = this.stack.length - 1;

    // Prune oldest states if exceeding normalized runtime capacity
    if (this.stack.length > UndoRingBuffer.MAX_RUNTIME_STATES) {
      const oldest = this.stack.shift();
      if (oldest) {
        oldest.layerData.forEach(ld => {
          memory.unregisterBuffer(ld.imageData.data.byteLength);
        });
      }
      this.currentIndex--;
    }

    this.notify();
  }

  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.stack.length - 1;
  }

  public undo(layers: Layer[]): boolean {
    if (!this.canUndo()) return false;

    this.currentIndex--;
    const snapshot = this.stack[this.currentIndex];
    if (!snapshot) return false;

    this.applySnapshotToLayers(snapshot, layers);
    this.notify();
    return true;
  }

  public redo(layers: Layer[]): boolean {
    if (!this.canRedo()) return false;

    this.currentIndex++;
    const snapshot = this.stack[this.currentIndex];
    if (!snapshot) return false;

    this.applySnapshotToLayers(snapshot, layers);
    this.notify();
    return true;
  }

  public jumpToState(index: number, layers: Layer[]): boolean {
    if (index < 0 || index >= this.stack.length || index === this.currentIndex) return false;

    this.currentIndex = index;
    const snapshot = this.stack[this.currentIndex];
    if (!snapshot) return false;

    this.applySnapshotToLayers(snapshot, layers);
    this.notify();
    return true;
  }

  private applySnapshotToLayers(snapshot: UndoSnapshot, layers: Layer[]) {
    snapshot.layerData.forEach(sd => {
      const targetLayer = layers.find(l => l.id === sd.id);
      if (targetLayer) {
        targetLayer.ctx.putImageData(sd.imageData, 0, 0);
      }
    });
  }

  /**
   * Extracts strictly the last 3 states for saving into the .xblend project format.
   */
  public getSaveStatesForXBlend() {
    if (this.stack.length === 0) return [];
    const endIndex = this.currentIndex >= 0 ? this.currentIndex : this.stack.length - 1;
    const startIndex = Math.max(0, endIndex - 2);
    const chosen = this.stack.slice(startIndex, endIndex + 1);

    return chosen.map((snap, i) => ({
      slotIndex: i,
      id: snap.id,
      timestamp: snap.timestamp,
      description: snap.description,
    }));
  }

  /**
   * Returns metadata for the normalized history UI list.
   */
  public getHistoryList() {
    const saveStates = this.getSaveStatesForXBlend();
    const saveStateIds = new Set(saveStates.map(s => s.id));

    return this.stack.map((snap, index) => ({
      index,
      id: snap.id,
      description: snap.description,
      timestamp: snap.timestamp,
      isActive: index === this.currentIndex,
      isCommittedToXBlend: saveStateIds.has(snap.id),
    }));
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getCount(): number {
    return this.stack.length;
  }
}
