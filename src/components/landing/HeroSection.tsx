import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <span className="eyebrow reveal" style={{ animationDelay: "0.05s" }}>
            CARP · 无人机播种航线规划仿真系统
          </span>

          <h1 className="hero__title reveal" style={{ animationDelay: "0.12s" }}>
            空中农夫
          </h1>

          <p className="hero__subtitle reveal" style={{ animationDelay: "0.2s" }}>
            基于带容量约束弧路径问题的无人机播种航线规划仿真系统
          </p>

          <p className="hero__lead reveal" style={{ animationDelay: "0.28s" }}>
            把现实农田的播种任务抽象为 CARP 模型，在种箱容量、电池续航与障碍绕行约束下，
            用近似算法与启发式算法规划航线，并以三维仿真展示无人机的播种全过程。
          </p>

          <div className="hero__cta reveal" style={{ animationDelay: "0.36s" }}>
            <button className="btn-primary" onClick={() => navigate("/scene")}>
              进入系统 <span className="arrow">→</span>
            </button>
          </div>
        </div>

        <div className="hero__visual reveal" style={{ animationDelay: "0.3s" }}>
          <HeroFieldGraphic />
        </div>
      </div>

      <button
        type="button"
        className="hero__scroll"
        aria-label="向下滚动查看更多"
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
      >
        <span className="hero__arrow" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9 L12 15 L18 9" />
          </svg>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9 L12 15 L18 9" />
          </svg>
        </span>
      </button>
    </section>
  );
}

/** 装饰性 SVG：农田航带 + 补给点 + 一条规划航线，呼应主题 */
function HeroFieldGraphic() {
  const strips = Array.from({ length: 7 });
  return (
    <svg
      className="hero__svg"
      viewBox="0 0 320 320"
      role="img"
      aria-label="农田航带与无人机航线示意"
    >
      <defs>
        <linearGradient id="field" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c9a72" stopOpacity="0.28" />
          <stop offset="1" stopColor="#5a7d4f" stopOpacity="0.42" />
        </linearGradient>
      </defs>

      {/* 田块 */}
      <rect
        x="34"
        y="34"
        width="252"
        height="252"
        rx="10"
        fill="url(#field)"
        stroke="rgba(63,92,55,0.5)"
        strokeWidth="1.5"
      />

      {/* 航带 */}
      {strips.map((_, i) => {
        const y = 60 + i * 34;
        return (
          <line
            key={i}
            x1="50"
            y1={y}
            x2="270"
            y2={y}
            stroke="rgba(63,92,55,0.55)"
            strokeWidth="2"
            strokeDasharray="3 5"
          />
        );
      })}

      {/* 规划航线（蛇形服务路径） */}
      <path
        className="hero__route"
        d="M48 60 H272 V94 H48 V128 H272 V162 H48 V196 H272 V230 H48 V264"
        fill="none"
        stroke="#d9a441"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 补给点 depot */}
      <g>
        <circle cx="48" cy="288" r="11" fill="#8b6f47" />
        <circle cx="48" cy="288" r="11" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
        <text x="48" y="292" textAnchor="middle" fontSize="11" fill="#fff" fontFamily="monospace">v0</text>
      </g>

      {/* 无人机标记 */}
      <g className="hero__drone">
        <circle r="8" fill="#3f5c37" />
        <circle r="8" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
        <line x1="-12" y1="0" x2="12" y2="0" stroke="#3f5c37" strokeWidth="2" />
        <line x1="0" y1="-12" x2="0" y2="12" stroke="#3f5c37" strokeWidth="2" />
      </g>
    </svg>
  );
}
