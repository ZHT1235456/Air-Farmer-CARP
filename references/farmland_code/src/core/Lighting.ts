import * as THREE from 'three';

/** 太阳平行光(投影)+ 半球补光。太阳方向与天空模块同步。 */
export class Lighting {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly group: THREE.Group;
  private distance = 240;

  constructor() {
    this.group = new THREE.Group();

    this.hemi = new THREE.HemisphereLight(0xbcd6ff, 0x55452e, 0.55);
    this.group.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const cam = this.sun.shadow.camera;
    cam.left = -95;
    cam.right = 95;
    cam.top = 80;
    cam.bottom = -80;
    cam.near = 1;
    cam.far = 520;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.6;
    this.group.add(this.sun);
    this.group.add(this.sun.target);
  }

  /** 用归一化太阳方向更新平行光位置。 */
  setSunDirection(dir: THREE.Vector3): void {
    this.sun.position.copy(dir).multiplyScalar(this.distance);
    this.sun.target.position.set(0, 0, 0);
    this.sun.target.updateMatrixWorld();
  }
}
