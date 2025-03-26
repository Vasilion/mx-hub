import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  console.log("Middleware: Processing request for:", req.nextUrl.pathname);

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log(
    "Middleware: Session state:",
    session ? "Authenticated" : "Not authenticated"
  );

  // Auth routes (sign-in, sign-up)
  const isAuthRoute = req.nextUrl.pathname.startsWith("/sign-");
  console.log("Middleware: Is auth route:", isAuthRoute);

  // If there's no session and the user is trying to access a protected route
  if (!session && !isAuthRoute) {
    console.log("Middleware: No session, redirecting to sign-in");
    const redirectUrl = new URL("/sign-in", req.url);
    // Store the original URL to redirect back after sign-in
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If there's a session and the user is trying to access auth routes
  if (session && isAuthRoute) {
    console.log("Middleware: Session exists, redirecting to home");
    // Get the redirectedFrom parameter or default to "/"
    const redirectTo = req.nextUrl.searchParams.get("redirectedFrom") || "/";
    const redirectUrl = new URL(redirectTo, req.url);
    return NextResponse.redirect(redirectUrl);
  }

  console.log("Middleware: Request proceeding normally");
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api (API routes)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
