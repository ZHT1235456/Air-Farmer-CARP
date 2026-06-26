import { Icon, type IconName } from "../common/icons";

interface FeatureItem {
  k: string;
  icon: IconName;
  title: string;
  desc: string;
}

const FEATURES: FeatureItem[] = [
  {
    k: "01",
    icon: "smart",
    title: "智慧农业",
    desc: "农业生产从机械化迈向智能化、自动化，无人机成为田间作业的新载体。",
  },
  {
    k: "02",
    icon: "drone",
    title: "无人机播种",
    desc: "无人机沿播种航带飞行完成播种，效率高、适应复杂地形。",
  },
  {
    k: "03",
    icon: "lowalt",
    title: "低空作业",
    desc: "在地块边界与安全高度内规划航线，兼顾覆盖率与飞行安全。",
  },
  {
    k: "04",
    icon: "obstacle",
    title: "农田障碍物",
    desc: "电线杆、架空线、树木与沟渠会切断航带，改变必服务边结构。",
  },
  {
    k: "05",
    icon: "refill",
    title: "返航补给",
    desc: "种箱与电池有限，需多次返回补给点补种、换电后继续作业。",
  },
];

export default function FeatureSection() {
  return (
    <section className="section" id="background">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Background · 项目背景</span>
          <h2 className="section__title">从田间到任务模型</h2>
          <p className="section__sub">
            真实播种任务受地块边界、障碍物、种箱容量与电池续航等现实约束的层层影响，需要系统性的航线优化。
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <article
              key={f.k}
              className="feature-card card reveal"
              style={{ animationDelay: `${0.05 + i * 0.06}s` }}
            >
              <div className="feature-card__top">
                <span className="feature-card__icon">
                  <Icon name={f.icon} size={18} />
                </span>
                <span className="feature-card__k mono">{f.k}</span>
              </div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
