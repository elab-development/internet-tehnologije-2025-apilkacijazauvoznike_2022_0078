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

type DobavljaciItem = {
    idDobavljac: number;
    dobavljacIme: string;
    ukupno: number;
};

type ProizvodiItem = {
    idProizvod: number;
    naziv: string;
    ukupnaKolicina: number;
};

type ApiRespMeseci = {
    ok: boolean;
    items?: MeseciItem[];
    error?: string;
    message?: string;
};

type ApiRespDobavljaci = {
    ok: boolean;
    items?: DobavljaciItem[];
    error?: string;
    message?: string;
};

type ApiRespProizvodi = {
    ok: boolean;
    items?: ProizvodiItem[];
    error?: string;
    message?: string;
};

export default function UvoznikAnalitikaPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [meseci, setMeseci] = useState<MeseciItem[]>([]);
    const [dobavljaci, setDobavljaci] = useState<DobavljaciItem[]>([]);
    const [proizvodi, setProizvodi] = useState<ProizvodiItem[]>([]);

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

            if (uloga !== "UVOZNIK") {
                redirected = true;
                router.replace(homeByRole(uloga));
                return;
            }

            const [meseciRes, dobavljaciRes, proizvodiRes] = await Promise.all([
                fetch("/api/uvoznik/analitika/meseci", {
                    credentials: "include",
                    cache: "no-store",
                }),
                fetch("/api/uvoznik/analitika/dobavljaci", {
                    credentials: "include",
                    cache: "no-store",
                }),
                fetch("/api/uvoznik/analitika/proizvodi", {
                    credentials: "include",
                    cache: "no-store",
                }),
            ]);

            const meseciJson: ApiRespMeseci = await meseciRes.json();
            const dobavljaciJson: ApiRespDobavljaci = await dobavljaciRes.json();
            const proizvodiJson: ApiRespProizvodi = await proizvodiRes.json();

            if (!meseciRes.ok || !meseciJson.ok) {
                setErr(meseciJson.message ?? meseciJson.error ?? "Greška pri učitavanju analitike po mesecima.");
                return;
            }

            if (!dobavljaciRes.ok || !dobavljaciJson.ok) {
                setErr(dobavljaciJson.message ?? dobavljaciJson.error ?? "Greška pri učitavanju analitike po dobavljačima.");
                return;
            }

            if (!proizvodiRes.ok || !proizvodiJson.ok) {
                setErr(proizvodiJson.message ?? proizvodiJson.error ?? "Greška pri učitavanju analitike proizvoda.");
                return;
            }

            setMeseci(meseciJson.items ?? []);
            setDobavljaci(dobavljaciJson.items ?? []);
            setProizvodi(proizvodiJson.items ?? []);
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
        ["Mesec", "Ukupna potrošnja"],
        ...meseci.map((m) => [m.mesec, Number(m.ukupno)]),
    ];

    const dobavljaciChartData = [
        ["Dobavljač", "Ukupna potrošnja"],
        ...dobavljaci.map((d) => [d.dobavljacIme, Number(d.ukupno)]),
    ];

    const proizvodiChartData = [
        ["Proizvod", "Ukupna količina"],
        ...proizvodi.map((p) => [p.naziv, Number(p.ukupnaKolicina)]),
    ];

    if (loading) return <div style={{ padding: 16 }}>Učitavanje analitike...</div>;

    return (
        <div className="grid gap-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Uvoznik | Analitika
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Analitika uvoznika
                        </h1>
                        <p className="max-w-3xl text-sm text-slate-600">
                            Vizuelni pregled potrošnje po mesecima, po dobavljačima i po
                            najčešće kupljenim proizvodima.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => router.push("/uvoznik/proizvodi")}>Proizvodi</Button>
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
                                Kupovina po mesecima
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Pregled ukupne potrošnje po vremenskim periodima.
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
                                    title: "Ukupna potrošnja po mesecima",
                                    legend: { position: "none" },
                                    backgroundColor: "transparent",
                                }}
                            />
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Potrošnja po dobavljaču
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Udeo ukupne potrošnje raspoređen po poslovnim partnerima.
                            </p>
                        </div>

                        {dobavljaci.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                                Nema podataka za prikaz.
                            </div>
                        ) : (
                            <Chart
                                chartType="PieChart"
                                width="100%"
                                height="400px"
                                data={dobavljaciChartData}
                                options={{
                                    title: "Udeo potrošnje po dobavljaču",
                                    backgroundColor: "transparent",
                                }}
                            />
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Najčešće kupljeni proizvodi
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Proizvodi koji se najčešće pojavljuju u završenim porudžbinama.
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
                                    title: "Najčešće kupljeni proizvodi",
                                    legend: { position: "none" },
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