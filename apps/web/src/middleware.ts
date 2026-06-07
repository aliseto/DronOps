import { NextResponse, type NextRequest } from "next/server";

// Edge middleware seam. next-intl runs without i18n routing (locale via cookie),
// so it needs no middleware. PR-005 wraps this with Auth.js using the split
// (edge-safe) config — keep heavy/Node-only imports OUT of this file.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
