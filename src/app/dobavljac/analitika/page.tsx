"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Chart } from "react-google-charts";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";

type MeseciItem = {
  period: string;
  mesec: string;
  ukupno: number;
};

type ProizvodiItem = {
  idProizvod: number;
  naziv: string;
  ukupnaKolicina: number;
};

type PrihodiItem = {
  idProizvod: number;
  naziv: string;
  ukupno: number;
};

type ApiRespMeseci = {
  ok: boolean;
  items?: MeseciItem[];
  error?: string;
  message?: string;
};

type ApiRespProizvodi = {
  ok: boolean;
  items?: ProizvodiItem[];
  error?: string;
  message?: string;
};

type ApiRespPrihodi = {
  ok: boolean;
  items?: PrihodiItem[];
  error?: string;
  message?: string;
};

export default function DobavljacAnalitikaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [meseci, setMeseci] = useState<MeseciItem[]>([]);
  const [proizvodi, setProizvodi] = useState<ProizvodiItem[]>([]);
  const [prihodi, setPrihodi] = useState<PrihodiItem[]>([]);

  let redirected = false;

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const meRes = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!meRes.ok) {
        router.push("/login");
        return;
      }

      const meJson = await meRes.json();
      const uloga = meJson?.data?.uloga;

      if (uloga !== "DOBAVLJAC") {
        redirected = true;
        router.replace(homeByRole(uloga));
        return;
      }

      const [meseciRes, proizvodiRes, prihodiRes] = await Promise.all([
        fetch("/api/dobavljac/analitika/meseci", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/dobavljac/analitika/proizvodi", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/dobavljac/analitika/prihodi", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const meseciJson: ApiRespMeseci = await meseciRes.json();
      const proizvodiJson: ApiRespProizvodi = await proizvodiRes.json();
      const prihodiJson: ApiRespPrihodi = await prihodiRes.json();

      if (!meseciRes.ok || !meseciJson.ok) {
        setErr(
          meseciJson.message ??
            meseciJson.error ??
            "Greška pri učitavanju prodaje po mesecima."
        );
        return;
      }

      if (!proizvodiRes.ok || !proizvodiJson.ok) {
        setErr(
          proizvodiJson.message ??
            proizvodiJson.error ??
            "Greška pri učitavanju najprodavanijih proizvoda."
        );
        return;
      }

      if (!prihodiRes.ok || !prihodiJson.ok) {
        setErr(
          prihodiJson.message ??
            prihodiJson.error ??
            "Greška pri učitavanju prihoda po proizvodima."
        );
        return;
      }

      setMeseci(meseciJson.items ?? []);
      setProizvodi(proizvodiJson.items ?? []);
      setPrihodi(prihodiJson.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Neočekivana greška.");
    } finally {
      if (!redirected) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const meseciChartData = [
    ["Mesec", "Ukupna prodaja"],
    ...meseci.map((m) => [m.mesec, Number(m.ukupno)]),
  ];

  const proizvodiChartData = [
    ["Proizvod", "Ukupna količina"],
    ...proizvodi.map((p) => [p.naziv, Number(p.ukupnaKolicina)]),
  ];

  const prihodiChartData = [
    ["Proizvod", "Ukupan prihod"],
    ...prihodi.map((p) => [p.naziv, Number(p.ukupno)]),
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Učitavanje analitike...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Dobavljač / Analitika
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Analitika dobavljača
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Pregled prodaje po mesecima, najprodavanijih proizvoda i prihoda
              ostvarenih po artiklima.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/dobavljac/proizvod")}>
              Proizvodi
            </Button>
            <Button onClick={() => load()}>Osveži analitiku</Button>
          </div>
        </div>
      </section>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          <span className="font-semibold">Greška:</span> {err}
        </div>
      )}

      {!err && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Prodaja po mesecima
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pregled ukupne prodaje po vremenskim periodima.
              </p>
            </div>

            {meseci.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Nema podataka za prikaz.
              </div>
            ) : (
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="400px"
                data={meseciChartData}
                options={{
                  title: "Ukupna prodaja po mesecima",
                  legend: { position: "none" },
                  backgroundColor: "transparent",
                }}
              />
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Najprodavaniji proizvodi
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Proizvodi sa najvećom ukupnom količinom prodaje.
              </p>
            </div>

            {proizvodi.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Nema podataka za prikaz.
              </div>
            ) : (
              <Chart
                chartType="BarChart"
                width="100%"
                height="450px"
                data={proizvodiChartData}
                options={{
                  title: "Najprodavaniji proizvodi",
                  legend: { position: "none" },
                  backgroundColor: "transparent",
                }}
              />
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Prihod po proizvodima
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Udeo prihoda raspoređen po proizvodima iz ponude.
              </p>
            </div>

            {prihodi.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Nema podataka za prikaz.
              </div>
            ) : (
              <Chart
                chartType="PieChart"
                width="100%"
                height="400px"
                data={prihodiChartData}
                options={{
                  title: "Udeo prihoda po proizvodima",
                  backgroundColor: "transparent",
                }}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}