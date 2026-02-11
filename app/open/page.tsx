import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import { countdownToUnlock, currentYear, isYearUnlocked, nowNY } from "@/lib/valentine";
import { getAllQuestions, getEntriesByYear, listYearsWithEntries } from "@/lib/db";

export const dynamic = "force-dynamic";

type OpenPageProps = {
  searchParams?: Promise<{ year?: string }>;
};

export default async function OpenPage({ searchParams }: OpenPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const years = await listYearsWithEntries();
  const now = nowNY();
  const current = currentYear();

  const requestedYear = params?.year
    ? Number.parseInt(params.year, 10)
    : null;

  const selectedYear =
    requestedYear && years.includes(requestedYear)
      ? requestedYear
      : years[0] ?? current;

  if (years.length === 0) {
    return (
      <main>
        <section className="card">
          <div className="hero">
            <h1>No memories opened yet.</h1>
            <p>
              Start by writing your first time capsule entry. Your love story
              will unfold here.
            </p>
          </div>
          <Link className="button" href="/write">
            Start Writing
          </Link>
        </section>
      </main>
    );
  }

  const unlocked = isYearUnlocked(selectedYear, now);
  const countdown =
    !unlocked && selectedYear === current ? countdownToUnlock(now) : null;

  const questions = unlocked ? await getAllQuestions() : [];
  const entries = unlocked ? await getEntriesByYear(selectedYear) : [];

  const acw = entries.find((entry) => entry.partner_id === "ACW");
  const sls = entries.find((entry) => entry.partner_id === "SLS");

  return (
    <main>
      <section className="card">
        <div className="hero">
          <h1>{selectedYear} Time Capsule</h1>
          <p>
            Browse past Valentine reflections. The current year remains sealed
            until February 14 in New York.
          </p>
        </div>

        <div className="year-list">
          {years.map((year) => (
            <Link
              key={year}
              href={`/open?year=${year}`}
              className={`year-pill ${year === selectedYear ? "active" : ""}`}
            >
              {year}
            </Link>
          ))}
        </div>

        {!unlocked ? (
          <div className="notice" style={{ marginTop: 24 }}>
            <strong>This year's capsule is still locked.</strong>
            <div style={{ marginTop: 8 }}>
              {countdown ? (
                <span>
                  Opens in {countdown.days} days, {countdown.hours} hours, and{
                  " "}
                  {countdown.minutes} minutes.
                </span>
              ) : (
                <span>The lock will lift on February 14.</span>
              )}
            </div>
          </div>
        ) : (
          <div className="grid-two" style={{ marginTop: 28 }}>
            <div>
              <h3>ACW</h3>
              {questions.map((question) => (
                <div className="answer-block" key={`acw-${question.id}`}>
                  <h4>{question.prompt}</h4>
                  <p>
                    {acw?.answers?.[question.id.toString()]?.trim() ||
                      "No entry yet."}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <h3>SLS</h3>
              {questions.map((question) => (
                <div className="answer-block" key={`sls-${question.id}`}>
                  <h4>{question.prompt}</h4>
                  <p>
                    {sls?.answers?.[question.id.toString()]?.trim() ||
                      "No entry yet."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="footer-note">
          Tip: keep writing through the year. Everything is saved and becomes a
          gift on February 14.
        </div>
      </section>
    </main>
  );
}
