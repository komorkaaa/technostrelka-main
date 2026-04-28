import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type SelectHTMLAttributes,
} from "react";

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

function collectOptions(children: SelectHTMLAttributes<HTMLSelectElement>["children"]): SelectOption[] {
  const options: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (isOptionElement(child)) {
      const value = String(child.props.value ?? "");
      const label = String(child.props.children ?? "");
      options.push({ value, label, disabled: Boolean(child.props.disabled) });
    }
    if (isOptGroupElement(child) && child.props?.children) {
      Children.forEach(child.props.children, (nested) => {
        if (!isOptionElement(nested)) return;
        const value = String(nested.props.value ?? "");
        const label = String(nested.props.children ?? "");
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
        type="button"
        className={`input selectTrigger ${className ?? ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="selectTriggerLabel">{displayLabel}</span>
        <span className={`selectChevron ${open ? "open" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && !disabled && (
        <div className="suggestDropdown selectDropdown" role="listbox">
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
        </div>
      )}
    </div>
  );
}
