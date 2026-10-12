import type { ReactNode } from "react";
import Illustration from "./Illustration";

/** Server-only (the illustration reads the assets folder). Client components should render their own empty state. */
export function EmptyState({ illustration, title, body, action }: { illustration?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {illustration && <Illustration id={illustration} />}
      <h3 className="h3">{title}</h3>
      {body && <p className="muted" style={{ maxWidth: 440 }}>{body}</p>}
      {action}
    </div>
  );
}
