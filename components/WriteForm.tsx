"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question } from "@/lib/db";

type WriteFormProps = {
  questions: Question[];
  initialAnswers: Record<string, string>;
  year: number;
  partner: string;
  saved?: boolean;
  action: (formData: FormData) => void;
};

export default function WriteForm({
  questions,
  initialAnswers,
  year,
  partner,
  saved,
  action
}: WriteFormProps) {
  const storageKey = useMemo(
    () => `vday-draft-${partner}-${year}`,
    [partner, year]
  );

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const question of questions) {
      seed[question.id.toString()] = initialAnswers[question.id.toString()] ?? "";
    }
    return seed;
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Record<string, string>;
      setAnswers((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore corrupt drafts.
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey]);

  useEffect(() => {
    if (!saved) return;
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, saved, storageKey]);

  return (
    <form action={action}>
      <input type="hidden" name="year" value={year} />
      <div className="notice">
        Drafts are stored locally in this browser so you never lose a memory.
      </div>
      {saved ? <div className="notice">Saved with love.</div> : null}
      {questions.map((question) => (
        <label key={question.id}>
          {question.prompt}
          <textarea
            name={`q_${question.id}`}
            value={answers[question.id.toString()] ?? ""}
            onChange={(event) =>
              setAnswers((prev) => ({
                ...prev,
                [question.id.toString()]: event.target.value
              }))
            }
          />
        </label>
      ))}
      <button className="button" type="submit">
        Save My Answers
      </button>
    </form>
  );
}
