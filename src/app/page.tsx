"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";
import HeroSection from "@/src/components/HeroSection";
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <HeroSection
        badge="Pametna nabavka za efikasnije poslovanje"
        title="Digitalni most između uvoznika i dobavljača."
        subtitle="BizSupply povezuje poslovne partnere, pojednostavljuje pregled ponude, upravljanje saradnjama, organizaciju kontejnera i analizu troškova uvoza kroz jednu modernu platformu."
        minHeightClassName="min-h-[520px]"
      >
        <div className="flex flex-wrap items-center gap-3">
          {!uloga && (
            <>
              <Button onClick={() => router.push("/login")}>Login</Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/register")}
              >
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

        <div className="flex flex-wrap gap-6 pt-4 text-sm text-slate-300">
          <div>
            <div className="text-2xl font-semibold text-white">B2B</div>
            <div>poslovna platforma</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-white">3</div>
            <div>tipa korisnika</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-white">1</div>
            <div>centralizovan sistem</div>
          </div>
        </div>
      </HeroSection>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Ključne prednosti platforme
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Naša rešenja osnažuju Vaše poslovanje.
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Istražite funkcionalnosti koje olakšavaju saradnju partnera, pregled
            ponude, upravljanje uvozom i donošenje poslovnih odluka na osnovu podataka.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-4 text-sm text-slate-400">✓</div>
            <h3 className="text-lg font-semibold text-slate-900">Tehnologija</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Integrisana platforma za rad u realnom vremenu, sa pregledom proizvoda,
              kategorija, saradnji i kontejnera na jednom mestu.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-4 text-sm text-slate-400">✓</div>
            <h3 className="text-lg font-semibold text-slate-900">Pouzdanost</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Jasna kontrola pristupa, pregled statusa saradnji i uredan tok porudžbina
              omogućavaju sigurnije i preglednije poslovanje.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-4 text-sm text-slate-400">✓</div>
            <h3 className="text-lg font-semibold text-slate-900">Skalabilnost</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Rešenje je prilagođeno rastu poslovanja, većem broju partnera,
              proizvoda i porudžbina, uz centralizovan i pregledan sistem rada.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Uvoznik</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Pregled dobavljača sa kojima sarađuje, filtriranje proizvoda,
                poređenje ponuda, rad sa kontejnerima, checkout i istorija porudžbina.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">Dobavljač</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Upravljanje ponudom proizvoda i kategorija, pregled saradnji,
                obrada zahteva uvoznika i uvid u prodajnu analitiku.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">Administrator</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Centralna kontrola sistema, pregled korisnika i podrška stabilnom
                funkcionisanju cele platforme.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}