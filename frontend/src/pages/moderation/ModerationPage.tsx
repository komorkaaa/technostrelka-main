import { useEffect, useState } from "react";
import type { ApiError } from "@/shared/api/types";
import { moderationApi, type ModerationQuestItem, type ComplaintItem } from "@/entities/moderation/api";
import { adminApi, type AdminUserItem } from "@/entities/admin/api";
import type { UserRole } from "@/entities/user/model";
import { Spinner } from "@/shared/ui/Spinner";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { useAuth } from "@/features/auth/model/useAuth";
import { ApiErrorBox } from "@/shared/ui/ApiErrorBox";
import { useToast } from "@/shared/ui/Toast";

function complaintStatusLabel(s: string) {
  if (s === "new") return "новая";
  if (s === "handled") return "обработана";
  return s;
}

export function ModerationPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [quests, setQuests] = useState<ModerationQuestItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("moderator");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [u, q, c] = await Promise.all([
        adminApi.listUsers(),
        moderationApi.listQuests(),
        moderationApi.listComplaints(),
      ]);
      setUsers(u.items);
      setQuests(q.items);
      setComplaints(c.items);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function approve(id: number) {
    setError(null);
    try {
      await moderationApi.approveQuest(id);
      await reload();
      toast.push({ kind: "success", message: "Квест опубликован." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function reject(id: number) {
    setError(null);
    try {
      await moderationApi.rejectQuest(id, rejectReason[id] ?? "Небезопасно / некачественно");
      await reload();
      toast.push({ kind: "info", message: "Квест отклонён." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function resolveComplaint(id: number) {
    setError(null);
    try {
      await moderationApi.resolveComplaint(id);
      await reload();
      toast.push({ kind: "success", message: "Жалоба помечена обработанной." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

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

  if (user?.role !== "moderator") {
    return (
      <div className="card wide">
        <div className="cardHeader">
          <h1>Модерация</h1>
          <p className="muted">Нужны права модератора.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card wide">
      <div className="cardHeader">
        <h1>Модерация</h1>
        <p className="muted">Проверка квестов и обработка жалоб.</p>
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
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
              </label>
              <label className="label">
                Пароль
                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Минимум 6 символов" />
              </label>
              <label className="label">
                Роль
                <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                  <option value="moderator">moderator</option>
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
                    ID {u.id}
                    {u.nickname ? `, ${u.nickname}` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {(["user", "moderator"] as UserRole[]).map((role) => (
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
              <h1 style={{ fontSize: 18 }}>Квесты на модерации</h1>
            </div>
            <div className="form" style={{ gap: 10 }}>
              {quests.length === 0 ? (
                <div className="hint">Нет квестов на проверку.</div>
              ) : (
                quests.map((q) => (
                  <div key={q.id} className="card" style={{ width: "100%", padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 750, minWidth: 0, overflowWrap: "anywhere" }}>{q.title}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span className="pill">{q.city_area}</span>
                        <span className="pill">Сложность {q.difficulty}</span>
                        <span className="pill">{q.duration_minutes} мин</span>
                      </div>
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                      {q.description}
                    </div>
                    <label className="label" style={{ marginTop: 10 }}>
                      Причина отклонения
                      <Textarea
                        value={rejectReason[q.id] ?? ""}
                        onChange={(e) => setRejectReason((m) => ({ ...m, [q.id]: e.target.value }))}
                        placeholder="Причина…"
                      />
                    </label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Button onClick={() => approve(q.id)}>Опубликовать</Button>
                      <Button className="btn secondary" onClick={() => reject(q.id)}>
                        Отклонить
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card" style={{ width: "100%" }}>
            <div className="cardHeader">
              <h1 style={{ fontSize: 18 }}>Жалобы</h1>
            </div>
            <div className="form" style={{ gap: 10 }}>
              {complaints.length === 0 ? (
                <div className="hint">Жалоб нет.</div>
              ) : (
                complaints.map((c) => (
                  <div key={c.id} className="card" style={{ width: "100%", padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 750 }}>#{c.id}</div>
                      <span className="pill">{complaintStatusLabel(c.status)}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                      {c.reason}
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                      Объект: {c.quest_id ? `квест ${c.quest_id}` : `точка ${c.checkpoint_id}`}
                    </div>
                    {c.status !== "handled" && (
                      <Button className="btn secondary" onClick={() => resolveComplaint(c.id)}>
                        Пометить обработанной
                      </Button>
                    )}
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
