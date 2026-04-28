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

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<AppShell />}>
          <Route path="/status" element={<StatusPage />} />
          <Route path="/" element={<QuestsPage />} />
          <Route path="/quests/:id" element={<QuestDetailsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route
            path="/create"
            element={
              <ProtectedRoute allowedRoles={["user", "moderator"]}>
                <QuestCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute allowedRoles={["user", "moderator"]}>
                <TeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["user", "moderator"]}>
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
            path="/runs/:id"
            element={
              <ProtectedRoute allowedRoles={["user", "moderator"]}>
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
