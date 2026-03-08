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

    if (loading) return <div style={{ padding: 16 }}>Učitavanje analitike...</div>;

    return (
        <div style={{ display: "grid", gap: 24 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <h1>Analitika dobavljača</h1>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button onClick={() => router.push("/dobavljac/proizvodi")}>
                        Proizvodi
                    </Button>
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
                        <h2 style={{ marginBottom: 12 }}>Prodaja po mesecima</h2>

                        {meseci.length === 0 ? (
                            <div>Nema podataka za prikaz.</div>
                        ) : (
                            <Chart
                                chartType="ColumnChart"
                                width="100%"
                                height="400px"
                                data={meseciChartData}
                                options={{
                                    title: "Ukupna prodaja po mesecima",
                                    legend: { position: "none" },
                                }}
                            />
                        )}
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
                        <h2 style={{ marginBottom: 12 }}>Najprodavaniji proizvodi</h2>

                        {proizvodi.length === 0 ? (
                            <div>Nema podataka za prikaz.</div>
                        ) : (
                            <Chart
                                chartType="BarChart"
                                width="100%"
                                height="450px"
                                data={proizvodiChartData}
                                options={{
                                    title: "Najprodavaniji proizvodi",
                                    legend: { position: "none" },
                                }}
                            />
                        )}
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
                        <h2 style={{ marginBottom: 12 }}>Prihod po proizvodima</h2>

                        {prihodi.length === 0 ? (
                            <div>Nema podataka za prikaz.</div>
                        ) : (
                            <Chart
                                chartType="PieChart"
                                width="100%"
                                height="400px"
                                data={prihodiChartData}
                                options={{
                                    title: "Udeo prihoda po proizvodima",
                                }}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}