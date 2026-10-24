import { useCallback, useState, type FormEvent } from "react";
import { PairButton } from "../../pairing/PairingPage";
import { markOnboarded, Onboarding, shouldShowOnboarding } from "../Onboarding";
import { StartFrame } from "./StartFrame";

export const MODES: [string, string][] = [
  ["math", "Maths"], ["consulting", "Consulting case"], ["system_design", "System design"],
  ["language", "Language"], ["accounting", "Accounting"], ["sudoku", "Sudoku"], ["other", "Other"],
];

const BLURB: Record<string, string> = {
  math: "Algebra, calculus, proofs — one line at a time.",
  consulting: "Structure a case, size a market, find the answer.",
  system_design: "Boxes, arrows and the trade-offs between them.",
  language: "Grammar, vocabulary and writing practice.",
  accounting: "Journals, ledgers and balance sheets.",
  sudoku: "Logic, one square at a time.",
  other: "Bring anything — we’ll figure it out together.",
};

const LOOK: Record<string, string> = { math: "maths", language: "english", accounting: "science" };

export const NAME_KEY = "opentutor.name.v1";

function loadName(): string {
  try { return localStorage.getItem(NAME_KEY)?.trim() ?? ""; } catch { return ""; }
}
function saveName(name: string | null): void {
  try {
    if (name) localStorage.setItem(NAME_KEY, name);
    else localStorage.removeItem(NAME_KEY);
  } catch { /* storage unavailable: the name lives for this visit only */ }
}

type Step = "join" | "subjects" | "start";

export function StartFlow({ initialMode, initialProblem, onStart }: {
  initialMode: string;
  initialProblem: string;
  onStart: (mode: string, problem: string, student: string) => void | Promise<void>;
}) {
  const fromUrl = new URLSearchParams(location.search).has("mode");
  const [name, setName] = useState(loadName);
  const [draft, setDraft] = useState("");
  const [step, setStep] = useState<Step>(() => (loadName() ? "subjects" : "join"));
  const [mode, setMode] = useState(initialMode);
  const [problem, setProblem] = useState(initialProblem);
  const [intro, setIntro] = useState(shouldShowOnboarding); // first run: a short how-it-works overlay
  const closeIntro = useCallback(() => { markOnboarded(); setIntro(false); }, []);

  const join = (e: FormEvent) => {
    e.preventDefault();
    const n = draft.trim().slice(0, 20);
    if (!n) return;
    saveName(n);
    setName(n);
    setStep("subjects");
  };
  const notMe = () => { saveName(null); setDraft(""); setName(""); setStep("join"); };
  const label = MODES.find(([v]) => v === mode)?.[1] ?? "Other";

  return (
    <StartFrame name={name || null}>
      {step === "join" && (
        <section className="ot-join" data-testid="join">
          <div>
            <span className="ot-page-kicker"><span className="ot-star">✳</span> Free to ask. Free to learn.</span>
            <h1>Big questions.<br /><span className="ot-muted-title">Small steps.</span></h1>
            <p className="ot-join-copy">Your homework. Your pace. A tutor that helps you find the way — not just the answer.</p>
            <form className="ot-join-form" onSubmit={join}>
              <label htmlFor="ot-nickname">What should we call you?</label>
              <div className="ot-field">
                <input id="ot-nickname" value={draft} onChange={(e) => setDraft(e.target.value)}
                  required minLength={1} maxLength={20} pattern=".*\S.*" autoComplete="off" autoCapitalize="words"
                  enterKeyHint="go" placeholder="Just a nickname…" aria-describedby="ot-nickname-help" />
                <button className="ot-btn" type="submit">Let’s begin ↗</button>
              </div>
              <span id="ot-nickname-help" className="ot-help">1–20 characters · not your full name</span>
            </form>
            <div className="ot-join-promises"><span>✓ No account</span><span>✓ Stays on this Mac</span><span>✓ Works offline</span></div>
          </div>
          <div className="ot-join-visual">
            <div className="ot-type-art" aria-hidden="true">
              <span className="ot-art-question">?</span><span className="ot-art-plus">+</span>
              <span className="ot-art-word">aha<span>!</span></span>
              <span className="ot-art-note">GOOD QUESTIONS<br />MAKE GREAT BEGINNINGS.</span>
              <span className="ot-art-star">✳</span>
            </div>
          </div>
        </section>
      )}

      {step === "subjects" && (
        <section data-testid="subjects">
          <span className="ot-page-kicker"><span className="ot-star">✳</span> Your next lightbulb moment</span>
          <div className="ot-title-row">
            <div>
              <h1>Hey, {name}.<br /><span className="ot-muted-title">What are you practising?</span></h1>
              <button type="button" className="ot-link" onClick={notMe}>Not {name}?</button>
            </div>
            <span className="ot-open-label" aria-hidden="true">OPEN MINDS<br />WELCOME HERE ↙</span>
          </div>
          <div className="ot-section-title"><h2>Your subjects</h2><span>01 — CHOOSE A SUBJECT</span></div>
          <ul className="ot-subjects">
            {MODES.map(([v, l], i) => (
              <li key={v}>
                <button type="button" className={`ot-subject ${LOOK[v] ?? "other"}${fromUrl && v === initialMode ? " picked" : ""}`}
                  aria-current={fromUrl && v === initialMode ? "true" : undefined}
                  onClick={() => { setMode(v); setStep("start"); }}>
                  <span className="ot-subject-top"><span>{l}</span><span aria-hidden="true">0{i + 1}</span></span>
                  <span className="ot-subject-blurb">{BLURB[v]}</span>
                  <span className="ot-subject-foot" aria-hidden="true"><span>Let’s work it out</span><span>↗</span></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === "start" && (
        <section className="ot-start-step" data-testid="start-step">
          <button type="button" className="ot-link" onClick={() => setStep("subjects")}>← Subjects</button>
          <span className="ot-page-kicker"><span className="ot-star">✳</span> 02 — Bring a question</span>
          <h1>{label}<br /><span className="ot-muted-title">Pencil ready?</span></h1>
          <form className={`ot-start-form ${LOOK[mode] ?? "other"}`}
            onSubmit={(e) => { e.preventDefault(); void onStart(mode, problem, name); }}>
            <label htmlFor="ot-problem">The problem (optional)</label>
            <textarea id="ot-problem" value={problem} onChange={(e) => setProblem(e.target.value)} rows={4}
              placeholder="e.g. Compute ∫₀¹ x³ dx. Show your steps." />
            <div className="ot-actions">
              <button className="ot-btn" type="submit">Start writing</button>
              <PairButton />
              <button type="button" className="ot-link" onClick={() => setIntro(true)}>How it works</button>
            </div>
          </form>
        </section>
      )}
      {intro && <Onboarding onClose={closeIntro} />}
    </StartFrame>
  );
}
