import { redirect } from "next/navigation";
import EnvelopeWorkspace from "@/components/EnvelopeWorkspace";
import { getSessionFromCookies } from "@/lib/session";
import { currentYear } from "@/lib/valentine";

export const dynamic = "force-dynamic";

export default async function WritePage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const year = currentYear();

  return (
    <main>
      <section className="card">
        <div className="hero">
          <p className="script-accent">A note to your future selves</p>
          <h1>Write Your Love Letter</h1>
          <p className="hero-subtext">Seal each message for February 14.</p>
        </div>
        <EnvelopeWorkspace year={year} />
      </section>
    </main>
  );
}
