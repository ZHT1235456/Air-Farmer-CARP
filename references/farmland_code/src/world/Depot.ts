import * as THREE from 'three';
import type { Vec2 } from '../types';
import { GRASS_Y } from './FieldBoundary';

/** 起降补给点:停机坪 + 种子料仓 + 标志杆,位于田块外的草地上。 */
export class Depot {
  readonly group: THREE.Group;
  readonly landingPosition = new THREE.Vector3();

  constructor(depot: Vec2) {
    this.group = new THREE.Group();
    this.group.position.set(depot.x, GRASS_Y, depot.y);

    // 停机坪
    const padGeo = new THREE.CylinderGeometry(4, 4.2, 0.25, 40);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x33373c, roughness: 0.85 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.125;
    pad.receiveShadow = true;
    pad.castShadow = true;
    this.group.add(pad);
    const padTop = 0.25;

    // 白色圆环
    const ringGeo = new THREE.RingGeometry(3.3, 3.7, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0xf2f2f2,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const ring = new THREE.Mesh(ringGeo, lineMat);
    ring.position.y = padTop + 0.01;
    this.group.add(ring);

    // "H" 标志
    const barGeo = new THREE.BoxGeometry(0.4, 0.05, 2.6);
    const left = new THREE.Mesh(barGeo, lineMat);
    left.position.set(-1, padTop + 0.03, 0);
    const right = new THREE.Mesh(barGeo.clone(), lineMat);
    right.position.set(1, padTop + 0.03, 0);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 0.4), lineMat);
    cross.position.set(0, padTop + 0.03, 0);
    this.group.add(left, right, cross);

    // 种子料仓
    const silo = new THREE.Group();
    silo.position.set(6.5, 0, -1);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xb9c2c8, roughness: 0.5, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3.2, 24), bodyMat);
    body.position.y = 1.6 + 1.0;
    body.castShadow = true;
    const hopper = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 24), bodyMat);
    hopper.position.y = 1.0 + 0.3;
    hopper.rotation.x = Math.PI;
    hopper.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.0, 24), new THREE.MeshStandardMaterial({ color: 0x8a949b, roughness: 0.6, metalness: 0.3 }));
    roof.position.y = 1.6 + 1.0 + 1.6 + 0.5;
    roof.castShadow = true;
    const legMat = new THREE.MeshStandardMaterial({ color: 0x6b7177, roughness: 0.7, metalness: 0.3 });
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), legMat);
      leg.position.set(Math.cos(ang) * 1.1, 1.1, Math.sin(ang) * 1.1);
      leg.castShadow = true;
      silo.add(leg);
    }
    silo.add(body, hopper, roof);
    this.group.add(silo);

    // 标志杆 + 旗
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 5, 8),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.5 }),
    );
    pole.position.set(-4, 2.5, -2);
    pole.castShadow = true;
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xe0533d, roughness: 0.7, side: THREE.DoubleSide }),
    );
    flag.position.set(-4 + 0.8, 4.4, -2);
    this.group.add(pole, flag);

    // 无人机起飞点(停机坪中心上方)
    this.landingPosition.set(depot.x, GRASS_Y + padTop, depot.y);
  }
}
