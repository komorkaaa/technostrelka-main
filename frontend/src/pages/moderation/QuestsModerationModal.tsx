import { createPortal } from "react-dom";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import type { ModerationQuestDetails, ModerationQuestItem } from "@/entities/moderation/api";

type Props = {
  open: boolean;
  quests: ModerationQuestItem[];
  selectedQuestId: number | null;
  questDetails: ModerationQuestDetails | null;
  rejectReason: Record<number, string>;
  questEditTitle: string;
  questEditDescription: string;
  questEditCityArea: string;
  questEditDifficulty: string;
  questEditDuration: string;
  questEditRules: string;
  onOpenQuest: (id: number) => void;
  onSaveQuest: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onCloseDetails: () => void;
  onRejectReasonChange: (questId: number, reason: string) => void;
  onQuestEditTitleChange: (value: string) => void;
  onQuestEditDescriptionChange: (value: string) => void;
  onQuestEditCityAreaChange: (value: string) => void;
  onQuestEditDifficultyChange: (value: string) => void;
  onQuestEditDurationChange: (value: string) => void;
  onQuestEditRulesChange: (value: string) => void;
  onClose: () => void;
};

export function QuestsModerationModal(props: Props) {
  const {
    open,
    quests,
    selectedQuestId,
    questDetails,
    rejectReason,
    questEditTitle,
    questEditDescription,
    questEditCityArea,
    questEditDifficulty,
    questEditDuration,
    questEditRules,
    onOpenQuest,
    onSaveQuest,
    onApprove,
    onReject,
    onCloseDetails,
    onRejectReasonChange,
    onQuestEditTitleChange,
    onQuestEditDescriptionChange,
    onQuestEditCityAreaChange,
    onQuestEditDifficultyChange,
    onQuestEditDurationChange,
    onQuestEditRulesChange,
    onClose,
  } = props;

  if (!open) return null;

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard usersModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="cardHeader">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <h1 style={{ fontSize: 20 }}>Все квесты на модерации</h1>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
        <div className="form" style={{ gap: 10, maxHeight: "70vh", overflow: "auto" }}>
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
                    <span className="pill">{q.route_length_meters} м</span>
                  </div>
                </div>
                <div className="muted descriptionText" style={{ fontSize: 13, marginTop: 8 }}>
                  {q.description}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <Button variant="ghost" onClick={() => onOpenQuest(q.id)}>
                    Открыть квест
                  </Button>
                </div>
              </div>
            ))
          )}
          {questDetails && selectedQuestId && (
            <div className="card" style={{ width: "100%", padding: 12 }}>
              <h2 style={{ fontSize: 16, marginTop: 0 }}>Доп. информация и редактирование квеста #{selectedQuestId}</h2>
              <label className="label">
                Название
                <Input value={questEditTitle} onChange={(e) => onQuestEditTitleChange(e.target.value)} />
              </label>
              <label className="label">
                Описание
                <Textarea value={questEditDescription} onChange={(e) => onQuestEditDescriptionChange(e.target.value)} />
              </label>
              <label className="label">
                Район/город
                <Input value={questEditCityArea} onChange={(e) => onQuestEditCityAreaChange(e.target.value)} />
              </label>
              <div className="grid3">
                <label className="label">
                  Сложность
                  <Select value={questEditDifficulty} onChange={(e) => onQuestEditDifficultyChange(e.target.value)}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </Select>
                </label>
                <label className="label">
                  Длительность (мин)
                  <Input value={questEditDuration} onChange={(e) => onQuestEditDurationChange(e.target.value)} />
                </label>
                <label className="label">
                  Правила
                  <Input value={questEditRules} onChange={(e) => onQuestEditRulesChange(e.target.value)} placeholder="необязательно" />
                </label>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Точек в квесте: {questDetails.checkpoints.length}
              </div>
              <label className="label" style={{ marginTop: 10 }}>
                Причина отклонения
                <Textarea
                  value={rejectReason[selectedQuestId] ?? ""}
                  onChange={(e) => onRejectReasonChange(selectedQuestId, e.target.value)}
                  placeholder="Причина…"
                />
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button onClick={() => onApprove(selectedQuestId)}>Сохранить и опубликовать</Button>
                <Button variant="secondary" onClick={() => onReject(selectedQuestId)}>
                  Отклонить с причиной
                </Button>
                <Button variant="ghost" onClick={onCloseDetails}>
                  Закрыть
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
