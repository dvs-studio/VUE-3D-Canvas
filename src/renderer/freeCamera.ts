/**
 * Camera tumble with no polar clamp and no gimbal lock.
 * Orientation is a quaternion. Mouse axes are the camera's own up and right,
 * so the view can roll past the old top and bottom stops.
 */
import * as THREE from 'three';

export interface FreeOrbit {
  radius: number;
  target: THREE.Vector3;
  quat: THREE.Quaternion;
}

export function quatFromSpherical(theta: number, phi: number): THREE.Quaternion {
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const eye = new THREE.Vector3(sinPhi * Math.sin(theta), cosPhi, sinPhi * Math.cos(theta));
  if (eye.lengthSq() < 1e-12) eye.set(0, 1, 0);
  const up = new THREE.Vector3(-cosPhi * Math.sin(theta), sinPhi, -cosPhi * Math.cos(theta));
  if (up.lengthSq() < 1e-8) up.set(0, 0, -1);
  else up.normalize();
  const cam = new THREE.PerspectiveCamera();
  cam.position.copy(eye);
  cam.up.copy(up);
  cam.lookAt(0, 0, 0);
  return cam.quaternion.clone();
}

export function applyFreeCamera(camera: THREE.Camera, orbit: FreeOrbit, zoom = 1): void {
  const distance = Math.max(orbit.radius, 1e-6) / Math.max(zoom, 1e-6);
  const offset = new THREE.Vector3(0, 0, distance).applyQuaternion(orbit.quat);
  camera.position.copy(orbit.target).add(offset);
  camera.quaternion.copy(orbit.quat);
  camera.updateMatrixWorld();
}

/** Screen-space tumble. dx and dy are pixels. There is no angle clamp. */
export function tumbleFreeCamera(orbit: FreeOrbit, dx: number, dy: number, speed: number): void {
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(orbit.quat);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(orbit.quat);
  const pitch = new THREE.Quaternion().setFromAxisAngle(right, dy * speed);
  const yaw = new THREE.Quaternion().setFromAxisAngle(up, dx * speed);
  orbit.quat.premultiply(pitch);
  orbit.quat.premultiply(yaw);
  orbit.quat.normalize();
}

export function yawAroundWorldUp(orbit: FreeOrbit, angle: number): void {
  orbit.quat.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle));
  orbit.quat.normalize();
}

export function gizmoAngles(quat: THREE.Quaternion): { x: number; y: number } {
  const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(quat).normalize();
  const phi = Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1));
  const theta = Math.atan2(dir.x, dir.z);
  return { x: phi - Math.PI / 2, y: -theta };
}
