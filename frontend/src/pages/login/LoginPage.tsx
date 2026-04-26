import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import type { ApiError } from "@/shared/api/types";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const canSubmit = useMemo(() => email.trim() && password.trim() && !submitting, [email, password, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (e2) {
      setError(e2 as ApiError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <h1>Welcome back</h1>
          <p className="muted">Sign in to continue</p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Email
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="label">
            Password
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Your password"
            />
          </label>

          {error ? (
            <div className="errorBox">
              <div className="errorTitle">{error.code}</div>
              <div className="errorMsg">{error.message}</div>
            </div>
          ) : null}

          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="cardFooter">
          <span className="muted">No account?</span> <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

