interface Capability {
  k: string;
  title: string;
  desc: string;
}

const CAPS: Capability[] = [
  { k: "场景", title: "农田场景预览", desc: "多种内置农田与障碍物，俯视查看航带划分与统计信息。" },
  { k: "航带", title: "航带自动生成", desc: "按播种幅宽生成平行航带，障碍物处切分为子航带。" },
  { k: "规划", title: "航线规划求解", desc: "Path Scanning / GA / MemeticGA / VNS 多算法生成航线。" },
  { k: "仿真", title: "三维播种仿真", desc: "Three.js 展示飞行、播种、返航补给的完整动画流程。" },
  { k: "对比", title: "算法指标对比", desc: "总航程、返航次数、覆盖率、运行时间多维度对比。" },
];

export default function CapabilitySection() {
  return (
    <section className="section section--tint" id="capability">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Capability · 系统能力</span>
          <h2 className="section__title">一条完整的展示链路</h2>
          <p className="section__sub">
            从农田结构到算法求解，再到三维仿真与指标对比，逐步呈现 CARP 的求解效果。
          </p>
        </div>

        <div className="cap-grid">
          {CAPS.map((c, i) => (
            <article
              key={c.title}
              className="cap-card card reveal"
              style={{ animationDelay: `${0.05 + i * 0.06}s` }}
            >
              <span className="cap-card__tag mono">{c.k}</span>
              <h3 className="cap-card__title">{c.title}</h3>
              <p className="cap-card__desc">{c.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
