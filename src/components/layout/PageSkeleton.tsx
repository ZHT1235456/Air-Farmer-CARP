import "./PageSkeleton.css";

/**
 * 田园风骨架屏：作为路由 lazy 分包的 Suspense fallback。
 * 呈现三栏工作台骨架（左控制栏 / 中视口渐变 / 右信息栏），
 * 较暗页用简单 hero 骨架——任由其滚动到顶部即可。
 */
export default function PageSkeleton() {
  return (
    <div className="ps" aria-hidden="true" aria-busy="true">
      <div className="ps__bar" />
      <div className="ps__ws">
        <aside className="ps__side ps__side--l">
          <div className="ps__head" />
          <div className="ps__group">
            <div className="ps__eyebrow" />
            <div className="ps__card" />
            <div className="ps__card" />
            <div className="ps__card ps__card--sm" />
          </div>
          <div className="ps__group">
            <div className="ps__eyebrow" />
            <div className="ps__card" />
          </div>
        </aside>

        <section className="ps__stage">
          <div className="ps__viewport">
            <span className="ps__viewport-tag mono">正在装载田块…</span>
          </div>
        </section>

        <aside className="ps__side ps__side--r">
          <div className="ps__head" />
          <div className="ps__group">
            <div className="ps__eyebrow" />
            <div className="ps__card" />
            <div className="ps__card ps__card--sm" />
            <div className="ps__card ps__card--sm" />
          </div>
        </aside>
      </div>
    </div>
  );
}