import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const IS_DEV = process.env.NODE_ENV === "development";
const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

// Routes that don't need authentication
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",
  "/api/track",        // Email tracking pixels
  "/api/unsubscribe",  // Unsubscribe links
  "/_next",
  "/favicon",
];

// Admin-only paths (requires role: owner or admin)
const ADMIN_ONLY_PATHS = [
  "/admin",
  "/api/admin",
  "/api/audit-logs",
  "/api/workspace/members",
  "/api/workspace/invitations",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Dev Firebase bypass: allow all requests in dev mode
  if (IS_DEV && IS_FIREBASE) {
    return NextResponse.next();
  }

  // Validate JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // No token → redirect to login for pages, 401 for API
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (token.role as string) || "member";

  // Enforce admin-only paths
  if (ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    const isAdminOrOwner = userRole === "admin" || userRole === "owner";
    if (!isAdminOrOwner) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden", message: "You do not have permission to access this resource." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Attach workspace context to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-workspace-id", (token.workspaceId as string) || (token.id as string) || "");
  requestHeaders.set("x-user-id", (token.id as string) || "");
  requestHeaders.set("x-user-role", userRole);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
