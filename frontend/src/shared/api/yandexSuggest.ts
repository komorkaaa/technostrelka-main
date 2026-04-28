import { loadYMaps } from "@/shared/map/ymaps";

export type CitySuggestion = {
  title: string;
  subtitle: string;
  value: string;
};

export function hasYandexSuggestApiKey() {
  return ((import.meta as any).env?.VITE_YANDEX_SUGGEST_API_KEY ?? "").trim().length > 0;
}

export async function fetchCitySuggestions(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const text = query.trim();
  if (!text || !hasYandexSuggestApiKey()) return [];
  const ymaps = await loadYMaps();
  if (signal?.aborted) return [];

  const items = (await ymaps.suggest(text, {
    results: 6,
  })) as Array<{ displayName?: string; value?: string }>;
  if (signal?.aborted) return [];

  const seen = new Set<string>();

  return items
    .map((item) => {
      const title = item.displayName?.trim() ?? item.value?.trim() ?? "";
      const value = item.value?.trim() ?? title;
      return { title, subtitle: "", value };
    })
    .filter((item) => item.value)
    .filter((item) => {
      const key = item.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
