export type DifficultyPreset = "ask" | "play" | "pro";

export type QuestListItem = {
  id: number;
  title: string;
  description: string;
  city_area: string;
  difficulty: number;
  duration_minutes: number;
  status: string;
  published_at?: string | null;
};

export type QuestCheckpoint = {
  id: number;
  order_index: number;
  title: string;
  lat: number;
  lon: number;
  task_type: "codeword" | "quiz" | string;
  task_text: string;
  quiz_question?: string | null;
  quiz_options?: string[] | null;
  hint?: string | null;
  safety_rules?: string | null;
};

export type QuestDetails = {
  id: number;
  title: string;
  description: string;
  city_area: string;
  difficulty: number;
  duration_minutes: number;
  rules?: string | null;
  cover_path?: string | null;
  status: string;
  published_at?: string | null;
  checkpoints: QuestCheckpoint[];
};

export type QuestCreateRequest = {
  title: string;
  description: string;
  city_area: string;
  difficulty: number;
  duration_minutes: number;
  rules?: string | null;
};

export type CheckpointCreateRequest = {
  order_index: number;
  title: string;
  lat: number;
  lon: number;
  task_type: "codeword" | "quiz";
  task_text: string;
  codeword_answer?: string | null;
  quiz_question?: string | null;
  quiz_options?: string[] | null;
  quiz_correct_index?: number | null;
  hint?: string | null;
  safety_rules?: string | null;
};

