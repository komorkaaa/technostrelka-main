import { Link, NavLink, Outlet } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/model/useAuth";
import { Button } from "@/shared/ui/Button";

function navCls({ isActive }: { isActive: boolean }) {
  return isActive ? "navLink active" : "navLink";
}

function mobileNavCls({ isActive }: { isActive: boolean }) {
  return isActive ? "mobileNavItem active" : "mobileNavItem";
}

function Icon({ name }: { name: "quests" | "leaderboard" | "create" | "teams" | "profile" | "more" | "login" }) {
  const common = { className: "mobileNavIcon", "aria-hidden": true } as const;
  if (name === "quests") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M7 6.5h10M7 10h10M7 13.5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.5 3.75h11A2.75 2.75 0 0 1 20.25 6.5v11A2.75 2.75 0 0 1 17.5 20.25h-11A2.75 2.75 0 0 1 3.75 17.5v-11A2.75 2.75 0 0 1 6.5 3.75Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (name === "leaderboard") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M4.5 20h15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.5 19.5v-8.5h3v8.5M10.5 19.5V7.5h3v12M14.5 19.5v-6.5h3v6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "create") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.5 3.75h11A2.75 2.75 0 0 1 20.25 6.5v11A2.75 2.75 0 0 1 17.5 20.25h-11A2.75 2.75 0 0 1 3.75 17.5v-11A2.75 2.75 0 0 1 6.5 3.75Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (name === "teams") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path
          d="M8.5 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM16 11a2.6 2.6 0 1 1 0-5.2A2.6 2.6 0 0 1 16 11Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M4.75 19.25c.7-3.1 2.7-4.75 5.75-4.75s5.05 1.65 5.75 4.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M14.75 15.2c2.2.25 3.6 1.45 4.5 4.05"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (name === "profile") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20c.9-3.2 3.3-5 7-5s6.1 1.8 7 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "login") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M10.5 16.5 15 12l-4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 12H4.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12.5 4.75h6.75v14.5H12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <path d="M6 12h0M12 12h0M18 12h0" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function AppShell() {
  const { status, user, logout } = useAuth();
  const isModerator = user?.role === "moderator";
  const isAuthenticated = status === "authenticated";
  const homePath = "/";
  const [moreOpen, setMoreOpen] = useState(false);

  const moreItems = useMemo(() => {
    const items: { key: string; label: string; to?: string; onClick?: () => void }[] = [];
    items.push({ key: "status", label: "Статус", to: "/status" });
    if (isModerator) items.push({ key: "moderation", label: "Окно модератора", to: "/moderation" });
    if (isAuthenticated) items.push({ key: "logout", label: "Выйти", onClick: logout });
    return items;
  }, [isAuthenticated, isModerator, logout]);

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
      </header>
      <main className="content">
        <Outlet />
      </main>

      <nav className="mobileNav" aria-label="Навигация">
        {status !== "authenticated" ? (
          <>
            <NavLink to="/" className={mobileNavCls} end>
              <Icon name="quests" />
              <span className="mobileNavLabel">Квесты</span>
            </NavLink>
            <NavLink to="/leaderboard" className={mobileNavCls}>
              <Icon name="leaderboard" />
              <span className="mobileNavLabel">Рейтинг</span>
            </NavLink>
            <NavLink to="/login" className={mobileNavCls}>
              <Icon name="login" />
              <span className="mobileNavLabel">Вход</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" className={mobileNavCls} end>
              <Icon name="quests" />
              <span className="mobileNavLabel">Квесты</span>
            </NavLink>
            <NavLink to="/leaderboard" className={mobileNavCls}>
              <Icon name="leaderboard" />
              <span className="mobileNavLabel">Рейтинг</span>
            </NavLink>
            <NavLink to="/create" className={mobileNavCls}>
              <Icon name="create" />
              <span className="mobileNavLabel">Создать</span>
            </NavLink>
            <NavLink to="/teams" className={mobileNavCls}>
              <Icon name="teams" />
              <span className="mobileNavLabel">Команды</span>
            </NavLink>
            <button type="button" className="mobileNavItem" onClick={() => setMoreOpen(true)} aria-label="Ещё">
              <Icon name="more" />
              <span className="mobileNavLabel">Ещё</span>
            </button>
          </>
        )}
      </nav>

      {moreOpen && (
        <div className="modalOverlay" onClick={() => setMoreOpen(false)}>
          <div className="modalCard mobileSheet" onClick={(e) => e.stopPropagation()}>
            <div className="cardHeader">
              <div className="modalHeaderRow">
                <h1 style={{ fontSize: 18, margin: 0 }}>Меню</h1>
                <Button variant="secondary" size="sm" onClick={() => setMoreOpen(false)}>
                  Закрыть
                </Button>
              </div>
            </div>
            <div className="modalBody">
              <div className="mobileSheetGrid">
                <NavLink to="/profile" className="usersModalListItem" onClick={() => setMoreOpen(false)}>
                  <div style={{ fontWeight: 800 }}>Профиль</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Настройки, тема, выход
                  </div>
                </NavLink>
                {moreItems.map((item) =>
                  item.to ? (
                    <NavLink key={item.key} to={item.to} className="usersModalListItem" onClick={() => setMoreOpen(false)}>
                      <div style={{ fontWeight: 800 }}>{item.label}</div>
                    </NavLink>
                  ) : (
                    <button
                      key={item.key}
                      type="button"
                      className="usersModalListItem"
                      onClick={() => {
                        setMoreOpen(false);
                        item.onClick?.();
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{item.label}</div>
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
