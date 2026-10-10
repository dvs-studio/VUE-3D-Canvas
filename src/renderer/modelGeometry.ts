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
  ensureUVs(geom);
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
  ensureUVs(geom);
  return geom;
}

/**
 * Calculates seamless UV coordinates if missing or irregular
 */
function ensureUVs(geom: THREE.BufferGeometry) {
  if (geom.attributes.uv) return;

  const pos = geom.attributes.position;
  const uvs = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Spherical polar mapping
    const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
    const v = 0.5 - Math.asin(Math.max(-1, Math.min(1, y / 2.0))) / Math.PI;

    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

export const BUILTIN_MODELS: Record<string, () => ModelPreset> = {
  suzanne: () => {
    const geom = createSuzanneGeometry();
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
