import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/menu/:path*",
    "/discover/:path*",
    "/recipes/:path*",
    "/groceries/:path*",
    "/event-planning/:path*",
    "/settings/:path*",
  ],
};
