"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";
import { homeByRole, type Role } from "@/src/lib/role_routes";

type MeResp =
  | { ok: true; data: { uloga: Role } }
  | { ok: false };

export default function HomePage() {
  const router = useRouter();
  const [uloga, setUloga] = useState<Role | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const json = (await res.json()) as MeResp;
        if (json && (json as any).ok && (json as any).data?.uloga) {
          setUloga((json as any).data.uloga);
        }
      } catch {}
    })();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        <div className="border rounded-2xl p-8 bg-white">
          <h1 className="text-3xl font-bold">Aplikacija za uvoznike</h1>
          <p className="mt-3 text-gray-600">
            Sistem za saradnju uvoznika i dobavljača, ponudu proizvoda i organizaciju uvoza.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {!uloga && (
              <>
                <Button onClick={() => router.push("/login")}>Login</Button>
                <Button variant="secondary" onClick={() => router.push("/register")}>
                  Register
                </Button>
              </>
            )}

            {uloga && (
              <Button onClick={() => router.push(homeByRole(uloga))}>
                Idi na moj panel
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="border rounded-2xl p-5">
            <div className="text-lg font-semibold">👤 Uvoznik</div>
            <p className="mt-2 text-sm text-gray-600">
              Pregled dobavljača sa kojima sarađuje, pregled i filtriranje proizvoda.
            </p>
          </div>

          <div className="border rounded-2xl p-5">
            <div className="text-lg font-semibold">🏭 Dobavljač</div>
            <p className="mt-2 text-sm text-gray-600">
              Upravljanje proizvodima i kategorijama, obrada zahteva za saradnju.
            </p>
          </div>

          <div className="border rounded-2xl p-5">
            <div className="text-lg font-semibold">🛡️ Admin</div>
            <p className="mt-2 text-sm text-gray-600">
              Administracija korisnika i nadzor sistema (po potrebi).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}