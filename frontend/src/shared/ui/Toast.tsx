import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastKind = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
};

type ToastCtx = {
  push: (t: Omit<ToastItem, "id">, opts?: { ttlMs?: number }) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

function randomId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, "id">, opts?: { ttlMs?: number }) => {
    const id = randomId();
    const ttlMs = opts?.ttlMs ?? 4500;
    setItems((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, ttlMs);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastHost items={items} onClose={(id) => setItems((prev) => prev.filter((x) => x.id !== id))} />
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastHost({ items, onClose }: { items: ToastItem[]; onClose: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="toastHost" aria-live="polite" aria-relevant="additions removals">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`} role="status">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              {t.title && <div className="toastTitle">{t.title}</div>}
              <div className="toastMsg">{t.message}</div>
            </div>
            <button className="toastClose" onClick={() => onClose(t.id)} aria-label="Закрыть">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

