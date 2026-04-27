import { api } from "@/shared/api/client";
import type { DifficultyPreset, QuestCreateRequest, QuestDetails, QuestListItem, CheckpointCreateRequest } from "./model";

type QuestListResponse = {
  page: number;
  page_size: number;
  has_next: boolean;
  items: QuestListItem[];
};

export const questApi = {
  async list(params: {
    page?: number;
    min_duration?: number;
    max_duration?: number;
    difficulty_preset?: DifficultyPreset;
    lat?: number;
    lon?: number;
    radius_m?: number;
  }) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.min_duration !== undefined) qs.set("min_duration", String(params.min_duration));
    if (params.max_duration !== undefined) qs.set("max_duration", String(params.max_duration));
    if (params.difficulty_preset) qs.set("difficulty_preset", params.difficulty_preset);
    if (params.lat !== undefined) qs.set("lat", String(params.lat));
    if (params.lon !== undefined) qs.set("lon", String(params.lon));
    if (params.radius_m !== undefined) qs.set("radius_m", String(params.radius_m));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<QuestListResponse>(`/api/v1/quests${suffix}`);
  },

  async get(id: number) {
    return api.get<QuestDetails>(`/api/v1/quests/${id}`);
  },

  async create(data: QuestCreateRequest) {
    return api.post<{ quest_id: number; status: string }>(`/api/v1/quests`, data);
  },

  async addCheckpoint(questId: number, data: CheckpointCreateRequest) {
    return api.post<{ id: number; quest_id: number; order_index: number; title: string; task_type: string }>(
      `/api/v1/quests/${questId}/checkpoints`,
      data,
    );
  },

  async uploadCover(questId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    return api.postForm<{ id: number; cover_path: string }>(`/api/v1/quests/${questId}/cover`, form);
  },

  async submit(questId: number) {
    return api.post<{ id: number; status: string }>(`/api/v1/quests/${questId}/submit`);
  },

  async archive(questId: number) {
    return api.post<{ id: number; status: string }>(`/api/v1/quests/${questId}/archive`);
  },
};

