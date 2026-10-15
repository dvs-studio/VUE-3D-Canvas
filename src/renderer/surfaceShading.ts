/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Dynamic Blender-Style Surface Shading Engine
 * Created by Victory Ukpong
 * 
 * Implements seamless dynamic switching between:
 * - "Def" (Default): Preserves and applies exact original vertex normals loaded from input mesh file.
 * - "Smooth": Dynamically recalculates angle-weighted face normal averages across shared vertices.
 * - "Flat": Computes faceted per-face normals and enables flat shading across all polygon faces.
 */

import * as THREE from 'three';

export type SurfaceShadingType = 'default' | 'smooth' | 'flat';

export class SurfaceShadingEngine {
  /**
   * Caches original mesh normals into a 'defaultNormal' attribute if not already present.
   */
  public static ensureDefaultNormalsCached(geom: THREE.BufferGeometry): void {
    if (!geom.getAttribute('defaultNormal')) {
      const normalAttr = geom.getAttribute('normal');
      if (normalAttr) {
        geom.setAttribute('defaultNormal', normalAttr.clone());
      } else {
        geom.computeVertexNormals();
        const computed = geom.getAttribute('normal');
        if (computed) {
          geom.setAttribute('defaultNormal', computed.clone());
        }
      }
    }
  }

  /**
   * Applies the selected surface shading mode dynamically to the geometry and material.
   */
  public static applySurfaceShading(
    geom: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[] | null,
    mode: SurfaceShadingType
  ): void {
    this.ensureDefaultNormalsCached(geom);

    switch (mode) {
      case 'default':
        this.applyDefaultNormals(geom, material);
        break;
      case 'smooth':
        this.computeSmoothNormals(geom, material);
        break;
      case 'flat':
        this.computeFlatNormals(geom, material);
        break;
    }
  }

  /**
   * Mode: "Def" (Default)
   * Restores original vertex normals as stored/loaded in the mesh file.
   */
  public static applyDefaultNormals(
    geom: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[] | null
  ): void {
    const defaultNorm = geom.getAttribute('defaultNormal');
    if (defaultNorm) {
      geom.setAttribute('normal', defaultNorm.clone());
      geom.attributes.normal.needsUpdate = true;
    }

    this.setMaterialFlatShading(material, false);
  }

  /**
   * Mode: "Smooth"
   * Dynamically recalculates and averages vertex normals across shared vertices using
   * angle-weighted face normal averaging for a continuous organic appearance.
   */
  public static computeSmoothNormals(
    geom: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[] | null
  ): void {
    const posAttr = geom.getAttribute('position');
    if (!posAttr) return;

    const vertexCount = posAttr.count;
    const normals = new Float32Array(vertexCount * 3);

    // Spatial hash lookup: key = quantized position -> array of vertex indices sharing that position
    const EPSILON = 1e-4;
    const posKey = (x: number, y: number, z: number): string => {
      const qx = Math.round(x / EPSILON);
      const qy = Math.round(y / EPSILON);
      const qz = Math.round(z / EPSILON);
      return `${qx}_${qy}_${qz}`;
    };

    const sharedVertexMap = new Map<string, number[]>();
    for (let i = 0; i < vertexCount; i++) {
      const key = posKey(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      let list = sharedVertexMap.get(key);
      if (!list) {
        list = [];
        sharedVertexMap.set(key, list);
      }
      list.push(i);
    }

    // Temporary vectors for face normal and angle calculation
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const edgeAB = new THREE.Vector3();
    const edgeAC = new THREE.Vector3();
    const edgeBC = new THREE.Vector3();
    const edgeBA = new THREE.Vector3();
    const edgeCA = new THREE.Vector3();
    const edgeCB = new THREE.Vector3();
    const faceNormal = new THREE.Vector3();

    // Accumulation map: key -> Vector3 sum of weighted normals
    const accumMap = new Map<string, THREE.Vector3>();
    sharedVertexMap.forEach((_, key) => {
      accumMap.set(key, new THREE.Vector3(0, 0, 0));
    });

    const indexAttr = geom.getIndex();
    const triangleCount = indexAttr ? indexAttr.count / 3 : vertexCount / 3;

    for (let t = 0; t < triangleCount; t++) {
      let iA: number, iB: number, iC: number;
      if (indexAttr) {
        iA = indexAttr.getX(t * 3);
        iB = indexAttr.getX(t * 3 + 1);
        iC = indexAttr.getX(t * 3 + 2);
      } else {
        iA = t * 3;
        iB = t * 3 + 1;
        iC = t * 3 + 2;
      }

      vA.set(posAttr.getX(iA), posAttr.getY(iA), posAttr.getZ(iA));
      vB.set(posAttr.getX(iB), posAttr.getY(iB), posAttr.getZ(iB));
      vC.set(posAttr.getX(iC), posAttr.getY(iC), posAttr.getZ(iC));

      edgeAB.subVectors(vB, vA);
      edgeAC.subVectors(vC, vA);
      faceNormal.crossVectors(edgeAB, edgeAC);

      const area2 = faceNormal.length();
      if (area2 <= 1e-8) continue; // Degenerate face
      faceNormal.divideScalar(area2); // Normalized face normal

      edgeBC.subVectors(vC, vB);
      edgeBA.copy(edgeAB).negate();
      edgeCA.copy(edgeAC).negate();
      edgeCB.copy(edgeBC).negate();

      // Angle weights at vertices A, B, C
      const angleA = Math.max(0, Math.min(Math.PI, edgeAB.angleTo(edgeAC)));
      const angleB = Math.max(0, Math.min(Math.PI, edgeBA.angleTo(edgeBC)));
      const angleC = Math.max(0, Math.min(Math.PI, edgeCA.angleTo(edgeCB)));

      // Accumulate to spatial keys
      const keyA = posKey(vA.x, vA.y, vA.z);
      const keyB = posKey(vB.x, vB.y, vB.z);
      const keyC = posKey(vC.x, vC.y, vC.z);

      const accA = accumMap.get(keyA);
      if (accA) accA.addScaledVector(faceNormal, angleA);

      const accB = accumMap.get(keyB);
      if (accB) accB.addScaledVector(faceNormal, angleB);

      const accC = accumMap.get(keyC);
      if (accC) accC.addScaledVector(faceNormal, angleC);
    }

    // Normalize accumulated normals and assign back to all shared vertices
    sharedVertexMap.forEach((indices, key) => {
      const acc = accumMap.get(key);
      if (!acc || acc.lengthSq() < 1e-8) {
        acc?.set(0, 1, 0);
      } else {
        acc.normalize();
      }

      const nx = acc!.x;
      const ny = acc!.y;
      const nz = acc!.z;

      for (const idx of indices) {
        normals[idx * 3] = nx;
        normals[idx * 3 + 1] = ny;
        normals[idx * 3 + 2] = nz;
      }
    });

    geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geom.attributes.normal.needsUpdate = true;

    this.setMaterialFlatShading(material, false);
  }

  /**
   * Mode: "Flat"
   * Computes per-face orthogonal normals so each polygon renders distinctly faceted.
   */
  public static computeFlatNormals(
    geom: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[] | null
  ): void {
    const posAttr = geom.getAttribute('position');
    if (!posAttr) return;

    const vertexCount = posAttr.count;
    const normals = new Float32Array(vertexCount * 3);

    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const edge1 = new THREE.Vector3();
    const edge2 = new THREE.Vector3();
    const faceNorm = new THREE.Vector3();

    const indexAttr = geom.getIndex();
    if (indexAttr) {
      const triangleCount = indexAttr.count / 3;
      for (let t = 0; t < triangleCount; t++) {
        const iA = indexAttr.getX(t * 3);
        const iB = indexAttr.getX(t * 3 + 1);
        const iC = indexAttr.getX(t * 3 + 2);

        vA.set(posAttr.getX(iA), posAttr.getY(iA), posAttr.getZ(iA));
        vB.set(posAttr.getX(iB), posAttr.getY(iB), posAttr.getZ(iB));
        vC.set(posAttr.getX(iC), posAttr.getY(iC), posAttr.getZ(iC));

        edge1.subVectors(vB, vA);
        edge2.subVectors(vC, vA);
        faceNorm.crossVectors(edge1, edge2).normalize();

        normals[iA * 3] = faceNorm.x;
        normals[iA * 3 + 1] = faceNorm.y;
        normals[iA * 3 + 2] = faceNorm.z;

        normals[iB * 3] = faceNorm.x;
        normals[iB * 3 + 1] = faceNorm.y;
        normals[iB * 3 + 2] = faceNorm.z;

        normals[iC * 3] = faceNorm.x;
        normals[iC * 3 + 1] = faceNorm.y;
        normals[iC * 3 + 2] = faceNorm.z;
      }
    } else {
      const triangleCount = vertexCount / 3;
      for (let t = 0; t < triangleCount; t++) {
        const iA = t * 3;
        const iB = t * 3 + 1;
        const iC = t * 3 + 2;

        vA.set(posAttr.getX(iA), posAttr.getY(iA), posAttr.getZ(iA));
        vB.set(posAttr.getX(iB), posAttr.getY(iB), posAttr.getZ(iB));
        vC.set(posAttr.getX(iC), posAttr.getY(iC), posAttr.getZ(iC));

        edge1.subVectors(vB, vA);
        edge2.subVectors(vC, vA);
        faceNorm.crossVectors(edge1, edge2).normalize();

        for (const idx of [iA, iB, iC]) {
          normals[idx * 3] = faceNorm.x;
          normals[idx * 3 + 1] = faceNorm.y;
          normals[idx * 3 + 2] = faceNorm.z;
        }
      }
    }

    geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geom.attributes.normal.needsUpdate = true;

    this.setMaterialFlatShading(material, true);
  }

  private static setMaterialFlatShading(
    material: THREE.Material | THREE.Material[] | null,
    flat: boolean
  ): void {
    if (!material) return;
    const mats = Array.isArray(material) ? material : [material];
    for (const m of mats) {
      if ('flatShading' in m) {
        (m as any).flatShading = flat;
        m.needsUpdate = true;
      }
    }
  }
}
