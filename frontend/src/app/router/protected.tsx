import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { Spinner } from "@/shared/ui/Spinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="page">
        <Spinner label="Проверяем сессию…" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
