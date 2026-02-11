import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { getSessionFromCookies } from "@/lib/session";

export const metadata = {
  title: "Valentine Time Capsule",
  description: "A private Valentine time capsule for ACW and SLS."
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromCookies();

  return (
    <html lang="en">
      <body>
        <header>
          <div className="header-inner">
            <div className="brand">
              <div className="brand-heart">&hearts;</div>
              Valentine Time Capsule
            </div>
            <nav className="nav-links">
              {session ? (
                <>
                  <span className="nav-partner">Logged in as {session.partner}</span>
                  <Link className="nav-chip" href="/write">
                    Write
                  </Link>
                  <Link className="nav-chip" href="/open">
                    Open
                  </Link>
                  <form action="/api/logout" method="post">
                    <button className="nav-chip" type="submit">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <Link className="nav-chip" href="/login">
                  Login
                </Link>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
