import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../app/routes";
import "./TopBar.css";

interface TopBarProps {
  /** 右侧状态位：当前场景名 / 算法模式 / 系统状态 */
  status?: string;
}

export default function TopBar({ status = "未加载场景" }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <NavLink to="/" className="topbar__brand" aria-label="返回首页">
          <svg
            className="topbar__mark"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="tbMark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--leaf)" />
                <stop offset="100%" stopColor="var(--seed-gold)" />
              </linearGradient>
            </defs>
            <rect
              x="1"
              y="1"
              width="20"
              height="20"
              rx="6"
              fill="url(#tbMark)"
              opacity="0.18"
            />
            <path
              d="M4.5 14.5 H17.5"
              stroke="var(--leaf-deep)"
              strokeWidth="1.3"
              strokeLinecap="round"
              className="topbar__mark-path"
            />
            <path
              d="M4.5 14.5 V8 H9.5 V11 H14 V6"
              stroke="var(--seed-gold-deep)"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray="2.4 2.4"
              className="topbar__mark-route"
            />
            <circle cx="4.5" cy="14.5" r="1.7" fill="var(--leaf-deep)" />
          </svg>
          <span className="topbar__name">空中农夫</span>
        </NavLink>

        <nav className="topbar__nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                "topbar__link" + (isActive ? " is-active" : "")
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="topbar__status mono" title="当前系统状态">
          <span className="topbar__dot" aria-hidden="true" />
          {status}
        </div>
      </div>
    </header>
  );
}