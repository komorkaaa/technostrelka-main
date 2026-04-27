export type Team = {
  id: number;
  name: string;
  description?: string | null;
  join_code: string;
  owner_user_id: number;
  my_role?: string;
  members_count?: number;
};

