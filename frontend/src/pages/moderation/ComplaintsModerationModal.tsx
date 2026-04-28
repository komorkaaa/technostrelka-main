import { createPortal } from "react-dom";
import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/Button";
import type { ComplaintItem } from "@/entities/moderation/api";

function complaintStatusLabel(s: string) {
  if (s === "new") return "новая";
  if (s === "handled") return "обработана";
  return s;
}

type Props = {
  open: boolean;
  complaints: ComplaintItem[];
  onOpenQuest: (questId: number) => void;
  onResolve: (complaintId: number) => void;
  onClose: () => void;
};

export function ComplaintsModerationModal(props: Props) {
  const { open, complaints, onOpenQuest, onResolve, onClose } = props;
  const [filter, setFilter] = useState<"all" | "new" | "handled">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return complaints;
    return complaints.filter((item) => item.status === filter);
  }, [complaints, filter]);

  if (!open) return null;

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard usersModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="cardHeader">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 20 }}>Все жалобы</h1>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <Button variant={filter === "all" ? "primary" : "ghost"} size="sm" onClick={() => setFilter("all")}>
              Все
            </Button>
            <Button variant={filter === "new" ? "primary" : "ghost"} size="sm" onClick={() => setFilter("new")}>
              Новые
            </Button>
            <Button variant={filter === "handled" ? "primary" : "ghost"} size="sm" onClick={() => setFilter("handled")}>
              Обработанные
            </Button>
          </div>
        </div>
        <div className="form" style={{ gap: 10, maxHeight: "70vh", overflow: "auto" }}>
          {filtered.length === 0 ? (
            <div className="hint">Жалоб в выбранной категории нет.</div>
          ) : (
            filtered.map((c) => (
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
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {c.quest_id && (
                    <Button variant="ghost" onClick={() => onOpenQuest(c.quest_id as number)}>
                      Посмотреть квест
                    </Button>
                  )}
                  {c.status !== "handled" && (
                    <Button variant="secondary" onClick={() => onResolve(c.id)}>
                      Пометить обработанной
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
