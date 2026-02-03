"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";
import LogoutButton from "@/src/components/LogoutButton";

type DobavljacRow = {
  idDobavljac: number;
  imePrezime: string;
  email: string;
  saradnjaId: number;
  datumPocetka: string;
  statusSaradnje: boolean;
};

type ApiResp = {
  ok: boolean;
  dobavljaci?: DobavljacRow[];
  error?: string;
  message?: string;
};

export default function UvoznikDobavljaciPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [dobavljaci, setDobavljaci] = useState<DobavljacRow[]>([]);
  const [q, setQ] = useState("");

  async function init() {
    setLoading(true);
    setErr(null);

    try {

      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }

      const meJson = await meRes.json();
      const uloga = meJson?.data?.uloga;

      if (uloga !== "UVOZNIK") {
        setLoading(false);
        router.replace(homeByRole(uloga));
        return;
      }

      const res = await fetch("/api/uvoznik/dobavljaci");
      const json: ApiResp = await res.json();

      if (!res.ok || !json.ok) {
        setErr(json.message ?? json.error ?? "Greška pri učitavanju dobavljača");
        return;
      }

      setDobavljaci(json.dobavljaci ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Neočekivana greška");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return dobavljaci;
    return dobavljaci.filter((d) => {
      return (
        d.imePrezime.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term)
      );
    });
  }, [dobavljaci, q]);

  if (loading) return <div style={{ padding: 16 }}>Učitavanje...</div>;

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1>Moji dobavljači</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/uvoznik/proizvodi")}>
            Vidi proizvode
          </Button>

          <LogoutButton />
        </div>
      </div>

      <Input
        value={q}
        onChange={(e: any) => setQ(e.target.value)}
        placeholder="Pretraga (ime ili email)"
      />

      {err && (
        <div style={{ padding: 12, border: "1px solid #ccc" }}>
          <b>Greška:</b> {err}
        </div>
      )}

      {filtered.length === 0 ? (
        <div>Nema aktivnih dobavljača.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((d) => (
            <div
              key={d.saradnjaId}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 600 }}>{d.imePrezime}</div>
              <div>{d.email}</div>
              <div style={{ opacity: 0.8 }}>
                Saradnja od: {new Date(d.datumPocetka).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}