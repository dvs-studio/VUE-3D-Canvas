/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - non-destructive subdivision preview
 * Preview geometry is transient and is never written to the source mesh or .xblend.
 */

import * as THREE from 'three';
import type { Layer } from '../core/types';

export interface SubdivisionPreviewOptions {
  enabled: boolean;
  algorithm: 'catmull-clark' | 'simple';
  levels: number;
  sharpAngle: number;
  crease: number;
  boundary: boolean;
  displacement: number;
}

type Vec3 = [number, number, number];
type Vec2 = [number, number];
interface PreviewVertex { p: Vec3; uv: Vec2; }
interface PreviewFace { v: number[]; }

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const average3 = (values: Vec3[]): Vec3 => values.length
  ? [values.reduce((s, v) => s + v[0], 0) / values.length, values.reduce((s, v) => s + v[1], 0) / values.length, values.reduce((s, v) => s + v[2], 0) / values.length]
  : [0, 0, 0];
const average2 = (values: Vec2[]): Vec2 => values.length
  ? [values.reduce((s, v) => s + v[0], 0) / values.length, values.reduce((s, v) => s + v[1], 0) / values.length]
  : [0, 0];

function mix3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function mix2(a: Vec2, b: Vec2, t: number): Vec2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
function faceNormal(face: PreviewFace, vertices: PreviewVertex[]): THREE.Vector3 {
  const a = new THREE.Vector3(...vertices[face.v[0]].p);
  const b = new THREE.Vector3(...vertices[face.v[1]].p);
  const c = new THREE.Vector3(...vertices[face.v[2]].p);
  return b.sub(a).cross(c.sub(a)).normalize();
}

function sourceMesh(source: THREE.BufferGeometry): { vertices: PreviewVertex[]; faces: PreviewFace[] } {
  const positions = source.getAttribute('position');
  if (!positions) throw new Error('Subdivision preview requires a position attribute.');
  const uvAttribute = source.getAttribute('uv');
  const index = source.getIndex();
  const vertices: PreviewVertex[] = [];
  let ids: number[];

  if (index) {
    for (let i = 0; i < positions.count; i++) {
      vertices.push({
        p: [positions.getX(i), positions.getY(i), positions.getZ(i)],
        uv: uvAttribute ? [uvAttribute.getX(i), uvAttribute.getY(i)] : [0, 0],
      });
    }
    ids = Array.from(index.array);
  } else {
    // Weld duplicate non-indexed corners by position + UV, retaining UV seams.
    const lookup = new Map<string, number>();
    ids = [];
    for (let i = 0; i < positions.count; i++) {
      const p: Vec3 = [positions.getX(i), positions.getY(i), positions.getZ(i)];
      const uv: Vec2 = uvAttribute ? [uvAttribute.getX(i), uvAttribute.getY(i)] : [0, 0];
      const key = [...p, ...uv].map(value => Math.round(value * 100000)).join(':');
      let vertexIndex = lookup.get(key);
      if (vertexIndex === undefined) {
        vertexIndex = vertices.length;
        lookup.set(key, vertexIndex);
        vertices.push({ p, uv });
      }
      ids.push(vertexIndex);
    }
  }

  const faces: PreviewFace[] = [];
  for (let i = 0; i + 2 < ids.length; i += 3) faces.push({ v: [ids[i], ids[i + 1], ids[i + 2]] });
  return { vertices, faces };
}

function simpleSplit(vertices: PreviewVertex[], faces: PreviewFace[]): { vertices: PreviewVertex[]; faces: PreviewFace[] } {
  const nextVertices = vertices.slice();
  const midpoints = new Map<string, number>();
  const midpoint = (a: number, b: number) => {
    const key = edgeKey(a, b);
    const cached = midpoints.get(key);
    if (cached !== undefined) return cached;
    const va = vertices[a], vb = vertices[b];
    const index = nextVertices.length;
    nextVertices.push({ p: mix3(va.p, vb.p, 0.5), uv: mix2(va.uv, vb.uv, 0.5) });
    midpoints.set(key, index);
    return index;
  };
  const nextFaces: PreviewFace[] = [];
  for (const face of faces) {
    if (face.v.length !== 3) continue;
    const [a, b, c] = face.v;
    const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
    nextFaces.push({ v: [a, ab, ca] }, { v: [ab, b, bc] }, { v: [ca, bc, c] }, { v: [ab, bc, ca] });
  }
  return { vertices: nextVertices, faces: nextFaces };
}

function catmullClarkSplit(
  vertices: PreviewVertex[],
  faces: PreviewFace[],
  options: SubdivisionPreviewOptions,
): { vertices: PreviewVertex[]; faces: PreviewFace[] } {
  const facePoints = faces.map(face => {
    const faceVertices = face.v.map(index => vertices[index]);
    return {
      p: average3(faceVertices.map(v => v.p)),
      uv: average2(faceVertices.map(v => v.uv)),
    };
  });
  const faceNormals = faces.map(face => faceNormal(face, vertices));
  const edges = new Map<string, { a: number; b: number; faces: number[] }>();
  const incidentFaces = vertices.map(() => [] as number[]);
  const incidentEdges = vertices.map(() => [] as string[]);

  faces.forEach((face, faceIndex) => {
    face.v.forEach((vertexIndex, corner) => {
      incidentFaces[vertexIndex].push(faceIndex);
      const next = face.v[(corner + 1) % face.v.length];
      const key = edgeKey(vertexIndex, next);
      const edge = edges.get(key) || { a: Math.min(vertexIndex, next), b: Math.max(vertexIndex, next), faces: [] };
      edge.faces.push(faceIndex);
      edges.set(key, edge);
    });
  });
  edges.forEach((edge, key) => {
    incidentEdges[edge.a].push(key);
    incidentEdges[edge.b].push(key);
  });

  const sharpEdges = new Set<string>();
  const threshold = THREE.MathUtils.degToRad(Math.max(0, Math.min(180, options.sharpAngle)));
  edges.forEach((edge, key) => {
    if (edge.faces.length === 1) {
      if (options.boundary) sharpEdges.add(key);
      return;
    }
    if (edge.faces.length >= 2) {
      const dot = THREE.MathUtils.clamp(faceNormals[edge.faces[0]].dot(faceNormals[edge.faces[1]]), -1, 1);
      if (Math.acos(dot) >= threshold) sharpEdges.add(key);
    }
  });

  const edgePoints = new Map<string, PreviewVertex>();
  edges.forEach((edge, key) => {
    const a = vertices[edge.a], b = vertices[edge.b];
    const midpointVertex = { p: mix3(a.p, b.p, 0.5), uv: mix2(a.uv, b.uv, 0.5) };
    if (edge.faces.length !== 2 || sharpEdges.has(key)) {
      edgePoints.set(key, midpointVertex);
    } else {
      const adjacent = edge.faces.map(index => facePoints[index]);
      const smoothP = average3([a.p, b.p, adjacent[0].p, adjacent[1].p]);
      const smoothUV = average2([a.uv, b.uv, adjacent[0].uv, adjacent[1].uv]);
      edgePoints.set(key, {
        p: mix3(midpointVertex.p, smoothP, 0.5),
        uv: mix2(midpointVertex.uv, smoothUV, 0.5),
      });
    }
  });

  const nextVertices: PreviewVertex[] = [];
  const vertexIndices = vertices.map((vertex, index) => {
    const facesForVertex = incidentFaces[index];
    const edgesForVertex = incidentEdges[index];
    if (facesForVertex.length < 2 || edgesForVertex.length < 2) {
      const newIndex = nextVertices.length;
      nextVertices.push(vertex);
      return newIndex;
    }
    const fAverage = average3(facesForVertex.map(fi => facePoints[fi].p));
    const eAverage = average3(edgesForVertex.map(key => edgePoints.get(key)!.p));
    const n = facesForVertex.length;
    const smoothP: Vec3 = [
      (fAverage[0] + 2 * eAverage[0] + (n - 3) * vertex.p[0]) / n,
      (fAverage[1] + 2 * eAverage[1] + (n - 3) * vertex.p[1]) / n,
      (fAverage[2] + 2 * eAverage[2] + (n - 3) * vertex.p[2]) / n,
    ];
    const fUv = average2(facesForVertex.map(fi => facePoints[fi].uv));
    const eUv = average2(edgesForVertex.map(key => edgePoints.get(key)!.uv));
    const smoothUV: Vec2 = [
      (fUv[0] + 2 * eUv[0] + (n - 3) * vertex.uv[0]) / n,
      (fUv[1] + 2 * eUv[1] + (n - 3) * vertex.uv[1]) / n,
    ];
    const creaseNeighbors: number[] = [];
    for (const key of edgesForVertex) {
      if (sharpEdges.has(key)) {
        const edge = edges.get(key)!;
        creaseNeighbors.push(edge.a === index ? edge.b : edge.a);
      }
    }
    let resultP = smoothP;
    let resultUV = smoothUV;
    if (creaseNeighbors.length >= 2 && options.crease > 0) {
      const n1 = vertices[creaseNeighbors[0]];
      const n2 = vertices[creaseNeighbors[1]];
      const creaseP: Vec3 = [
        vertex.p[0] * 0.75 + (n1.p[0] + n2.p[0]) * 0.125,
        vertex.p[1] * 0.75 + (n1.p[1] + n2.p[1]) * 0.125,
        vertex.p[2] * 0.75 + (n1.p[2] + n2.p[2]) * 0.125,
      ];
      const creaseUV: Vec2 = [
        vertex.uv[0] * 0.75 + (n1.uv[0] + n2.uv[0]) * 0.125,
        vertex.uv[1] * 0.75 + (n1.uv[1] + n2.uv[1]) * 0.125,
      ];
      resultP = mix3(smoothP, creaseP, clamp01(options.crease));
      resultUV = mix2(smoothUV, creaseUV, clamp01(options.crease));
    }
    const newIndex = nextVertices.length;
    nextVertices.push({ p: resultP, uv: resultUV });
    return newIndex;
  });

  const edgeIndices = new Map<string, number>();
  edges.forEach((edge, key) => {
    edgeIndices.set(key, nextVertices.length);
    nextVertices.push(edgePoints.get(key)!);
  });
  const faceIndices = facePoints.map(point => {
    const index = nextVertices.length;
    nextVertices.push(point);
    return index;
  });

  const nextFaces: PreviewFace[] = [];
  faces.forEach((face, faceIndex) => {
    const center = faceIndices[faceIndex];
    face.v.forEach((vertex, corner) => {
      const next = face.v[(corner + 1) % face.v.length];
      const prev = face.v[(corner - 1 + face.v.length) % face.v.length];
      nextFaces.push({
        v: [
          vertexIndices[vertex],
          edgeIndices.get(edgeKey(vertex, next))!,
          center,
          edgeIndices.get(edgeKey(prev, vertex))!,
        ],
      });
    });
  });
  return { vertices: nextVertices, faces: nextFaces };
}

function buildGeometry(vertices: PreviewVertex[], faces: PreviewFace[], heightMap: HTMLCanvasElement | null, displacement: number): THREE.BufferGeometry {
  const indices: number[] = [];
  faces.forEach(face => {
    for (let i = 1; i < face.v.length - 1; i++) indices.push(face.v[0], face.v[i], face.v[i + 1]);
  });
  const positions = new Float32Array(vertices.length * 3);
  const uvs = new Float32Array(vertices.length * 2);
  vertices.forEach((vertex, index) => {
    positions.set(vertex.p, index * 3);
    uvs.set(vertex.uv, index * 2);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  if (heightMap && displacement !== 0) {
    const context = heightMap.getContext('2d');
    const uvAttribute = geometry.getAttribute('uv');
    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    if (context && uvAttribute && normalAttribute) {
      const image = context.getImageData(0, 0, heightMap.width, heightMap.height);
      const pixels = image.data;
      for (let i = 0; i < positionAttribute.count; i++) {
        const u = ((uvAttribute.getX(i) % 1) + 1) % 1;
        const v = ((uvAttribute.getY(i) % 1) + 1) % 1;
        const x = Math.min(heightMap.width - 1, Math.floor(u * (heightMap.width - 1)));
        const y = Math.min(heightMap.height - 1, Math.floor((1 - v) * (heightMap.height - 1)));
        const value = pixels[(y * heightMap.width + x) * 4] / 255;
        const amount = (value - 0.5) * displacement;
        positionAttribute.setXYZ(
          i,
          positionAttribute.getX(i) + normalAttribute.getX(i) * amount,
          positionAttribute.getY(i) + normalAttribute.getY(i) * amount,
          positionAttribute.getZ(i) + normalAttribute.getZ(i) * amount,
        );
      }
      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function buildCombinedHeightMap(layers: Layer[], resolution = 256): HTMLCanvasElement | null {
  const contributors = layers.filter(layer => layer.visible && !layer.isGroup && (!layer.groupId || layers.find(parent => parent.id === layer.groupId)?.visible !== false) && (layer.pbrSettings?.bumpOn ?? layer.channel === 'height'));
  if (contributors.length === 0) return null;
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const values = new Float32Array(resolution * resolution);
  for (const layer of contributors) {
    const pbr = layer.pbrSettings || ({} as any);
    const influence = clamp01((pbr.bumpInfluence ?? (layer.channel === 'height' ? 1 : 0)) * (layer.opacity ?? 100) / 100);
    if (influence <= 0) continue;
    const source = document.createElement('canvas');
    source.width = resolution;
    source.height = resolution;
    const sourceContext = source.getContext('2d');
    if (!sourceContext) continue;
    sourceContext.drawImage(layer.canvas, 0, 0, resolution, resolution);
    const pixels = sourceContext.getImageData(0, 0, resolution, resolution).data;
    const ramp = (pbr.bumpRamp?.length ? pbr.bumpRamp : [{ position: 0, height: 0 }, { position: 1, height: 1 }]).slice().sort((a: any, b: any) => a.position - b.position);
    const mapRamp = (v: number) => {
      if (v <= ramp[0].position) return ramp[0].height;
      if (v >= ramp[ramp.length - 1].position) return ramp[ramp.length - 1].height;
      for (let i = 0; i < ramp.length - 1; i++) {
        if (v >= ramp[i].position && v <= ramp[i + 1].position) {
          const t = (v - ramp[i].position) / Math.max(0.000001, ramp[i + 1].position - ramp[i].position);
          return ramp[i].height + (ramp[i + 1].height - ramp[i].height) * t;
        }
      }
      return v;
    };
    for (let i = 0; i < values.length; i++) {
      const offset = i * 4;
      const alpha = pixels[offset + 3] / 255;
      const luminance = (0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2]) / 255;
      values[i] = Math.min(1, values[i] + mapRamp(luminance) * influence * alpha);
    }
  }
  const image = context.createImageData(resolution, resolution);
  for (let i = 0; i < values.length; i++) {
    const value = Math.round(clamp01(values[i]) * 255);
    const offset = i * 4;
    image.data[offset] = image.data[offset + 1] = image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

export function createSubdivisionPreviewGeometry(
  source: THREE.BufferGeometry,
  options: SubdivisionPreviewOptions,
  heightMap: HTMLCanvasElement | null = null,
): THREE.BufferGeometry {
  if (!options.enabled || options.levels === 0) return source.clone();
  let { vertices, faces } = sourceMesh(source);
  for (let level = 0; level < options.levels; level++) {
    if (options.algorithm === 'simple') {
      const result = simpleSplit(vertices, faces);
      vertices = result.vertices;
      faces = result.faces;
    } else {
      const result = catmullClarkSplit(vertices, faces, options);
      vertices = result.vertices;
      faces = result.faces;
    }
  }
  return buildGeometry(vertices, faces, heightMap, options.displacement);
}
