/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - 3D Models & Geometry Provider
 * Created by Victory Ukpong
 */

import * as THREE from 'three';

export interface ModelPreset {
  id: string;
  name: string;
  category: string;
  triangleCount: number;
  vertexCount: number;
  geometry: THREE.BufferGeometry;
}

/**
 * Procedural low-poly Monkey Head (Suzanne-inspired) geometry for resource-constrained hardware
 */
function createSuzanneGeometry(): THREE.BufferGeometry {
  const geom = new THREE.DodecahedronGeometry(1.6, 2);
  const pos = geom.attributes.position;
  
  // Deform dodecahedron to sculpt monkey features (brow, muzzle, ears)
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Brow ridge
    if (y > 0.4 && z > 0.6) {
      z += 0.35;
      y += 0.15;
    }
    // Muzzle forward extrusion
    if (y < 0.2 && y > -0.8 && z > 0.3) {
      z += 0.55;
      x *= 0.85;
    }
    // Eye sockets depression
    if (y > 0.1 && y < 0.6 && Math.abs(x) > 0.4 && Math.abs(x) < 1.1 && z > 0.5) {
      z -= 0.3;
    }
    // Ears flare
    if (Math.abs(x) > 1.2 && y > 0.0) {
      x *= 1.45;
      z -= 0.2;
    }
    // Taper chin
    if (y < -0.8) {
      x *= 0.65;
      z *= 0.85;
    }

    pos.setXYZ(i, x, y, z);
  }

  geom.computeVertexNormals();
  // Ensure cylindrical spherical UV mapping for texture painting
  ensureUVs(geom, true);
  return geom;
}

/**
 * Sci-Fi Cyber Helmet / Bust
 */
function createHelmetGeometry(): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(1.2, 0.9, 2.4, 24, 16);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Visor groove
    if (y > 0.1 && y < 0.6 && z > 0.5) {
      z += 0.25;
    }
    // Helmet dome curve
    if (y > 0.8) {
      const taper = 1.0 - (y - 0.8) * 0.8;
      x *= taper;
      z *= taper;
    }
    // Chin guard
    if (y < -0.4 && z > 0.4) {
      z += 0.3;
      x *= 0.8;
    }

    pos.setXYZ(i, x, y, z);
  }

  geom.computeVertexNormals();
  ensureUVs(geom, false);
  return geom;
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
}

export const BUILTIN_MODELS: Record<string, () => ModelPreset> = {
  suzanne: () => {
    const geom = createSuzanneGeometry();
    tagModelComponents(geom, 'suzanne');
    return {
      id: 'suzanne',
      name: 'Suzanne Monkey (Blender Mascot)',
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
};

/**
 * Parses a wavefront .obj file text content into Three.js BufferGeometry
 */
export function parseOBJ(objText: string): THREE.BufferGeometry {
  const lines = objText.split('\n');
  const vertices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  const finalVertices: number[] = [];
  const finalUVs: number[] = [];
  const finalNormals: number[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    const tag = parts[0];

    if (tag === 'v') {
      vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (tag === 'vt') {
      uvs.push(parseFloat(parts[1]), parseFloat(parts[2]));
    } else if (tag === 'vn') {
      normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (tag === 'f') {
      // Process face triangle or quad
      const faceVertices = parts.slice(1);
      const triangulate = [0, 1, 2];
      if (faceVertices.length === 4) {
        triangulate.push(0, 2, 3);
      }

      for (const idx of triangulate) {
        const vertDef = faceVertices[idx].split('/');
        const vIdx = (parseInt(vertDef[0], 10) - 1) * 3;
        finalVertices.push(vertices[vIdx], vertices[vIdx + 1], vertices[vIdx + 2]);

        if (vertDef[1] && uvs.length > 0) {
          const vtIdx = (parseInt(vertDef[1], 10) - 1) * 2;
          finalUVs.push(uvs[vtIdx], uvs[vtIdx + 1]);
        } else {
          // Generate default UV based on position
          finalUVs.push(vertices[vIdx] * 0.5 + 0.5, vertices[vIdx + 1] * 0.5 + 0.5);
        }

        if (vertDef[2] && normals.length > 0) {
          const vnIdx = (parseInt(vertDef[2], 10) - 1) * 3;
          finalNormals.push(normals[vnIdx], normals[vnIdx + 1], normals[vnIdx + 2]);
        }
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(finalVertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(finalUVs, 2));

  if (finalNormals.length === finalVertices.length) {
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(finalNormals, 3));
  } else {
    geom.computeVertexNormals();
  }

  geom.center();
  return geom;
}
