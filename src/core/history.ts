/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - 3-State Ring Buffer Undo State Manager
 * Created by Victory Ukpong
 * 
 * Strict maximum of 3 undo states directly within memory and the .xblend project format.
 * Guarantees zero memory bloating on constrained hardware.
 */

import { Layer, UndoSnapshot } from './types';
import { WasmMemoryEngine } from './wasmMemoryEngine';

export class UndoRingBuffer {
  public static readonly MAX_STATES = 3;
  private ring: (UndoSnapshot | null)[] = [null, null, null];
  private currentIndex = -1;
  private count = 0;
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
    this.ring = [null, null, null];
    this.currentIndex = -1;
    this.count = 0;
    this.notify();
  }

  /**
   * Captures the current layer state into the 3-element ring buffer.
   */
  public pushState(description: string, layers: Layer[]) {
    const memory = WasmMemoryEngine.getInstance();
    
    // Create layer snapshots
    const layerData = layers.map(layer => {
      const w = layer.canvas.width;
      const h = layer.canvas.height;
      const originalData = layer.ctx.getImageData(0, 0, w, h);
      
      // Clone pixel data into fresh ImageData
      const copyData = layer.ctx.createImageData(w, h);
      copyData.data.set(originalData.data);
      
      // Track memory allocation in wasm manager
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

    if (this.count === 0) {
      this.ring[0] = snapshot;
      this.currentIndex = 0;
      this.count = 1;
    } else {
      // Ring shift if advancing past current index or at capacity
      this.currentIndex = (this.currentIndex + 1) % UndoRingBuffer.MAX_STATES;
      
      // Free previously occupied snapshot memory if overwriting
      const old = this.ring[this.currentIndex];
      if (old) {
        old.layerData.forEach(l => {
          memory.unregisterBuffer(l.imageData.data.byteLength);
        });
      }

      this.ring[this.currentIndex] = snapshot;
      this.count = Math.min(UndoRingBuffer.MAX_STATES, this.count + 1);
    }

    this.notify();
  }

  public canUndo(): boolean {
    return this.count > 1 && this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.count - 1 && this.ring[this.currentIndex + 1] !== null;
  }

  public undo(layers: Layer[]): boolean {
    if (!this.canUndo()) return false;

    this.currentIndex--;
    const snapshot = this.ring[this.currentIndex];
    if (!snapshot) return false;

    this.applySnapshotToLayers(snapshot, layers);
    this.notify();
    return true;
  }

  public redo(layers: Layer[]): boolean {
    if (!this.canRedo()) return false;

    this.currentIndex++;
    const snapshot = this.ring[this.currentIndex];
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
   * Returns metadata for UI visualization of the 3 ring slots
   */
  public getRingSlots() {
    return [0, 1, 2].map(slotIndex => {
      const snapshot = this.ring[slotIndex];
      const isActive = slotIndex === this.currentIndex;
      return {
        slotIndex,
        isFilled: snapshot !== null,
        isActive,
        description: snapshot ? snapshot.description : 'Empty Slot',
        timestamp: snapshot ? snapshot.timestamp : null,
      };
    });
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getCount(): number {
    return this.count;
  }
}
