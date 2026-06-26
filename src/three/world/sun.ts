import * as THREE from "three";

/** 太阳高度角 / 方位角（度）——与参考一致 */
export const SUN_ELEVATION_DEG = 34;
export const SUN_AZIMUTH_DEG = 135;

/** 太阳方向单位向量（three 空间） */
export function getSunDir(): THREE.Vector3 {
  const el = (SUN_ELEVATION_DEG * Math.PI) / 180;
  const az = (SUN_AZIMUTH_DEG * Math.PI) / 180;
  const h = Math.cos(el);
  return new THREE.Vector3(h * Math.cos(az), Math.sin(el), h * Math.sin(az)).normalize();
}
