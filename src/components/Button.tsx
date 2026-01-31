"use client";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "secondary";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "px-4 py-2 rounded border text-sm";
  const styles =
    variant === "primary"
      ? "bg-black text-white"
      : variant === "danger"
      ? "bg-red-600 text-white"
      : "bg-white text-black";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}