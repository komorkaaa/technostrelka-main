import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ApiError } from "@/shared/api/types";
import { runApi } from "@/entities/run/api";
import type { RunState } from "@/entities/run/model";
import { questApi } from "@/entities/quest/api";
import type { QuestDetails, QuestCheckpoint } from "@/entities/quest/model";
import { Spinner } from "@/shared/ui/Spinner";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { QuestMap } from "@/shared/map/QuestMap";

function ErrorBox({ error }: { error: ApiError }) {
  return (
    <div className="errorBox">
      <div className="errorTitle">{error.code}</div>
      <div className="errorMsg">{error.message}</div>
    </div>
  );
}

function parseProgress(progress: string) {
  const [a, b] = progress.split("/");
  const passed = Number(a);
  const total = Number(b);
  return { passed: Number.isFinite(passed) ? passed : 0, total: Number.isFinite(total) ? total : 0 };
}

function runStatusLabel(s: string) {
  if (s === "started") return "начато";
  if (s === "in_progress") return "в процессе";
  if (s === "finished") return "завершено";
  if (s === "abandoned") return "брошено";
  return s;
}

function cpStatusLabel(s: string) {
  if (s === "locked") return "закрыта";
  if (s === "active") return "активная";
  if (s === "passed") return "пройдена";
  return s;
}

export function RunPage() {
  const { id } = useParams();
  const runId = Number(id);
  const nav = useNavigate();

  const [run, setRun] = useState<RunState | null>(null);
  const [quest, setQuest] = useState<QuestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [codeword, setCodeword] = useState("");
  const [quizIndex, setQuizIndex] = useState<string>("0");

  const progress = useMemo(() => (run ? parseProgress(run.progress) : { passed: 0, total: 0 }), [run]);

  const statusByOrder = useMemo(() => {
    if (!quest || !run) return undefined;
    const { passed, total } = parseProgress(run.progress);
    const map: Record<number, "locked" | "active" | "passed"> = {};
    for (let i = 1; i <= total; i++) {
      if (i <= passed) map[i] = "passed";
      else if (i === passed + 1 && run.status !== "finished") map[i] = "active";
      else map[i] = "locked";
    }
    return map;
  }, [quest, run]);

  const currentCheckpointFull = useMemo(() => {
    if (!quest || !run?.current_checkpoint) return null;
    return quest.checkpoints.find((c) => c.order_index === run.current_checkpoint?.order_index) ?? null;
  }, [quest, run]);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const r = await runApi.get(runId);
      setRun(r);
      const q = await questApi.get(r.quest_id);
      setQuest(q);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  async function submit() {
    if (!run?.current_checkpoint) return;
    setError(null);
    try {
      if (run.current_checkpoint.task_type === "codeword") {
        await runApi.submit(runId, { codeword_answer: codeword });
        setCodeword("");
      } else {
        await runApi.submit(runId, { quiz_selected_index: Number(quizIndex) });
      }
      await reload();
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function abandon() {
    setError(null);
    try {
      await runApi.abandon(runId);
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
        </div>
      </div>
    );
  }

  if (error && !run) {
    return (
      <div className="card wide">
        <div className="cardHeader">
          <h1>Прохождение</h1>
        </div>
        <ErrorBox error={error} />
        <div className="hint">
          <Link to="/">Назад</Link>
        </div>
      </div>
    );
  }

  if (!run || !quest) return null;

  return (
    <div className="card wide">
      <div className="cardHeader">
        <h1>Сессия #{run.id}</h1>
        <p className="muted">
          Квест: <Link to={`/quests/${quest.id}`}>{quest.title}</Link>
        </p>
      </div>

      {error && <ErrorBox error={error} />}

      <div className="row">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span className="pill">Статус: {runStatusLabel(run.status)}</span>
          <span className="pill">Прогресс: {run.progress}</span>
          <span className="pill">Очки: {run.score_total}</span>
        </div>
        {run.status !== "finished" && run.status !== "abandoned" && (
          <Button className="btn secondary" onClick={abandon}>
            Бросить
          </Button>
        )}
      </div>

      <div className="grid2">
        <div className="card" style={{ width: "100%" }}>
          <div className="cardHeader">
            <h1 style={{ fontSize: 18 }}>Карта</h1>
          </div>
          <div style={{ padding: "0 8px 12px" }}>
            <QuestMap checkpoints={quest.checkpoints} statusByOrder={statusByOrder} />
          </div>
        </div>

        <div className="card" style={{ width: "100%" }}>
          <div className="cardHeader">
            <h1 style={{ fontSize: 18 }}>Текущая точка</h1>
          </div>
          <div className="form">
            {!run.current_checkpoint ? (
              <div className="hint">Нет активной точки (сессия завершена или брошена).</div>
            ) : (
              <>
                <div style={{ fontWeight: 800 }}>
                  {run.current_checkpoint.order_index}. {run.current_checkpoint.title}
                </div>
                <div className="muted">{run.current_checkpoint.task_text}</div>
                {run.current_checkpoint.hint && <div className="muted">Подсказка: {run.current_checkpoint.hint}</div>}

                {run.current_checkpoint.task_type === "codeword" ? (
                  <label className="label">
                    Код-слово
                    <Input value={codeword} onChange={(e) => setCodeword(e.target.value)} placeholder="Введите код-слово…" />
                  </label>
                ) : (
                  <>
                    <div className="muted">{currentCheckpointFull?.quiz_question}</div>
                    <label className="label">
                      Ответ
                      <Select value={quizIndex} onChange={(e) => setQuizIndex(e.target.value)}>
                        {(currentCheckpointFull?.quiz_options ?? []).map((opt, idx) => (
                          <option key={idx} value={String(idx)}>
                            {idx + 1}. {opt}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </>
                )}

                <Button onClick={submit}>Проверить</Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="form">
        <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>Все точки</h2>
        {quest.checkpoints.map((cp: QuestCheckpoint) => (
          <div key={cp.id} className="card" style={{ width: "100%", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700 }}>
                {cp.order_index}. {cp.title}
              </div>
              <span className="pill">{cpStatusLabel(statusByOrder?.[cp.order_index] ?? "locked")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
