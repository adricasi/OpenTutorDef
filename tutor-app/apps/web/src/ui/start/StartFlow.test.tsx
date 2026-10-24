import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The start screens show the pairing button; keep it off the network.
vi.mock("../../pairing/PairingPage", () => ({
  PairButton: () => null,
  PairingPage: () => null,
}));

import { StartFlow } from "./StartFlow";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let el: HTMLDivElement;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("inktutor.onboarded.v1", "1");
  el = document.createElement("div");
  document.body.append(el);
  root = createRoot(el);
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
});
afterEach(() => {
  act(() => root.unmount());
  el.remove();
  vi.unstubAllGlobals();
});

const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** Accessible name of a button: aria-label, aria-labelledby, or its text. */
function buttonName(b: HTMLElement): string {
  const label = b.getAttribute("aria-label");
  if (label) return norm(label);
  const by = b.getAttribute("aria-labelledby");
  if (by) return norm(by.split(/\s+/).map((id) => document.getElementById(id)?.textContent).join(" "));
  return norm(b.textContent);
}

function button(scope: ParentNode, startsWith: string): HTMLButtonElement {
  const all = [...scope.querySelectorAll<HTMLButtonElement>("button, [role=button]")];
  const hit = all.find((b) => buttonName(b).startsWith(startsWith));
  if (!hit) throw new Error(`no button starting with "${startsWith}"; have: ${all.map(buttonName).join(" | ")}`);
  return hit;
}

function inputByLabel(scope: ParentNode, text: string): HTMLInputElement {
  for (const i of scope.querySelectorAll<HTMLInputElement>("input")) {
    if (norm(i.getAttribute("aria-label")) === text) return i;
  }
  for (const l of scope.querySelectorAll("label")) {
    if (!norm(l.textContent).startsWith(text)) continue;
    const nested = l.querySelector("input");
    if (nested) return nested;
    if (l.htmlFor) return document.getElementById(l.htmlFor) as HTMLInputElement;
  }
  throw new Error(`no input labelled "${text}"`);
}

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const click = (b: HTMLElement) => act(() => b.click());
const step = (id: string) => el.querySelector(`[data-testid="${id}"]`);

describe("StartFlow", () => {
  it("joins with a name, picks Maths and starts writing", () => {
    const onStart = vi.fn();
    act(() => root.render(<StartFlow initialMode="math" initialProblem="" onStart={onStart} />));

    const join = step("join")!;
    expect(join).not.toBeNull();
    type(inputByLabel(join, "What should we call you?"), "Ana");
    click(button(join, "Let’s begin"));

    const subjects = step("subjects")!;
    expect(subjects).not.toBeNull();
    click(button(subjects, "Maths"));

    const start = step("start-step")!;
    expect(start).not.toBeNull();
    click(button(start, "Start writing"));

    expect(onStart).toHaveBeenCalledWith("math", "", "Ana");
  });

  it("remembers the name, so a fresh render starts on Subjects", () => {
    act(() => root.render(<StartFlow initialMode="math" initialProblem="" onStart={() => {}} />));
    type(inputByLabel(step("join")!, "What should we call you?"), "Ana");
    click(button(step("join")!, "Let’s begin"));
    expect(localStorage.getItem("opentutor.name.v1")).toContain("Ana");

    act(() => root.unmount());
    root = createRoot(el);
    act(() => root.render(<StartFlow initialMode="math" initialProblem="" onStart={() => {}} />));
    expect(step("join")).toBeNull();
    expect(step("subjects")).not.toBeNull();
  });
});
