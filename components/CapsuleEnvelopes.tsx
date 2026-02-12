"use client";

import { useMemo, useState } from "react";
import type { Entry } from "@/lib/db";
import { PARTNER_NAMES } from "@/lib/auth";
import { parseEntryAnswer } from "@/lib/entryFormat";

type YearBundle = {
  year: number;
  entries: Entry[];
  locked: boolean;
  upcoming: boolean;
};

type CapsuleEnvelopesProps = {
  years: YearBundle[];
};

const SLOTS = [1, 2, 3, 4, 5];

export default function CapsuleEnvelopes({ years }: CapsuleEnvelopesProps) {
  const [openYears, setOpenYears] = useState<number[]>([]);

  const yearSet = useMemo(() => new Set(openYears), [openYears]);

  function toggleYear(year: number) {
    setOpenYears((prev) =>
      prev.includes(year) ? prev.filter((item) => item !== year) : [...prev, year]
    );
  }

  return (
    <div className="capsule-stack">
      {years.map((bundle) => {
        const isOpen = yearSet.has(bundle.year);
        const acwEntries = bundle.entries.filter((entry) => entry.partner_id === "ACW");
        const slsEntries = bundle.entries.filter((entry) => entry.partner_id === "SLS");
        const acwBySlot = new Map(acwEntries.map((entry) => [entry.slot, entry]));
        const slsBySlot = new Map(slsEntries.map((entry) => [entry.slot, entry]));
        const statusText = bundle.locked
          ? "Locked"
          : isOpen
          ? "Open"
          : "Sealed";

        return (
          <section
            key={`capsule-${bundle.year}`}
            className={`capsule-envelope ${bundle.locked ? "locked" : ""} ${
              isOpen ? "open" : ""
            }`}
          >
            <div className="capsule-header">
              <div className="capsule-icon" aria-hidden="true">
                <svg viewBox="0 0 80 60" role="presentation">
                  <rect x="6" y="12" width="68" height="40" rx="6" fill="none" />
                  <path d="M6 14L40 36L74 14" fill="none" />
                  <path d="M6 52L30 28" fill="none" />
                  <path d="M74 52L50 28" fill="none" />
                </svg>
              </div>
              <div className="capsule-meta">
                <p className="capsule-year">{bundle.year} Capsule</p>
                <div className="capsule-tags">
                  {bundle.upcoming ? <span className="capsule-tag">Upcoming</span> : null}
                  <span className={`capsule-tag ${bundle.locked ? "locked" : ""}`}>
                    {statusText}
                  </span>
                </div>
              </div>
              <div className="capsule-actions">
                {bundle.locked ? (
                  <span className="capsule-lock">Sealed until Feb 14</span>
                ) : (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => toggleYear(bundle.year)}
                    aria-expanded={isOpen}
                    aria-controls={`capsule-content-${bundle.year}`}
                  >
                    {isOpen ? "Close envelope" : "Open envelope"}
                  </button>
                )}
              </div>
            </div>

            {bundle.locked ? (
              <p className="capsule-hint">
                This envelope stays sealed until February 14.
              </p>
            ) : isOpen ? (
              <div id={`capsule-content-${bundle.year}`} className="capsule-content">
                {bundle.entries.length === 0 ? (
                  <div className="notice">No letters sealed for this year yet.</div>
                ) : (
                  <div className="grid-two">
                    <div>
                      <h3>{PARTNER_NAMES.ACW}</h3>
                      {SLOTS.map((slot) => {
                        const entry = acwBySlot.get(slot);
                        const parsed = entry ? parseEntryAnswer(entry.answer) : null;
                        return (
                          <div className="answer-block" key={`acw-${bundle.year}-${slot}`}>
                            <h4>{entry?.question || `Envelope ${slot}`}</h4>
                            {entry ? (
                              <>
                                <div
                                  className="answer-html"
                                  dangerouslySetInnerHTML={{
                                    __html: parsed?.bodyHtml ?? ""
                                  }}
                                />
                                {parsed?.signature ? (
                                  <p className="answer-signature">
                                    — {parsed.signature}
                                  </p>
                                ) : null}
                              </>
                            ) : (
                              <p>No entry yet.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <h3>{PARTNER_NAMES.SLS}</h3>
                      {SLOTS.map((slot) => {
                        const entry = slsBySlot.get(slot);
                        const parsed = entry ? parseEntryAnswer(entry.answer) : null;
                        return (
                          <div className="answer-block" key={`sls-${bundle.year}-${slot}`}>
                            <h4>{entry?.question || `Envelope ${slot}`}</h4>
                            {entry ? (
                              <>
                                <div
                                  className="answer-html"
                                  dangerouslySetInnerHTML={{
                                    __html: parsed?.bodyHtml ?? ""
                                  }}
                                />
                                {parsed?.signature ? (
                                  <p className="answer-signature">
                                    — {parsed.signature}
                                  </p>
                                ) : null}
                              </>
                            ) : (
                              <p>No entry yet.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="capsule-hint">Open the envelope to read the letters.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
