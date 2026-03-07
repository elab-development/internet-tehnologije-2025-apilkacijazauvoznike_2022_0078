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
        <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <h1>Analitika uvoznika</h1>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button onClick={() => router.push("/uvoznik/proizvodi")}>Proizvodi</Button>
                    <Button onClick={() => router.push("/uvoznik/kontejner")}>Moja korpa</Button>
                    <Button onClick={() => load()}>Osveži analitiku</Button>
                </div>
            </div>

            {err && (
                <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
                    <b>Greška:</b> {err}
                </div>
            )}

            {!err && (
                <>
                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
                        <h2 style={{ marginBottom: 12 }}>Kupovina po mesecima</h2>

                        {meseci.length === 0 ? (
                            <div>Nema podataka za prikaz.</div>
                        ) : (
                            <Chart
                                chartType="ColumnChart"
                                width="100%"
                                height="400px"
                                data={meseciChartData}
                                options={{
                                    title: "Ukupna potrošnja po mesecima",
                                    legend: { position: "none" },
                                }}
                            />
                        )}
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
                        <h2 style={{ marginBottom: 12 }}>Potrošnja po dobavljaču</h2>

                        {dobavljaci.length === 0 ? (
                            <div>Nema podataka za prikaz.</div>
                        ) : (
                            <Chart
                                chartType="PieChart"
                                width="100%"
                                height="400px"
                                data={dobavljaciChartData}
                                options={{
                                    title: "Udeo potrošnje po dobavljaču",
                                }}
                            />
                        )}
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
                        <h2 style={{ marginBottom: 12 }}>Najčešće kupljeni proizvodi</h2>

                        {proizvodi.length === 0 ? (
                            <div>Nema podataka za prikaz.</div>
                        ) : (
                            <Chart
                                chartType="BarChart"
                                width="100%"
                                height="450px"
                                data={proizvodiChartData}
                                options={{
                                    title: "Najčešće kupljeni proizvodi",
                                    legend: { position: "none" },
                                }}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}