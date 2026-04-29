import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchCitySuggestions, hasYandexSuggestApiKey, type CitySuggestion } from "@/shared/api/yandexSuggest";
import { Input } from "@/shared/ui/Input";

export function CitySuggestInput({
  value,
  onChange,
  disabled,
  placeholder = "Начни вводить город",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (disabled || !hasYandexSuggestApiKey() || value.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const items = await fetchCitySuggestions(value, controller.signal);
        setSuggestions(items);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [disabled, value]);

  function applySuggestion(item: CitySuggestion) {
    onChange(item.value);
    setSuggestions([]);
    setOpen(false);
  }

  const updateDropdownRect = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || !focused) return;
    updateDropdownRect();
  }, [open, focused, updateDropdownRect]);

  useEffect(() => {
    if (!open || !focused) return;
    const onReposition = () => updateDropdownRect();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, focused, updateDropdownRect]);

  return (
    <>
      <div className="suggestField">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            window.setTimeout(() => setOpen(false), 120);
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
        />
        {!disabled &&
          hasYandexSuggestApiKey() &&
          focused &&
          open &&
          (loading || suggestions.length > 0) &&
          dropdownRect &&
          createPortal(
            <div
              className="suggestDropdown"
              style={{
                position: "absolute",
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: dropdownRect.width,
                zIndex: 1200,
              }}
            >
              {loading && <div className="suggestItem muted">Ищем варианты…</div>}
              {!loading &&
                suggestions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className="suggestItem"
                    onMouseDown={() => applySuggestion(item)}
                  >
                    <span>{item.title}</span>
                    {item.subtitle && <span className="muted" style={{ fontSize: 12 }}>{item.subtitle}</span>}
                  </button>
                ))}
            </div>,
            document.body
          )}
      </div>
      {!disabled && !hasYandexSuggestApiKey() && (
        <div className="hint">Для подсказок города добавь `VITE_YANDEX_SUGGEST_API_KEY` в `.env`.</div>
      )}
    </>
  );
}
