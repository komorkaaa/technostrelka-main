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
import { ComplaintsModerationModal } from "@/pages/moderation/ComplaintsModerationModal";
import { QuestDetailsModerationModal } from "@/pages/moderation/QuestDetailsModerationModal";

export function ModerationPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [quests, setQuests] = useState<ModerationQuestItem[]>([]);
  const [hiddenQuests, setHiddenQuests] = useState<ModerationQuestItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [showComplaintsModal, setShowComplaintsModal] = useState(false);
  const [showQuestDetailsModal, setShowQuestDetailsModal] = useState(false);
  const [questsModalType, setQuestsModalType] = useState<"moderation" | "hidden">("moderation");
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
      const [u, qModeration, qHidden, c] = await Promise.all([
        adminApi.listUsers(),
        moderationApi.listQuests(["moderation"]),
        moderationApi.listQuests(["hidden"]),
        moderationApi.listComplaints(),
      ]);
      setUsers(u.items);
      setQuests(qModeration.items);
      setHiddenQuests(qHidden.items);
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
      setShowQuestDetailsModal(true);
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function approve(id: number) {
    setError(null);
    try {
      if (selectedQuestId === id) {
        await moderationApi.updateQuest(id, {
          title: questEditTitle.trim(),
          description: questEditDescription.trim(),
          city_area: questEditCityArea.trim(),
          difficulty: Number(questEditDifficulty),
          duration_minutes: Number(questEditDuration),
          rules: questEditRules.trim() ? questEditRules.trim() : null,
        });
      }
      await moderationApi.approveQuest(id);
      await reload();
      if (selectedQuestId === id) {
        await loadQuestDetails(id);
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
        setShowQuestDetailsModal(false);
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

  async function hideQuest(questId: number) {
    setError(null);
    try {
      await moderationApi.hideQuest(questId);
      await reload();
      if (selectedQuestId === questId) {
        await loadQuestDetails(questId);
      }
      toast.push({ kind: "info", message: `Квест ${questId} скрыт.` });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function unhideQuest(questId: number) {
    setError(null);
    try {
      await moderationApi.unhideQuest(questId);
      await reload();
      if (selectedQuestId === questId) {
        await loadQuestDetails(questId);
      }
      toast.push({ kind: "success", message: `Квест ${questId} снова видим.` });
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

  const complaintQuestsCount = useMemo(() => {
    const byQuest = new Set<number>();
    for (const c of complaints) {
      if (!c.quest_id) continue;
      byQuest.add(c.quest_id);
    }
    return byQuest.size;
  }, [complaints]);
  const activeQuestsForModal = questsModalType === "hidden" ? hiddenQuests : quests;

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
        <div className="grid2 moderationGrid">
          <div className="card moderationPanel" style={{ width: "100%" }}>
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

          <div className="card moderationPanel" style={{ width: "100%" }}>
            <div className="cardHeader">
              <h1 style={{ fontSize: 18 }}>Квесты</h1>
            </div>
            <div className="form">
              <div className="hint" style={{ marginTop: 0 }}>
                На модерации сейчас: {quests.length} квестов.
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setQuestsModalType("moderation");
                  setShowQuestsModal(true);
                }}
              >
                Открыть окно всех квестов
              </Button>
              <div className="hint" style={{ marginTop: 0 }}>
                В этом окне только квесты на модерации.
              </div>
            </div>
          </div>

          <div className="card moderationPanel" style={{ width: "100%" }}>
            <div className="cardHeader">
              <h1 style={{ fontSize: 18 }}>Скрытые квесты</h1>
            </div>
            <div className="form">
              <div className="hint" style={{ marginTop: 0 }}>
                Скрыто сейчас: {hiddenQuests.length} квестов.
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setQuestsModalType("hidden");
                  setShowQuestsModal(true);
                }}
              >
                Открыть окно скрытых квестов
              </Button>
            </div>
          </div>

          <div className="card moderationPanel" style={{ width: "100%" }}>
            <div className="cardHeader">
              <h1 style={{ fontSize: 18 }}>Жалобы</h1>
            </div>
            <div className="form" style={{ gap: 10 }}>
              <Button variant="ghost" onClick={() => setShowComplaintsModal(true)}>
                Открыть окно всех жалоб
              </Button>
              <div className="hint" style={{ marginTop: 0 }}>
                Всего жалоб: {complaints.length}. Квестов с жалобами: {complaintQuestsCount}.
              </div>
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
        mode={questsModalType}
        quests={activeQuestsForModal}
        onOpenQuest={(id) => void loadQuestDetails(id)}
        onClose={() => setShowQuestsModal(false)}
      />
      <ComplaintsModerationModal
        open={showComplaintsModal}
        complaints={complaints}
        onOpenQuest={(questId) => {
          void loadQuestDetails(questId);
          setShowQuestsModal(true);
        }}
        onResolve={(complaintId) => void resolveComplaint(complaintId)}
        onClose={() => setShowComplaintsModal(false)}
      />
      <QuestDetailsModerationModal
        open={showQuestDetailsModal}
        questDetails={questDetails}
        rejectReason={selectedQuestId ? (rejectReason[selectedQuestId] ?? "") : ""}
        questEditTitle={questEditTitle}
        questEditDescription={questEditDescription}
        questEditCityArea={questEditCityArea}
        questEditDifficulty={questEditDifficulty}
        questEditDuration={questEditDuration}
        questEditRules={questEditRules}
        onApprove={(id) => void approve(id)}
        onReject={(id) => void reject(id)}
        onHide={(id) => void hideQuest(id)}
        onUnhide={(id) => void unhideQuest(id)}
        onRejectReasonChange={(reason) => {
          if (!selectedQuestId) return;
          setRejectReason((m) => ({ ...m, [selectedQuestId]: reason }));
        }}
        onQuestEditTitleChange={setQuestEditTitle}
        onQuestEditDescriptionChange={setQuestEditDescription}
        onQuestEditCityAreaChange={setQuestEditCityArea}
        onQuestEditDifficultyChange={setQuestEditDifficulty}
        onQuestEditDurationChange={setQuestEditDuration}
        onQuestEditRulesChange={setQuestEditRules}
        onClose={() => {
          setShowQuestDetailsModal(false);
          setSelectedQuestId(null);
        }}
      />
    </div>
  );
}
