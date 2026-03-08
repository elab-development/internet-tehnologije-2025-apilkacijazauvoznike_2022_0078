type HeroProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  minHeightClassName?: string;
  children?: React.ReactNode;
};

export default function HeroSection({
  badge,
  title,
  subtitle,
  minHeightClassName = "min-h-[420px]",
  children,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.92),rgba(15,23,42,0.78))]" />

      <div className="absolute inset-0 opacity-20">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,white,transparent_35%),radial-gradient(circle_at_bottom_right,white,transparent_30%)]" />
      </div>

      <div className={`relative mx-auto flex max-w-6xl items-center px-6 py-20 ${minHeightClassName}`}>
        <div className="max-w-3xl space-y-6">
          {badge && (
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              {badge}
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              {title}
            </h1>

            {subtitle && (
              <p className="max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
                {subtitle}
              </p>
            )}
          </div>

          {children && <div className="pt-2">{children}</div>}
        </div>
      </div>
    </section>
  );
}