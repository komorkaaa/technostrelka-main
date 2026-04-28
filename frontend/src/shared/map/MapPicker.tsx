import { useEffect, useMemo, useRef } from "react";
import { loadYMaps } from "@/shared/map/ymaps";

export function MapPicker({
  value,
  onChange,
  initialCenter = [56.3269, 44.0059],
}: {
  value: { lat: number; lon: number } | null;
  onChange: (v: { lat: number; lon: number }) => void;
  initialCenter?: [number, number];
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);

  const center = useMemo(() => {
    if (value) return [value.lat, value.lon] as [number, number];
    return initialCenter;
  }, [value, initialCenter]);

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
      map.events.add("click", (e: any) => {
        const coords = e.get("coords");
        if (!Array.isArray(coords) || coords.length < 2) return;
        onChange({ lat: Number(coords[0]), lon: Number(coords[1]) });
      });

      mapInstanceRef.current = map;

      if (value) {
        const pm = new ymaps.Placemark([value.lat, value.lon], {}, { preset: "islands#blueDotIcon" });
        map.geoObjects.add(pm);
        placemarkRef.current = pm;
      }
    });

    return () => {
      disposed = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        placemarkRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.ymaps || !value) return;
    const map = mapInstanceRef.current;
    const ymaps = window.ymaps;
    if (!placemarkRef.current) {
      const pm = new ymaps.Placemark([value.lat, value.lon], {}, { preset: "islands#blueDotIcon" });
      map.geoObjects.add(pm);
      placemarkRef.current = pm;
    } else {
      placemarkRef.current.geometry.setCoordinates([value.lat, value.lon]);
    }
    map.setCenter([value.lat, value.lon], map.getZoom(), { duration: 200 });
  }, [value]);

  return <div ref={mapRef} className="mapContainer" />;
}
