import { createPortal } from "react-dom";
import { Button } from "@/shared/ui/Button";
import type { ModerationQuestItem } from "@/entities/moderation/api";

type Props = {
  open: boolean;
  mode: "moderation" | "hidden";
  quests: ModerationQuestItem[];
  onOpenQuest: (id: number) => void;
  onClose: () => void;
};

export function QuestsModerationModal(props: Props) {
  const {
    open,
    mode,
    quests,
    onOpenQuest,
    onClose,
  } = props;
  const filteredQuests = quests;

  if (!open) return null;

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard usersModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="cardHeader">
          <div className="modalHeaderRow">
            <h1 style={{ fontSize: 20 }}>{mode === "hidden" ? "Скрытые квесты" : "Квесты на модерации"}</h1>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
        <div className="modalBody">
          <div className="modalList">
          {filteredQuests.length === 0 ? (
            <div className="hint">Нет квестов на проверку.</div>
          ) : (
            filteredQuests.map((q) => (
              <div key={q.id} className="card cardCompact">
                <div className="modalHeaderRow">
                  <div style={{ fontWeight: 750, minWidth: 0, overflowWrap: "anywhere" }}>{q.title}</div>
                  <div className="pillRow">
                    <span className="pill">{q.city_area}</span>
                    <span className="pill">Сложность {q.difficulty}</span>
                    <span className="pill">{q.duration_minutes} мин</span>
                    <span className="pill">{q.status === "hidden" ? "Скрытый" : "Видимый"}</span>
                    <span className="pill">{q.route_length_meters} м</span>
                  </div>
                </div>
                <div className="muted descriptionText" style={{ fontSize: 13, marginTop: 8 }}>
                  {q.description}
                </div>
                <div className="modalActions">
                  <Button variant="ghost" onClick={() => onOpenQuest(q.id)}>
                    Открыть квест
                  </Button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
