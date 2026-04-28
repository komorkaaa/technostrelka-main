import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { Spinner } from "@/shared/ui/Spinner";
import type { UserRole } from "@/entities/user/model";

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/",
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}) {
  const { status, user } = useAuth();

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

  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role as UserRole))) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
