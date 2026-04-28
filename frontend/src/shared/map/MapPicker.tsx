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
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);

  const center = useMemo(() => {
    if (value) return [value.lat, value.lon] as [number, number];
    return initialCenter;
  }, [value, initialCenter]);

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
      map.events.add("click", (e: any) => {
        const coords = e.get("coords");
        if (!Array.isArray(coords) || coords.length < 2) return;
        onChange({ lat: Number(coords[0]), lon: Number(coords[1]) });
      });

      mapInstanceRef.current = map;
      restoreMapContainerSize();
      fitMapToViewport();

      if (value) {
        const pm = new ymaps.Placemark([value.lat, value.lon], {}, { preset: "islands#blueDotIcon" });
        map.geoObjects.add(pm);
        placemarkRef.current = pm;
      }
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
    fitMapToViewport();
  }, [value]);

  return (
    <div ref={frameRef} className="mapFrame">
      <div ref={mapRef} className="mapContainer" />
    </div>
  );
}
