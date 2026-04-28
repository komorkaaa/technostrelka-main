import { useEffect, useMemo, useState } from "react";
import type { ApiError } from "@/shared/api/types";
import { moderationApi, type ComplaintItem, type ModerationQuestDetails, type ModerationQuestItem } from "@/entities/moderation/api";
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
import { UsersModerationModal } from "@/pages/moderation/UsersModerationModal";
import { QuestsModerationModal } from "@/pages/moderation/QuestsModerationModal";

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
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [usersModalInitialUserId, setUsersModalInitialUserId] = useState<number | null>(null);

  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("moderator");

  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);
  const [questDetails, setQuestDetails] = useState<ModerationQuestDetails | null>(null);
  const [questEditTitle, setQuestEditTitle] = useState("");
  const [questEditDescription, setQuestEditDescription] = useState("");
  const [questEditCityArea, setQuestEditCityArea] = useState("");
  const [questEditDifficulty, setQuestEditDifficulty] = useState("3");
  const [questEditDuration, setQuestEditDuration] = useState("60");
  const [questEditRules, setQuestEditRules] = useState("");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [u, q, c] = await Promise.all([adminApi.listUsers(), moderationApi.listQuests(), moderationApi.listComplaints()]);
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

  async function loadQuestDetails(id: number) {
    setError(null);
    try {
      const quest = await moderationApi.getQuest(id);
      setSelectedQuestId(id);
      setQuestDetails(quest);
      setQuestEditTitle(quest.title);
      setQuestEditDescription(quest.description);
      setQuestEditCityArea(quest.city_area);
      setQuestEditDifficulty(String(quest.difficulty));
      setQuestEditDuration(String(quest.duration_minutes));
      setQuestEditRules(quest.rules ?? "");
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function saveQuestDetails() {
    if (!selectedQuestId) return;
    setError(null);
    try {
      await moderationApi.updateQuest(selectedQuestId, {
        title: questEditTitle.trim(),
        description: questEditDescription.trim(),
        city_area: questEditCityArea.trim(),
        difficulty: Number(questEditDifficulty),
        duration_minutes: Number(questEditDuration),
        rules: questEditRules.trim() ? questEditRules.trim() : null,
      });
      await Promise.all([reload(), loadQuestDetails(selectedQuestId)]);
      toast.push({ kind: "success", message: "Данные квеста обновлены." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function approve(id: number) {
    setError(null);
    try {
      await moderationApi.approveQuest(id);
      await reload();
      if (selectedQuestId === id) {
        setSelectedQuestId(null);
      }
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
      if (selectedQuestId === id) {
        setSelectedQuestId(null);
      }
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

  async function hideByComplaints(questId: number) {
    setError(null);
    try {
      await moderationApi.hideQuest(questId);
      await reload();
      toast.push({ kind: "info", message: `Квест ${questId} скрыт.` });
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

  async function saveUserFromUsersModal(
    userId: number,
    payload: { nickname: string | null; age_group: "14-15" | "16-17" | null; role: UserRole },
  ) {
    setError(null);
    try {
      await adminApi.updateUser(userId, payload);
      await reload();
      toast.push({ kind: "success", message: "Пользователь обновлён." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  const complaintQuestStats = useMemo(() => {
    const stats = new Map<number, number>();
    for (const c of complaints) {
      if (!c.quest_id || c.status === "handled") continue;
      stats.set(c.quest_id, (stats.get(c.quest_id) ?? 0) + 1);
    }
    return Array.from(stats.entries())
      .map(([questId, count]) => ({ questId, count }))
      .sort((a, b) => b.count - a.count);
  }, [complaints]);

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
              <h1 style={{ fontSize: 18 }}>Пользователи</h1>
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
              <Button variant="ghost" onClick={() => setShowUsersModal(true)}>
                Открыть окно всех пользователей
              </Button>
            </div>
          </div>

          <div className="card" style={{ width: "100%" }}>
            <div className="cardHeader">
              <h1 style={{ fontSize: 18 }}>Квесты</h1>
            </div>
            <div className="form">
              <div className="hint" style={{ marginTop: 0 }}>
                На модерации сейчас: {quests.length} квестов.
              </div>
              <Button variant="ghost" onClick={() => setShowQuestsModal(true)}>
                Открыть окно всех квестов
              </Button>
            </div>
          </div>

          <div className="card" style={{ width: "100%" }}>
            <div className="cardHeader">
              <h1 style={{ fontSize: 18 }}>Жалобы</h1>
            </div>
            <div className="form" style={{ gap: 10 }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Квесты с наибольшим числом жалоб</h2>
              {complaintQuestStats.length === 0 ? (
                <div className="hint">Активных жалоб на квесты нет.</div>
              ) : (
                complaintQuestStats.map((item) => (
                  <div key={item.questId} className="card" style={{ width: "100%", padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700 }}>Квест #{item.questId}</div>
                      <span className="pill">Жалоб: {item.count}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      <Button variant="ghost" onClick={() => {
                        void loadQuestDetails(item.questId);
                        setShowQuestsModal(true);
                      }}>
                        Посмотреть квест
                      </Button>
                      <Button variant="secondary" onClick={() => hideByComplaints(item.questId)}>
                        Скрыть квест
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {complaints.length === 0 ? (
                <div className="hint">Жалоб нет.</div>
              ) : (
                complaints.map((c) => (
                  <div key={c.id} className="card" style={{ width: "100%", padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 750 }}>#{c.id}</div>
                      <span className="pill">{complaintStatusLabel(c.status)}</span>
                    </div>
                    <div className="muted descriptionText" style={{ fontSize: 13, marginTop: 8 }}>
                      {c.reason}
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                      Объект: {c.quest_id ? `квест ${c.quest_id}` : `точка ${c.checkpoint_id}`}
                    </div>
                    {c.status !== "handled" && (
                      <Button variant="secondary" onClick={() => resolveComplaint(c.id)}>
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
      <UsersModerationModal
        open={showUsersModal}
        users={users}
        initialUserId={usersModalInitialUserId}
        onClose={() => {
          setShowUsersModal(false);
          setUsersModalInitialUserId(null);
        }}
        onSaveUser={saveUserFromUsersModal}
      />
      <QuestsModerationModal
        open={showQuestsModal}
        quests={quests}
        selectedQuestId={selectedQuestId}
        questDetails={questDetails}
        rejectReason={rejectReason}
        questEditTitle={questEditTitle}
        questEditDescription={questEditDescription}
        questEditCityArea={questEditCityArea}
        questEditDifficulty={questEditDifficulty}
        questEditDuration={questEditDuration}
        questEditRules={questEditRules}
        onOpenQuest={(id) => void loadQuestDetails(id)}
        onSaveQuest={() => void saveQuestDetails()}
        onApprove={(id) => void approve(id)}
        onReject={(id) => void reject(id)}
        onCloseDetails={() => setSelectedQuestId(null)}
        onRejectReasonChange={(questId, reason) => setRejectReason((m) => ({ ...m, [questId]: reason }))}
        onQuestEditTitleChange={setQuestEditTitle}
        onQuestEditDescriptionChange={setQuestEditDescription}
        onQuestEditCityAreaChange={setQuestEditCityArea}
        onQuestEditDifficultyChange={setQuestEditDifficulty}
        onQuestEditDurationChange={setQuestEditDuration}
        onQuestEditRulesChange={setQuestEditRules}
        onClose={() => setShowQuestsModal(false)}
      />
    </div>
  );
}
