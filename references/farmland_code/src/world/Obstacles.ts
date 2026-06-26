import * as THREE from 'three';
import type { Obstacle } from '../types';
import { Terrain } from './terrain';

/** 障碍物与禁飞区:水塘、石块、半透明禁飞圆柱。 */
export class Obstacles {
  readonly group: THREE.Group;

  constructor(obstacles: Obstacle[], terrain: Terrain) {
    this.group = new THREE.Group();

    for (const o of obstacles) {
      const gy = terrain.height(o.center.x, o.center.y);
      if (o.kind === 'pond') this.group.add(this.makePond(o, gy));
      else if (o.kind === 'rock') this.group.add(this.makeRocks(o, gy));
      else this.group.add(this.makeNoFly(o, gy));
    }
  }

  private makePond(o: Obstacle, gy: number): THREE.Group {
    const g = new THREE.Group();
    g.position.set(o.center.x, 0, o.center.y);

    const rim = new THREE.Mesh(
      new THREE.RingGeometry(o.radius * 0.92, o.radius * 1.12, 48).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x3a2c1c, roughness: 1 }),
    );
    rim.position.y = gy - 0.05;
    rim.receiveShadow = true;

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(o.radius, 48).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x2f6f97,
        roughness: 0.12,
        metalness: 0.1,
        transparent: true,
        opacity: 0.92,
      }),
    );
    water.position.y = gy - 0.18;
    g.add(rim, water);
    return g;
  }

  private makeRocks(o: Obstacle, gy: number): THREE.Group {
    const g = new THREE.Group();
    g.position.set(o.center.x, gy, o.center.y);
    const mat = new THREE.MeshStandardMaterial({ color: 0x7d7a73, roughness: 0.95 });
    const count = 5;
    for (let i = 0; i < count; i++) {
      const r = o.radius * (0.25 + Math.random() * 0.35);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mat);
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * o.radius * 0.6;
      rock.position.set(Math.cos(ang) * dist, r * 0.4, Math.sin(ang) * dist);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.scale.y = 0.6;
      rock.castShadow = true;
      rock.receiveShadow = true;
      g.add(rock);
    }
    return g;
  }

  private makeNoFly(o: Obstacle, gy: number): THREE.Group {
    const g = new THREE.Group();
    g.position.set(o.center.x, 0, o.center.y);
    const height = 16;

    const zone = new THREE.Mesh(
      new THREE.CylinderGeometry(o.radius, o.radius, height, 40, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xe0533d,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    zone.position.y = gy + height / 2;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(o.radius * 0.9, o.radius, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xe0533d, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
    );
    ring.position.y = gy + 0.08;
    g.add(zone, ring);
    return g;
  }
}
