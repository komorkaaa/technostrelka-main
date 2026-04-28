import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import type { ApiError } from "@/shared/api/types";
import { ApiErrorBox } from "@/shared/ui/ApiErrorBox";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { useToast } from "@/shared/ui/Toast";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const canSubmit = useMemo(() => email.trim() && password.trim() && !submitting, [email, password, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(email.trim(), password);
      toast.push({ kind: "success", message: "Аккаунт создан. Добро пожаловать!" });
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
        <div className="cardHeader authCardHeader">
          <div>
            <h1>Регистрация</h1>
            <p className="muted">После регистрации вы автоматически войдёте</p>
          </div>
          <ThemeToggle className="themeToggleCompact" />
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Email
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="label">
            Пароль
            <div className="passwordField">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Минимум 6 символов"
                className="passwordInput"
              />
              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                title={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                <svg className="passwordToggleIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  {showPassword && (
                    <path d="M4 4 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  )}
                </svg>
              </button>
            </div>
          </label>

          {error ? <ApiErrorBox error={error} /> : null}

          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Создаём..." : "Создать аккаунт"}
          </Button>
        </form>

        <div className="cardFooter">
          <span className="muted">Уже есть аккаунт?</span> <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  );
}
