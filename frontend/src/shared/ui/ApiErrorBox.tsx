import type { ApiError } from "@/shared/api/types";
import { humanizeApiError } from "@/shared/api/humanizeError";

export function ApiErrorBox({ error }: { error: ApiError }) {
  const h = humanizeApiError(error);
  const details = (h.details ?? []).slice(0, 3);

  return (
    <div className="errorBox" role="alert">
      <div className="errorTitle">{h.title}</div>
      <div className="errorMsg">{h.message}</div>
      {details.length > 0 && (
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
          {details.map((x, idx) => (
            <li key={idx}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

