import { useEffect, useState } from "react";
import type { ApiError } from "@/shared/api/types";
import { leaderboardApi, type LeaderboardTeamDetails, type LeaderboardTeamItem } from "@/entities/leaderboard/api";
import { Spinner } from "@/shared/ui/Spinner";
import { ApiErrorBox } from "@/shared/ui/ApiErrorBox";
import { TeamDetailsModal } from "@/pages/leaderboard/TeamDetailsModal";

export function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardTeamItem[]>([]);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<LeaderboardTeamDetails | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await leaderboardApi.teams();
        setItems(data.items);
      } catch (e) {
        setError(e as ApiError);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function openTeam(teamId: number) {
    setError(null);
    try {
      const details = await leaderboardApi.teamDetails(teamId);
      setSelectedTeamDetails(details);
      setShowTeamModal(true);
    } catch (e) {
      setError(e as ApiError);
    }
  }

  return (
    <div className="card wide">
      <div className="cardHeader">
        <h1>Рейтинг команд</h1>
        <p className="muted">Сумма очков за завершённые квесты (всё время).</p>
      </div>

      {error && <ApiErrorBox error={error} />}

      {loading ? (
        <div className="spinnerWrap" style={{ padding: 18 }}>
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <div className="hint">Пока нет завершённых командных прохождений.</div>
      ) : (
        <div className="form" style={{ gap: 10 }}>
          {items.map((t, idx) => (
            <button
              key={t.team_id}
              className="listCard"
              onClick={() => void openTeam(t.team_id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 800, minWidth: 0, overflowWrap: "anywhere" }}>
                  #{idx + 1} {t.team_name}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="pill">Очки: {t.score_total}</span>
                  <span className="pill">Забеги: {t.finished_runs}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <TeamDetailsModal
        open={showTeamModal}
        details={selectedTeamDetails}
        onClose={() => setShowTeamModal(false)}
      />
    </div>
  );
}
