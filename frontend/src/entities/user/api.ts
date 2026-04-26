import { api } from "@/shared/api/client";
import type { User } from "@/entities/user/model";

export const userApi = {
  async getMe() {
    return api.get<User>("/api/v1/user/me");
  },
};

