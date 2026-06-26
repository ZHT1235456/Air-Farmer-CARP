import * as THREE from 'three';
import { Terrain } from '../world/terrain';

const dummy = new THREE.Object3D();
const GRAVITY = 9.8;

/** 无人机喷口下落的种子粒子,落地后回收复用,持续展示播种动作。 */
export class SeedParticles {
  readonly mesh: THREE.InstancedMesh;
  private pos: THREE.Vector3[] = [];
  private vel: THREE.Vector3[] = [];
  private terrain: Terrain;
  private emitter = new THREE.Vector3();

  constructor(count: number, terrain: Terrain) {
    this.terrain = terrain;
    const geo = new THREE.SphereGeometry(0.05, 6, 4);
    const mat = new THREE.MeshStandardMaterial({ color: 0xcDB672, roughness: 0.7, metalness: 0.05 });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.frustumCulled = false;

    for (let i = 0; i < count; i++) {
      this.pos.push(new THREE.Vector3());
      this.vel.push(new THREE.Vector3());
      this.respawn(i, true);
    }
  }

  private respawn(i: number, stagger: boolean): void {
    this.pos[i].copy(this.emitter);
    this.pos[i].x += (Math.random() - 0.5) * 0.5;
    this.pos[i].z += (Math.random() - 0.5) * 0.5;
    if (stagger) this.pos[i].y -= Math.random() * 8;
    this.vel[i].set(
      (Math.random() - 0.5) * 1.6,
      -1.5 - Math.random() * 1.8,
      (Math.random() - 0.5) * 1.6,
    );
  }

  /** emitter:当前播种喷口的世界位置。 */
  update(dt: number, emitter: THREE.Vector3): void {
    this.emitter.copy(emitter);
    const step = Math.min(dt, 0.05);
    for (let i = 0; i < this.pos.length; i++) {
      this.vel[i].y -= GRAVITY * step;
      this.pos[i].addScaledVector(this.vel[i], step);
      const ground = this.terrain.height(this.pos[i].x, this.pos[i].z) + 0.03;
      if (this.pos[i].y <= ground) this.respawn(i, false);
      dummy.position.copy(this.pos[i]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
