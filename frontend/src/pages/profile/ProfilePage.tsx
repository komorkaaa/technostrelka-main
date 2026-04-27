import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/model/useAuth";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import type { ApiError } from "@/shared/api/types";
import { userApi } from "@/entities/user/api";
import { ApiErrorBox } from "@/shared/ui/ApiErrorBox";
import { useToast } from "@/shared/ui/Toast";

function roleLabel(role?: string | null) {
  if (role === "admin") return "Администратор";
  if (role === "moderator") return "Модератор";
  return "Пользователь";
}

function ageGroupLabel(v?: string | null) {
  if (v === "10-11") return "10–11";
  if (v === "12-13") return "12–13";
  if (v === "14-15") return "14–15";
  if (v === "16-17") return "16–17";
  if (v === "18+") return "18+";
  return "не выбрано";
}

export function ProfilePage() {
  const { user, refreshSession } = useAuth();
  const toast = useToast();
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [ageGroup, setAgeGroup] = useState<"10-11" | "12-13" | "14-15" | "16-17" | "18+" | "">((user?.age_group as any) ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const nicknameOk = nickname.trim().length >= 2;
  const ageOk = ageGroup !== "";
  const canSave = nicknameOk && ageOk;

  const title = useMemo(() => (user?.role === "moderator" ? "Профиль (модератор)" : "Профиль"), [user?.role]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await userApi.patchMe({ nickname: nickname.trim(), age_group: ageGroup as any });
      await refreshSession();
      toast.push({ kind: "success", message: "Профиль сохранён." });
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card wide">
      <div
        className="cardHeader"
        style={{
          background:
            "radial-gradient(700px 240px at 15% 10%, rgba(125,211,252,0.18), transparent 60%), radial-gradient(700px 240px at 85% 30%, rgba(167,139,250,0.16), transparent 60%)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
          margin: "0 0 12px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h1>{title}</h1>
            <p className="muted" style={{ margin: 0 }}>
              Аккаунт и настройки профиля.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="pill">Роль: {roleLabel(user?.role)}</span>
            <span className="pill">Возраст: {ageGroupLabel(user?.age_group ?? null)}</span>
          </div>
        </div>
      </div>

      {error && <ApiErrorBox error={error} />}

      <div className="grid2">
        <div className="card" style={{ width: "100%" }}>
          <div className="cardHeader">
            <h1 style={{ fontSize: 18 }}>Аккаунт</h1>
          </div>
          <div className="form" style={{ gap: 10 }}>
            <div className="row" style={{ padding: "0 8px 6px" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, overflowWrap: "anywhere" }}>{user?.nickname ? user.nickname : "Без никнейма"}</div>
                <div className="muted" style={{ fontSize: 13, overflowWrap: "anywhere" }}>
                  {user?.email ?? ""}
                </div>
              </div>
              <span className="pill">{roleLabel(user?.role)}</span>
            </div>

            <div className="grid3" style={{ alignItems: "stretch" }}>
              <div className="card" style={{ width: "100%", padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  ID
                </div>
                <div className="mono" style={{ fontWeight: 800 }}>
                  {user?.id ?? "—"}
                </div>
              </div>
              <div className="card" style={{ width: "100%", padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Возраст
                </div>
                <div style={{ fontWeight: 800 }}>{ageGroupLabel(user?.age_group ?? null)}</div>
              </div>
              <div className="card" style={{ width: "100%", padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Статус
                </div>
                <div style={{ fontWeight: 800 }}>Активен</div>
              </div>
            </div>

            <div className="hint">Никнейм и возрастная группа используются для команд и рейтинга.</div>
          </div>
        </div>

        <div className="card" style={{ width: "100%" }}>
          <div className="cardHeader">
            <h1 style={{ fontSize: 18 }}>Настройки профиля</h1>
            <p className="muted" style={{ margin: 0 }}>
              Заполни данные — это займёт минуту.
            </p>
          </div>

          <div className="form">
            <label className="label">
              Никнейм
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="например, neo" />
            </label>
            {!nicknameOk && <div className="hint">Никнейм должен быть минимум 2 символа.</div>}

            <label className="label">
              Возрастная группа
              <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as any)}>
                <option value="">Выберите…</option>
                <option value="10-11">10–11</option>
                <option value="12-13">12–13</option>
                <option value="14-15">14–15</option>
                <option value="16-17">16–17</option>
                <option value="18+">18+</option>
              </Select>
            </label>
            {!ageOk && <div className="hint">Выбери возрастную группу.</div>}

            <div className="cardFooter" style={{ justifyContent: "space-between" }}>
              <div className="muted" style={{ fontSize: 13 }}>
                {canSave ? "Готово к сохранению." : "Заполни обязательные поля."}
              </div>
              <Button onClick={save} disabled={!canSave || saving}>
                {saving ? "Сохраняем…" : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
