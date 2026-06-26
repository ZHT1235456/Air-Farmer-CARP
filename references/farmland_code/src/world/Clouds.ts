import * as THREE from 'three';
import { cloudTexture } from './foliageTextures';

/** 高空缓慢飘动的柔和云朵(始终朝向相机的 Sprite)。 */
export class Clouds {
  readonly group: THREE.Group;
  private speeds: number[] = [];
  private readonly bound = 480;

  constructor(count = 12) {
    this.group = new THREE.Group();
    const tex = cloudTexture();

    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.7 + Math.random() * 0.25,
        depthWrite: false,
        fog: false,
      });
      const sprite = new THREE.Sprite(mat);
      const w = 70 + Math.random() * 110;
      sprite.scale.set(w, w * 0.55, 1);
      sprite.position.set(
        (Math.random() * 2 - 1) * this.bound,
        90 + Math.random() * 90,
        (Math.random() * 2 - 1) * this.bound,
      );
      this.group.add(sprite);
      this.speeds.push(1.5 + Math.random() * 2.5);
    }
  }

  update(dt: number): void {
    for (let i = 0; i < this.group.children.length; i++) {
      const s = this.group.children[i];
      s.position.x += this.speeds[i] * dt;
      if (s.position.x > this.bound) s.position.x = -this.bound;
    }
  }
}
