"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sifra, setSifra] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, sifra }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.message ?? "Neuspesan login.");
        return;
      }

      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (!meRes.ok) {
        setError("Login ok, ali /me i dalje 401 (cookie nije postavljen).");
        return;
      }

      const meJson = await meRes.json();
      const uloga = meJson?.data?.uloga;

      router.push(homeByRole(uloga));
    } catch {
      setError("Greska pri loginu (fetch/network).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Login</h1>

      {error && <div className="text-red-600">{error}</div>}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Sifra"
          type="password"
          value={sifra}
          onChange={(e) => setSifra(e.target.value)}
          required
        />
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Prijavljivanje..." : "Uloguj se"}
          </Button>

          <Button type="button" variant="secondary" onClick={() => router.push("/")}>
            Nazad
          </Button>
        </div>
      </form>
    </div>
  );
}