import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/pages/login/LoginPage";
import { RegisterPage } from "@/pages/register/RegisterPage";
import { StatusPage } from "@/pages/status/StatusPage";
import { ProtectedRoute } from "@/app/router/protected";
import { AppShell } from "@/app/layout/AppShell";
import { QuestsPage } from "@/pages/quests/QuestsPage";
import { QuestDetailsPage } from "@/pages/quests/QuestDetailsPage";
import { QuestCreatePage } from "@/pages/create/QuestCreatePage";
import { TeamsPage } from "@/pages/teams/TeamsPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { LeaderboardPage } from "@/pages/leaderboard/LeaderboardPage";
import { ModerationPage } from "@/pages/moderation/ModerationPage";
import { RunPage } from "@/pages/runs/RunPage";
import { AdminPage } from "@/pages/admin/AdminPage";
import { useAuth } from "@/features/auth/model/useAuth";

function RoleAwarePublicPage({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();

  if (status === "authenticated" && user?.role === "moderator") {
    return <Navigate to="/moderation" replace />;
  }
  if (status === "authenticated" && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<AppShell />}>
          <Route path="/status" element={<StatusPage />} />
          <Route path="/" element={<RoleAwarePublicPage><QuestsPage /></RoleAwarePublicPage>} />
          <Route path="/quests/:id" element={<RoleAwarePublicPage><QuestDetailsPage /></RoleAwarePublicPage>} />
          <Route path="/leaderboard" element={<RoleAwarePublicPage><LeaderboardPage /></RoleAwarePublicPage>} />
          <Route
            path="/create"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <QuestCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <TeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moderation"
            element={
              <ProtectedRoute allowedRoles={["moderator"]} redirectTo="/">
                <ModerationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]} redirectTo="/">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/runs/:id"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <RunPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
