"use client";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "secondary";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "px-4 py-2 rounded border text-sm";
  const styles =
    variant === "primary"
      ? "bg-[#1e3a5f] text-white hover:bg-[#24476f]"
      : variant === "danger"
      ? "rounded-xl bg-[#9f2a38] border border-[#7f222e] text-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-[#7f222e] active:scale-[0.98]"
      : "rounded-xl border border-[#334155] bg-white text-[#1e293b] px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 hover:border-[#1e40af] active:scale-[0.98]";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}