import {
  Children,
  isValidElement,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

type SelectOption = {
  value: string;
  label: string;
  disabled: boolean;
};

type NativeOptionProps = {
  value?: string | number;
  children?: unknown;
  disabled?: boolean;
};

type NativeOptGroupProps = {
  children?: unknown;
};

function isOptionElement(node: unknown): node is ReactElement<NativeOptionProps> {
  return isValidElement<NativeOptionProps>(node) && node.type === "option";
}

function isOptGroupElement(node: unknown): node is ReactElement<NativeOptGroupProps> {
  return isValidElement<NativeOptGroupProps>(node) && node.type === "optgroup";
}

function extractOptionLabel(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((part) => extractOptionLabel(part)).join("");
  if (isValidElement(node)) return extractOptionLabel(node.props.children as ReactNode);
  return "";
}

function collectOptions(children: SelectHTMLAttributes<HTMLSelectElement>["children"]): SelectOption[] {
  const options: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (isOptionElement(child)) {
      const value = String(child.props.value ?? "");
      const label = extractOptionLabel(child.props.children as ReactNode).trim();
      options.push({ value, label, disabled: Boolean(child.props.disabled) });
    }
    if (isOptGroupElement(child) && child.props?.children) {
      Children.forEach(child.props.children, (nested) => {
        if (!isOptionElement(nested)) return;
        const value = String(nested.props.value ?? "");
        const label = extractOptionLabel(nested.props.children as ReactNode).trim();
        options.push({ value, label, disabled: Boolean(nested.props.disabled) });
      });
    }
  });
  return options;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, value, defaultValue, onChange, disabled, children } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const options = useMemo(() => collectOptions(children), [children]);

  const selectedValue = String(value ?? defaultValue ?? "");
  const selectedOption = options.find((o) => o.value === selectedValue) ?? options.find((o) => !o.disabled) ?? options[0];
  const displayLabel = selectedOption?.label ?? "Выберите значение";

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [selectedValue]);

  const updateDropdownRect = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateDropdownRect();
  }, [open, updateDropdownRect]);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => updateDropdownRect();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updateDropdownRect]);

  function pick(nextValue: string) {
    setOpen(false);
    if (!onChange) return;
    onChange({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as any);
  }

  return (
    <div ref={rootRef} className="suggestField selectField">
      <button
        ref={triggerRef}
        type="button"
        className={`input selectTrigger ${className ?? ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="selectTriggerLabel">{displayLabel}</span>
        <span className={`selectChevron ${open ? "open" : ""}`} aria-hidden="true">
          <svg viewBox="0 0 16 16" className="selectChevronIcon" focusable="false" aria-hidden="true">
            <path d="M4 6.5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open &&
        !disabled &&
        dropdownRect &&
        createPortal(
          <div
            className="suggestDropdown selectDropdown"
            role="listbox"
            style={{
              position: "absolute",
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 1200,
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`suggestItem selectItem ${option.value === selectedOption?.value ? "active" : ""}`}
                disabled={option.disabled}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(option.value);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
