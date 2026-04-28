import { createPortal } from "react-dom";
import { Button } from "@/shared/ui/Button";
import type { LeaderboardTeamDetails } from "@/entities/leaderboard/api";

type Props = {
  open: boolean;
  details: LeaderboardTeamDetails | null;
  onClose: () => void;
};

export function TeamDetailsModal(props: Props) {
  const { open, details, onClose } = props;
  if (!open || !details) return null;

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="cardHeader">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 20 }}>{details.team_name}</h1>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <span className="pill">Очки: {details.score_total}</span>
            <span className="pill">Забеги: {details.finished_runs}</span>
          </div>
        </div>
        <div className="form" style={{ maxHeight: "60vh", overflow: "auto" }}>
          {details.members.length === 0 ? (
            <div className="hint">У команды пока нет участников.</div>
          ) : (
            details.members.map((member, idx) => (
              <div key={member.id} className="card" style={{ width: "100%", padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700 }}>
                    {idx + 1}. {member.nickname || member.email}
                  </div>
                  <span className="pill">{member.role}</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  {member.email}
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
