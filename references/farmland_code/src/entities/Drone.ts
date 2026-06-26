import * as THREE from 'three';

const CARBON = new THREE.MeshStandardMaterial({ color: 0x202327, roughness: 0.55, metalness: 0.5 });
const SHELL = new THREE.MeshStandardMaterial({ color: 0x2c3137, roughness: 0.4, metalness: 0.4 });
const ACCENT = new THREE.MeshStandardMaterial({ color: 0xe0533d, roughness: 0.5, metalness: 0.3 });
const TANK = new THREE.MeshStandardMaterial({ color: 0xd8dde1, roughness: 0.45, metalness: 0.2 });
const BLADE = new THREE.MeshStandardMaterial({
  color: 0x15171a,
  roughness: 0.4,
  metalness: 0.3,
  transparent: true,
  opacity: 0.85,
  side: THREE.DoubleSide,
});

/** 由基本几何体拼装的四旋翼播种无人机。propellers 每帧旋转;setPose 供后续飞行接入。 */
export class Drone {
  readonly group: THREE.Group; // 外层:由 setPose 放置
  private craft: THREE.Group; // 内层:承载机体,做悬停浮动
  private props: THREE.Group[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.craft = new THREE.Group();
    this.group.add(this.craft);

    // 机身
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.36, 1.0), SHELL);
    body.castShadow = true;
    this.craft.add(body);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), SHELL);
    canopy.position.set(0.1, 0.18, 0);
    canopy.scale.set(1, 0.7, 0.9);
    canopy.castShadow = true;
    this.craft.add(canopy);

    // 前部相机云台
    const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), CARBON);
    gimbal.position.set(0.55, -0.18, 0);
    this.craft.add(gimbal);

    // 种子料斗 + 喷口
    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.55, 20), TANK);
    hopper.position.set(-0.05, -0.42, 0);
    hopper.castShadow = true;
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.28, 16), ACCENT);
    nozzle.position.set(-0.05, -0.78, 0);
    this.craft.add(hopper, nozzle);

    // 机臂 + 电机 + 螺旋桨
    const a = 1.05;
    const motors: [number, number][] = [
      [a, a],
      [a, -a],
      [-a, -a],
      [-a, a],
    ];
    for (let i = 0; i < motors.length; i++) {
      const [mx, mz] = motors[i];
      const armLen = Math.hypot(mx, mz);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.1, 0.16), CARBON);
      arm.position.set(mx / 2, -0.02, mz / 2);
      arm.rotation.y = -Math.atan2(mz, mx);
      arm.castShadow = true;
      this.craft.add(arm);

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.26, 16), CARBON);
      motor.position.set(mx, 0.08, mz);
      motor.castShadow = true;
      this.craft.add(motor);

      const propMount = new THREE.Group();
      propMount.position.set(mx, 0.24, mz);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.02, 0.16), BLADE);
      const blade2 = blade.clone();
      blade2.rotation.y = Math.PI / 2;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 10), CARBON);
      propMount.add(blade, blade2, hub);
      this.craft.add(propMount);
      this.props.push(propMount);
    }

    // 起落架
    const legMat = CARBON;
    for (const sx of [-1, 1]) {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.8), legMat);
      skid.position.set(sx * 0.5, -0.85, 0);
      skid.castShadow = true;
      this.craft.add(skid);
      for (const sz of [-0.6, 0.6]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), legMat);
        leg.position.set(sx * 0.5, -0.5, sz);
        leg.castShadow = true;
        this.craft.add(leg);
      }
    }
  }

  /** 放置无人机:位置 + 朝向(弧度,绕世界 Y)。 */
  setPose(position: THREE.Vector3, headingRad = 0): void {
    this.group.position.copy(position);
    this.group.rotation.y = headingRad;
  }

  /** 每帧更新:旋转螺旋桨 + 轻微悬停浮动。 */
  update(dt: number, elapsed: number): void {
    for (let i = 0; i < this.props.length; i++) {
      this.props[i].rotation.y += (i % 2 === 0 ? 1 : -1) * 42 * dt;
    }
    this.craft.position.y = Math.sin(elapsed * 2.2) * 0.06;
    this.craft.rotation.z = Math.sin(elapsed * 1.3) * 0.01;
  }
}
