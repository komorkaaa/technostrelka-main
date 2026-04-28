import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button(props: Props) {
  const { className, variant = "primary", size = "md", fullWidth, ...rest } = props;
  const classes = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? "btn-full" : null,
    className ?? null,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...rest} />;
}
