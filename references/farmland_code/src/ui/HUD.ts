export interface HudState {
  battery: number; // 0..1
  seed: number; // 0..1
  route: string;
  served: number;
  total: number;
}

/** 更新右上角 HUD 面板(电量/种箱/航线/覆盖率)。 */
export class HUD {
  private stat(name: string): HTMLElement | null {
    return document.querySelector(`[data-stat="${name}"]`);
  }
  private bar(name: string): HTMLElement | null {
    return document.querySelector(`[data-bar="${name}"]`);
  }

  update(s: HudState): void {
    const pct = (v: number) => `${Math.round(v * 100)}%`;
    const battery = this.stat('battery');
    if (battery) battery.textContent = pct(s.battery);
    const batteryBar = this.bar('battery');
    if (batteryBar) batteryBar.style.width = pct(s.battery);

    const seed = this.stat('seed');
    if (seed) seed.textContent = pct(s.seed);
    const seedBar = this.bar('seed');
    if (seedBar) seedBar.style.width = pct(s.seed);

    const route = this.stat('route');
    if (route) route.textContent = s.route;

    const served = this.stat('served');
    if (served) served.textContent = `${s.served} / ${s.total}`;

    const coverage = this.stat('coverage');
    if (coverage) coverage.textContent = s.total > 0 ? pct(s.served / s.total) : '0%';
  }
}
