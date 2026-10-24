import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ChatText, ClientMessage, FeedbackEvent } from "../../protocol";
import { TutorText } from "../../tutor/TutorText";
import "./chat.css";

export const MAX_CHAT = 1000;
const LADDER = ["A nudge", "The method", "The next step", "The answer"];
const TUTOR_TYPES = new Set<FeedbackEvent["type"]>(["speak", "hint", "explain", "question"]);

interface Turn { key: string; who: "tutor" | "student"; text: string; at: number }
interface Log {
  turns: Turn[];
  seen: string[]; // feedback ids already in the log (never duplicated across re-renders)
  transcripts: string[]; // the last transcripts window seen (the session keeps the last 6)
  key: string; // what the log was last merged from
  seq: number;
}

/** New transcripts = what follows the longest overlap between the old window's tail and the new window's head. */
function newTranscripts(prev: string[], next: string[]): string[] {
  for (let k = Math.min(prev.length, next.length); k > 0; k--) {
    if (prev.slice(-k).every((t, i) => t === next[i])) return next.slice(k);
  }
  return next;
}

function merge(log: Log, feedback: FeedbackEvent[], transcripts: string[], skip: ReadonlySet<string>, key: string): Log {
  let seq = log.seq;
  const turns = [...log.turns];
  const seen = new Set(log.seen);
  for (const t of newTranscripts(log.transcripts, transcripts)) {
    turns.push({ key: `t${seq}`, who: "student", text: t, at: seq++ });
  }
  for (const f of feedback) {
    if (seen.has(f.id) || !f.text || !TUTOR_TYPES.has(f.type) || skip.has(f.id)) continue;
    seen.add(f.id);
    turns.push({ key: `f:${f.id}`, who: "tutor", text: f.text, at: seq++ });
  }
  return { turns, seen: [...seen], transcripts, key, seq };
}

export interface ChatPanelProps {
  subject: string;
  student?: string | null;
  pageId: string;
  /** feedback events on the current page (hint/explain/speak/question texts become tutor turns) */
  feedback: FeedbackEvent[];
  /** final voice transcripts (oldest first) */
  transcripts: string[];
  send: (m: ClientMessage) => void;
  /** feedback ids that are shown elsewhere (e.g. the reference structure) */
  skip?: ReadonlySet<string>;
  /** small sections shown above the conversation (Problem, Checklist, Reference structure, …) */
  sections?: ReactNode;
  /** the Talk / mic control, shown in the composer */
  talk?: ReactNode;
}

const NO_SKIP: ReadonlySet<string> = new Set();

export function ChatPanel({ subject, student, pageId, feedback, transcripts, send, skip = NO_SKIP, sections, talk }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [log, setLog] = useState<Log>({ turns: [], seen: [], transcripts: [], key: "", seq: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  // stamp arrival order the first time an event / transcript is seen (derived state, updated during render)
  const key = `${feedback.map((f) => `${f.id}:${f.text ? 1 : 0}`).join(",")}|${transcripts.join("\u0001")}|${[...skip].join(",")}`;
  if (key !== log.key) setLog(merge(log, feedback, transcripts, skip, key));

  const current = new Map(feedback.map((f) => [f.id, f.text]));
  const turns = log.turns.map((t) => (t.key.startsWith("f:") ? { ...t, text: current.get(t.key.slice(2)) || t.text } : t));

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length]);

  const level = Math.max(0, ...feedback.filter((f) => f.type === "hint" && f.hint_level != null).map((f) => f.hint_level!));

  const submit = () => {
    const text = draft.trim().slice(0, MAX_CHAT);
    if (!text) return;
    const msg: ChatText = { type: "chat.text", page_id: pageId, text };
    send(msg);
    setLog((l) => ({ ...l, turns: [...l.turns, { key: `s${l.seq}`, who: "student", text, at: l.seq }], seq: l.seq + 1 }));
    setDraft("");
  };

  const you = student?.trim() || "You";

  return (
    <div className="ot-chat">
      <header className="ot-chat-head">
        <h2><span className="ot-live" aria-hidden="true" />{subject} tutor</h2>
        <p>Not the answer. The way to get there.</p>
      </header>

      {sections && <div className="ot-chat-sections">{sections}</div>}

      <div className="ot-chat-scroll" ref={scrollRef} aria-live="polite">
        {turns.length === 0 ? (
          <div className="ot-chat-empty">
            <div className="ot-chat-empty-mark" aria-hidden="true">?</div>
            <h3>Let’s figure it out.</h3>
            <p>Write on the page, or ask here. I’ll help one step at a time.</p>
          </div>
        ) : turns.map((t) => t.who === "tutor" ? (
          <div key={t.key} className="ot-turn tutor">
            <span className="ot-turn-avatar" aria-hidden="true">OT</span>
            <div>
              <div className="ot-turn-name">Open Tutor</div>
              <div className="ot-turn-text"><TutorText text={t.text} /></div>
            </div>
          </div>
        ) : (
          <div key={t.key} className="ot-turn student">
            <div>
              <div className="ot-turn-name">{you}</div>
              <div className="ot-turn-text">{t.text}</div>
            </div>
          </div>
        ))}
      </div>

      <ol className="ot-hint-ladder" aria-label="Hints on this page">
        {LADDER.map((label, i) => (
          <li key={label} className={i < level ? "done" : ""} aria-current={i + 1 === level ? "step" : undefined}>
            <span>{i + 1}</span>{label}
          </li>
        ))}
      </ol>

      <form className="ot-composer" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <textarea rows={1} value={draft} maxLength={MAX_CHAT} placeholder="Ask the tutor…" aria-label="Ask the tutor"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
          }} />
        {talk}
        <button type="submit" className="ot-send" aria-label="Send" disabled={!draft.trim()}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </form>
      <p className="ot-composer-foot">AI can make mistakes. Check with your teacher.</p>
    </div>
  );
}
