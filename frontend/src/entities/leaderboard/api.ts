import { api } from "@/shared/api/client";

export type LeaderboardTeamItem = {
  team_id: number;
  team_name: string;
  score_total: number;
  finished_runs: number;
};

export type LeaderboardTeamMember = {
  id: number;
  email: string;
  nickname?: string | null;
  role: string;
};

export type LeaderboardTeamDetails = LeaderboardTeamItem & {
  members: LeaderboardTeamMember[];
};

export const leaderboardApi = {
  async teams() {
    return api.get<{ items: LeaderboardTeamItem[] }>("/api/v1/leaderboard/teams");
  },
  async teamDetails(teamId: number) {
    return api.get<LeaderboardTeamDetails>(`/api/v1/leaderboard/teams/${teamId}`);
  },
};

