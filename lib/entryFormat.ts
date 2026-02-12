export type ParsedEntryAnswer = {
  bodyHtml: string;
  signature: string;
  format: "json" | "text";
};

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;"
};

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

export function htmlToPlainText(html: string) {
  if (!html) return "";
  if (typeof window !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent ?? "";
  }
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function plainTextToHtml(text: string) {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

export function parseEntryAnswer(raw: string): ParsedEntryAnswer {
  if (!raw) {
    return { bodyHtml: "", signature: "", format: "text" };
  }

  try {
    const parsed = JSON.parse(raw) as { bodyHtml?: unknown; signature?: unknown };
    if (parsed && typeof parsed.bodyHtml === "string") {
      return {
        bodyHtml: parsed.bodyHtml,
        signature: typeof parsed.signature === "string" ? parsed.signature : "",
        format: "json"
      };
    }
  } catch {
    // fall through to plain text handling
  }

  return {
    bodyHtml: escapeHtml(raw).replace(/\n/g, "<br />"),
    signature: "",
    format: "text"
  };
}

export function serializeEntryAnswer(bodyHtml: string, signature: string) {
  return JSON.stringify({ bodyHtml, signature });
}
