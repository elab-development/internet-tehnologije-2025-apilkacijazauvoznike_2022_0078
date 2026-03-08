"use client";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className = "", ...props }: Props) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-sm">{label}</span>}
      <input
        className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-700 ${className}`}
        {...props}
      />
    </label>
  );
}