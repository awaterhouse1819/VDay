import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import Countdown from "@/components/Countdown";
import { PARTNER_NAMES } from "@/lib/auth";
import { getSessionFromCookies } from "@/lib/session";

export const metadata = {
  title: "MiAmor",
  description: "A private time capsule for Anna and Samara."
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
              MiAmor
              <Countdown />
            </div>
            <nav className="nav-links">
              {session ? (
                <>
                  <span className="nav-partner">
                    Logged in as {PARTNER_NAMES[session.partner]}
                  </span>
                  <Link className="nav-chip" href="/write">
                    Entry
                  </Link>
                  <Link className="nav-chip" href="/open">
                    Capsule
                  </Link>
                  <Link className="nav-chip" href="/board">
                    Pictures
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
