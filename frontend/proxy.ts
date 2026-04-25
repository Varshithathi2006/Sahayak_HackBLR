import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const userDataStr = request.cookies.get("user-data")?.value;
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const protectedPaths = ["/client", "/bank", "/form"];
  
  // Paths that are only for non-authenticated users
  const authPaths = ["/auth/login", "/auth/signup"];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuth = authPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    // Optional: add a redirect parameter to return here after login
    // loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && token && userDataStr) {
    try {
      const user = JSON.parse(userDataStr);
      const dashboardUrl = new URL(user.role === "bank" ? "/bank" : "/client", request.url);
      return NextResponse.redirect(dashboardUrl);
    } catch (e) {
      // If parsing fails, just continue
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
