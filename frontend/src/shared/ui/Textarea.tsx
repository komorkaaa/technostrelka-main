import type { TextareaHTMLAttributes } from "react";

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, style, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`input ${className ?? ""}`}
      style={{
        minHeight: 120,
        height: 120,
        maxWidth: "100%",
        width: "100%",
        paddingTop: 10,
        resize: "none",
        overflowY: "auto",
        overflowX: "hidden",
        ...(style ?? {}),
      }}
    />
  );
}
