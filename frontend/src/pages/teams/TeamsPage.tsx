import { useEffect, useState } from "react";
import type { ApiError } from "@/shared/api/types";
import { teamApi } from "@/entities/team/api";
import type { Team } from "@/entities/team/model";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { Button } from "@/shared/ui/Button";
import { Spinner } from "@/shared/ui/Spinner";
import { ApiErrorBox } from "@/shared/ui/ApiErrorBox";
import { useToast } from "@/shared/ui/Toast";

export function TeamsPage() {
  const toast = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const data = await teamApi.my();
      setTeams(data.items);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function createTeam() {
    setError(null);
    try {
      await teamApi.create({ name, description: desc || null });
      setName("");
      setDesc("");
      await reload();
      toast.push({ kind: "success", message: "Команда создана." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  async function join() {
    setError(null);
    try {
      await teamApi.join(joinCode);
      setJoinCode("");
      await reload();
      toast.push({ kind: "success", message: "Вы вступили в команду." });
    } catch (e) {
      setError(e as ApiError);
    }
  }

  return (
    <div className="card wide">
      <div className="cardHeader">
        <h1>Команды</h1>
        <p className="muted">Создайте команду (2–6) или вступите по коду.</p>
      </div>

      {error && <ApiErrorBox error={error} />}

      <div className="grid2">
        <div className="card" style={{ width: "100%" }}>
          <div className="cardHeader">
            <h1 style={{ fontSize: 18 }}>Создать</h1>
          </div>
          <div className="form">
            <label className="label">
              Название
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название команды" />
            </label>
            <label className="label">
              Описание
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Необязательно" />
            </label>
            <Button onClick={createTeam} disabled={name.trim().length < 2}>
              Создать команду
            </Button>
          </div>
        </div>

        <div className="card" style={{ width: "100%" }}>
          <div className="cardHeader">
            <h1 style={{ fontSize: 18 }}>Вступить</h1>
          </div>
          <div className="form">
            <label className="label">
              Код команды
              <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="ABCD1234" />
            </label>
            <Button onClick={join} disabled={joinCode.trim().length < 4}>
              Вступить
            </Button>
          </div>
        </div>
      </div>

      <div className="form">
        <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>Мои команды</h2>
        {loading ? (
          <div className="spinnerWrap" style={{ padding: 18 }}>
            <Spinner />
          </div>
        ) : teams.length === 0 ? (
          <div className="hint">Пока команд нет.</div>
        ) : (
          teams.map((t) => (
            <div key={t.id} className="card" style={{ width: "100%", padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 750 }}>{t.name}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="pill">
                    Код: <span className="mono">{t.join_code}</span>
                  </span>
                  <span className="pill">
                    Участники: {t.members_count ?? "?"}/6
                  </span>
                </div>
              </div>
              {t.description && (
                <div className="muted descriptionText" style={{ fontSize: 13, marginTop: 8 }}>
                  {t.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
