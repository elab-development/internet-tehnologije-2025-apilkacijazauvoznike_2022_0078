"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/src/components/Button";

type ProizvodRow = {
  id: number;
  sifra: string;
  naziv: string;
  cena: number;
  slika: string;

  sirina: number;
  visina: number;
  duzina: number;

  idKategorija: number;
  kategorijaIme: string | null;

  idDobavljac: number;
  dobavljacIme: string | null;
};

type DobavljacOpt = { idDobavljac: number; imePrezime: string };
type KategorijaOpt = { id: number; ime: string };

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json().catch(() => ({}));
  const text = await res.text().catch(() => "");
  return { ok: false, error: "NON_JSON_RESPONSE", message: text.slice(0, 200) };
}

function parseId(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export default function UvoznikUporediPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const leftFromQuery = parseId(sp.get("left"));
  const rightFromQuery = parseId(sp.get("right"));

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // opcije (uvoznik vidi samo svoje dobavljače)
  const [dobavljaci, setDobavljaci] = useState<DobavljacOpt[]>([]);
  const [kategorije, setKategorije] = useState<KategorijaOpt[]>([]);

  // slot state
  const [left, setLeft] = useState<ProizvodRow | null>(null);
  const [right, setRight] = useState<ProizvodRow | null>(null);

  // UI za desni slot (izbor)
  const [rDobId, setRDobId] = useState<number | "">("");
  const [rKatId, setRKatId] = useState<number | "">("");
  const [rProizvodi, setRProizvodi] = useState<ProizvodRow[]>([]);
  const [rProizvodId, setRProizvodId] = useState<number | "">("");

  // UI za levi slot (ako nema query left)
  const [lDobId, setLDobId] = useState<number | "">("");
  const [lKatId, setLKatId] = useState<number | "">("");
  const [lProizvodi, setLProizvodi] = useState<ProizvodRow[]>([]);
  const [lProizvodId, setLProizvodId] = useState<number | "">("");

  async function loadOptions() {
    const [dRes, kRes] = await Promise.all([
      fetch("/api/uvoznik/dobavljaci", { credentials: "include", cache: "no-store" }),
      fetch("/api/kategorije", { credentials: "include", cache: "no-store" }),
    ]);

    const dJson: any = await safeJson(dRes);
    const kJson: any = await safeJson(kRes);

    if (!dRes.ok || !dJson.ok) throw new Error(dJson.message ?? dJson.error ?? "Ne mogu da učitam dobavljače.");
    if (!kRes.ok || !kJson.ok) throw new Error(kJson.message ?? kJson.error ?? "Ne mogu da učitam kategorije.");

    setDobavljaci((dJson.dobavljaci ?? []).map((x: any) => ({ idDobavljac: x.idDobavljac, imePrezime: x.imePrezime })));
    setKategorije((kJson.data ?? []).map((x: any) => ({ id: x.id, ime: x.ime })));
  }

  async function fetchProductById(id: number) {
    const res = await fetch(`/api/uvoznik/proizvodi/${id}`, { credentials: "include", cache: "no-store" });
    const json: any = await safeJson(res);
    if (!res.ok || !json.ok) throw new Error(json.message ?? json.error ?? "Ne mogu da učitam proizvod.");
    return json.proizvod as ProizvodRow;
  }

  async function fetchProductsList(dobId: number | "", katId: number | "") {
    const params = new URLSearchParams();
    if (dobId !== "") params.set("dobavljacId", String(dobId));
    if (katId !== "") params.set("kategorijaId", String(katId));

    const res = await fetch(`/api/uvoznik/proizvodi?${params.toString()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json: any = await safeJson(res);
    if (!res.ok || !json.ok) throw new Error(json.message ?? json.error ?? "Ne mogu da učitam listu proizvoda.");
    return (json.proizvodi ?? []) as ProizvodRow[];
  }

  async function init() {
    setLoading(true);
    setErr(null);

    try {
      await loadOptions();

      // ako je došlo iz "Uporedi" dugmeta
      if (leftFromQuery) {
        const p = await fetchProductById(leftFromQuery);
        setLeft(p);
      }
      if (rightFromQuery) {
        const p = await fetchProductById(rightFromQuery);
        setRight(p);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Greška");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLeftList() {
    if (lDobId === "") {
      setLProizvodi([]);
      setLProizvodId("");
      return;
    }
    const list = await fetchProductsList(lDobId, lKatId);
    setLProizvodi(list);
    setLProizvodId("");
  }

  async function loadRightList() {
    if (rDobId === "") {
      setRProizvodi([]);
      setRProizvodId("");
      return;
    }
    const list = await fetchProductsList(rDobId, rKatId);
    setRProizvodi(list);
    setRProizvodId("");
  }

  async function pickLeft() {
    if (lProizvodId === "") return;
    const p = await fetchProductById(Number(lProizvodId));
    setLeft(p);

    // očisti izbor UI (ostavi dob/kat kao što je)
    setLProizvodId("");
    setLProizvodi([]);
  }

  async function pickRight() {
    if (rProizvodId === "") return;
    const p = await fetchProductById(Number(rProizvodId));
    setRight(p);

    setRProizvodId("");
    setRProizvodi([]);
  }

  function clearLeft() {
    setLeft(null);
    // reset UI za izbor levog
    setLDobId("");
    setLKatId("");
    setLProizvodi([]);
    setLProizvodId("");
    // skini query param (da ne vraća levo posle refresh)
    router.replace("/uvoznik/uporedi");
  }

  function clearRight() {
    setRight(null);
    setRDobId("");
    setRKatId("");
    setRProizvodi([]);
    setRProizvodId("");
    router.replace(left ? `/uvoznik/uporedi?left=${left.id}` : "/uvoznik/uporedi");
  }

  const canCompare = useMemo(() => Boolean(left && right), [left, right]);

  if (loading) return <div style={{ padding: 16 }}>Učitavanje...</div>;
  if (err) return <div style={{ padding: 16, color: "red" }}>{err}</div>;

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1>Uporedi proizvode</h1>
        <Button onClick={() => router.push("/uvoznik/proizvodi")}>Nazad na proizvode</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* LEFT */}
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, minHeight: 380 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <b>Proizvod A</b>
            {left && (
              <Button variant="danger" onClick={clearLeft}>
                X
              </Button>
            )}
          </div>

          {!left ? (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                Izaberi dobavljača i (opciono) kategoriju, pa proizvod.
              </div>

              <label style={{ display: "grid", gap: 4 }}>
                Dobavljač (obavezno)
                <select
                  value={lDobId}
                  onChange={(e) => setLDobId(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
                >
                  <option value="">Izaberi...</option>
                  {dobavljaci.map((d) => (
                    <option key={d.idDobavljac} value={d.idDobavljac}>
                      {d.imePrezime} (#{d.idDobavljac})
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                Kategorija (opciono)
                <select
                  value={lKatId}
                  onChange={(e) => setLKatId(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
                >
                  <option value="">Sve</option>
                  {kategorije.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ime}
                    </option>
                  ))}
                </select>
              </label>

              <Button onClick={async () => {
                try { await loadLeftList(); } catch (e:any) { setErr(e?.message ?? "Greška"); }
              }}>
                Prikaži proizvode
              </Button>

              {lProizvodi.length > 0 && (
                <>
                  <label style={{ display: "grid", gap: 4 }}>
                    Proizvod
                    <select
                      value={lProizvodId}
                      onChange={(e) => setLProizvodId(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
                    >
                      <option value="">Izaberi...</option>
                      {lProizvodi.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.naziv} (#{p.id}) — {p.cena}€
                        </option>
                      ))}
                    </select>
                  </label>

                  <Button onClick={async () => {
                    try { await pickLeft(); } catch (e:any) { setErr(e?.message ?? "Greška"); }
                  }}>
                    Izaberi proizvod A
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <img src={left.slika} alt={left.naziv} style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, border: "1px solid #eee" }} />
              <div><b>{left.naziv}</b></div>
              <div>Šifra: {left.sifra}</div>
              <div>Dobavljač: <b>{left.dobavljacIme ?? "-"}</b></div>
              <div>Kategorija: <b>{left.kategorijaIme ?? "-"}</b></div>
              <div>Dimenzije: {left.sirina} × {left.visina} × {left.duzina}</div>
              <div style={{ fontSize: 16 }}><b>Cena: {left.cena}€</b></div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, minHeight: 380 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <b>Proizvod B</b>
            {right && (
              <Button variant="danger" onClick={clearRight}>
                X
              </Button>
            )}
          </div>

          {!right ? (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                Izaberi dobavljača i (opciono) kategoriju, pa proizvod.
              </div>

              <label style={{ display: "grid", gap: 4 }}>
                Dobavljač (obavezno)
                <select
                  value={rDobId}
                  onChange={(e) => setRDobId(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
                >
                  <option value="">Izaberi...</option>
                  {dobavljaci.map((d) => (
                    <option key={d.idDobavljac} value={d.idDobavljac}>
                      {d.imePrezime} (#{d.idDobavljac})
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                Kategorija (opciono)
                <select
                  value={rKatId}
                  onChange={(e) => setRKatId(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
                >
                  <option value="">Sve</option>
                  {kategorije.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ime}
                    </option>
                  ))}
                </select>
              </label>

              <Button onClick={async () => {
                try { await loadRightList(); } catch (e:any) { setErr(e?.message ?? "Greška"); }
              }}>
                Prikaži proizvode
              </Button>

              {rProizvodi.length > 0 && (
                <>
                  <label style={{ display: "grid", gap: 4 }}>
                    Proizvod
                    <select
                      value={rProizvodId}
                      onChange={(e) => setRProizvodId(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
                    >
                      <option value="">Izaberi...</option>
                      {rProizvodi.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.naziv} (#{p.id}) — {p.cena}€
                        </option>
                      ))}
                    </select>
                  </label>

                  <Button onClick={async () => {
                    try { await pickRight(); } catch (e:any) { setErr(e?.message ?? "Greška"); }
                  }}>
                    Izaberi proizvod B
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <img src={right.slika} alt={right.naziv} style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, border: "1px solid #eee" }} />
              <div><b>{right.naziv}</b></div>
              <div>Šifra: {right.sifra}</div>
              <div>Dobavljač: <b>{right.dobavljacIme ?? "-"}</b></div>
              <div>Kategorija: <b>{right.kategorijaIme ?? "-"}</b></div>
              <div>Dimenzije: {right.sirina} × {right.visina} × {right.duzina}</div>
              <div style={{ fontSize: 16 }}><b>Cena: {right.cena}€</b></div>
            </div>
          )}
        </div>
      </div>

      {/* mala poruka ispod */}
      <div style={{ opacity: 0.85 }}>
        {canCompare ? "✅ Izabrana su oba proizvoda – možete ih porediti." : "Izaberite oba proizvoda da biste uporedili."}
      </div>
    </div>
  );
}