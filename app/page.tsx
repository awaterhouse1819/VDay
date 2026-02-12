import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import { PARTNER_NAMES } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const name = PARTNER_NAMES[session.partner];

  return (
    <main>
      <section className="card">
        <div className="hero">
          <h1 className="hero-greeting">Dear {name},</h1>
          <p className="hero-subtext">
            This is your space to write and seal love letters until February 14.
          </p>
        </div>
        <Link className="button" href="/write">
          Write your love letter
        </Link>
      </section>
    </main>
  );
}
