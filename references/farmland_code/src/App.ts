import * as THREE from 'three';
import GUI from 'lil-gui';

import { SceneManager } from './core/SceneManager';
import { Sky } from './core/Sky';
import { Lighting } from './core/Lighting';
import { Terrain } from './world/terrain';
import { Farmland } from './world/Farmland';
import { FieldBoundary } from './world/FieldBoundary';
import { Strips } from './world/Strips';
import { Depot } from './world/Depot';
import { Obstacles } from './world/Obstacles';
import { Drone } from './entities/Drone';
import { Vegetation } from './world/Vegetation';
import { Crops } from './world/Crops';
import { Clouds } from './world/Clouds';
import { SeedParticles } from './effects/SeedParticles';
import { HUD } from './ui/HUD';
import { createFieldData, FIELD_WIDTH, FIELD_DEPTH } from './config/fieldConfig';

export class App {
  private sm: SceneManager;
  private sky: Sky;
  private lighting: Lighting;
  private terrain: Terrain;
  private strips: Strips;
  private crops!: Crops;
  private drone: Drone;
  private clouds!: Clouds;
  private seedParticles!: SeedParticles;
  private hud: HUD;
  private sun = { elevation: 34, azimuth: 135 };
  private emitter = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.sm = new SceneManager(container);
    const scene = this.sm.scene;

    // 天空 + 光照
    this.sky = new Sky(scene);
    this.lighting = new Lighting();
    scene.add(this.lighting.group);
    this.applySun();
    this.sky.updateEnvironment(this.sm.renderer);

    // 数据 + 地形
    const field = createFieldData();
    this.terrain = new Terrain({ furrowAngleDeg: field.stripAngleDeg });

    // 农田与场景对象
    const farmland = new Farmland(this.terrain, FIELD_WIDTH, FIELD_DEPTH);
    const boundary = new FieldBoundary(FIELD_WIDTH, FIELD_DEPTH);
    this.strips = new Strips(field.strips, field.stripWidth, this.terrain);
    const depot = new Depot(field.depot);
    const obstacles = new Obstacles(field.obstacles, this.terrain);
    scene.add(farmland.mesh, boundary.group, this.strips.group, depot.group, obstacles.group);

    // 环境植被 + 作物 + 云朵
    const vegetation = new Vegetation(FIELD_WIDTH, FIELD_DEPTH, field.depot);
    this.crops = new Crops(field.strips, field.stripWidth, this.terrain);
    this.clouds = new Clouds(12);
    scene.add(vegetation.group, this.crops.mesh, this.clouds.group);

    // 无人机:悬停在田块上方
    this.drone = new Drone();
    const dx = -20;
    const dz = 0;
    this.drone.setPose(
      new THREE.Vector3(dx, this.terrain.height(dx, dz) + field.drone.cruiseHeight, dz),
      0,
    );
    scene.add(this.drone.group);

    // 播种粒子(从无人机喷口下落)
    this.seedParticles = new SeedParticles(150, this.terrain);
    scene.add(this.seedParticles.mesh);

    // 演示:标记前 40% 航带为已播种,展示两态质感
    const seededCount = Math.floor(this.strips.total * 0.4);
    this.setSeededCount(seededCount);

    // HUD
    this.hud = new HUD();
    this.hud.update({
      battery: 0.72,
      seed: 0.55,
      route: 'P2 · 第 2 趟',
      served: this.strips.servedCount,
      total: this.strips.total,
    });

    this.setupGUI();
    this.animate();
  }

  private setSeededCount(n: number): void {
    for (let i = 0; i < this.strips.total; i++) {
      const seeded = i < n;
      this.strips.setSeeded(i, seeded);
      this.crops.setSeeded(i, seeded);
    }
  }

  private applySun(): void {
    const dir = this.sky.setSun(this.sun.elevation, this.sun.azimuth);
    this.lighting.setSunDirection(dir);
  }

  private setupGUI(): void {
    const gui = new GUI({ title: '场景参数' });

    const sun = gui.addFolder('太阳');
    sun.add(this.sun, 'elevation', 6, 85, 1).name('高度角').onChange(() => {
      this.applySun();
      this.sky.updateEnvironment(this.sm.renderer);
    });
    sun.add(this.sun, 'azimuth', 0, 360, 1).name('方位角').onChange(() => {
      this.applySun();
      this.sky.updateEnvironment(this.sm.renderer);
    });

    const render = gui.addFolder('渲染');
    const exposureProxy = { exposure: this.sm.renderer.toneMappingExposure };
    render.add(exposureProxy, 'exposure', 0.2, 1.5, 0.01).name('曝光').onChange((v: number) => {
      this.sm.renderer.toneMappingExposure = v;
    });

    const demo = gui.addFolder('播种演示');
    const demoProxy = { fraction: 0.4 };
    demo.add(demoProxy, 'fraction', 0, 1, 0.01).name('已播种比例').onChange((v: number) => {
      this.setSeededCount(Math.round(this.strips.total * v));
      this.hud.update({
        battery: 0.72,
        seed: 0.55,
        route: 'P2 · 第 2 趟',
        served: this.strips.servedCount,
        total: this.strips.total,
      });
    });

    gui.close();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const dt = this.sm.clock.getDelta();
    const elapsed = this.sm.clock.elapsedTime;
    this.drone.update(dt, elapsed);
    this.clouds.update(dt);
    this.emitter.copy(this.drone.group.position);
    this.emitter.y -= 0.8;
    this.seedParticles.update(dt, this.emitter);
    this.sm.render();
  };
}
