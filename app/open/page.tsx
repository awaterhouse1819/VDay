import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import { isYearUnlocked, nowNY, upcomingValentineYear } from "@/lib/valentine";
import { getEntriesByYear, listYearsWithEntries } from "@/lib/db";
import CapsuleEnvelopes from "@/components/CapsuleEnvelopes";

export const dynamic = "force-dynamic";

export default async function OpenPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const now = nowNY();
  const upcomingYear = upcomingValentineYear(now);
  const yearsWithEntries = await listYearsWithEntries();
  const displayYears = Array.from(new Set([upcomingYear, ...yearsWithEntries])).sort(
    (a, b) => b - a
  );

  const yearBundles = await Promise.all(
    displayYears.map(async (year) => {
      const locked = !isYearUnlocked(year, now);
      return {
        year,
        locked,
        upcoming: year === upcomingYear,
        entries: locked ? [] : await getEntriesByYear(year)
      };
    })
  );

  return (
    <main>
      <section className="card">
        <div className="hero">
          <p className="script-accent">Re-open your memories</p>
          <h1>Capsule Archive</h1>
          <p className="hero-subtext">
            Past years are ready to be opened. The upcoming year stays sealed until
            February 14 in New York.
          </p>
        </div>

        <CapsuleEnvelopes years={yearBundles} />
      </section>
    </main>
  );
}
