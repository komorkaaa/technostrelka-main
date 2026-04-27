import { useEffect, useState } from "react";
import type { ApiError } from "@/shared/api/types";
import { adminApi, type AdminQuestItem, type AdminUserItem } from "@/entities/admin/api";
import type { UserRole } from "@/entities/user/model";
import { useAuth } from "@/features/auth/model/useAuth";
import { useToast } from "@/shared/ui/Toast";
import { ApiErrorBox } from "@/shared/ui/ApiErrorBox";
import { Spinner } from "@/shared/ui/Spinner";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";

const ROLES: UserRole[] = ["user", "moderator", "admin"];

export function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [quests, setQuests] = useState<AdminQuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("moderator");
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, questsRes] = await Promise.all([adminApi.listUsers(), adminApi.listModerationQuests()]);
      setUsers(usersRes.items);
      setQuests(questsRes.items);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function createStaffUser() {
    setError(null);
    try {
      await adminApi.createUser({
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      setNewEmail("");
      setNewPassword("");
      setNewRole("moderator");
      await reload();
      toast.push({ kind: "success", message: "Пользователь создан." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function updateUserRole(targetUser: AdminUserItem, role: UserRole) {
    setError(null);
    try {
      await adminApi.setUserRole(targetUser.id, role);
      await reload();
      toast.push({ kind: "info", message: `Роль обновлена: ${targetUser.email} -> ${role}` });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function approveQuest(questId: number) {
    setError(null);
    try {
      await adminApi.approveQuest(questId);
      await reload();
      toast.push({ kind: "success", message: "Квест активирован и опубликован." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function rejectQuest(questId: number) {
    setError(null);
    try {
      await adminApi.rejectQuest(questId, rejectReason[questId] ?? "Отклонено администратором");
      await reload();
      toast.push({ kind: "info", message: "Квест отклонен." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  if (user?.role !== "admin") {
    return (
      <div className="card wide">
        <div className="cardHeader">
          <h1>Панель администратора</h1>
          <p className="muted">Нужны права администратора.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card wide">
      <div className="cardHeader">
        <h1>Панель администратора</h1>
        <p className="muted">Управление ролями и модерацией квестов.</p>
      </div>

      {error && <ApiErrorBox error={error} />}

      {loading ? (
        <div className="spinnerWrap" style={{ padding: 18 }}>
          <Spinner />
        </div>
      ) : (
        <div className="grid2">
          <div className="card" style={{ width: "100%" }}>
            <div className="cardHeader">
              <h1 style={{ fontSize: 18 }}>Пользователи и роли</h1>
            </div>
            <div className="form">
              <label className="label">
                Email нового пользователя
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="admin@example.com" />
              </label>
              <label className="label">
                Пароль
                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Минимум 6 символов" />
              </label>
              <label className="label">
                Роль
                <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </Select>
              </label>
              <Button onClick={createStaffUser}>Создать пользователя</Button>
            </div>
            <div className="form" style={{ gap: 10 }}>
              {users.map((u) => (
                <div key={u.id} className="card" style={{ width: "100%", padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 700 }}>{u.email}</div>
                    <span className="pill">{u.role}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    ID {u.id}{u.nickname ? `, ${u.nickname}` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {ROLES.map((role) => (
                      <Button
                        key={role}
                        variant={u.role === role ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => updateUserRole(u, role)}
                        disabled={u.role === role}
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ width: "100%" }}>
            <div className="cardHeader">
              <h1 style={{ fontSize: 18 }}>Квесты на проверке</h1>
            </div>
            <div className="form" style={{ gap: 10 }}>
              {quests.length === 0 ? (
                <div className="hint">Нет квестов в статусе moderation.</div>
              ) : (
                quests.map((q) => (
                  <div key={q.id} className="card" style={{ width: "100%", padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700 }}>{q.title}</div>
                      <span className="pill">{q.status}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      {q.city_area} • Сложность {q.difficulty} • {q.duration_minutes} мин
                    </div>
                    <label className="label" style={{ marginTop: 10 }}>
                      Причина отклонения
                      <Textarea
                        value={rejectReason[q.id] ?? ""}
                        onChange={(e) => setRejectReason((m) => ({ ...m, [q.id]: e.target.value }))}
                        placeholder="Причина..."
                      />
                    </label>
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      <Button onClick={() => approveQuest(q.id)}>Активировать</Button>
                      <Button variant="secondary" onClick={() => rejectQuest(q.id)}>
                        Отклонить
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
