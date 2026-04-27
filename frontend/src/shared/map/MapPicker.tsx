import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { initLeafletDefaultIcon } from "@/shared/map/leafletIcons";
import type { LeafletMouseEvent } from "leaflet";

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapPicker({
  value,
  onChange,
  initialCenter = [56.3269, 44.0059],
}: {
  value: { lat: number; lon: number } | null;
  onChange: (v: { lat: number; lon: number }) => void;
  initialCenter?: [number, number];
}) {
  useEffect(() => {
    initLeafletDefaultIcon();
  }, []);

  const center = useMemo(() => {
    if (value) return [value.lat, value.lon] as [number, number];
    return initialCenter;
  }, [value, initialCenter]);

  const [zoom] = useState(14);

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onPick={(lat, lon) => onChange({ lat, lon })} />
      {value && <Marker position={[value.lat, value.lon]} />}
    </MapContainer>
  );
}
