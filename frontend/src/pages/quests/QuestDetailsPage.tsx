import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ApiError } from "@/shared/api/types";
import { questApi } from "@/entities/quest/api";
import type { QuestCheckpoint, QuestDetails } from "@/entities/quest/model";
import { Spinner } from "@/shared/ui/Spinner";
import { Button } from "@/shared/ui/Button";
import { useAuth } from "@/features/auth/model/useAuth";
import { runApi } from "@/entities/run/api";
import { teamApi } from "@/entities/team/api";
import type { Team } from "@/entities/team/model";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { complaintApi } from "@/entities/complaint/api";
import { moderationApi } from "@/entities/moderation/api";
import { QuestMap } from "@/shared/map/QuestMap";
import { ApiErrorBox } from "@/shared/ui/ApiErrorBox";
import { useToast } from "@/shared/ui/Toast";

function taskTypeLabel(t: QuestCheckpoint["task_type"]) {
  if (t === "codeword") return "Код-слово";
  if (t === "quiz") return "Вопрос";
  return t;
}

export function QuestDetailsPage() {
  const { id } = useParams();
  const questId = Number(id);
  const nav = useNavigate();
  const { status, user } = useAuth();
  const toast = useToast();

  const [quest, setQuest] = useState<QuestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<string>("");

  const [complaintReason, setComplaintReason] = useState("");
  const [complaintResult, setComplaintResult] = useState<string | null>(null);
  const [complaintTarget, setComplaintTarget] = useState<"quest" | "checkpoint">("quest");
  const [checkpointId, setCheckpointId] = useState<string>("");

  const canStart = status === "authenticated";

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await questApi.get(questId);
        setQuest(data);
      } catch (e) {
        setError(e as ApiError);
      } finally {
        setLoading(false);
      }
    })();
  }, [questId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      try {
        const data = await teamApi.my();
        setTeams(data.items);
      } catch {
        setTeams([]);
      }
    })();
  }, [status]);

  const coverUrl = useMemo(() => {
    if (!quest?.cover_path) return null;
    return quest.cover_path;
  }, [quest]);

  async function startSolo() {
    if (!quest) return;
    setError(null);
    try {
      const run = await runApi.start({ quest_id: quest.id, mode: "solo" });
      toast.push({ kind: "success", message: "Прохождение начато." });
      nav(`/runs/${run.id}`);
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function startTeam() {
    if (!quest) return;
    setError(null);
    const tid = Number(teamId);
    if (!tid) {
      setError({ status: 0, code: "TEAM_REQUIRED", message: "Выберите команду" });
      return;
    }
    try {
      const run = await runApi.start({ quest_id: quest.id, mode: "team", team_id: tid });
      toast.push({ kind: "success", message: "Командное прохождение начато." });
      nav(`/runs/${run.id}`);
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function sendComplaint() {
    if (!quest) return;
    setError(null);
    setComplaintResult(null);
    try {
      const payload =
        complaintTarget === "quest"
          ? { quest_id: quest.id, reason: complaintReason }
          : { checkpoint_id: Number(checkpointId), reason: complaintReason };
      const res = await complaintApi.create(payload as any);
      setComplaintResult(`Жалоба отправлена (#${res.id})`);
      setComplaintReason("");
      toast.push({ kind: "success", message: "Жалоба отправлена." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function hideQuest() {
    if (!quest) return;
    setError(null);
    try {
      await moderationApi.hideQuest(quest.id);
      toast.push({ kind: "info", message: "Квест скрыт." });
      nav("/");
    } catch (e) {
      setError(e as ApiError);
    }
  }

  if (loading) {
    return (
      <div className="card wide">
        <div className="spinnerWrap" style={{ padding: 18 }}>
          <Spinner />
          <div className="muted">Загрузка…</div>
        </div>
      </div>
    );
  }

  if (error && !quest) {
    return (
      <div className="card wide">
        <div className="cardHeader">
          <h1>Квест</h1>
        </div>
        <ApiErrorBox error={error} />
        <div className="hint">
          <Link to="/">Назад к ленте</Link>
        </div>
      </div>
    );
  }

  if (!quest) return null;

  return (
    <div className="card wide">
      <div className="cardHeader">
        <h1>{quest.title}</h1>
        <p className="muted">{quest.city_area}</p>
      </div>

      {coverUrl && (
        <div style={{ padding: "0 8px 12px" }}>
          <img
            src={coverUrl}
            alt="cover"
            style={{ width: "100%", borderRadius: 14, border: "1px solid var(--border)", maxHeight: 280, objectFit: "cover" }}
          />
        </div>
      )}

      <div className="row">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span className="pill">Сложность {quest.difficulty}</span>
          <span className="pill">{quest.duration_minutes} мин</span>
          <span className="pill">Точек: {quest.checkpoints.length}</span>
        </div>
        {user?.role === "moderator" && (
          <Button variant="secondary" size="sm" onClick={hideQuest}>
            Скрыть
          </Button>
        )}
      </div>

      <div className="form">
        <div className="muted descriptionText">{quest.description}</div>
        {quest.rules && (
          <div className="errorBox" style={{ borderColor: "rgba(125, 211, 252, 0.25)", background: "rgba(125, 211, 252, 0.06)" }}>
            <div className="errorTitle">Правила / предупреждения</div>
            <div className="errorMsg">{quest.rules}</div>
          </div>
        )}
      </div>

      {error && <ApiErrorBox error={error} />}

      <div className="cardFooter questActions">
        <div className="questActionsMain">
          <Button onClick={startSolo} disabled={!canStart} size="lg" className="questActionBtn">
            Начать соло
          </Button>
          <div className="questActionsTeam">
            <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} disabled={!canStart} className="questTeamSelect">
              <option value="">Команда…</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name} ({t.members_count ?? "?"}/6)
                </option>
              ))}
            </Select>
            <Button onClick={startTeam} disabled={!canStart} size="lg" variant="secondary" className="questActionBtn">
              Начать командой
            </Button>
          </div>
        </div>
        {!canStart && (
          <div className="muted" style={{ fontSize: 13 }}>
            Войдите, чтобы начать
          </div>
        )}
      </div>

      <div className="form">
        <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>Точки</h2>
        <div style={{ padding: "0 0 8px" }}>
          <QuestMap checkpoints={quest.checkpoints} />
        </div>
        {quest.checkpoints.map((cp) => (
          <div key={cp.id} className="card" style={{ width: "100%", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>
                {cp.order_index}. {cp.title}
              </div>
              <span className="pill">{taskTypeLabel(cp.task_type)}</span>
            </div>
            <div className="muted descriptionText" style={{ fontSize: 13, marginTop: 8 }}>
              {cp.task_text}
            </div>
            {cp.hint && (
              <div className="muted descriptionText" style={{ fontSize: 13, marginTop: 8 }}>
                Подсказка: {cp.hint}
              </div>
            )}
            {cp.safety_rules && (
              <div className="muted descriptionText" style={{ fontSize: 13, marginTop: 6 }}>
                Правила: {cp.safety_rules}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="form">
        <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>Пожаловаться</h2>
        {complaintResult && <div className="hint">{complaintResult}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label className="label">
            На что
            <Select value={complaintTarget} onChange={(e) => setComplaintTarget(e.target.value as any)}>
              <option value="quest">Квест</option>
              <option value="checkpoint">Точка</option>
            </Select>
          </label>
          <label className="label">
            Точка
            <Select
              value={checkpointId}
              onChange={(e) => setCheckpointId(e.target.value)}
              disabled={complaintTarget !== "checkpoint"}
            >
              <option value="">Выберите…</option>
              {quest.checkpoints.map((cp) => (
                <option key={cp.id} value={String(cp.id)}>
                  {cp.order_index}. {cp.title}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <label className="label">
          Причина (мин. 10 символов)
          <Textarea value={complaintReason} onChange={(e) => setComplaintReason(e.target.value)} placeholder="Что небезопасно или неадекватно?" />
        </label>
        <Button
          onClick={sendComplaint}
          disabled={
            status !== "authenticated" ||
            complaintReason.trim().length < 10 ||
            (complaintTarget === "checkpoint" && !checkpointId)
          }
        >
          Отправить жалобу
        </Button>
      </div>
    </div>
  );
}
