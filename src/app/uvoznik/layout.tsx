import Link from "next/link";
import LogoutButton from "@/src/components/LogoutButton";

export default function UvoznikLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <nav className="flex gap-4">
            <Link href="/uvoznik/dobavljaci">Dobavljači</Link>
            <Link href="/uvoznik/proizvodi">Proizvodi</Link>
            <Link href="/uvoznik/saradnje">Saradnje</Link>
          </nav>

          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}