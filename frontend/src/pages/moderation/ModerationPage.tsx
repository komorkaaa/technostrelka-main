import { useEffect, useState } from "react";
import type { ApiError } from "@/shared/api/types";
import { moderationApi, type ModerationQuestItem, type ComplaintItem } from "@/entities/moderation/api";
import { Spinner } from "@/shared/ui/Spinner";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";
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
  const [quests, setQuests] = useState<ModerationQuestItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const q = await moderationApi.listQuests();
      const c = await moderationApi.listComplaints();
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
