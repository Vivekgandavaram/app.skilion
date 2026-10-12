import Link from "next/link";
import Image from "next/image";

/** Split auth layout with an unframed brand panel. */
export default function AuthShell({ title, sub, children, footer }: { title: string; sub?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <section className="auth-main">
        <div className="auth-brand"><Link href="/" aria-label="Skilion home"><Image src="/brand/skilion-wordmark.png" alt="Skilion" width={640} height={213} priority style={{ height: 30, width: "auto" }} /></Link></div>
        <div className="auth-card">
          <div className="stack" style={{ marginBottom: 24 }}>
            <h1 className="h1" style={{ fontSize: 34 }}>{title}</h1>
            {sub && <p className="muted">{sub}</p>}
          </div>
          {children}
          {footer && <div className="auth-footer small muted">{footer}</div>}
        </div>
      </section>
      <aside className="auth-side" aria-label="About Skilion">
        <div className="auth-art auth-art-logo">
          <Image src="/brand/skilion-mark.svg" alt="Skilion logo" width={320} height={320} priority />
        </div>
        <div className="stack-sm">
          <p className="auth-quote">Find the people to build with, by what they have made.</p>
          <p className="small muted">Validate an idea, build a prototype, get help or start a company. Around a day job or full time.</p>
        </div>
      </aside>
    </div>
  );
}
