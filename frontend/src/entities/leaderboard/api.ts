import { api } from "@/shared/api/client";

export type LeaderboardTeamItem = {
  team_id: number;
  team_name: string;
  score_total: number;
  finished_runs: number;
};

export const leaderboardApi = {
  async teams() {
    return api.get<{ items: LeaderboardTeamItem[] }>("/api/v1/leaderboard/teams");
  },
};

