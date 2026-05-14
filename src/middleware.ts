import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (isLoginPage && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/menu";
    return NextResponse.redirect(url);
  }

  if (!isLoggedIn && !isLoginPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/login",
    "/menu/:path*",
    "/discover/:path*",
    "/recipes/:path*",
    "/groceries/:path*",
    "/event-planning/:path*",
    "/settings/:path*",
  ],
};
