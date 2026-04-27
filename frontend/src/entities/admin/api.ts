import { api } from "@/shared/api/client";
import type { UserRole } from "@/entities/user/model";

export type AdminUserItem = {
  id: number;
  email: string;
  nickname?: string | null;
  age_group?: "14-15" | "16-17" | null;
  role: UserRole;
};

export type AdminQuestItem = {
  id: number;
  title: string;
  city_area: string;
  difficulty: number;
  duration_minutes: number;
  status: string;
  created_at: string;
};

export const adminApi = {
  async listUsers() {
    return api.get<{ items: AdminUserItem[] }>("/api/v1/admin/users");
  },
  async createUser(data: { email: string; password: string; role: UserRole }) {
    return api.post<{ id: number; email: string; role: UserRole }>("/api/v1/admin/users", data);
  },
  async setUserRole(userId: number, role: UserRole) {
    return api.patch<{ id: number; email: string; role: UserRole }>(`/api/v1/admin/users/${userId}/role`, { role });
  },
  async listModerationQuests() {
    return api.get<{ items: AdminQuestItem[] }>("/api/v1/admin/quests/moderation");
  },
  async approveQuest(id: number) {
    return api.post<{ id: number; status: string }>(`/api/v1/admin/quests/${id}/approve`);
  },
  async rejectQuest(id: number, reason: string) {
    return api.post<{ id: number; status: string; reject_reason: string }>(`/api/v1/admin/quests/${id}/reject`, { reason });
  },
};
