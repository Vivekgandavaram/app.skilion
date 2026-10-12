"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X, Check, AlertTriangle, Copy } from "lucide-react";

/* ---------- toasts ---------- */
type Toast = { id: number; msg: string; kind: "ok" | "err" | "info" };
const ToastCtx = createContext<{ toast: (msg: string, kind?: Toast["kind"]) => void }>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const toast = useCallback((msg: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-3), { id, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), kind === "err" ? 6500 : 3800);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="toasts" aria-live="polite" role="status">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind === "err" ? "err" : t.kind === "ok" ? "ok" : ""}`}>
            {t.kind === "err" ? <AlertTriangle size={18} aria-hidden /> : t.kind === "ok" ? <Check size={18} aria-hidden /> : null}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- modal ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => ref.current?.querySelector<HTMLElement>("input,textarea,select,button")?.focus(), 30);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? "modal-lg" : ""}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="row between" style={{ marginBottom: 16 }}>
          <h2 className="h3">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", danger, busy, onConfirm, onClose }: { open: boolean; title: string; body: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="stack">
        <div className="muted">{body}</div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={busy}>{busy ? <span className="spinner" /> : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- small helpers ---------- */
export function Spinner({ label = "Loading" }: { label?: string }) { return <span className="spinner" role="status" aria-label={label} />; }
export function Skeleton({ h = 90, className = "" }: { h?: number; className?: string }) { return <div className={`skel ${className}`} style={{ height: h }} aria-hidden />; }

export function Field({ label, help, error, optional, children, htmlFor }: { label: string; help?: string; error?: string; optional?: boolean; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label className="label" htmlFor={htmlFor}>{label}{optional && <span className="opt"> (optional)</span>}</label>
      {children}
      {help && !error && <span className="help">{help}</span>}
      {error && <span className="error-text" role="alert">{error}</span>}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  );
}

export function Tabs<T extends string>({ value, tabs, onChange }: { value: T; tabs: { value: T; label: string; badge?: number }[]; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" className="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}>
          {t.label}{!!t.badge && <> <span className="badge-n">{t.badge}</span></>}
        </button>
      ))}
    </div>
  );
}

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const { toast } = useToast();
  return (
    <button className="btn btn-ghost btn-sm" type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); toast("Copied", "ok"); } catch { toast("Copy failed. Select the text and copy manually.", "err"); } }}>
      <Copy aria-hidden /> {label}
    </button>
  );
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** Calls fn every `ms` while the tab is visible (also on focus). Used for messaging and counters. */
export function usePoll(fn: () => void | Promise<void>, ms: number, deps: unknown[] = [], enabled = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState === "visible") { try { await ref.current(); } catch {} }
      timer = setTimeout(tick, ms);
    };
    tick();
    const onVis = () => { if (document.visibilityState === "visible") { clearTimeout(timer); tick(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, enabled, ...deps]);
}
