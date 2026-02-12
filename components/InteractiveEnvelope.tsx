"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./InteractiveEnvelope.module.css";

export type EnvelopeMessage = {
  title: string;
  bodyHtml: string;
  signature: string;
  updatedAt: string;
};

export type EnvelopeDraft = {
  title: string;
  bodyHtml: string;
  signature: string;
};

type InteractiveEnvelopeProps = {
  initialMessage?: Partial<EnvelopeMessage>;
  message?: EnvelopeDraft;
  messageKey?: string;
  variant?: "hero" | "panel";
  defaultOpen?: boolean;
  storageKey?: string | null;
  openLabel?: string;
  saveLabel?: string;
  closeLabel?: string;
  saveDisabled?: boolean;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
  signaturePlaceholder?: string;
  pulseKey?: number;
  onChange?: (draft: EnvelopeDraft) => void;
  onSave?: (message: EnvelopeMessage) => void;
};

function buildMessage(
  title: string,
  bodyHtml: string,
  signature: string
): EnvelopeMessage {
  return {
    title,
    bodyHtml,
    signature,
    updatedAt: new Date().toISOString()
  };
}

export default function InteractiveEnvelope({
  initialMessage,
  message,
  messageKey,
  variant = "hero",
  defaultOpen = false,
  storageKey = "gay4u-envelope-draft",
  openLabel = "Open Message",
  saveLabel = "Save",
  closeLabel = "Close",
  saveDisabled = false,
  titlePlaceholder = "A note for us",
  bodyPlaceholder = "Write like you're sealing this up for future-us...",
  signaturePlaceholder = "With love",
  pulseKey,
  onChange,
  onSave
}: InteractiveEnvelopeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [title, setTitle] = useState(initialMessage?.title ?? "");
  const [bodyHtml, setBodyHtml] = useState(initialMessage?.bodyHtml ?? "");
  const [signature, setSignature] = useState(initialMessage?.signature ?? "");
  const [announcement, setAnnouncement] = useState("");
  const [isPulsing, setIsPulsing] = useState(false);

  const bodyRef = useRef<HTMLDivElement | null>(null);

  const isControlled = Boolean(message);
  const draft: EnvelopeDraft = {
    title: isControlled ? message?.title ?? "" : title,
    bodyHtml: isControlled ? message?.bodyHtml ?? "" : bodyHtml,
    signature: isControlled ? message?.signature ?? "" : signature
  };

  const envelopeState = isOpen ? "open" : "closed";

  useEffect(() => {
    if (storageKey === null) return;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as EnvelopeMessage;
      const nextDraft = {
        title: parsed?.title ?? "",
        bodyHtml: parsed?.bodyHtml ?? "",
        signature: parsed?.signature ?? ""
      };
      if (isControlled) {
        onChange?.(nextDraft);
      } else {
        if (nextDraft.title) setTitle(nextDraft.title);
        if (nextDraft.bodyHtml) setBodyHtml(nextDraft.bodyHtml);
        if (nextDraft.signature) setSignature(nextDraft.signature);
      }
    } catch {
      // ignore bad cache
    }
  }, [storageKey, messageKey, isControlled, onChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const payload = buildMessage(draft.title, draft.bodyHtml, draft.signature);
      if (storageKey !== null) {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [draft.title, draft.bodyHtml, draft.signature, storageKey]);

  useEffect(() => {
    if (!isOpen) return;
    setAnnouncement("Message opened");
    const timeout = setTimeout(() => setAnnouncement(""), 1500);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!pulseKey) return;
    setIsPulsing(true);
    const timeout = setTimeout(() => setIsPulsing(false), 650);
    return () => clearTimeout(timeout);
  }, [pulseKey, prefersReducedMotion]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    bodyRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (messageKey !== undefined) {
      setIsOpen(defaultOpen);
    }
    if (isControlled) return;
    if (messageKey === undefined && !initialMessage) return;
    setTitle(initialMessage?.title ?? "");
    setBodyHtml(initialMessage?.bodyHtml ?? "");
    setSignature(initialMessage?.signature ?? "");
  }, [messageKey, defaultOpen, initialMessage, isControlled]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== draft.bodyHtml) {
      el.innerHTML = draft.bodyHtml;
    }
  }, [draft.bodyHtml]);

  const transitions = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        flap: { duration: 0.01 },
        letter: { duration: 0.01 },
        sides: { duration: 0.01 }
      };
    }
    return {
      flap: { type: "spring", stiffness: 120, damping: 18, delay: 0 },
      sides: { type: "spring", stiffness: 140, damping: 20, delay: 0.12 },
      letter: { type: "spring", stiffness: 110, damping: 18, delay: 0.18 }
    };
  }, [prefersReducedMotion]);

  function handleSave() {
    const payload = buildMessage(draft.title, draft.bodyHtml, draft.signature);
    onSave?.(payload);
    setAnnouncement("Message saved");
    setTimeout(() => setAnnouncement(""), 1200);
  }

  function updateDraft(next: Partial<EnvelopeDraft>) {
    const payload = { ...draft, ...next };
    if (isControlled) {
      onChange?.(payload);
    } else {
      setTitle(payload.title);
      setBodyHtml(payload.bodyHtml);
      setSignature(payload.signature);
    }
  }

  return (
    <section
      className={styles.hero}
      data-state={envelopeState}
      data-reduced={prefersReducedMotion ? "true" : "false"}
      data-variant={variant}
      data-pulse={isPulsing ? "true" : "false"}
    >
      <div className={styles.backdropGlow} aria-hidden="true" />
      <div className={styles.particles} aria-hidden="true" />

      <div className={styles.content}>
        {variant === "hero" ? (
          <div className={styles.copy}>
            <p className={styles.kicker}>Interactive envelope</p>
            <h1>Seal your love for future-us.</h1>
            <p className={styles.subtext}>
              Open the envelope, write your letter, and save it as a time capsule
              you can revisit.
            </p>

            <div className={styles.ctaRow}>
              {!isOpen ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => setIsOpen(true)}
                  aria-label="Open envelope"
                >
                  {openLabel}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleSave}
                    disabled={saveDisabled}
                  >
                    {saveLabel}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setIsOpen(false)}
                  >
                    {closeLabel}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className={styles.stage}>
          <div className={styles.srOnly} aria-live="polite">
            {announcement}
          </div>
          <div className={styles.envelope}>
            <motion.div
              className={styles.flap}
              animate={isOpen ? { rotateX: -140 } : { rotateX: 0 }}
              transition={transitions.flap}
              aria-hidden="true"
            />
            <motion.div
              className={styles.sideLeft}
              animate={isOpen ? { x: -6 } : { x: 0 }}
              transition={transitions.sides}
              aria-hidden="true"
            />
            <motion.div
              className={styles.sideRight}
              animate={isOpen ? { x: 6 } : { x: 0 }}
              transition={transitions.sides}
              aria-hidden="true"
            />
            <motion.div
              className={styles.letter}
              animate={
                isOpen
                  ? { y: -140, opacity: 1 }
                  : { y: -40, opacity: 0 }
              }
              transition={transitions.letter}
            >
              <div className={styles.letterInner}>
                <label className={styles.label}>
                  <span className={styles.labelText}>Subject</span>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(event) => updateDraft({ title: event.target.value })}
                    placeholder={titlePlaceholder}
                    aria-label="Editable title"
                    disabled={!isOpen}
                  />
                </label>

                <label className={styles.label}>
                  <span className={styles.labelText}>Message</span>
                  <div
                    ref={bodyRef}
                    className={styles.richBody}
                    contentEditable={isOpen}
                    suppressContentEditableWarning
                    aria-label="Editable message body"
                    data-placeholder={bodyPlaceholder}
                    onInput={(event) =>
                      updateDraft({
                        bodyHtml: (event.target as HTMLDivElement).innerHTML
                      })
                    }
                    dangerouslySetInnerHTML={{ __html: draft.bodyHtml }}
                  />
                </label>

                <label className={styles.label}>
                  <span className={styles.labelText}>Signature</span>
                  <input
                    type="text"
                    value={draft.signature}
                    onChange={(event) => updateDraft({ signature: event.target.value })}
                    placeholder={signaturePlaceholder}
                    aria-label="Editable signature"
                    disabled={!isOpen}
                  />
                </label>
              </div>
            </motion.div>
            <div className={styles.envelopeBase} aria-hidden="true" />
          </div>
          {variant === "panel" ? (
            <div className={styles.panelCta}>
              {!isOpen ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => setIsOpen(true)}
                  aria-label="Open envelope"
                >
                  {openLabel}
                </button>
              ) : (
                <div className={styles.ctaRow}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleSave}
                    disabled={saveDisabled}
                  >
                    {saveLabel}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setIsOpen(false)}
                  >
                    {closeLabel}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
