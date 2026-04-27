import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/model/useAuth";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import type { ApiError } from "@/shared/api/types";
import { userApi } from "@/entities/user/api";

function ErrorBox({ error }: { error: ApiError }) {
  return (
    <div className="errorBox">
      <div className="errorTitle">{error.code}</div>
      <div className="errorMsg">{error.message}</div>
    </div>
  );
}

export function ProfilePage() {
  const { user, refreshSession } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [ageGroup, setAgeGroup] = useState<"14-15" | "16-17" | "">((user?.age_group as any) ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const canSave = nickname.trim().length >= 2 && ageGroup !== "";

  const title = useMemo(() => (user?.role === "moderator" ? "Профиль (модератор)" : "Профиль"), [user?.role]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await userApi.patchMe({ nickname: nickname.trim(), age_group: ageGroup as any });
      await refreshSession();
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card wide">
      <div className="cardHeader">
        <h1>{title}</h1>
        <p className="muted">Для MVP нужны никнейм и возрастная группа.</p>
      </div>

      {error && <ErrorBox error={error} />}

      <div className="form">
        <label className="label">
          Email
          <Input value={user?.email ?? ""} readOnly />
        </label>
        <label className="label">
          Никнейм
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. neo" />
        </label>
        <label className="label">
          Возрастная группа
          <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as any)}>
            <option value="">Выберите…</option>
            <option value="14-15">14–15</option>
            <option value="16-17">16–17</option>
          </Select>
        </label>
        <Button onClick={save} disabled={!canSave || saving}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
