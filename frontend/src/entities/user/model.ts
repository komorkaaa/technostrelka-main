export type UserRole = "user" | "moderator" | "admin";

export type User = {
  id: number;
  email: string;
  nickname?: string | null;
  age_group?: "10-11" | "12-13" | "14-15" | "16-17" | "18+" | null;
  role?: UserRole | string;
};
