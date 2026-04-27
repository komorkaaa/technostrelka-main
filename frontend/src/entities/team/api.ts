import { api } from "@/shared/api/client";
import type { Team } from "./model";

export const teamApi = {
  async create(data: { name: string; description?: string | null }) {
    return api.post<Team>("/api/v1/teams", data);
  },
  async join(code: string) {
    return api.post<{ team: Team; members: { id: number; email: string }[] }>("/api/v1/teams/join", { code });
  },
  async my() {
    return api.get<{ items: Team[] }>("/api/v1/teams/my");
  },
};

