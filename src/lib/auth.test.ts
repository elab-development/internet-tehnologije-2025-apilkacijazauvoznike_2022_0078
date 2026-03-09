import { describe, expect, it } from "vitest";
import { cookieOpts, signAuthToken, verifyAuthToken } from "@/src/lib/auth";

describe("auth token", () => {
  it("potpisuje i verifikuje token", () => {
    const token = signAuthToken({
      sub: 1,
      email: "test@test.com",
      uloga: "UVOZNIK",
    });

    const payload = verifyAuthToken(token);

    expect(payload).toEqual({
      sub: 1,
      email: "test@test.com",
      uloga: "UVOZNIK",
    });
  });

  it("baca gresku za neispravan token", () => {
    expect(() => verifyAuthToken("neispravan-token")).toThrow();
  });
});

describe("cookieOpts", () => {
  it("vraca ispravne cookie opcije", () => {
    const opts = cookieOpts();

    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(60 * 60 * 24 * 7);
  });
});