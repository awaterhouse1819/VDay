import { redirect } from "next/navigation";
import BoardClient from "@/components/BoardClient";
import { getSessionFromCookies } from "@/lib/session";
import { listBoardYears } from "@/lib/db";
import { upcomingValentineYear } from "@/lib/valentine";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const upcomingYear = upcomingValentineYear();
  const years = await listBoardYears();

  return (
    <main>
      <section className="card">
        <div className="hero">
          <p className="script-accent">For every little moment</p>
          <h1>Memory Board</h1>
          <p className="hero-subtext">
            Upload memories all year. The full board unlocks on February 14 in
            New York.
          </p>
        </div>
        <BoardClient initialYear={upcomingYear} years={years} />
      </section>
    </main>
  );
}
