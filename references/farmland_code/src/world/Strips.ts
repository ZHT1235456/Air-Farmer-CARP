import * as THREE from 'three';
import type { Strip } from '../types';
import { Terrain } from './terrain';

const OFFSET = 0.06; // 航带高于土壤,避免 z-fighting

/** 播种航带:贴合地形的细长条带,支持"待播/已播种"两态。 */
export class Strips {
  readonly group: THREE.Group;
  private meshes = new Map<number, THREE.Mesh>();
  private seeded = new Set<number>();
  private unseededMat: THREE.MeshStandardMaterial;
  private seededMat: THREE.MeshStandardMaterial;
  readonly total: number;

  constructor(strips: Strip[], stripWidth: number, terrain: Terrain) {
    this.group = new THREE.Group();
    this.total = strips.length;

    this.unseededMat = new THREE.MeshStandardMaterial({
      color: 0xc9a86b,
      roughness: 0.92,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.seededMat = new THREE.MeshStandardMaterial({
      color: 0x5b9d3e,
      roughness: 0.82,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const ribbonWidth = stripWidth * 0.84;
    for (const s of strips) {
      const length = s.length;
      const cx = (s.start.x + s.end.x) / 2;
      const cz = (s.start.y + s.end.y) / 2; // 田块 y → 世界 z
      const lenSeg = Math.min(220, Math.max(6, Math.round(length / 2)));

      const geo = new THREE.PlaneGeometry(length, ribbonWidth, lenSeg, 3);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const wx = cx + pos.getX(i);
        const wz = cz + pos.getZ(i);
        pos.setX(i, wx);
        pos.setZ(i, wz);
        pos.setY(i, terrain.height(wx, wz) + OFFSET);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, this.unseededMat);
      mesh.receiveShadow = true;
      mesh.name = `strip-${s.id}`;
      this.meshes.set(s.id, mesh);
      this.group.add(mesh);
    }
  }

  /** 标记某航带是否已播种(供后续飞行动画调用)。 */
  setSeeded(id: number, value: boolean): void {
    const mesh = this.meshes.get(id);
    if (!mesh) return;
    mesh.material = value ? this.seededMat : this.unseededMat;
    if (value) this.seeded.add(id);
    else this.seeded.delete(id);
  }

  get servedCount(): number {
    return this.seeded.size;
  }
}
