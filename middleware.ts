import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "auth";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://internet-tehnologije-2025-apilkacijazauvoznike2-production.up.railway.app",
];

function homeByRole(role?: string) {
  if (role === "UVOZNIK") return "/uvoznik/dobavljaci";
  if (role === "DOBAVLJAC") return "/dobavljac/proizvod";
  if (role === "ADMIN") return "/";
  return "/";
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);

    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function applyCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CORS za API rute
  if (pathname.startsWith("/api")) {
    if (req.method === "OPTIONS") {
      const res = new NextResponse(null, { status: 204 });
      return applyCors(req, res);
    }

    const res = NextResponse.next();
    return applyCors(req, res);
  }

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  const isUvoznikRoute = pathname.startsWith("/uvoznik");
  const isDobavljacRoute = pathname.startsWith("/dobavljac");

  if (!isUvoznikRoute && !isDobavljacRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const payload = decodeJwtPayload(token);
  const role = payload?.uloga as string | undefined;

  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isUvoznikRoute && role !== "UVOZNIK") {
    const url = req.nextUrl.clone();
    url.pathname = homeByRole(role);
    return NextResponse.redirect(url);
  }

  if (isDobavljacRoute && role !== "DOBAVLJAC") {
    const url = req.nextUrl.clone();
    url.pathname = homeByRole(role);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/uvoznik/:path*", "/dobavljac/:path*"],
};