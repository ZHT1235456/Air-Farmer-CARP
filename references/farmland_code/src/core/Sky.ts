import * as THREE from 'three';
import { Sky as SkyMesh } from 'three/examples/jsm/objects/Sky.js';

/** 基于大气散射的写实天空 + 地平线雾;太阳方向供光照模块同步。 */
export class Sky {
  readonly mesh: SkyMesh;
  readonly sunDirection = new THREE.Vector3();
  private scene: THREE.Scene;
  private pmrem?: THREE.PMREMGenerator;
  private envRT?: THREE.WebGLRenderTarget;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.mesh = new SkyMesh();
    this.mesh.scale.setScalar(8000);

    const u = this.mesh.material.uniforms;
    u['turbidity'].value = 6;
    u['rayleigh'].value = 1.8;
    u['mieCoefficient'].value = 0.005;
    u['mieDirectionalG'].value = 0.8;

    scene.add(this.mesh);
    scene.fog = new THREE.Fog(0xcdd6cf, 160, 1100);

    this.setSun(34, 135);
  }

  /** 设置太阳的高度角与方位角(度),返回供平行光使用的太阳方向。 */
  setSun(elevationDeg: number, azimuthDeg: number): THREE.Vector3 {
    const phi = THREE.MathUtils.degToRad(90 - elevationDeg);
    const theta = THREE.MathUtils.degToRad(azimuthDeg);
    this.sunDirection.setFromSphericalCoords(1, phi, theta);
    this.mesh.material.uniforms['sunPosition'].value.copy(this.sunDirection);

    // 雾色随太阳高度略微变暖/变暗
    const warmth = THREE.MathUtils.clamp(elevationDeg / 60, 0.15, 1);
    (this.scene.fog as THREE.Fog).color.setRGB(
      0.78 * warmth + 0.1,
      0.82 * warmth + 0.1,
      0.78 * warmth + 0.12,
    );
    return this.sunDirection;
  }

  /** 用当前天空生成环境贴图,为 PBR 材质(水面/金属/无人机)提供基于图像的光照。 */
  updateEnvironment(renderer: THREE.WebGLRenderer): void {
    if (!this.pmrem) this.pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    this.scene.remove(this.mesh);
    envScene.add(this.mesh);
    if (this.envRT) this.envRT.dispose();
    this.envRT = this.pmrem.fromScene(envScene);
    envScene.remove(this.mesh);
    this.scene.add(this.mesh);
    this.scene.environment = this.envRT.texture;
  }
}
