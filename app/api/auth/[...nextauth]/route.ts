import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

import { authOptions, authReady } from "@/lib/auth";

const handler = NextAuth(authOptions);

type Context = { params: Promise<{ nextauth: string[] }> };

/*
  Without a secret NextAuth 500s on every call, including the header's session
  probe on the home page. Stand in for it until one is configured: the session
  and provider probes get the empty object that means "none", and anything
  else is told sign in is unavailable.
*/
function unavailable(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.endsWith("/session") || pathname.endsWith("/providers")) {
    return Response.json({});
  }
  return Response.json({ message: "Sign in is not configured on this server." }, { status: 503 });
}

export function GET(req: NextRequest, ctx: Context) {
  return authReady ? handler(req, ctx) : unavailable(req);
}

export function POST(req: NextRequest, ctx: Context) {
  return authReady ? handler(req, ctx) : unavailable(req);
}
