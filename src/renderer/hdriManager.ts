/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - HDRI Equirectangular Environment & Reflection Engine
 * Created by Victory Ukpong
 */

import * as THREE from 'three';

export type HDRIPreset = 'studio' | 'sunset' | 'cyberpunk' | 'outdoor' | 'custom';

export class HDRIManager {
  private static cachedTextures: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Procedurally generates a 1024x512 32-bit color-range equirectangular panorama canvas
   */
  public static generateEquirectangularCanvas(preset: HDRIPreset): HTMLCanvasElement {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    if (preset === 'studio') {
      // 3-Point Studio Softbox Environment
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1c1c1f');
      grad.addColorStop(0.48, '#2d2e33');
      grad.addColorStop(0.52, '#18191c');
      grad.addColorStop(1, '#0e0f11');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Key Softbox Light (Left, 45 degrees elevation)
      ctx.fillStyle = 'rgba(255, 250, 240, 0.95)';
      ctx.beginPath();
      ctx.ellipse(w * 0.25, h * 0.32, 70, 45, 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Fill Softbox Light (Right, lower elevation)
      ctx.fillStyle = 'rgba(210, 230, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(w * 0.72, h * 0.38, 50, 35, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Top Rim Strip Light
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(w * 0.38, 15, w * 0.24, 25);
    } else if (preset === 'sunset') {
      // Warm Golden Sunset Horizon
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a102e'); // Deep purple zenith
      grad.addColorStop(0.35, '#5c234a');
      grad.addColorStop(0.5, '#f57a2b'); // Bright golden horizon
      grad.addColorStop(0.52, '#ffba42'); // Setting sun band
      grad.addColorStop(0.65, '#2e1810');
      grad.addColorStop(1, '#110a08'); // Dark ground
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Blazing Setting Sun Sphere
      const sunGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 4, w * 0.5, h * 0.5, 90);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.2, '#fff1a8');
      sunGrad.addColorStop(0.6, '#ff8326');
      sunGrad.addColorStop(1, 'rgba(255, 131, 38, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 90, 0, Math.PI * 2);
      ctx.fill();
    } else if (preset === 'cyberpunk') {
      // High-contrast Cyberpunk Neon Strips
      ctx.fillStyle = '#0a0b12';
      ctx.fillRect(0, 0, w, h);

      // Electric Cyan Vertical Grid Lines
      ctx.fillStyle = 'rgba(0, 230, 255, 0.8)';
      ctx.fillRect(w * 0.18, 50, 18, h * 0.5);
      ctx.fillRect(w * 0.82, 70, 14, h * 0.45);

      // Vivid Magenta Horizontal Strips
      ctx.fillStyle = 'rgba(255, 0, 128, 0.85)';
      ctx.fillRect(w * 0.35, h * 0.4, 220, 30);
      ctx.fillRect(w * 0.65, h * 0.3, 160, 20);

      // Horizon glow
      const hGrad = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.55);
      hGrad.addColorStop(0, 'rgba(120, 0, 255, 0.6)');
      hGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.9)');
      hGrad.addColorStop(1, 'rgba(120, 0, 255, 0.1)');
      ctx.fillStyle = hGrad;
      ctx.fillRect(0, h * 0.45, w, h * 0.1);
    } else {
      // Daylight Sky & Outdoor Horizon
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1c5aa6'); // Sky blue zenith
      grad.addColorStop(0.48, '#7bb3eb'); // Horizon haze
      grad.addColorStop(0.52, '#385e2b'); // Ground grass
      grad.addColorStop(1, '#1b2c15');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Daylight Sun
      const sunGrad = ctx.createRadialGradient(w * 0.35, h * 0.22, 6, w * 0.35, h * 0.22, 100);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.3, '#fffbe6');
      sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.35, h * 0.22, 100, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  }

  /**
   * Returns a cached Three.js Texture mapped with EquirectangularReflectionMapping
   */
  public static getHDRITexture(preset: HDRIPreset, customUrl?: string): THREE.Texture {
    const key = preset === 'custom' && customUrl ? customUrl : preset;
    if (this.cachedTextures.has(key)) {
      return this.cachedTextures.get(key)!;
    }

    if (preset === 'custom' && customUrl) {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(customUrl);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      this.cachedTextures.set(key, tex as any);
      return tex;
    }

    const canvas = this.generateEquirectangularCanvas(preset);
    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set(key, tex);
    return tex;
  }

  /**
   * Mathematical equirectangular reflection vector sampler:
   * R = reflect(-V, N) = 2.0 * dot(V, N) * N - V
   * u = atan2(R.x, R.z) / (2 * pi) + 0.5
   * v = asin(R.y) / pi + 0.5
   */
  public static sampleReflectionVector(
    V: THREE.Vector3,
    N: THREE.Vector3,
    canvas: HTMLCanvasElement
  ): { r: number; g: number; b: number } {
    // R = 2 * (V . N) * N - V
    const dotVN = V.dot(N);
    const R = new THREE.Vector3()
      .copy(N)
      .multiplyScalar(2.0 * dotVN)
      .sub(V)
      .normalize();

    const u = Math.atan2(R.x, R.z) / (2 * Math.PI) + 0.5;
    const v = Math.asin(Math.max(-1, Math.min(1, R.y))) / Math.PI + 0.5;

    const px = Math.floor(Math.max(0, Math.min(1, u)) * (canvas.width - 1));
    const py = Math.floor(Math.max(0, Math.min(1, 1 - v)) * (canvas.height - 1));

    const ctx = canvas.getContext('2d')!;
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    return { r: pixel[0], g: pixel[1], b: pixel[2] };
  }
}
