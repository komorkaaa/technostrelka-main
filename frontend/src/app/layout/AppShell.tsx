import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { Button } from "@/shared/ui/Button";

function navCls({ isActive }: { isActive: boolean }) {
  return isActive ? "navLink active" : "navLink";
}

export function AppShell() {
  const { status, user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          City Quests
        </Link>
        <nav className="nav">
          <NavLink to="/" className={navCls} end>
            Квесты
          </NavLink>
          <NavLink to="/leaderboard" className={navCls}>
            Рейтинг
          </NavLink>
          {status === "authenticated" && (
            <>
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
          {status === "authenticated" && user?.role === "moderator" && (
            <NavLink to="/moderation" className={navCls}>
              Модерация
            </NavLink>
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
              <Button onClick={logout}>Выйти</Button>
            </div>
          )}
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
