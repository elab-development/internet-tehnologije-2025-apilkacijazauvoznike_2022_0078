import Link from "next/link";
import LogoutButton from "@/src/components/LogoutButton";

export default function DobavljacLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
          
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <Link
              href="/"
              className="shrink-0 text-xl font-semibold tracking-tight text-slate-800"
            >
              Dobavljač panel
            </Link>

            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
              <Link
                href="/"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Početna
              </Link>

              <Link
                href="/dobavljac/proizvod"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Moji proizvodi
              </Link>

              <Link
                href="/dobavljac/proizvod/novi"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Novi proizvod
              </Link>

              <Link
                href="/dobavljac/istorija"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Istorija porudžbina
              </Link>

              <Link
                href="/dobavljac/saradnje"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Saradnje
              </Link>

              <Link
                href="/dobavljac/analitika"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Analitika
              </Link>
            </nav>
          </div>

          <div className="flex shrink-0 items-center">
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