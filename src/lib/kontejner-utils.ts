export type AddToKontejnerInput = {
  uvoznikId: number;
  idProizvod: number;
  kolicina: number;
  forceNewContainer?: boolean;
};

export type KontejnerStatus = "OPEN" | "CLOSED" | "REOPEN" | "PAUSED" | "PAID";

export function isActiveStatus(s: KontejnerStatus) {
  return s === "OPEN" || s === "REOPEN";
}

export function validateAddInput(body: any):
  | { ok: true; data: AddToKontejnerInput }
  | { ok: false; error: string } {
  const { uvoznikId, idProizvod, kolicina } = body ?? {};

  const nUvoznikId = Number(uvoznikId);
  const nIdProizvod = Number(idProizvod);
  const nKolicina = Number(kolicina);

  if (!Number.isInteger(nUvoznikId) || nUvoznikId <= 0) {
    return { ok: false, error: "uvoznikId mora biti pozitivan ceo broj" };
  }

  if (!Number.isInteger(nIdProizvod) || nIdProizvod <= 0) {
    return { ok: false, error: "idProizvod mora biti pozitivan ceo broj" };
  }

  if (!Number.isInteger(nKolicina) || nKolicina <= 0) {
    return { ok: false, error: "kolicina mora biti pozitivan ceo broj" };
  }

  return {
    ok: true,
    data: {
      uvoznikId: nUvoznikId,
      idProizvod: nIdProizvod,
      kolicina: nKolicina,
      forceNewContainer: Boolean(body?.forceNewContainer),
    },
  };
}