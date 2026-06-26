import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Vec2 } from '../types';
import { GRASS_Y } from './FieldBoundary';
import { grassBladeTexture } from './foliageTextures';

const dummy = new THREE.Object3D();
const color = new THREE.Color();

/** 环境植被:环绕田块的树木、田边草丛、远处山丘。 */
export class Vegetation {
  readonly group: THREE.Group;
  private halfW: number;
  private halfD: number;
  private depot: Vec2;

  constructor(fieldWidth: number, fieldDepth: number, depot: Vec2) {
    this.group = new THREE.Group();
    this.halfW = fieldWidth / 2;
    this.halfD = fieldDepth / 2;
    this.depot = depot;

    this.group.add(this.makeTrees(44));
    this.group.add(this.makeGrassTufts(2600));
    this.group.add(this.makeHills(9));
  }

  private nearDepot(x: number, z: number, r: number): boolean {
    return Math.hypot(x - this.depot.x, z - this.depot.y) < r;
  }

  private makeTrees(count: number): THREE.Group {
    const g = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.9, 1.3, 1, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4326, roughness: 0.95 });
    const foliageGeo = new THREE.IcosahedronGeometry(1, 1);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const foliage = new THREE.InstancedMesh(foliageGeo, foliageMat, count);
    trunks.castShadow = true;
    foliage.castShadow = true;
    foliage.receiveShadow = true;

    for (let i = 0; i < count; i++) {
      let x = 0;
      let z = 0;
      do {
        const ang = Math.random() * Math.PI * 2;
        const rad = 84 + Math.random() * 150;
        x = Math.cos(ang) * rad;
        z = Math.sin(ang) * rad * 0.8;
      } while (this.nearDepot(x, z, 18));

      const trunkH = 2.6 + Math.random() * 3.6;
      const tr = 0.22 + Math.random() * 0.16;
      dummy.position.set(x, GRASS_Y + trunkH / 2, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(tr, trunkH, tr);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);

      const fr = 1.8 + Math.random() * 1.6;
      dummy.position.set(x, GRASS_Y + trunkH + fr * 0.5, z);
      dummy.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
      dummy.scale.set(fr, fr * (0.9 + Math.random() * 0.4), fr);
      dummy.updateMatrix();
      foliage.setMatrixAt(i, dummy.matrix);

      const h = 95 + Math.random() * 35;
      color.setHSL(h / 360, 0.42, 0.26 + Math.random() * 0.12);
      foliage.setColorAt(i, color);
    }
    trunks.instanceMatrix.needsUpdate = true;
    foliage.instanceMatrix.needsUpdate = true;
    if (foliage.instanceColor) foliage.instanceColor.needsUpdate = true;
    g.add(trunks, foliage);
    return g;
  }

  private makeGrassTufts(count: number): THREE.InstancedMesh {
    const plane = new THREE.PlaneGeometry(1, 1);
    plane.translate(0, 0.5, 0);
    const p1 = plane.clone();
    p1.rotateY(Math.PI / 3);
    const p2 = plane.clone();
    p2.rotateY((2 * Math.PI) / 3);
    const tuft = mergeGeometries([plane, p1, p2])!;

    const mat = new THREE.MeshStandardMaterial({
      map: grassBladeTexture(),
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 1,
    });
    const mesh = new THREE.InstancedMesh(tuft, mat, count);

    let placed = 0;
    let guard = 0;
    while (placed < count && guard < count * 12) {
      guard++;
      const x = (Math.random() * 2 - 1) * (this.halfW + 28);
      const z = (Math.random() * 2 - 1) * (this.halfD + 28);
      const inField = Math.abs(x) < this.halfW + 1 && Math.abs(z) < this.halfD + 1;
      if (inField || this.nearDepot(x, z, 6)) continue;

      const s = 0.6 + Math.random() * 0.8;
      dummy.position.set(x, GRASS_Y, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(s * (0.8 + Math.random() * 0.5), s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      color.setHSL((100 + Math.random() * 25) / 360, 0.5, 0.34 + Math.random() * 0.12);
      mesh.setColorAt(placed, color);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

  private makeHills(count: number): THREE.InstancedMesh {
    const geo = new THREE.IcosahedronGeometry(1, 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 260 + Math.random() * 200;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      const w = 60 + Math.random() * 80;
      const h = 22 + Math.random() * 26;
      dummy.position.set(x, GRASS_Y - h * 0.55, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(w, h, w * (0.8 + Math.random() * 0.5));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setHSL((110 + Math.random() * 20) / 360, 0.3, 0.32 + Math.random() * 0.08);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }
}
