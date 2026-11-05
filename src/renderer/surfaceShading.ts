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
    if (!geom.getAttribute('origFileNormal')) {
      const normalAttr = geom.getAttribute('normal');
      if (normalAttr) {
        geom.setAttribute('origFileNormal', normalAttr.clone());
        geom.setAttribute('defaultNormal', normalAttr.clone());
      } else {
        geom.computeVertexNormals();
        const computed = geom.getAttribute('normal');
        if (computed) {
          geom.setAttribute('origFileNormal', computed.clone());
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
    const defaultNorm = geom.getAttribute('origFileNormal') || geom.getAttribute('defaultNormal');
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
  /**
   * Mode: "Smooth"
   * Dynamically calculates angle-weighted face normal averages with a crease-angle threshold (default 38°).
   * Faces sharing a vertex are only averaged if their dihedral angle is within the threshold.
   * This preserves razor-sharp architectural edges, chamfers, and window frames while keeping organic curves smooth.
   */
  public static computeSmoothNormals(
    geom: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[] | null,
    creaseAngleThreshold: number = THREE.MathUtils.degToRad(38)
  ): void {
    const posAttr = geom.getAttribute('position');
    if (!posAttr) return;

    const vertexCount = posAttr.count;
    const normals = new Float32Array(vertexCount * 3);

    // Spatial hash lookup: key = quantized position -> array of vertex indices sharing that position
    // EPSILON 5e-4 accommodates CAD / SweetHome 3D coordinate floating point variances
    const EPSILON = 5e-4;
    const posKey = (x: number, y: number, z: number): string => {
      const qx = Math.round(x / EPSILON);
      const qy = Math.round(y / EPSILON);
      const qz = Math.round(z / EPSILON);
      return `${qx}_${qy}_${qz}`;
    };

    const indexAttr = geom.getIndex();
    const triangleCount = indexAttr ? indexAttr.count / 3 : Math.floor(vertexCount / 3);

    // 1. Compute and store face normal and angle weights for every triangle
    const faceNormals: THREE.Vector3[] = new Array(triangleCount);
    const faceVertexAngles: [number, number, number][] = new Array(triangleCount);
    const triangleIndices: [number, number, number][] = new Array(triangleCount);

    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const edgeAB = new THREE.Vector3();
    const edgeAC = new THREE.Vector3();
    const edgeBC = new THREE.Vector3();
    const edgeBA = new THREE.Vector3();
    const edgeCA = new THREE.Vector3();
    const edgeCB = new THREE.Vector3();

    // Map each spatial vertex position to list of triangles sharing that position and vertex slot (0, 1, or 2)
    const posToFaces = new Map<string, { triIndex: number; corner: number; vertIndex: number }[]>();

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
      triangleIndices[t] = [iA, iB, iC];

      vA.set(posAttr.getX(iA), posAttr.getY(iA), posAttr.getZ(iA));
      vB.set(posAttr.getX(iB), posAttr.getY(iB), posAttr.getZ(iB));
      vC.set(posAttr.getX(iC), posAttr.getY(iC), posAttr.getZ(iC));

      edgeAB.subVectors(vB, vA);
      edgeAC.subVectors(vC, vA);
      const fn = new THREE.Vector3().crossVectors(edgeAB, edgeAC);
      const area = fn.length();
      if (area > 1e-8) {
        fn.divideScalar(area);
      } else {
        fn.set(0, 1, 0);
      }
      faceNormals[t] = fn;

      edgeBC.subVectors(vC, vB);
      edgeBA.copy(edgeAB).negate();
      edgeCA.copy(edgeAC).negate();
      edgeCB.copy(edgeBC).negate();

      const angleA = Math.max(0, Math.min(Math.PI, edgeAB.angleTo(edgeAC)));
      const angleB = Math.max(0, Math.min(Math.PI, edgeBA.angleTo(edgeBC)));
      const angleC = Math.max(0, Math.min(Math.PI, edgeCA.angleTo(edgeCB)));
      faceVertexAngles[t] = [angleA, angleB, angleC];

      const keyA = posKey(vA.x, vA.y, vA.z);
      const keyB = posKey(vB.x, vB.y, vB.z);
      const keyC = posKey(vC.x, vC.y, vC.z);

      if (!posToFaces.has(keyA)) posToFaces.set(keyA, []);
      if (!posToFaces.has(keyB)) posToFaces.set(keyB, []);
      if (!posToFaces.has(keyC)) posToFaces.set(keyC, []);

      posToFaces.get(keyA)!.push({ triIndex: t, corner: 0, vertIndex: iA });
      posToFaces.get(keyB)!.push({ triIndex: t, corner: 1, vertIndex: iB });
      posToFaces.get(keyC)!.push({ triIndex: t, corner: 2, vertIndex: iC });
    }

    const cosThreshold = Math.cos(creaseAngleThreshold);
    // Strict coplanar angle threshold: 2 degrees (cos ~ 0.99939) for dead-flat architectural planar walls
    const cosCoplanar = Math.cos(THREE.MathUtils.degToRad(2.0));

    // 2. For each triangle corner, accumulate face normals with coplanar alignment and crease angle protection
    const accumVec = new THREE.Vector3();
    const coplanarVec = new THREE.Vector3();

    for (let t = 0; t < triangleCount; t++) {
      const baseFn = faceNormals[t];
      const [iA, iB, iC] = triangleIndices[t];
      const vertIndices = [iA, iB, iC];

      for (let corner = 0; corner < 3; corner++) {
        const vIdx = vertIndices[corner];
        const px = posAttr.getX(vIdx);
        const py = posAttr.getY(vIdx);
        const pz = posAttr.getZ(vIdx);
        const key = posKey(px, py, pz);

        const neighbors = posToFaces.get(key);
        accumVec.set(0, 0, 0);

        if (neighbors && neighbors.length > 0) {
          // Pass A: Check for coplanar adjacent faces (< 2 deg)
          coplanarVec.set(0, 0, 0);
          let coplanarCount = 0;

          for (const n of neighbors) {
            const neighborFn = faceNormals[n.triIndex];
            const dot = baseFn.dot(neighborFn);
            if (dot >= cosCoplanar) {
              coplanarVec.add(neighborFn);
              coplanarCount++;
            }
          }

          if (coplanarCount > 1) {
            // Directly snap to unified coplanar normal to eliminate wavy/choppy shading on planar walls & floors
            accumVec.copy(coplanarVec).normalize();
          } else {
            // Pass B: Standard angle-weighted blending within crease threshold
            for (const n of neighbors) {
              const neighborFn = faceNormals[n.triIndex];
              const dot = baseFn.dot(neighborFn);
              if (dot >= cosThreshold) {
                const weight = faceVertexAngles[n.triIndex][n.corner];
                accumVec.addScaledVector(neighborFn, Math.max(weight, 1e-4));
              }
            }
          }
        }

        if (accumVec.lengthSq() < 1e-8) {
          accumVec.copy(baseFn);
        } else {
          accumVec.normalize();
        }

        normals[vIdx * 3] = accumVec.x;
        normals[vIdx * 3 + 1] = accumVec.y;
        normals[vIdx * 3 + 2] = accumVec.z;
      }
    }

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
