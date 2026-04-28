import { Link, NavLink, Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/model/useAuth";
import { Button } from "@/shared/ui/Button";

function navCls({ isActive }: { isActive: boolean }) {
  return isActive ? "navLink active" : "navLink";
}

function BurgerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="burgerIcon">
      <path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function AppShell() {
  const { status, user, logout } = useAuth();
  const isModerator = user?.role === "moderator";
  const isAuthenticated = status === "authenticated";
  const homePath = "/";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerItems = useMemo(() => {
    if (status !== "authenticated") {
      return [
        { key: "quests", label: "Квесты", to: "/" },
        { key: "leaderboard", label: "Рейтинг", to: "/leaderboard" },
        { key: "login", label: "Войти", to: "/login" },
        { key: "register", label: "Регистрация", to: "/register" },
      ];
    }
    const items = [
      { key: "quests", label: "Квесты", to: "/" },
      { key: "leaderboard", label: "Рейтинг", to: "/leaderboard" },
      { key: "create", label: "Создать квест", to: "/create" },
      { key: "teams", label: "Команды", to: "/teams" },
      { key: "profile", label: "Профиль", to: "/profile" },
    ];
    if (isModerator) items.push({ key: "moderation", label: "Окно модератора", to: "/moderation" });
    return items;
  }, [isModerator, status]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to={homePath}>
          City Quests
        </Link>
        <nav className="nav">
          {status !== "authenticated" && (
            <>
              <NavLink to="/" className={navCls} end>
                Квесты
              </NavLink>
              <NavLink to="/leaderboard" className={navCls}>
                Рейтинг
              </NavLink>
            </>
          )}
          {isAuthenticated && (
            <>
              <NavLink to="/" className={navCls} end>
                Квесты
              </NavLink>
              <NavLink to="/leaderboard" className={navCls}>
                Рейтинг
              </NavLink>
              <NavLink to="/create" className={navCls}>
                Создать
              </NavLink>
              <NavLink to="/teams" className={navCls}>
                Команды
              </NavLink>
              <NavLink to="/profile" className={navCls}>
                Профиль
              </NavLink>
            </>
          )}
        </nav>
        <div className="topbarRight">
          {status !== "authenticated" ? (
            <div className="row" style={{ padding: 0 }}>
              <Link to="/login">Войти</Link>
              <Link to="/register">Регистрация</Link>
            </div>
          ) : (
            <div className="row" style={{ padding: 0 }}>
              <div className="muted" style={{ fontSize: 13 }}>
                {user?.nickname ? user.nickname : user?.email}
              </div>
              {isModerator && (
                <Link to="/moderation">
                  <Button className="moderationButton">Окно модератора</Button>
                </Link>
              )}
              <Button onClick={logout}>Выйти</Button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="burgerButton"
          onClick={() => setDrawerOpen(true)}
          aria-label="Меню"
          title="Меню"
        >
          <BurgerIcon />
        </button>
      </header>
      <main className="content">
        <Outlet />
      </main>

      {drawerOpen && (
        <div className="drawerOverlay" onClick={() => setDrawerOpen(false)}>
          <aside className="drawerPanel" onClick={(e) => e.stopPropagation()} aria-label="Меню">
            <div className="drawerTop">
              <div className="drawerTitle">Меню</div>
              <button type="button" className="drawerClose" onClick={() => setDrawerOpen(false)} aria-label="Закрыть">
                ×
              </button>
            </div>

            {status === "authenticated" && (
              <div className="drawerUser">
                <div className="drawerUserName">{user?.nickname ? user.nickname : user?.email}</div>
                <div className="drawerUserRole muted">{user?.role}</div>
              </div>
            )}

            <nav className="drawerList" aria-label="Разделы">
              {drawerItems.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className="drawerItem"
                  onClick={() => setDrawerOpen(false)}
                  end={item.to === "/"}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {status === "authenticated" && (
              <div className="drawerBottom">
                <button
                  type="button"
                  className="drawerItem danger"
                  onClick={() => {
                    setDrawerOpen(false);
                    logout();
                  }}
                >
                  Выйти
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
