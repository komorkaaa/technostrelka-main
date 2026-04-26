export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  status?: number;
};

export type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

