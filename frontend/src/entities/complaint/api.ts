import { api } from "@/shared/api/client";

export const complaintApi = {
  async create(data: { quest_id?: number; checkpoint_id?: number; reason: string }) {
    return api.post<{ id: number; status: string; quest_id?: number | null; checkpoint_id?: number | null; created_at: string }>(
      "/api/v1/complaints",
      data,
    );
  },
};

