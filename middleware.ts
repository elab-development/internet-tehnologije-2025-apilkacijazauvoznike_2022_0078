import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "auth";

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

    const payload = parts[1]; // base64url
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);

    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
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
  matcher: ["/uvoznik/:path*", "/dobavljac/:path*"],
};