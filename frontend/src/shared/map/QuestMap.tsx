import { useEffect, useMemo, useRef, useState } from "react";
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
  const mapInstanceRef = useRef<any>(null);
  const collectionRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const center = useMemo(() => {
    const start = checkpoints.find((c) => c.order_index === 1) ?? checkpoints[0];
    return start ? ([start.lat, start.lon] as [number, number]) : ([56.3269, 44.0059] as [number, number]);
  }, [checkpoints]);

  const points = useMemo(() => checkpoints.map((cp) => ({ cp, st: statusByOrder?.[cp.order_index] ?? "locked" })), [checkpoints, statusByOrder]);

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
      setMapReady(true);
    });

    return () => {
      disposed = true;
      setMapReady(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        collectionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    if (!collectionRef.current || !window.ymaps || !mapInstanceRef.current) return;
    const ymaps = window.ymaps;
    const collection = collectionRef.current;
    const map = mapInstanceRef.current;
    collection.removeAll();

    for (const { cp, st } of points) {
      const preset = st === "passed" ? "islands#greenDotIcon" : st === "active" ? "islands#blueDotIcon" : "islands#grayDotIcon";
      const balloon = `<div><div style="font-weight:700">${cp.order_index}. ${cp.title}</div><div style="font-size:12px;opacity:.8">Тип: ${taskTypeLabel(cp.task_type)}</div></div>`;
      const pm = new ymaps.Placemark([cp.lat, cp.lon], { balloonContent: balloon }, { preset });
      collection.add(pm);
    }

    if (points.length > 1) {
      const routeLine = new ymaps.Polyline(
        points.map(({ cp }) => [cp.lat, cp.lon]),
        {},
        {
          strokeColor: "#7dd3fc",
          strokeWidth: 4,
          strokeOpacity: 0.75,
        }
      );
      collection.add(routeLine);
    }

    if (points.length > 1) {
      map.setBounds(collection.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 32,
      });
      return;
    }

    map.setCenter(center, map.getZoom(), { duration: 200 });
  }, [points, center, mapReady]);

  return <div ref={mapRef} className="mapContainer" />;
}
