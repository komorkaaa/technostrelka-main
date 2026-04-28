import { createPortal } from "react-dom";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import type { ModerationQuestDetails } from "@/entities/moderation/api";

type Props = {
  open: boolean;
  questDetails: ModerationQuestDetails | null;
  rejectReason: string;
  questEditTitle: string;
  questEditDescription: string;
  questEditCityArea: string;
  questEditDifficulty: string;
  questEditDuration: string;
  questEditRules: string;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onHide: (id: number) => void;
  onUnhide: (id: number) => void;
  onRejectReasonChange: (reason: string) => void;
  onQuestEditTitleChange: (value: string) => void;
  onQuestEditDescriptionChange: (value: string) => void;
  onQuestEditCityAreaChange: (value: string) => void;
  onQuestEditDifficultyChange: (value: string) => void;
  onQuestEditDurationChange: (value: string) => void;
  onQuestEditRulesChange: (value: string) => void;
  onClose: () => void;
};

export function QuestDetailsModerationModal(props: Props) {
  const {
    open,
    questDetails,
    rejectReason,
    questEditTitle,
    questEditDescription,
    questEditCityArea,
    questEditDifficulty,
    questEditDuration,
    questEditRules,
    onApprove,
    onReject,
    onHide,
    onUnhide,
    onRejectReasonChange,
    onQuestEditTitleChange,
    onQuestEditDescriptionChange,
    onQuestEditCityAreaChange,
    onQuestEditDifficultyChange,
    onQuestEditDurationChange,
    onQuestEditRulesChange,
    onClose,
  } = props;

  if (!open || !questDetails) return null;

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard usersModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="cardHeader">
          <div className="modalHeaderRow">
            <h1 style={{ fontSize: 20 }}>Доп. информация квеста #{questDetails.id}</h1>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
        <div className="modalBody">
          <div className="form" style={{ gap: 10, padding: 0 }}>
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
                <Input value={questEditDuration} onChange={(e) => onQuestEditDurationChange(e.target.value)} inputMode="numeric" />
              </label>
              <label className="label">
                Правила
                <Input value={questEditRules} onChange={(e) => onQuestEditRulesChange(e.target.value)} placeholder="необязательно" />
              </label>
            </div>
            <div className="pillRow">
              <span className="pill">Точек: {questDetails.checkpoints.length}</span>
              <span className="pill">{questDetails.status === "hidden" ? "Скрытый" : "Видимый"}</span>
            </div>
            <label className="label" style={{ marginTop: 2 }}>
              Причина отклонения
              <Textarea value={rejectReason} onChange={(e) => onRejectReasonChange(e.target.value)} placeholder="Причина…" />
            </label>
            <div className="modalActions">
              {questDetails.status === "moderation" && (
                <>
                  <Button onClick={() => onApprove(questDetails.id)}>Сохранить и опубликовать</Button>
                  <Button variant="secondary" onClick={() => onReject(questDetails.id)}>
                    Отклонить с причиной
                  </Button>
                </>
              )}
              {questDetails.status === "hidden" ? (
                <Button variant="ghost" onClick={() => onUnhide(questDetails.id)}>
                  Сделать видимым
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => onHide(questDetails.id)}>
                  Скрыть квест
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
