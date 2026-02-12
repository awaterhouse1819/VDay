"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  htmlToPlainText,
  parseEntryAnswer,
  plainTextToHtml,
  serializeEntryAnswer
} from "@/lib/entryFormat";

const SLOT_COUNT = 5;

type Entry = {
  slot: number;
  question: string;
  answer: string;
};

type EnvelopeWorkspaceProps = {
  year: number;
};

type SaveState = "idle" | "saving" | "error" | "success";

export default function EnvelopeWorkspace({ year }: EnvelopeWorkspaceProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promptAnnouncement, setPromptAnnouncement] = useState("");
  const [suggestedIndex, setSuggestedIndex] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  const promptRef = useRef<HTMLDivElement | null>(null);
  const writingRef = useRef<HTMLDivElement | null>(null);

  const sealedCount = entries.length;
  const entriesBySlot = useMemo(() => {
    const map = new Map<number, Entry>();
    entries.forEach((entry) => map.set(entry.slot, entry));
    return map;
  }, [entries]);
  const hasSelection = subject.trim() !== "";
  const isEditing = editingSlot !== null;
  const answerText = useMemo(() => message, [message]);
  const canSave =
    hasSelection && answerText.trim() !== "" && saveState !== "saving";
  const hasSealedAll = sealedCount >= SLOT_COUNT && !isEditing;
  const messagePlaceholder = subject.trim()
    ? `Write about: ${subject.trim()}`
    : "Write like you're sealing this up for future-us...";

  useEffect(() => {
    if (saveState !== "success") return;
    setIsPulsing(true);
    const timeout = setTimeout(() => setIsPulsing(false), 650);
    return () => clearTimeout(timeout);
  }, [saveState]);

  async function fetchSuggestions() {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/questions/suggestions?count=12`);
      const payload = (await response.json()) as { questions?: string[] };
      setSuggestions(payload.questions ?? []);
      setSuggestedIndex(0);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);
      try {
        const [promptResponse, entriesResponse] = await Promise.all([
          fetch(`/api/questions/suggestions?count=12`),
          fetch(`/api/entries?year=${year}`)
        ]);

        const promptPayload = (await promptResponse.json()) as {
          questions?: string[];
        };
        const entryPayload = (await entriesResponse.json()) as {
          entries?: Entry[];
        };

        if (!active) return;
        const normalizedEntries = (entryPayload.entries ?? []).sort(
          (a, b) => a.slot - b.slot
        );
        setSuggestions(promptPayload.questions ?? []);
        setSuggestedIndex(0);
        setEntries(normalizedEntries);
        if (normalizedEntries.length > 0) {
          const firstEntry = normalizedEntries[0];
          const parsedAnswer = parseEntryAnswer(firstEntry.answer);
          setSubject(firstEntry.question);
          setMessage(htmlToPlainText(parsedAnswer.bodyHtml));
          setSignature(parsedAnswer.signature);
          setEditingSlot(firstEntry.slot);
          setSaveState("idle");
          setErrorMessage("");
        } else {
          setSubject("");
          setMessage("");
          setSignature("");
          setEditingSlot(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [year]);

  function selectPrompt(prompt: string) {
    if (!prompt.trim()) return;
    setSubject(prompt);
    setMessage("");
    setSignature("");
    setEditingSlot(null);
    setSaveState("idle");
    setErrorMessage("");
    setPromptAnnouncement(`Prompt selected: ${prompt}`);
    setTimeout(() => {
      writingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function openEnvelope(entry: Entry) {
    const parsedAnswer = parseEntryAnswer(entry.answer);
    setSubject(entry.question);
    setMessage(htmlToPlainText(parsedAnswer.bodyHtml));
    setSignature(parsedAnswer.signature);
    setEditingSlot(entry.slot);
    setSaveState("idle");
    setErrorMessage("");
    setPromptAnnouncement(`Opened envelope ${entry.slot}.`);
    setTimeout(() => {
      writingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function nextSuggestion() {
    if (suggestions.length === 0) return;
    const nextIndex = (suggestedIndex + 1) % suggestions.length;
    setSuggestedIndex(nextIndex);
    const prompt = suggestions[nextIndex];
    if (prompt) {
      selectPrompt(prompt);
    }
  }

  async function handleSave() {
    if (!canSave) return;
    if (hasSealedAll && !isEditing) return;

    setSaveState("saving");
    setErrorMessage("");

    const question = subject.trim();
    const answer = serializeEntryAnswer(
      plainTextToHtml(message.trim()),
      signature.trim()
    );

    try {
      if (isEditing && editingSlot) {
        const response = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            slot: editingSlot,
            question,
            answer
          })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          setSaveState("error");
          setErrorMessage(payload?.error ?? "Unable to reseal changes.");
          return;
        }

        const payload = (await response.json()) as { entry?: Entry };
        if (payload.entry) {
          setEntries((prev) =>
            prev.map((entry) =>
              entry.slot === payload.entry?.slot ? payload.entry : entry
            )
          );
        }
        setSaveState("success");
        return;
      }

      const response = await fetch("/api/entries/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          question,
          answer
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setSaveState("error");
        setErrorMessage(payload?.error ?? "Unable to seal this envelope.");
        return;
      }

      const payload = (await response.json()) as { entry?: Entry };
      if (payload.entry) {
        setEntries((prev) => [...prev, payload.entry].sort((a, b) => a.slot - b.slot));
        setEditingSlot(payload.entry.slot);
      }

      setSaveState("success");
    } catch {
      setSaveState("error");
      setErrorMessage("Unable to save right now.");
    }
  }

  async function handleDelete(slot: number) {
    const entry = entriesBySlot.get(slot);
    if (!entry) return;
    const confirmed = window.confirm("Delete this envelope?");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, slot })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setSaveState("error");
        setErrorMessage(payload?.error ?? "Unable to delete this envelope.");
        return;
      }

      setEntries((prev) => prev.filter((item) => item.slot !== slot));
      if (editingSlot === slot) {
        setSubject("");
        setMessage("");
        setSignature("");
        setEditingSlot(null);
      }
      setSaveState("idle");
      setErrorMessage("");
    } catch {
      setSaveState("error");
      setErrorMessage("Unable to delete this envelope.");
    }
  }

  const writingTitle = isEditing
    ? "Re-open & edit your love letter"
    : "Write your love letter";
  const primaryLabel = isEditing ? "Reseal changes" : "Seal & Save";

  return (
    <div className="envelope-layout">
      <div className="sr-only" aria-live="polite">
        {promptAnnouncement}
      </div>
      <section className="writing-desk">
        <div className="prompt-picker" ref={promptRef}>
          <p className="workflow-tag">Pick -&gt; Write</p>
          <h2>Pick a prompt (or write your own)</h2>
          <p>Choose one that feels right. Refresh for a new spark anytime.</p>

          <div className="prompt-options">
            <div className="prompt-option">
              <div className="prompt-panel">
                <div className="prompt-panel-header">
                  <h3>Prompt suggestions</h3>
                  <div className="prompt-panel-actions">
                    <button
                      type="button"
                      className="button ghost"
                      onClick={fetchSuggestions}
                      disabled={refreshing}
                    >
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                    <button
                      type="button"
                      className="button ghost"
                      onClick={nextSuggestion}
                      disabled={suggestions.length < 2}
                    >
                      Next prompt
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="notice">Loading prompts...</div>
                ) : (
                  <div className="prompt-list" role="list">
                    {suggestions.map((prompt) => (
                      <div
                        key={prompt}
                        className={`prompt-card ${
                          subject === prompt ? "active" : ""
                        }`}
                        role="listitem"
                      >
                        <p className="prompt-copy">{prompt}</p>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => selectPrompt(prompt)}
                        >
                          Use this prompt
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      <aside className="envelope-panel letter-panel">
        <div className="letter-header">
          <div>
            <h3>{writingTitle}</h3>
            <p className="letter-subtext">
              Choose a prompt or write your own, then seal it for February 14.
            </p>
          </div>
          <div className="progress-block">
            <p className="progress-text">Envelopes sealed: {sealedCount} / 5</p>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={sealedCount}
              aria-valuemin={0}
              aria-valuemax={5}
            >
              <div
                className="progress-fill"
                style={{ width: `${(sealedCount / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div
          className="letter-card"
          data-pulse={isPulsing ? "true" : "false"}
          ref={writingRef}
        >
          <div className="letter-field">
            <label htmlFor="letter-subject">Subject</label>
            <input
              id="letter-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject"
              aria-label="Subject"
            />
          </div>
          <div className="letter-field">
            <label htmlFor="letter-message">Message</label>
            <textarea
              id="letter-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={messagePlaceholder}
              aria-label="Message"
            />
          </div>
        </div>

        <div className="letter-actions">
          {hasSealedAll ? (
            <div className="notice">
              You've sealed all 5 envelopes for this year. You can still re-open
              one to edit.
            </div>
          ) : null}

          {saveState === "error" ? <div className="error">{errorMessage}</div> : null}
          {saveState === "success" ? (
            <div className="notice">Saved with love.</div>
          ) : null}

          <button
            type="button"
            className="button"
            onClick={handleSave}
            disabled={!canSave || hasSealedAll}
          >
            {primaryLabel}
          </button>
        </div>

        <div className="envelope-list-header">
          <h3>Love Envelopes</h3>
          <p>Your sealed notes for this year.</p>
        </div>

        <div className="envelope-list">
          {sealedCount === 0 ? (
            <div className="notice">
              <p>No envelopes yet.</p>
              <p>Pick a prompt on the left and seal your first one.</p>
            </div>
          ) : null}

          {entries.map((entry) => {
            const isActive = entry.slot === editingSlot;
            return (
              <div className="envelope-row" key={`envelope-${entry.slot}`}>
                <button
                  type="button"
                  className={`envelope-item sealed ${isActive ? "active" : ""}`}
                  onClick={() => openEnvelope(entry)}
                >
                  <div>
                    <h4>Envelope {entry.slot}</h4>
                    <p>{entry.question}</p>
                  </div>
                  <span className="envelope-status">Sealed</span>
                </button>
                <button
                  type="button"
                  className="envelope-delete"
                  onClick={() => handleDelete(entry.slot)}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>

        <div className="notice">
          You can open any sealed envelope to view or edit it before February 14.
        </div>
      </aside>
    </div>
  );
}
