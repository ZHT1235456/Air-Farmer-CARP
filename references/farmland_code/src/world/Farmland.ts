import * as THREE from 'three';
import { Terrain } from './terrain';
import { soilDetailTexture, soilBumpTexture } from './soilTexture';

const DAMP = new THREE.Color('#41301c'); // 沟底:湿润、深棕
const DRY = new THREE.Color('#9c7a48'); // 垄顶:干燥、浅棕

function hash2(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * 写实农田地面:高分段平面按 Terrain 高度场位移出垄沟与起伏,
 * 顶点色按垄沟相位/湿度斑块在湿暗与干浅之间过渡,
 * 叠加程序化细节贴图与凹凸贴图营造土壤质感。
 */
export class Farmland {
  readonly mesh: THREE.Mesh;
  readonly terrain: Terrain;

  constructor(terrain: Terrain, width: number, depth: number) {
    this.terrain = terrain;

    const segX = Math.max(2, Math.round(width / 0.5));
    const segZ = Math.max(2, Math.round(depth / 0.5));
    const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, terrain.height(x, z));

      const phase01 = terrain.furrowPhase(x, z) * 0.5 + 0.5; // 0 沟底 → 1 垄顶
      const moist = terrain.moisturePatch(x, z); // 0..1 湿度斑块
      const jitter = (hash2(x, z) - 0.5) * 0.12;
      let t = phase01 * (1 - 0.45 * moist) + jitter;
      t = Math.min(1, Math.max(0, t));
      c.copy(DAMP).lerp(DRY, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    pos.needsUpdate = true;
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const repeat = Math.round(width / 5);
    const detail = soilDetailTexture(repeat);
    const bump = soilBumpTexture(repeat);

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: detail,
      bumpMap: bump,
      bumpScale: 0.4,
      roughness: 0.97,
      metalness: 0.0,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'Farmland';
  }
}
