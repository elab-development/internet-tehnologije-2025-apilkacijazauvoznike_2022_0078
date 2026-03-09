import { describe, expect, it } from "vitest";
import { isActiveStatus, validateAddInput } from "@/src/lib/kontejner-utils";

describe("isActiveStatus", () => {
  it("vraca true za OPEN", () => {
    expect(isActiveStatus("OPEN")).toBe(true);
  });

  it("vraca true za REOPEN", () => {
    expect(isActiveStatus("REOPEN")).toBe(true);
  });

  it("vraca false za CLOSED", () => {
    expect(isActiveStatus("CLOSED")).toBe(false);
  });

  it("vraca false za PAUSED", () => {
    expect(isActiveStatus("PAUSED")).toBe(false);
  });

  it("vraca false za PAID", () => {
    expect(isActiveStatus("PAID")).toBe(false);
  });
});

describe("validateAddInput", () => {
  it("prihvata ispravan unos", () => {
    const result = validateAddInput({
      uvoznikId: 1,
      idProizvod: 2,
      kolicina: 3,
      forceNewContainer: true,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).toEqual({
        uvoznikId: 1,
        idProizvod: 2,
        kolicina: 3,
        forceNewContainer: true,
      });
    }
  });

  it("odbija neispravan uvoznikId", () => {
    const result = validateAddInput({
      uvoznikId: 0,
      idProizvod: 2,
      kolicina: 3,
    });

    expect(result).toEqual({
      ok: false,
      error: "uvoznikId mora biti pozitivan ceo broj",
    });
  });

  it("odbija neispravan idProizvod", () => {
    const result = validateAddInput({
      uvoznikId: 1,
      idProizvod: -5,
      kolicina: 3,
    });

    expect(result).toEqual({
      ok: false,
      error: "idProizvod mora biti pozitivan ceo broj",
    });
  });

  it("odbija neispravnu kolicinu", () => {
    const result = validateAddInput({
      uvoznikId: 1,
      idProizvod: 2,
      kolicina: 0,
    });

    expect(result).toEqual({
      ok: false,
      error: "kolicina mora biti pozitivan ceo broj",
    });
  });

  it("pretvara string brojeve u validne integer vrednosti", () => {
    const result = validateAddInput({
      uvoznikId: "5",
      idProizvod: "7",
      kolicina: "2",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).toEqual({
        uvoznikId: 5,
        idProizvod: 7,
        kolicina: 2,
        forceNewContainer: false,
      });
    }
  });
});