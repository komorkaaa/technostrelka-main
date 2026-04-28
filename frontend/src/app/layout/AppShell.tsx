import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { Button } from "@/shared/ui/Button";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

function navCls({ isActive }: { isActive: boolean }) {
  return isActive ? "navLink active" : "navLink";
}

function mobileNavCls({ isActive }: { isActive: boolean }) {
  return isActive ? "mobileNavItem active" : "mobileNavItem";
}

export function AppShell() {
  const { status, user, logout } = useAuth();
  const isModerator = user?.role === "moderator";
  const isAuthenticated = status === "authenticated";
  const homePath = "/";

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
              <ThemeToggle className="themeToggleCompact" />
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
              <ThemeToggle className="themeToggleCompact" />
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
              <span className="mobileNavLabel">Квесты</span>
            </NavLink>
            <NavLink to="/leaderboard" className={mobileNavCls}>
              <span className="mobileNavLabel">Рейтинг</span>
            </NavLink>
            <NavLink to="/login" className={mobileNavCls}>
              <span className="mobileNavLabel">Войти</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" className={mobileNavCls} end>
              <span className="mobileNavLabel">Квесты</span>
            </NavLink>
            <NavLink to="/leaderboard" className={mobileNavCls}>
              <span className="mobileNavLabel">Рейтинг</span>
            </NavLink>
            <NavLink to="/create" className={mobileNavCls}>
              <span className="mobileNavLabel">Создать</span>
            </NavLink>
            <NavLink to="/teams" className={mobileNavCls}>
              <span className="mobileNavLabel">Команды</span>
            </NavLink>
            <NavLink to="/profile" className={mobileNavCls}>
              <span className="mobileNavLabel">Профиль</span>
            </NavLink>
            {isModerator && (
              <NavLink to="/moderation" className={mobileNavCls}>
                <span className="mobileNavLabel">Модер.</span>
              </NavLink>
            )}
          </>
        )}
      </nav>
    </div>
  );
}
