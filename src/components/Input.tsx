"use client";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className = "", ...props }: Props) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-sm">{label}</span>}
      <input
        className={`w-full border rounded px-3 py-2 text-sm ${className}`}
        {...props}
      />
    </label>
  );
}