import type { TextareaHTMLAttributes } from "react";

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, style, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`input ${className ?? ""}`}
      style={{ height: 120, paddingTop: 10, ...(style ?? {}) }}
    />
  );
}
