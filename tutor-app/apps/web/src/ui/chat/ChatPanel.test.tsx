import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientMessage, FeedbackEvent } from "../../protocol";
import { ChatPanel, type ChatPanelProps } from "./ChatPanel";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  document.body.append(el);
  root = createRoot(el);
});
afterEach(() => {
  act(() => root.unmount());
  el.remove();
});

const speak = (id: string, text: string): FeedbackEvent => ({ id, page_id: "p1", anchor: { kind: "page" } as FeedbackEvent["anchor"], type: "speak", text });

function render(over: Partial<ChatPanelProps> = {}) {
  const send = vi.fn<(m: ClientMessage) => void>();
  const props: ChatPanelProps = { subject: "Maths", student: "Ada", pageId: "p1", feedback: [], transcripts: [], send, ...over };
  act(() => root.render(<ChatPanel {...props} />));
  return { send, props };
}

function type(text: string) {
  const ta = el.querySelector("textarea")!;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  act(() => {
    setter.call(ta, text);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const turns = () => [...el.querySelectorAll(".ot-turn")].map((t) => ({
  who: t.classList.contains("tutor") ? "tutor" : "student",
  name: t.querySelector(".ot-turn-name")?.textContent,
  text: t.querySelector(".ot-turn-text")?.textContent,
}));

describe("ChatPanel", () => {
  it("shows the empty state and the header", () => {
    render();
    expect(el.textContent).toContain("Maths tutor");
    expect(el.textContent).toContain("Let’s figure it out.");
  });

  it("sends typed text as chat.text and shows it as the student's turn", () => {
    const { send } = render();
    type("why?");
    act(() => el.querySelector<HTMLButtonElement>("button[aria-label=Send]")!.click());
    expect(send).toHaveBeenCalledWith({ type: "chat.text", page_id: "p1", text: "why?" });
    expect(turns()).toEqual([{ who: "student", name: "Ada", text: "why?" }]);
    expect(el.querySelector("textarea")!.value).toBe("");
  });

  it("Enter sends, Shift+Enter does not", () => {
    const { send } = render();
    type("hello");
    const ta = el.querySelector("textarea")!;
    act(() => { ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true })); });
    expect(send).not.toHaveBeenCalled();
    act(() => { ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); });
    expect(send).toHaveBeenCalledWith({ type: "chat.text", page_id: "p1", text: "hello" });
  });

  it("a speak answer is a tutor turn, after the transcript it answers, without duplicates", () => {
    const { props } = render({ student: null });
    act(() => root.render(<ChatPanel {...props} transcripts={["what is x?"]} />));
    const fb = [speak("f1", "Try isolating x.")];
    act(() => root.render(<ChatPanel {...props} transcripts={["what is x?"]} feedback={fb} />));
    act(() => root.render(<ChatPanel {...props} transcripts={["what is x?"]} feedback={[...fb]} />));
    expect(turns()).toEqual([
      { who: "student", name: "You", text: "what is x?" },
      { who: "tutor", name: "Open Tutor", text: "Try isolating x." },
    ]);
  });

  it("highlights the hint ladder up to the highest hint level", () => {
    const hint: FeedbackEvent = { ...speak("h", "Look at the sign."), type: "hint", hint_level: 2 };
    render({ feedback: [hint] });
    expect([...el.querySelectorAll(".ot-hint-ladder li.done")].map((li) => li.textContent)).toEqual(["1A nudge", "2The method"]);
  });
});
