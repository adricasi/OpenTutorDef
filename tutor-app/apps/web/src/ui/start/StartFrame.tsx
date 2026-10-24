import type { ReactNode } from "react";
import "./start.css";

/** The OpenTutor shell for the screens before a session: dark rail, top bar, content, footer. */
export function StartFrame({ name, children }: { name?: string | null; children: ReactNode }) {
  return (
    <div className="ot-start">
      <aside className="ot-rail">
        <span className="ot-brand">Open Tutor<span className="ot-brand-period">.</span></span>
        <span className="ot-rail-label">ONE MAC. EVERY PAGE.</span>
        <div className="ot-rail-statement" aria-hidden="true"><span>?</span><p>Great things<br />start with<br />a question.</p></div>
        <div className="ot-rail-footer"><span className="ot-live-dot" />Local<p>Gemma 4 · on this Mac</p></div>
      </aside>
      <div className="ot-body">
        <header className="ot-topbar">
          <span className="ot-crumb"><strong>Open Tutor</strong> ›</span>
          <div className="ot-top-right">
            <span className="ot-pill"><span className="ot-live-dot" />Local-first</span>
            {name && <span className="ot-user"><span aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>{name}</span>}
          </div>
        </header>
        <main className="ot-main">{children}</main>
        <footer className="ot-footer">
          <span>No account. Your work stays on this Mac.</span>
          <span>AI can make mistakes — check with your teacher. <span className="ot-footer-mark" aria-hidden="true">✳</span></span>
        </footer>
      </div>
    </div>
  );
}
