/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - 3D Models & Geometry Provider
 * Created by Victory Ukpong
 */

import * as THREE from 'three';
import suzanneOBJ from '../assets/Suzanne.obj?raw';
import { SurfaceShadingEngine } from './surfaceShading';

export interface ModelPreset {
  id: string;
  name: string;
  category: string;
  triangleCount: number;
  vertexCount: number;
  geometry: THREE.BufferGeometry;
}

/**
 * High-Fidelity Sci-Fi Cyber Armor Helmet with precision seams
 */
function createHelmetGeometry(): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(1.25, 0.95, 2.4, 64, 48);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Aerodynamic visor groove
    if (y > 0.05 && y < 0.65 && z > 0.45) {
      const visorCurve = Math.cos(x * 1.6) * 0.35;
      z += 0.28 + visorCurve;
    }
    // Helmet dome curvature
    if (y > 0.75) {
      const domeTaper = Math.sqrt(Math.max(0, 1.0 - (y - 0.75) * 1.5));
      x *= domeTaper;
      z *= domeTaper;
    }
    // Chin and mandible guard
    if (y < -0.35 && z > 0.35) {
      z += 0.38;
      x *= 0.78;
    }

    pos.setXYZ(i, x, y, z);
  }

  geom.computeVertexNormals();
  ensureUVs(geom, false);
  return geom;
}

/**
 * High-Fidelity Architectural Pavilion (Columns, Entablature, Stepped Plinth)
 * Perfect for architectural texture painting and hard-surface crease inspection
 */
function createArchitecturalPavilionGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // 1. Stepped Plinth Foundation (2 tiered beveled slabs)
  const base1 = new THREE.BoxGeometry(4.0, 0.3, 4.0, 4, 1, 4);
  base1.translate(0, -1.35, 0);
  parts.push(base1);

  const base2 = new THREE.BoxGeometry(3.6, 0.25, 3.6, 4, 1, 4);
  base2.translate(0, -1.075, 0);
  parts.push(base2);

  // 2. Colonnade: 8 fluted columns around perimeter
  const columnRadius = 0.14;
  const columnHeight = 1.8;
  const colPositions = [
    [-1.4, -1.4], [0.0, -1.4], [1.4, -1.4],
    [-1.4, 1.4],  [0.0, 1.4],  [1.4, 1.4],
    [-1.4, 0.0],  [1.4, 0.0]
  ];

  for (const [cx, cz] of colPositions) {
    const col = new THREE.CylinderGeometry(columnRadius, columnRadius * 1.1, columnHeight, 24, 12);
    col.translate(cx, -0.05, cz);
    parts.push(col);

    // Column capital / abacus
    const cap = new THREE.BoxGeometry(0.38, 0.1, 0.38);
    cap.translate(cx, 0.9, cz);
    parts.push(cap);
  }

  // 3. Entablature and Roof Slab
  const architrave = new THREE.BoxGeometry(3.8, 0.25, 3.8, 4, 1, 4);
  architrave.translate(0, 1.075, 0);
  parts.push(architrave);

  const cornice = new THREE.BoxGeometry(4.2, 0.2, 4.2, 4, 1, 4);
  cornice.translate(0, 1.3, 0);
  parts.push(cornice);

  // Merge components into unified BufferGeometry using simple attribute concatenation
  let totalVerts = 0;
  parts.forEach(p => { totalVerts += p.attributes.position.count; });

  const mergedPositions = new Float32Array(totalVerts * 3);
  const mergedNormals = new Float32Array(totalVerts * 3);
  const mergedUVs = new Float32Array(totalVerts * 2);

  let vOffset = 0;
  for (const p of parts) {
    const pos = p.attributes.position;
    const norm = p.attributes.normal || p.computeVertexNormals();
    ensureUVs(p, false);
    const uv = p.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      mergedPositions[(vOffset + i) * 3] = pos.getX(i);
      mergedPositions[(vOffset + i) * 3 + 1] = pos.getY(i);
      mergedPositions[(vOffset + i) * 3 + 2] = pos.getZ(i);

      if (norm) {
        mergedNormals[(vOffset + i) * 3] = norm.getX(i);
        mergedNormals[(vOffset + i) * 3 + 1] = norm.getY(i);
        mergedNormals[(vOffset + i) * 3 + 2] = norm.getZ(i);
      }

      if (uv) {
        mergedUVs[(vOffset + i) * 2] = uv.getX(i);
        mergedUVs[(vOffset + i) * 2 + 1] = uv.getY(i);
      }
    }
    vOffset += pos.count;
  }

  const pavilion = new THREE.BufferGeometry();
  pavilion.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
  pavilion.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
  pavilion.setAttribute('uv', new THREE.BufferAttribute(mergedUVs, 2));

  return pavilion;
}

/**
 * Calculates seamless UV coordinates if missing or irregular
 */
export function ensureUVs(geom: THREE.BufferGeometry, force = false) {
  if (geom.attributes.uv && !force) return;

  const pos = geom.attributes.position;
  const uvs = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Spherical polar mapping: u in [0, 1], v in [0, 1]
    const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
    const normalizedY = Math.max(-1.0, Math.min(1.0, y / 2.0));
    const v = 0.5 - Math.asin(normalizedY) / Math.PI;

    uvs[i * 2] = Math.max(0.001, Math.min(0.999, u));
    uvs[i * 2 + 1] = Math.max(0.001, Math.min(0.999, v));
  }

  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

export function tagModelComponents(geom: THREE.BufferGeometry, modelKey: string) {
  const pos = geom.attributes.position;
  if (!pos) return;

  if (!geom.getIndex()) {
    const indices: number[] = [];
    for (let i = 0; i < pos.count; i++) indices.push(i);
    geom.setIndex(indices);
  }

  const idxAttr = geom.getIndex()!;
  geom.userData.fullIndex = idxAttr.clone();

  const componentTriangles: Record<string, number[]> = {};

  const addTriangle = (comp: string, i1: number, i2: number, i3: number) => {
    if (!componentTriangles[comp]) componentTriangles[comp] = [];
    componentTriangles[comp].push(i1, i2, i3);
  };

  const triCount = idxAttr.count / 3;
  for (let t = 0; t < triCount; t++) {
    const i1 = idxAttr.getX(t * 3);
    const i2 = idxAttr.getX(t * 3 + 1);
    const i3 = idxAttr.getX(t * 3 + 2);

    const cx = (pos.getX(i1) + pos.getX(i2) + pos.getX(i3)) / 3;
    const cy = (pos.getY(i1) + pos.getY(i2) + pos.getY(i3)) / 3;
    const cz = (pos.getZ(i1) + pos.getZ(i2) + pos.getZ(i3)) / 3;

    let comp = 'main';
    if (modelKey === 'suzanne') {
      if (Math.abs(cx) > 1.15 && cy > -0.2) {
        comp = 'ears';
      } else if (cy > 0.05 && cy < 0.65 && Math.abs(cx) > 0.35 && Math.abs(cx) < 1.15 && cz > 0.3) {
        comp = 'eyes';
      } else if (cy < 0.25 && cz > 0.3) {
        comp = 'muzzle';
      } else {
        comp = 'head';
      }
    } else if (modelKey === 'helmet') {
      if (cy > 0.1 && cy < 0.65 && cz > 0.45) {
        comp = 'visor';
      } else if (cy > 0.75) {
        comp = 'dome';
      } else if (cy < -0.35 && cz > 0.3) {
        comp = 'chin';
      } else {
        comp = 'sides';
      }
    } else {
      if (Math.abs(cy) > 0.75) {
        comp = 'caps';
      } else {
        comp = 'body';
      }
    }

    addTriangle(comp, i1, i2, i3);
  }

  const componentIndices: Record<string, Uint32Array> = {};
  const excludeIndices: Record<string, Uint32Array> = {};

  const allComps = Object.keys(componentTriangles);
  allComps.forEach((comp) => {
    componentIndices[comp] = new Uint32Array(componentTriangles[comp]);

    const excludeList: number[] = [];
    allComps.forEach((other) => {
      if (other !== comp) {
        excludeList.push(...componentTriangles[other]);
      }
    });
    excludeIndices[comp] = new Uint32Array(excludeList);
  });

  geom.userData.componentIndices = componentIndices;
  geom.userData.excludeIndices = excludeIndices;
  const friendlyNames: Record<string, string> = {
    head: 'Main Head', eyes: 'Eyes', ears: 'Ears', muzzle: 'Muzzle',
    dome: 'Dome Shell', visor: 'Visor Plate', chin: 'Chin Guard', sides: 'Side Mounts',
    body: 'Main Body', caps: 'End Caps', main: 'Main Mesh',
  };
  geom.userData.componentNames = Object.fromEntries(Object.keys(componentIndices).map(id => [id, friendlyNames[id] || id.replace(/_/g, ' ')]));
}

export const BUILTIN_MODELS: Record<string, () => ModelPreset> = {
  suzanne: () => {
    const geom = createSuzanneGeometry();
    tagModelComponents(geom, 'suzanne');
    return {
      id: 'suzanne',
      name: 'Suzanne (Built-in)',
      category: 'Organic Character',
      triangleCount: geom.attributes.position.count,
      vertexCount: geom.attributes.position.count,
      geometry: geom,
    };
  },
  helmet: () => {
    const geom = createHelmetGeometry();
    tagModelComponents(geom, 'helmet');
    return {
      id: 'helmet',
      name: 'Cyber Armor Helmet',
      category: 'Hard Surface',
      triangleCount: geom.attributes.position.count,
      vertexCount: geom.attributes.position.count,
      geometry: geom,
    };
  },
  sphere: () => {
    const geom = new THREE.SphereGeometry(1.5, 32, 24);
    tagModelComponents(geom, 'sphere');
    return {
      id: 'sphere',
      name: 'Material Showcase Sphere',
      category: 'Primitives',
      triangleCount: geom.attributes.position.count,
      vertexCount: geom.attributes.position.count,
      geometry: geom,
    };
  },
  cube: () => {
    const geom = new THREE.BoxGeometry(2.0, 2.0, 2.0, 8, 8, 8);
    tagModelComponents(geom, 'cube');
    return {
      id: 'cube',
      name: 'Beveled Game Asset Box',
      category: 'Primitives',
      triangleCount: geom.attributes.position.count,
      vertexCount: geom.attributes.position.count,
      geometry: geom,
    };
  },
  cylinder: () => {
    const geom = new THREE.CylinderGeometry(1.2, 1.2, 2.4, 32, 16);
    tagModelComponents(geom, 'cylinder');
    return {
      id: 'cylinder',
      name: 'Sci-Fi Barrel Cylinder',
      category: 'Props',
      triangleCount: geom.attributes.position.count,
      vertexCount: geom.attributes.position.count,
      geometry: geom,
    };
  },
  torus: () => {
    const geom = new THREE.TorusGeometry(1.4, 0.45, 24, 48);
    tagModelComponents(geom, 'torus');
    return {
      id: 'torus',
      name: 'Plasma Arc Torus Ring',
      category: 'Props',
      triangleCount: geom.attributes.position.count,
      vertexCount: geom.attributes.position.count,
      geometry: geom,
    };
  },
  pavilion: () => {
    const geom = createArchitecturalPavilionGeometry();
    tagModelComponents(geom, 'pavilion');
    return {
      id: 'pavilion',
      name: 'Classical Architectural Colonnade',
      category: 'Architecture',
      triangleCount: geom.attributes.position.count / 3,
      vertexCount: geom.attributes.position.count,
      geometry: geom,
    };
  },
};

/**
 * Robust Architectural & High-Fidelity Wavefront .obj parser
 * - Full convex polygon fan triangulation for arbitrary n-gons (walls, slabs, windows)
 * - Negative and relative index resolution (e.g. v -1, vt -1)
 * - Preserves explicit face/vertex normals without flattening
 * - Seamless UV coordinate calculation fallback
 */
export function parseOBJ(objText: string): THREE.BufferGeometry {
  const lines = objText.split('\n');
  const vertices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  const finalVertices: number[] = [];
  const finalUVs: number[] = [];
  const finalNormals: number[] = [];
  const uvFromFile: boolean[] = [];
  const componentIndexLists: Record<string, number[]> = {};
  const componentNames: Record<string, string> = {};
  let currentObjectName = 'Object';
  let currentGroupName = '';
  let currentMaterialName = '';
  const componentIdentity = () => {
    const parts = [currentObjectName, currentGroupName, currentMaterialName].filter(Boolean);
    const name = parts.join(' / ') || 'Object';
    const id = parts.join('_').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'object';
    return { id, name };
  };

  const parseIndex = (str: string, totalCount: number): number => {
    const val = parseInt(str, 10);
    if (isNaN(val)) return -1;
    return val < 0 ? totalCount + val : val - 1;
  };

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    const tag = parts[0];

    if (tag === 'v') {
      vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (tag === 'vt') {
      uvs.push(parseFloat(parts[1]), parseFloat(parts[2]));
    } else if (tag === 'vn') {
      normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (tag === 'o') {
      currentObjectName = parts.slice(1).join(' ') || 'Object';
      currentGroupName = '';
      currentMaterialName = '';
    } else if (tag === 'g') {
      currentGroupName = parts.slice(1).join(' ');
    } else if (tag === 'usemtl') {
      currentMaterialName = parts.slice(1).join(' ');
    } else if (tag === 'f') {
      const part = componentIdentity();
      const partStart = finalVertices.length / 3;
      const faceVertices = parts.slice(1);
      if (faceVertices.length < 3) continue;

      const totalV = vertices.length / 3;
      const totalVT = uvs.length / 2;
      const totalVN = normals.length / 3;

      // Convex polygon fan triangulation: (0, i, i + 1) for i in 1 .. n-2
      for (let i = 1; i < faceVertices.length - 1; i++) {
        const triCornerIndices = [0, i, i + 1];

        for (const c of triCornerIndices) {
          const vertDef = faceVertices[c].split('/');
          const vIdx = parseIndex(vertDef[0], totalV);

          if (vIdx >= 0 && vIdx * 3 + 2 < vertices.length) {
            const vx = vertices[vIdx * 3];
            const vy = vertices[vIdx * 3 + 1];
            const vz = vertices[vIdx * 3 + 2];
            finalVertices.push(vx, vy, vz);

            if (vertDef.length > 1 && vertDef[1]) {
              const vtIdx = parseIndex(vertDef[1], totalVT);
              if (vtIdx >= 0 && vtIdx * 2 + 1 < uvs.length) {
                finalUVs.push(uvs[vtIdx * 2], uvs[vtIdx * 2 + 1]);
                uvFromFile.push(true);
              } else {
                finalUVs.push(0, 0);
                uvFromFile.push(false);
              }
            } else {
              finalUVs.push(0, 0);
              uvFromFile.push(false);
            }

            let nx = Number.NaN;
            let ny = Number.NaN;
            let nz = Number.NaN;
            if (vertDef.length > 2 && vertDef[2]) {
              const vnIdx = parseIndex(vertDef[2], totalVN);
              if (vnIdx >= 0 && vnIdx * 3 + 2 < normals.length) {
                nx = normals[vnIdx * 3];
                ny = normals[vnIdx * 3 + 1];
                nz = normals[vnIdx * 3 + 2];
              }
            }
            finalNormals.push(nx, ny, nz);
          }
        }
      }
      const partEnd = finalVertices.length / 3;
      if (partEnd > partStart) {
        const list = componentIndexLists[part.id] || (componentIndexLists[part.id] = []);
        componentNames[part.id] = part.name;
        for (let vertexIndex = partStart; vertexIndex < partEnd; vertexIndex++) list.push(vertexIndex);
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(finalVertices, 3));

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < finalVertices.length; i += 3) {
    const x = finalVertices[i];
    const y = finalVertices[i + 1];
    const z = finalVertices[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const cx = Number.isFinite(minX) ? (minX + maxX) / 2 : 0;
  const cy = Number.isFinite(minY) ? (minY + maxY) / 2 : 0;
  const cz = Number.isFinite(minZ) ? (minZ + maxZ) / 2 : 0;
  let maxR = 1e-8;
  for (let i = 0; i < finalVertices.length; i += 3) {
    const r = Math.hypot(finalVertices[i] - cx, finalVertices[i + 1] - cy, finalVertices[i + 2] - cz);
    if (r > maxR) maxR = r;
  }
  for (let i = 0; i < uvFromFile.length; i++) {
    if (uvFromFile[i]) continue;
    const x = finalVertices[i * 3] - cx;
    const y = finalVertices[i * 3 + 1] - cy;
    const z = finalVertices[i * 3 + 2] - cz;
    finalUVs[i * 2] = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
    finalUVs[i * 2 + 1] = 0.5 - Math.asin(Math.max(-1, Math.min(1, y / maxR))) / Math.PI;
  }
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(finalUVs, 2));

  const vertCount = finalVertices.length / 3;
  for (let t = 0; t + 2 < vertCount; t += 3) {
    let missing = false;
    for (let k = 0; k < 3; k++) {
      if (Number.isNaN(finalNormals[(t + k) * 3])) missing = true;
    }
    if (!missing) continue;
    const ax = finalVertices[t * 3];
    const ay = finalVertices[t * 3 + 1];
    const az = finalVertices[t * 3 + 2];
    const bx = finalVertices[(t + 1) * 3];
    const by = finalVertices[(t + 1) * 3 + 1];
    const bz = finalVertices[(t + 1) * 3 + 2];
    const cxv = finalVertices[(t + 2) * 3];
    const cyv = finalVertices[(t + 2) * 3 + 1];
    const czv = finalVertices[(t + 2) * 3 + 2];
    const e1x = bx - ax;
    const e1y = by - ay;
    const e1z = bz - az;
    const e2x = cxv - ax;
    const e2y = cyv - ay;
    const e2z = czv - az;
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    for (let k = 0; k < 3; k++) {
      const o = (t + k) * 3;
      if (Number.isNaN(finalNormals[o])) {
        finalNormals[o] = nx;
        finalNormals[o + 1] = ny;
        finalNormals[o + 2] = nz;
      }
    }
  }

  const fileNormals = new THREE.Float32BufferAttribute(finalNormals, 3);
  geom.setAttribute('normal', fileNormals);
  geom.setAttribute('origFileNormal', fileNormals.clone());
  geom.setAttribute('defaultNormal', fileNormals.clone());

  // OBJ objects/groups/material sections are exposed as stable inventory parts.
  const fullIndices = new Uint32Array(vertCount);
  for (let i = 0; i < vertCount; i++) fullIndices[i] = i;
  const componentIndices: Record<string, Uint32Array> = {};
  const excludeIndices: Record<string, Uint32Array> = {};
  const componentIds = Object.keys(componentIndexLists);
  for (const id of componentIds) componentIndices[id] = new Uint32Array(componentIndexLists[id]);
  for (const id of componentIds) {
    const excluded: number[] = [];
    for (const otherId of componentIds) if (otherId !== id) excluded.push(...componentIndexLists[otherId]);
    excludeIndices[id] = new Uint32Array(excluded);
  }
  geom.setIndex(new THREE.BufferAttribute(fullIndices, 1));
  geom.userData.fullIndex = geom.index!.clone();
  geom.userData.componentIndices = componentIndices;
  geom.userData.excludeIndices = excludeIndices;
  geom.userData.componentNames = componentNames;

  geom.center();
  geom.computeBoundingSphere();
  const fitted = geom.boundingSphere?.radius || 1;
  if (fitted > 1e-8 && Number.isFinite(fitted)) {
    geom.scale(1 / fitted, 1 / fitted, 1 / fitted);
  }
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * Automatically repairs architectural models (such as SweetHome 3D and CAD exports):
 * - Welds coincident vertices across disconnected wall and room segments within spatial tolerance
 * - Snaps coplanar face normals (< 2 degrees) to eliminate wavy/choppy shading on planar walls
 * - Calculates area-weighted smooth normals while preserving sharp 90-degree architectural edges
 */
export function repairArchitecturalMesh(geom: THREE.BufferGeometry): void {
  // Always preserve original file normals first before computing smooth CAD repairs
  SurfaceShadingEngine.ensureDefaultNormalsCached(geom);
  SurfaceShadingEngine.computeSmoothNormals(geom, null, THREE.MathUtils.degToRad(38));
  const smoothNorm = geom.getAttribute('normal');
  if (smoothNorm) {
    geom.setAttribute('repairedNormal', smoothNorm.clone());
  }
}

/**
 * Re-imports original UV coordinates from an OBJ file directly onto the geometry
 * Preserves user painted texture layers while restoring original UV mapping.
 */
export function reimportUVsFromOBJ(geom: THREE.BufferGeometry, objText: string): boolean {
  try {
    const tempGeom = parseOBJ(objText);
    const newUV = tempGeom.getAttribute('uv');
    if (newUV && newUV.count === geom.getAttribute('position')?.count) {
      geom.setAttribute('uv', newUV.clone());
      geom.attributes.uv.needsUpdate = true;
      return true;
    }
  } catch (err) {
    console.error('Failed to reimport UVs from OBJ:', err);
  }
  return false;
}
