import { api } from "@/shared/api/client";

export type ModerationQuestItem = {
  id: number;
  author_user_id: number;
  title: string;
  description: string;
  city_area: string;
  difficulty: number;
  duration_minutes: number;
  status: string;
  created_at: string;
};

export type ComplaintItem = {
  id: number;
  author_user_id: number;
  quest_id?: number | null;
  checkpoint_id?: number | null;
  reason: string;
  status: string;
  created_at: string;
};

export const moderationApi = {
  async listQuests() {
    return api.get<{ items: ModerationQuestItem[] }>("/api/v1/moderation/quests");
  },
  async approveQuest(id: number) {
    return api.post<{ id: number; status: string; published_at?: string | null }>(`/api/v1/moderation/quests/${id}/approve`);
  },
  async rejectQuest(id: number, reason: string) {
    return api.post<{ id: number; status: string; reject_reason: string }>(`/api/v1/moderation/quests/${id}/reject`, { reason });
  },
  async hideQuest(id: number) {
    return api.post<{ id: number; status: string }>(`/api/v1/moderation/quests/${id}/hide`);
  },
  async listComplaints(status?: string) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return api.get<{ items: ComplaintItem[] }>(`/api/v1/moderation/complaints${suffix}`);
  },
  async resolveComplaint(id: number) {
    return api.post<{ id: number; status: string }>(`/api/v1/moderation/complaints/${id}/resolve`, { status: "handled" });
  },
};

