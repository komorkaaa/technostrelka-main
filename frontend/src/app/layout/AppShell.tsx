import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { Button } from "@/shared/ui/Button";

function navCls({ isActive }: { isActive: boolean }) {
  return isActive ? "navLink active" : "navLink";
}

export function AppShell() {
  const { status, user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator";
  const isRegularUser = status === "authenticated" && !isAdmin && !isModerator;
  const homePath = isAdmin ? "/admin" : isModerator ? "/moderation" : "/";

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
          {isRegularUser && (
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
          {isModerator && (
            <NavLink to="/moderation" className={navCls}>
              Модерация
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navCls}>
              Админ-панель
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
