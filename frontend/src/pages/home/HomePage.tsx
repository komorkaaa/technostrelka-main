import { useAuth } from "@/features/auth/model/useAuth";
import { Button } from "@/shared/ui/Button";

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <div className="card wide">
        <div className="cardHeader">
          <h1>Dashboard</h1>
          <p className="muted">You are signed in</p>
        </div>
        <div className="row">
          <div>
            <div className="muted">User</div>
            <div className="mono">{user?.email}</div>
          </div>
          <Button onClick={logout}>Log out</Button>
        </div>
        <div className="hint">
          API docs: <a href="http://127.0.0.1:8000/docs">/docs</a>
        </div>
      </div>
    </div>
  );
}

