import { useMemo, useState } from "react";
import type { ApiError } from "@/shared/api/types";
import { questApi } from "@/entities/quest/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import type { CheckpointCreateRequest } from "@/entities/quest/model";
import { MapPicker } from "@/shared/map/MapPicker";
import { ApiErrorBox } from "@/shared/ui/ApiErrorBox";
import { useToast } from "@/shared/ui/Toast";

function taskTypeLabel(t: CheckpointCreateRequest["task_type"]) {
  if (t === "codeword") return "Код-слово";
  if (t === "quiz") return "Вопрос";
  return t;
}

export function QuestCreatePage() {
  const toast = useToast();
  const [error, setError] = useState<ApiError | null>(null);
  const [questId, setQuestId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("draft");

  // quest form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cityArea, setCityArea] = useState("Нижний Новгород");
  const [difficulty, setDifficulty] = useState("3");
  const [duration, setDuration] = useState("60");
  const [rules, setRules] = useState("");

  // cover
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPath, setCoverPath] = useState<string | null>(null);

  // checkpoints
  const [checkpoints, setCheckpoints] = useState<CheckpointCreateRequest[]>([]);
  const nextOrder = checkpoints.length + 1;
  const [cpTitle, setCpTitle] = useState(`Точка ${nextOrder}`);
  const [cpTaskText, setCpTaskText] = useState("");
  const [cpType, setCpType] = useState<"codeword" | "quiz">("codeword");
  const [cpCodeword, setCpCodeword] = useState("");
  const [cpQuizQuestion, setCpQuizQuestion] = useState("");
  const [cpQuizOptions, setCpQuizOptions] = useState(["", "", "", ""]);
  const [cpQuizCorrect, setCpQuizCorrect] = useState("0");
  const [cpHint, setCpHint] = useState("");
  const [cpSafety, setCpSafety] = useState("");
  const [cpPos, setCpPos] = useState<{ lat: number; lon: number } | null>(null);

  const canCreateQuest = title.trim().length >= 5 && description.trim().length >= 30 && cityArea.trim().length >= 1;
  const canAddCheckpoint = questId && cpTitle.trim().length > 0 && cpTaskText.trim().length >= 20 && !!cpPos;
  const canSubmit = questId && checkpoints.length >= 3 && status === "draft";
  const submitDisabledReason = useMemo(() => {
    if (questId === null) return "Сначала создайте черновик квеста.";
    if (checkpoints.length < 3) return `Добавьте минимум 3 точки (сейчас: ${checkpoints.length}).`;
    if (status !== "draft") return `Отправка доступна только для статуса draft (сейчас: ${status}).`;
    return null;
  }, [questId, checkpoints.length, status]);

  const coverHint = useMemo(() => (coverPath ? `Загружено: ${coverPath}` : "Обложка обязательна (≤ 5 МБ)."), [coverPath]);

  async function createQuest() {
    setError(null);
    try {
      const res = await questApi.create({
        title,
        description,
        city_area: cityArea,
        difficulty: Number(difficulty),
        duration_minutes: Number(duration),
        rules: rules || null,
      });
      setQuestId(res.quest_id);
      setStatus(res.status);
      toast.push({ kind: "success", message: "Черновик квеста создан." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function uploadCover() {
    if (!questId || !coverFile) return;
    setError(null);
    try {
      const res = await questApi.uploadCover(questId, coverFile);
      setCoverPath(res.cover_path);
      toast.push({ kind: "success", message: "Обложка загружена." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function addCheckpoint() {
    if (!questId || !cpPos) return;
    setError(null);
    try {
      const payload: CheckpointCreateRequest = {
        order_index: nextOrder,
        title: cpTitle,
        lat: cpPos.lat,
        lon: cpPos.lon,
        task_type: cpType,
        task_text: cpTaskText,
        hint: cpHint || null,
        safety_rules: cpSafety || null,
      };
      if (cpType === "codeword") {
        payload.codeword_answer = cpCodeword;
      } else {
        payload.quiz_question = cpQuizQuestion;
        payload.quiz_options = cpQuizOptions;
        payload.quiz_correct_index = Number(cpQuizCorrect);
      }
      await questApi.addCheckpoint(questId, payload);
      setCheckpoints((prev) => [...prev, payload]);
      toast.push({ kind: "success", message: "Точка добавлена." });
      const n = checkpoints.length + 2;
      setCpTitle(`Точка ${n}`);
      setCpTaskText("");
      setCpCodeword("");
      setCpQuizQuestion("");
      setCpQuizOptions(["", "", "", ""]);
      setCpQuizCorrect("0");
      setCpHint("");
      setCpSafety("");
      setCpPos(null);
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function submitForModeration() {
    if (!questId) return;
    setError(null);
    try {
      const res = await questApi.submit(questId);
      setStatus(res.status);
      toast.push({ kind: "info", message: "Квест отправлен на модерацию." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  return (
    <div className="card wide">
      <div className="cardHeader">
        <h1>Создание квеста</h1>
        <p className="muted">Черновик → добавьте точки → отправьте на модерацию.</p>
      </div>

      {error && <ApiErrorBox error={error} />}

      <div className="grid2">
        <div className="card" style={{ width: "100%" }}>
          <div className="cardHeader">
            <h1 style={{ fontSize: 18 }}>Квест</h1>
          </div>
          <div className="form">
            {questId && (
              <div className="hint">
                ID квеста: <span className="mono">{questId}</span> • Статус: <span className="mono">{status}</span>
              </div>
            )}
            <label className="label">
              Название (мин. 5)
              <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!!questId} />
            </label>
            <label className="label">
              Описание (мин. 30)
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!!questId} />
            </label>
            <label className="label">
              Район/город
              <Input value={cityArea} onChange={(e) => setCityArea(e.target.value)} disabled={!!questId} />
            </label>
            <div className="grid3">
              <label className="label">
                Сложность (1–5)
                <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={!!questId}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </Select>
              </label>
              <label className="label">
                Длительность (мин)
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} disabled={!!questId} />
              </label>
              <label className="label">
                Правила/предупреждения
                <Input value={rules} onChange={(e) => setRules(e.target.value)} disabled={!!questId} placeholder="необязательно" />
              </label>
            </div>
            {!questId && (
              <Button onClick={createQuest} disabled={!canCreateQuest}>
                Создать черновик
              </Button>
            )}
          </div>
        </div>

        <div className="card" style={{ width: "100%" }}>
          <div className="cardHeader">
            <h1 style={{ fontSize: 18 }}>Обложка</h1>
          </div>
          <div className="form">
            <div className="hint">{coverHint}</div>
            <input
              type="file"
              accept="image/*"
              disabled={!questId}
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={uploadCover} disabled={!questId || !coverFile}>
              Загрузить обложку
            </Button>
          </div>
        </div>
      </div>

      <div className="card" style={{ width: "100%", marginTop: 14 }}>
        <div className="cardHeader">
          <h1 style={{ fontSize: 18 }}>Добавить точку</h1>
          <p className="muted" style={{ margin: 0 }}>
            Выберите координаты на карте. Точка №{nextOrder}
          </p>
        </div>
        <div className="form">
          <div className="grid2">
            <div style={{ width: "100%" }}>
              <label className="label">
                Название
                <Input value={cpTitle} onChange={(e) => setCpTitle(e.target.value)} disabled={!questId} />
              </label>
              <label className="label">
                Задание (мин. 20)
                <Textarea value={cpTaskText} onChange={(e) => setCpTaskText(e.target.value)} disabled={!questId} />
              </label>
              <label className="label">
                Тип задания
                <Select value={cpType} onChange={(e) => setCpType(e.target.value as any)} disabled={!questId}>
                  <option value="codeword">Код-слово</option>
                  <option value="quiz">Вопрос (1 из 4)</option>
                </Select>
              </label>

              {cpType === "codeword" ? (
                <label className="label">
                  Правильное код-слово (для проверки)
                  <Input value={cpCodeword} onChange={(e) => setCpCodeword(e.target.value)} disabled={!questId} />
                </label>
              ) : (
                <>
                  <label className="label">
                    Вопрос
                    <Input value={cpQuizQuestion} onChange={(e) => setCpQuizQuestion(e.target.value)} disabled={!questId} />
                  </label>
                  <div style={{ display: "grid", gap: 10 }}>
                    {cpQuizOptions.map((v, idx) => (
                      <label key={idx} className="label">
                        Вариант {idx + 1}
                        <Input
                          value={v}
                          onChange={(e) =>
                            setCpQuizOptions((arr) => arr.map((x, i) => (i === idx ? e.target.value : x)))
                          }
                          disabled={!questId}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="label">
                    Правильный вариант
                    <Select value={cpQuizCorrect} onChange={(e) => setCpQuizCorrect(e.target.value)} disabled={!questId}>
                      <option value="0">1</option>
                      <option value="1">2</option>
                      <option value="2">3</option>
                      <option value="3">4</option>
                    </Select>
                  </label>
                </>
              )}

              <label className="label">
                Подсказка (опционально)
                <Input value={cpHint} onChange={(e) => setCpHint(e.target.value)} disabled={!questId} />
              </label>
              <label className="label">
                Правила точки / безопасность (опционально)
                <Input value={cpSafety} onChange={(e) => setCpSafety(e.target.value)} disabled={!questId} />
              </label>

              <div className="hint">
                Выбрано:{" "}
                <span className="mono">{cpPos ? `${cpPos.lat.toFixed(5)}, ${cpPos.lon.toFixed(5)}` : "не выбрано"}</span>
              </div>
              <Button onClick={addCheckpoint} disabled={!canAddCheckpoint}>
                Добавить точку
              </Button>
            </div>

            <div style={{ width: "100%" }}>
              <MapPicker value={cpPos} onChange={setCpPos} />
            </div>
          </div>
        </div>
      </div>

      <div className="form">
        <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>Точки в черновике ({checkpoints.length})</h2>
        {checkpoints.length === 0 ? (
          <div className="hint">Добавьте минимум 3 точки, чтобы отправить на модерацию.</div>
        ) : (
          checkpoints.map((cp) => (
            <div key={cp.order_index} className="card" style={{ width: "100%", padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 700 }}>
                  {cp.order_index}. {cp.title}
                </div>
                <span className="pill">{taskTypeLabel(cp.task_type)}</span>
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                {cp.task_text}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                {cp.lat.toFixed(5)}, {cp.lon.toFixed(5)}
              </div>
            </div>
          ))
        )}
        <Button onClick={submitForModeration} disabled={!canSubmit}>
          Отправить на модерацию
        </Button>
        {!canSubmit && submitDisabledReason && <div className="hint">{submitDisabledReason}</div>}
      </div>
    </div>
  );
}
