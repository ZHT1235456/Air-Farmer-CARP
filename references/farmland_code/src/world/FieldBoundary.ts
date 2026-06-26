import * as THREE from 'three';
import { grassTexture } from './soilTexture';

const GRASS_Y = -0.75; // 周边草地高度,低于田块所有点
export { GRASS_Y };

/** 周边草地 + 田埂围框 + 角桩栅栏,界定地块边界并遮挡接缝。 */
export class FieldBoundary {
  readonly group: THREE.Group;

  constructor(fieldWidth: number, fieldDepth: number) {
    this.group = new THREE.Group();

    // 周边草地
    const size = 1600;
    const grassGeo = new THREE.PlaneGeometry(size, size);
    grassGeo.rotateX(-Math.PI / 2);
    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTexture(Math.round(size / 6)),
      roughness: 1,
      metalness: 0,
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = GRASS_Y;
    grass.receiveShadow = true;
    this.group.add(grass);

    // 田埂围框
    const bw = 3;
    const h = 1.0;
    const midY = (GRASS_Y + 0.25) / 2;
    const bermMat = new THREE.MeshStandardMaterial({ color: 0x6f5c3e, roughness: 0.98 });
    const addBerm = (geo: THREE.BoxGeometry, x: number, z: number) => {
      const m = new THREE.Mesh(geo, bermMat);
      m.position.set(x, midY, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    };
    const sideGeo = new THREE.BoxGeometry(bw, h, fieldDepth + 2 * bw);
    const endGeo = new THREE.BoxGeometry(fieldWidth + 2 * bw, h, bw);
    addBerm(sideGeo, -fieldWidth / 2, 0);
    addBerm(sideGeo.clone(), fieldWidth / 2, 0);
    addBerm(endGeo, 0, -fieldDepth / 2);
    addBerm(endGeo.clone(), 0, fieldDepth / 2);

    // 角桩 + 顶部栏杆
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8a6b43, roughness: 0.9 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x9a7c52, roughness: 0.9 });
    const hw = fieldWidth / 2 + bw / 2;
    const hd = fieldDepth / 2 + bw / 2;
    const corners: [number, number][] = [
      [-hw, -hd],
      [hw, -hd],
      [hw, hd],
      [-hw, hd],
    ];
    const postGeo = new THREE.CylinderGeometry(0.14, 0.16, 1.8, 8);
    for (const [x, z] of corners) {
      const p = new THREE.Mesh(postGeo, postMat);
      p.position.set(x, 0.6, z);
      p.castShadow = true;
      this.group.add(p);
    }
    // 沿四边的顶部栏杆
    const railY = 1.2;
    const railH = 0.1;
    const railSide = new THREE.BoxGeometry(0.08, railH, fieldDepth + 2 * bw);
    const railEnd = new THREE.BoxGeometry(fieldWidth + 2 * bw, railH, 0.08);
    const rails: [THREE.BoxGeometry, number, number][] = [
      [railSide, -hw, 0],
      [railSide.clone(), hw, 0],
      [railEnd, 0, -hd],
      [railEnd.clone(), 0, hd],
    ];
    for (const [geo, x, z] of rails) {
      const r = new THREE.Mesh(geo, railMat);
      r.position.set(x, railY, z);
      r.castShadow = true;
      this.group.add(r);
    }
  }
}
