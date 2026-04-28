import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";

type Health = { status: string };

function getBuildInfo() {
  const env = (import.meta as any).env ?? {};
  return {
    mode: String(env.MODE ?? ""),
    buildRef: String(env.VITE_BUILD_REF ?? "unknown"),
    buildTime: String(env.VITE_BUILD_TIME ?? "unknown"),
  };
}

export function StatusPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const info = getBuildInfo();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/health", { cache: "no-store" });
      const json = (await res.json()) as Health;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHealth(json);
    } catch (e) {
      setHealth(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page">
      <div className="card wide">
        <div className="cardHeader">
          <h1>Статус</h1>
          <p className="muted">Быстрая проверка работоспособности</p>
        </div>

        <div className="row">
          <div>
            <div className="muted">Backend /health</div>
            <div className="mono">
              {loading ? "Загрузка..." : health ? JSON.stringify(health) : error ? `Ошибка: ${error}` : "Неизвестно"}
            </div>
          </div>
          <Button onClick={load} disabled={loading}>
            {loading ? "Обновляем..." : "Обновить"}
          </Button>
        </div>

        <div className="hint">
          <div>
            mode: <span className="mono">{info.mode}</span>
          </div>
          <div>
            buildRef: <span className="mono">{info.buildRef}</span>
          </div>
          <div>
            buildTime: <span className="mono">{info.buildTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
