export type RunStartResponse = {
  id: number;
  quest_id: number;
  mode: "solo" | "team" | string;
  status: string;
  current_checkpoint_order: number;
};

export type RunState = {
  id: number;
  quest_id: number;
  mode: string;
  status: string;
  score_total: number;
  progress: string; // "2/5"
  current_checkpoint: null | {
    id: number;
    order_index: number;
    title: string;
    task_type: string;
    task_text: string;
    hint?: string | null;
  };
};

export type RunSubmitResponse = {
  correct: boolean;
  status: string;
};

