import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ApiError } from "@/shared/api/types";
import { questApi } from "@/entities/quest/api";
import type { DifficultyPreset, QuestListItem } from "@/entities/quest/model";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Spinner } from "@/shared/ui/Spinner";
import { ApiErrorBox } from "@/shared/ui/ApiErrorBox";

export function QuestsPage() {
  const [items, setItems] = useState<QuestListItem[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [minDuration, setMinDuration] = useState<string>("");
  const [maxDuration, setMaxDuration] = useState<string>("");
  const [preset, setPreset] = useState<DifficultyPreset | "">("");

  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [radiusM, setRadiusM] = useState<string>("2000");
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null);

  const params = useMemo(() => {
    const p: any = { page };
    if (minDuration) p.min_duration = Number(minDuration);
    if (maxDuration) p.max_duration = Number(maxDuration);
    if (preset) p.difficulty_preset = preset;
    if (nearbyEnabled && pos) {
      p.lat = pos.lat;
      p.lon = pos.lon;
      p.radius_m = Number(radiusM || "2000");
    }
    return p;
  }, [page, minDuration, maxDuration, preset, nearbyEnabled, pos, radiusM]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await questApi.list(params);
        setItems(data.items);
        setHasNextPage(data.has_next);
      } catch (e) {
        setError(e as ApiError);
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  function requestGeo() {
    if (!navigator.geolocation) {
      setError({ status: 0, code: "GEO_UNAVAILABLE", message: "Геолокация недоступна в этом браузере" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setError({ status: 0, code: "GEO_DENIED", message: "Нет доступа к геолокации" }),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  const hasPrevPage = page > 1;
  const showPagination = hasPrevPage || hasNextPage;

  return (
    <div className="card wide">
      <div className="cardHeader">
        <h1>Квесты</h1>
        <p className="muted">Лента опубликованных квестов. Фильтры и поиск “рядом”.</p>
      </div>

      <div className="form filters3">
        <label className="label">
          Длительность от (мин)
          <Input value={minDuration} onChange={(e) => setMinDuration(e.target.value)} placeholder="например, 30" />
        </label>
        <label className="label">
          Длительность до (мин)
          <Input value={maxDuration} onChange={(e) => setMaxDuration(e.target.value)} placeholder="например, 90" />
        </label>
        <label className="label">
          Сложность
          <Select value={preset} onChange={(e) => setPreset(e.target.value as any)}>
            <option value="">Любая</option>
            <option value="ask">Мне только спросить (1–2)</option>
            <option value="play">Я бы еще поиграл (3)</option>
            <option value="pro">Работают профи (4–5)</option>
          </Select>
        </label>
      </div>

      <div className="row" style={{ paddingTop: 0 }}>
        <label className="pill" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={nearbyEnabled}
            onChange={(e) => setNearbyEnabled(e.target.checked)}
            style={{ margin: 0 }}
          />
          Старт рядом со мной
        </label>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {nearbyEnabled && (
            <>
              <div className="muted" style={{ fontSize: 13 }}>
                {pos ? `${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}` : "Локация не задана"}
              </div>
              <Input style={{ width: 140 }} value={radiusM} onChange={(e) => setRadiusM(e.target.value)} placeholder="радиус, м" />
              <Button className="btn secondary" onClick={requestGeo}>
                Определить
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <ApiErrorBox error={error} />}
      {loading ? (
        <div className="spinnerWrap" style={{ padding: 16 }}>
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <div className="hint">Ничего не найдено.</div>
      ) : (
        <div className="form" style={{ gap: 10 }}>
          {items.map((q) => (
            <Link key={q.id} to={`/quests/${q.id}`} className="card" style={{ width: "100%", padding: 14 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontWeight: 750 }}>{q.title}</div>
                <span className="pill">{q.city_area}</span>
                <span className="pill">Сложность {q.difficulty}</span>
                <span className="pill">{q.duration_minutes} мин</span>
              </div>
              <div className="muted descriptionText" style={{ fontSize: 13, marginTop: 8 }}>
                {q.description}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showPagination && (
        <div className="cardFooter">
          <Button className="btn secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!hasPrevPage || loading}>
            Назад
          </Button>
          <div className="muted">Страница {page}</div>
          <Button className="btn secondary" onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage || loading}>
            Вперёд
          </Button>
        </div>
      )}
    </div>
  );
}
