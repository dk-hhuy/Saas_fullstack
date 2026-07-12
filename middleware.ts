import createMiddleware from "next-intl/middleware";
import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function isApiOrTrpcRoute(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return pathname.startsWith("/api") || pathname.startsWith("/trpc");
}

export default clerkMiddleware(async (_auth, request: NextRequest) => {
  if (isApiOrTrpcRoute(request)) {
    return;
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // next-intl: skip static files and Next/Vercel internals
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    // Clerk auth for API route handlers
    "/(api|trpc)(.*)",
  ],
};
