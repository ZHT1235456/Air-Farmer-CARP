import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Strip } from '../types';
import { Terrain } from './terrain';
import { grassBladeTexture } from './foliageTextures';

const dummy = new THREE.Object3D();
const color = new THREE.Color();

interface Range {
  start: number;
  count: number;
}

/** 已播种航带上的作物幼苗:成行 InstancedMesh,随 setSeeded 显隐。 */
export class Crops {
  readonly mesh: THREE.InstancedMesh;
  private ranges = new Map<number, Range>();
  private posX: number[] = [];
  private posY: number[] = [];
  private posZ: number[] = [];
  private rotY: number[] = [];
  private scl: number[] = [];

  constructor(strips: Strip[], stripWidth: number, terrain: Terrain) {
    const ribbon = stripWidth * 0.84;
    const rows = [-0.3, 0, 0.3].map((f) => f * ribbon);

    // 预生成所有幼苗的变换
    for (const s of strips) {
      const cx = (s.start.x + s.end.x) / 2;
      const cz = (s.start.y + s.end.y) / 2;
      const len = s.length;
      const step = 1.6;
      const n = Math.max(1, Math.floor((len - 2) / step));
      const range: Range = { start: this.posX.length, count: 0 };
      for (let j = 0; j <= n; j++) {
        const along = -len / 2 + 1 + j * step;
        for (const r of rows) {
          const wx = cx + along + (Math.random() - 0.5) * 0.6;
          const wz = cz + r + (Math.random() - 0.5) * 0.5;
          this.posX.push(wx);
          this.posY.push(terrain.height(wx, wz) + 0.02);
          this.posZ.push(wz);
          this.rotY.push(Math.random() * Math.PI);
          this.scl.push(0.26 + Math.random() * 0.2);
          range.count++;
        }
      }
      this.ranges.set(s.id, range);
    }

    const total = this.posX.length;

    // 十字面片幼苗几何
    const plane = new THREE.PlaneGeometry(1, 1);
    plane.translate(0, 0.5, 0);
    const p1 = plane.clone();
    p1.rotateY(Math.PI / 2);
    const sprout = mergeGeometries([plane, p1])!;

    const mat = new THREE.MeshStandardMaterial({
      map: grassBladeTexture(),
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.9,
    });
    this.mesh = new THREE.InstancedMesh(sprout, mat, total);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;

    // 初始全部隐藏(缩放 0)
    for (let i = 0; i < total; i++) {
      dummy.position.set(this.posX[i], this.posY[i], this.posZ[i]);
      dummy.rotation.set(0, this.rotY[i], 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
      color.setHSL((105 + Math.random() * 20) / 360, 0.55, 0.34 + Math.random() * 0.1);
      this.mesh.setColorAt(i, color);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  /** 显隐某航带的幼苗。 */
  setSeeded(stripId: number, value: boolean): void {
    const range = this.ranges.get(stripId);
    if (!range) return;
    for (let k = 0; k < range.count; k++) {
      const i = range.start + k;
      const s = value ? this.scl[i] : 0;
      dummy.position.set(this.posX[i], this.posY[i], this.posZ[i]);
      dummy.rotation.set(0, this.rotY[i], 0);
      dummy.scale.set(s * 1.1, s, s * 1.1);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
