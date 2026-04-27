import { api } from "@/shared/api/client";
import type { RunStartResponse, RunState, RunSubmitResponse } from "./model";

export const runApi = {
  async start(data: { quest_id: number; mode: "solo" | "team"; team_id?: number }) {
    return api.post<RunStartResponse>("/api/v1/runs/start", data);
  },
  async get(runId: number) {
    return api.get<RunState>(`/api/v1/runs/${runId}`);
  },
  async submit(runId: number, data: { codeword_answer?: string; quiz_selected_index?: number }) {
    return api.post<RunSubmitResponse>(`/api/v1/runs/${runId}/submit`, data);
  },
  async abandon(runId: number) {
    return api.post<{ id: number; status: string; finished_at?: string | null }>(`/api/v1/runs/${runId}/abandon`);
  },
};

