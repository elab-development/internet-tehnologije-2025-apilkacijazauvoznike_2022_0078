import Link from "next/link";
import LogoutButton from "@/src/components/LogoutButton";

export default function UvoznikLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <Link
              href="/"
              className="shrink-0 text-xl font-semibold tracking-tight text-slate-800"
            >
              BizSupply
            </Link>

            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
              <Link
                href="/"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Početna
              </Link>
              <Link
                href="/uvoznik/dobavljaci"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Dobavljači
              </Link>
              <Link
                href="/uvoznik/proizvodi"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Proizvodi
              </Link>
              <Link
                href="/uvoznik/uporedi"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Uporedi
              </Link>
              <Link
                href="/uvoznik/istorija"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Istorija porudžbina
              </Link>
              <Link
                href="/uvoznik/saradnje"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Saradnje
              </Link>
              <Link
                href="/uvoznik/analitika"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Analitika
              </Link>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/uvoznik/kontejner"
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              Moja korpa
            </Link>
            <div className="rounded-lg border border-slate-200 bg-white px-1 py-1">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}