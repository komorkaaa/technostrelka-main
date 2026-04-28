import { useEffect, useMemo, useRef } from "react";
import type { QuestCheckpoint } from "@/entities/quest/model";
import { loadYMaps } from "@/shared/map/ymaps";

type CpStatus = "locked" | "active" | "passed";

function taskTypeLabel(t: QuestCheckpoint["task_type"]) {
  if (t === "codeword") return "Код-слово";
  if (t === "quiz") return "Вопрос";
  return t;
}

export function QuestMap({
  checkpoints,
  statusByOrder,
}: {
  checkpoints: QuestCheckpoint[];
  statusByOrder?: Record<number, CpStatus>;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const collectionRef = useRef<any>(null);

  const center = useMemo(() => {
    const start = checkpoints.find((c) => c.order_index === 1) ?? checkpoints[0];
    return start ? ([start.lat, start.lon] as [number, number]) : ([56.3269, 44.0059] as [number, number]);
  }, [checkpoints]);

  const points = useMemo(() => checkpoints.map((cp) => ({ cp, st: statusByOrder?.[cp.order_index] ?? "locked" })), [checkpoints, statusByOrder]);

  function fitMapToViewport() {
    const map = mapInstanceRef.current;
    if (!map) return;

    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        try {
          map.container.fitToViewport();
        } catch {
          // Ignore viewport sync failures during transient fullscreen transitions.
        }
      }, 0);
    });
  }

  function restoreMapContainerSize() {
    const mapElement = mapRef.current;
    const frameElement = frameRef.current;
    if (!mapElement || !frameElement) return;

    mapElement.style.width = "100%";
    mapElement.style.height = "100%";
    mapElement.style.position = "absolute";
    mapElement.style.inset = "0";
    mapElement.style.left = "0";
    mapElement.style.top = "0";

    frameElement.style.width = "100%";
    frameElement.style.height = "360px";
    frameElement.style.minHeight = "360px";
  }

  useEffect(() => {
    if (!mapRef.current) return;
    let disposed = false;

    void loadYMaps().then((ymaps) => {
      if (disposed || !mapRef.current) return;
      const map = new ymaps.Map(mapRef.current, {
        center,
        zoom: 14,
        controls: ["zoomControl", "fullscreenControl"],
      });
      map.behaviors.disable("scrollZoom");
      mapInstanceRef.current = map;
      const collection = new ymaps.GeoObjectCollection();
      map.geoObjects.add(collection);
      collectionRef.current = collection;
      restoreMapContainerSize();
      fitMapToViewport();
    });

    const handleViewportChange = () => {
      restoreMapContainerSize();
      fitMapToViewport();
    };

    window.addEventListener("resize", handleViewportChange);
    document.addEventListener("fullscreenchange", handleViewportChange);

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleViewportChange);
      document.removeEventListener("fullscreenchange", handleViewportChange);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        collectionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!collectionRef.current || !window.ymaps || !mapInstanceRef.current) return;
    const ymaps = window.ymaps;
    const collection = collectionRef.current;
    collection.removeAll();

    for (const { cp, st } of points) {
      const preset = st === "passed" ? "islands#greenDotIcon" : st === "active" ? "islands#blueDotIcon" : "islands#grayDotIcon";
      const balloon = `<div><div style="font-weight:700">${cp.order_index}. ${cp.title}</div><div style="font-size:12px;opacity:.8">Тип: ${taskTypeLabel(cp.task_type)}</div></div>`;
      const pm = new ymaps.Placemark([cp.lat, cp.lon], { balloonContent: balloon }, { preset });
      collection.add(pm);
    }

    mapInstanceRef.current.setCenter(center, mapInstanceRef.current.getZoom(), { duration: 200 });
    fitMapToViewport();
  }, [points, center]);

  return (
    <div ref={frameRef} className="mapFrame">
      <div ref={mapRef} className="mapContainer" />
    </div>
  );
}
