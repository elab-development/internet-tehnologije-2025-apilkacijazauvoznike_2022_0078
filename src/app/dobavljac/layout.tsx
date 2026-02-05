import Link from "next/link";
import LogoutButton from "@/src/components/LogoutButton";

export default function DobavljacLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <nav className="flex gap-4">
            <Link href="/dobavljac/proizvod">Moji proizvodi</Link>
            <Link href="/dobavljac/proizvod/novi">Novi proizvod</Link>
            <Link href="/dobavljac/saradnje">Saradnje</Link>
          </nav>

          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}