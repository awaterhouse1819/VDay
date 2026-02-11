import { redirect } from "next/navigation";
import WriteForm from "@/components/WriteForm";
import { getSessionFromCookies } from "@/lib/session";
import { currentYear } from "@/lib/valentine";
import { getActiveQuestions, getOrCreateEntry, upsertEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

type WritePageProps = {
  searchParams?: Promise<{ saved?: string }>;
};

export default async function WritePage({ searchParams }: WritePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const year = currentYear();
  const questions = await getActiveQuestions();
  const entry = await getOrCreateEntry(session.partner, year);

  async function saveAnswers(formData: FormData) {
    "use server";

    const current = currentYear();
    const sessionInner = await getSessionFromCookies();
    if (!sessionInner) {
      redirect("/login");
    }

    const answers: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("q_")) continue;
      answers[key.replace("q_", "")] = value.toString();
    }

    await upsertEntry(sessionInner.partner, current, answers);
    redirect("/write?saved=1");
  }

  return (
    <main>
      <section className="card">
        <div className="hero">
          <h1>{year} Love Notes</h1>
          <p>
            Answer each prompt with care. You can update your words anytime -
            they'll be waiting on February 14th.
          </p>
        </div>
        <WriteForm
          questions={questions}
          initialAnswers={entry.answers ?? {}}
          year={year}
          partner={session.partner}
          saved={params?.saved === "1"}
          action={saveAnswers}
        />
      </section>
    </main>
  );
}
