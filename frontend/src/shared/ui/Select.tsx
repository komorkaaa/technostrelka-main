import type { SelectHTMLAttributes } from "react";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select {...rest} className={`input ${className ?? ""}`} />;
}
