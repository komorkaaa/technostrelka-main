import { api } from "@/shared/api/client";

export type ModerationQuestItem = {
  id: number;
  author_user_id: number;
  title: string;
  description: string;
  city_area: string;
  difficulty: number;
  duration_minutes: number;
  rules?: string | null;
  status: string;
  created_at: string;
};

export type ModerationQuestCheckpoint = {
  id: number;
  order_index: number;
  title: string;
  lat: number;
  lon: number;
  task_type: string;
  task_text: string;
  quiz_question?: string | null;
  quiz_options?: string[] | null;
  hint?: string | null;
  safety_rules?: string | null;
};

export type ModerationQuestDetails = ModerationQuestItem & {
  reject_reason?: string | null;
  updated_at?: string;
  checkpoints: ModerationQuestCheckpoint[];
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
  async listQuests(statuses: string[] = ["moderation", "hidden"]) {
    const query = statuses.length > 0 ? `?statuses=${encodeURIComponent(statuses.join(","))}` : "";
    return api.get<{ items: ModerationQuestItem[] }>(`/api/v1/moderation/quests${query}`);
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
  async unhideQuest(id: number) {
    return api.post<{ id: number; status: string }>(`/api/v1/moderation/quests/${id}/unhide`);
  },
  async getQuest(id: number) {
    return api.get<ModerationQuestDetails>(`/api/v1/moderation/quests/${id}`);
  },
  async updateQuest(
    id: number,
    data: {
      title: string;
      description: string;
      city_area: string;
      difficulty: number;
      duration_minutes: number;
      rules: string | null;
    },
  ) {
    return api.patch<ModerationQuestDetails>(`/api/v1/moderation/quests/${id}`, data);
  },
  async listComplaints(status?: string) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return api.get<{ items: ComplaintItem[] }>(`/api/v1/moderation/complaints${suffix}`);
  },
  async resolveComplaint(id: number) {
    return api.post<{ id: number; status: string }>(`/api/v1/moderation/complaints/${id}/resolve`, { status: "handled" });
  },
};

