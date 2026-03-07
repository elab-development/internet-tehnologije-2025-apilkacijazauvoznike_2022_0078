export async function getExchangeRate(from: string, to: string) {
  try {
    if (from === to) {
      return {
        status: 200,
        json: {
          ok: true,
          from,
          to,
          rate: 1,
          date: null,
        },
      };
    }
 
    const url = `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`;
 
    const res = await fetch(url, {
      cache: "no-store",
    });
 
    if (!res.ok) {
      return {
        status: 502,
        json: {
          ok: false,
          error: "FRANKFURTER_ERROR",
          message: "Greška pri dobavljanju kursa.",
        },
      };
    }
 
    const data = await res.json();
 
    const rate = Number(data?.rates?.[to]);
 
    if (!Number.isFinite(rate)) {
      return {
        status: 404,
        json: {
          ok: false,
          error: "RATE_NOT_FOUND",
          message: "Kurs nije pronađen.",
        },
      };
    }
 
    return {
      status: 200,
      json: {
        ok: true,
        from,
        to,
        rate,
        date: data?.date ?? null,
      },
    };
  } catch (err: any) {
    return {
      status: 500,
      json: {
        ok: false,
        error: "SERVER_ERROR",
        message: err?.message ?? "Greška na serveru.",
      },
    };
  }
}