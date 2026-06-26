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
        <NavLink to="/" className="topbar__brand">
          <span className="topbar__mark" aria-hidden="true" />
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
              {item.label}
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
