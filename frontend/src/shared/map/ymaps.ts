let ymapsReadyPromise: Promise<any> | null = null;

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
      script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
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
