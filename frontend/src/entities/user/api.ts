import { api } from "@/shared/api/client";
import type { User } from "@/entities/user/model";

export const userApi = {
  async getMe() {
    return api.get<User>("/api/v1/user/me");
  },
  async patchMe(data: { nickname?: string | null; age_group?: "14-15" | "16-17" | null }) {
    return api.patch<User>("/api/v1/user/me", data);
  },
};
