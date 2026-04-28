let ymapsReadyPromise: Promise<any> | null = null;
const YANDEX_SUGGEST_API_KEY = (import.meta as any).env?.VITE_YANDEX_SUGGEST_API_KEY ?? "";

declare global {
  interface Window {
    ymaps?: any;
  }
}

export function loadYMaps(): Promise<any> {
  if (window.ymaps) {
    return new Promise((resolve) => {
      window.ymaps!.ready(() => resolve(window.ymaps));
    });
  }

  if (!ymapsReadyPromise) {
    ymapsReadyPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const url = new URL("https://api-maps.yandex.ru/2.1/");
      url.searchParams.set("lang", "ru_RU");
      if (YANDEX_SUGGEST_API_KEY.trim()) {
        url.searchParams.set("suggest_apikey", YANDEX_SUGGEST_API_KEY);
      }
      script.src = url.toString();
      script.async = true;
      script.onload = () => {
        if (!window.ymaps) {
          reject(new Error("Яндекс Карты недоступны"));
          return;
        }
        window.ymaps.ready(() => resolve(window.ymaps));
      };
      script.onerror = () => reject(new Error("Не удалось загрузить Яндекс Карты"));
      document.head.appendChild(script);
    });
  }

  return ymapsReadyPromise;
}
