import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { QuestCheckpoint } from "@/entities/quest/model";
import { coloredDotIcon, initLeafletDefaultIcon } from "@/shared/map/leafletIcons";

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
  useEffect(() => {
    initLeafletDefaultIcon();
  }, []);

  const center = useMemo(() => {
    const start = checkpoints.find((c) => c.order_index === 1) ?? checkpoints[0];
    return start ? ([start.lat, start.lon] as [number, number]) : ([56.3269, 44.0059] as [number, number]);
  }, [checkpoints]);

  const markers = useMemo(() => {
    return checkpoints.map((cp) => {
      const st = statusByOrder?.[cp.order_index] ?? "locked";
      const color = st === "passed" ? "#34d399" : st === "active" ? "#7dd3fc" : "#94a3b8";
      return { cp, icon: coloredDotIcon(color) };
    });
  }, [checkpoints, statusByOrder]);

  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup chunkedLoading>
        {markers.map(({ cp, icon }) => (
          <Marker key={cp.id} position={[cp.lat, cp.lon]} icon={icon}>
            <Popup>
              <div style={{ fontWeight: 700 }}>
                {cp.order_index}. {cp.title}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Тип: {taskTypeLabel(cp.task_type)}</div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
