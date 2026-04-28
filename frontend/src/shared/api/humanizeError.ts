import type { ApiError } from "@/shared/api/types";

type ValidationDetail = {
  loc?: (string | number)[];
  msg?: string;
};

function tryExtractValidationDetails(details: unknown): string[] | null {
  if (!Array.isArray(details)) return null;
  const lines: string[] = [];
  for (const item of details) {
    if (!item || typeof item !== "object") continue;
    const d = item as ValidationDetail;
    const loc = Array.isArray(d.loc) ? d.loc.filter((x) => typeof x === "string" || typeof x === "number").join(".") : "";
    const msg = typeof d.msg === "string" ? d.msg : "";
    const line = [loc, msg].filter(Boolean).join(": ");
    if (line) lines.push(line);
  }
  return lines.length ? lines : null;
}

function translateKnownMessage(message: string): string {
  const dict: Record<string, string> = {
    "Failed to fetch": "Не удалось выполнить запрос к серверу",
    "NetworkError when attempting to fetch resource.": "Ошибка сети при обращении к серверу",
    "Load failed": "Не удалось загрузить данные",
    "Network request failed": "Сетевой запрос завершился ошибкой",
    "Bad Request": "Некорректный запрос",
    Unauthorized: "Требуется авторизация",
    Forbidden: "Доступ запрещён",
    "Not Found": "Ресурс не найден",
    "Internal Server Error": "Внутренняя ошибка сервера",
    "Service Unavailable": "Сервис временно недоступен",
    "Gateway Timeout": "Сервер не ответил вовремя",
    "Request failed": "Ошибка запроса",
    "Bad response": "Некорректный ответ сервера",
    "API error": "Ошибка API",
    "Only published quests can be started": "Можно начать только опубликованный квест",
    "This user already has a finished run for this quest in last 24 hours":
      "Этот квест уже засчитывался вам за последние 24 часа",
    "Team cannot start quest when author is in the team":
      "Нельзя проходить квест командой, если автор квеста состоит в этой команде",
    "Nickname is already taken": "Этот никнейм уже занят",
    "Too many attempts for this checkpoint": "Слишком много попыток для этой точки",
    "lat, lon and radius_m must be provided together": "Для поиска рядом укажите lat, lon и radius_m вместе",
    "Invalid difficulty_preset": "Неверный фильтр сложности",
    "Geolocation is not available in this browser": "Геолокация недоступна в этом браузере",
    "Location permission denied": "Нет доступа к геолокации",
  };
  return dict[message] ?? message;
}

export function humanizeApiError(error: ApiError): { title: string; message: string; details?: string[] } {
  const translatedMessage = translateKnownMessage(error.message);

  const codeDict: Record<string, { title: string; message: string }> = {
    TEAM_REQUIRED: { title: "Команда", message: translatedMessage || "Выберите команду." },
    GEO_UNAVAILABLE: { title: "Геолокация", message: translatedMessage || "Геолокация недоступна." },
    GEO_DENIED: { title: "Геолокация", message: translatedMessage || "Нет доступа к геолокации." },
    NETWORK_ERROR: { title: "Сеть", message: translatedMessage || "Не удалось связаться с сервером." },
  };
  if (error.code in codeDict) {
    return codeDict[error.code]!;
  }

  if (error.code === "VALIDATION_ERROR") {
    const details = tryExtractValidationDetails(error.details) ?? undefined;
    return { title: "Проверьте ввод", message: "Некоторые поля заполнены неверно.", details };
  }

  if (error.status === 401) {
    return { title: "Нужно войти", message: translatedMessage || "Сессия истекла. Войдите снова." };
  }

  if (error.status === 403) {
    return { title: "Доступ запрещён", message: translatedMessage || "Недостаточно прав для этого действия." };
  }

  if (error.status === 404) {
    return { title: "Не найдено", message: translatedMessage || "Запрошенный ресурс не найден." };
  }

  const title = error.code === "HTTP_ERROR" ? "Ошибка" : error.code;
  return { title, message: translatedMessage || "Что-то пошло не так." };
}
