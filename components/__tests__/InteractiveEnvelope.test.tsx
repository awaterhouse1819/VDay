import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import InteractiveEnvelope from "../InteractiveEnvelope";

function openEnvelope() {
  const button = screen.getByRole("button", { name: /open message/i });
  fireEvent.click(button);
}

function mockReducedMotion(matches: boolean) {
  window.matchMedia = (query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? matches : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  });
}

describe("InteractiveEnvelope", () => {
  it("opens and closes", () => {
    render(<InteractiveEnvelope />);
    openEnvelope();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(screen.getByRole("button", { name: /open message/i })).toBeInTheDocument();
  });

  it("updates editable content", () => {
    render(<InteractiveEnvelope />);
    openEnvelope();
    const titleInput = screen.getByLabelText(/editable title/i);
    fireEvent.change(titleInput, { target: { value: "New Title" } });
    expect(titleInput).toHaveValue("New Title");
  });

  it("emits save payload", () => {
    const onSave = vi.fn();
    render(<InteractiveEnvelope onSave={onSave} />);
    openEnvelope();
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload).toHaveProperty("title");
    expect(payload).toHaveProperty("bodyHtml");
    expect(payload).toHaveProperty("signature");
    expect(payload).toHaveProperty("updatedAt");
  });

  it("sets reduced motion attribute when requested", () => {
    mockReducedMotion(true);
    const { container } = render(<InteractiveEnvelope />);
    const section = container.querySelector("section");
    expect(section?.getAttribute("data-reduced")).toBe("true");
  });
});
