export type User = {
  id: number;
  email: string;
  nickname?: string | null;
  age_group?: "14-15" | "16-17" | null;
  role?: "user" | "moderator" | string;
};
