import manifest from "@/generated/illustrations.json";
import { SLOT_MAP, BRAND_TEMPLATE } from "@/data/illustrations";

/** Image path from the generated manifest (npm run assets:sync / assets:watch rebuilds it from public/illustrations). */
function resolve(id: string): string | null {
  return (manifest as Record<string, string>)[id] || null;
}

/** True when a finished image exists for this slot. Pages use it to add art only once it has been generated. */
export const hasIllustration = (id: string) => !!resolve(id);

/**
 * <Illustration id="hero" /> shows public/illustrations/hero.(webp|png|jpg|svg) when it exists,
 * otherwise a brand-styled placeholder. Register slots in src/data/illustrations.ts.
 */
export default function Illustration({ id, className = "", priority = false, rounded = true, fit = "cover" }: { id: string; className?: string; priority?: boolean; rounded?: boolean; fit?: "cover" | "contain" }) {
  const slot = SLOT_MAP[id];
  if (!slot) return null;
  const src = resolve(id);
  const style = { aspectRatio: `${slot.w} / ${slot.h}` } as const;
  const cls = `illo ${rounded ? "illo-round" : ""} ${className}`;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={slot.alt} width={slot.w} height={slot.h} className={cls} style={{ ...style, objectFit: fit }} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : "auto"} />;
  }
  // Unfilled slots stay invisible to visitors. Set NEXT_PUBLIC_SHOW_SLOTS=1 to see them while generating art.
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SHOW_SLOTS !== "1") return null;
  const showPrompt = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_PROMPTS === "1";
  return (
    <div className={`illo illo-ph ${rounded ? "illo-round" : ""} ${className}`} style={style} role="img" aria-label={slot.alt || "Illustration placeholder"} data-illustration={id}>
      <svg className="illo-ph-grid" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#65C7F3" stopOpacity=".35" /><stop offset="1" stopColor="#159BD4" stopOpacity=".08" /></linearGradient></defs>
        <rect width="100" height="60" fill={`url(#g-${id})`} />
        <path d="M0 45 C20 35 35 55 55 42 S85 30 100 38" stroke="#65C7F3" strokeOpacity=".5" strokeWidth=".4" fill="none" />
        <path d="M0 30 C25 20 40 40 60 28 S90 18 100 24" stroke="#159BD4" strokeOpacity=".35" strokeWidth=".4" fill="none" />
        <circle cx="78" cy="18" r="2.2" fill="#F0441E" fillOpacity=".9" />
      </svg>
      <div className="illo-ph-label">
        <span className="illo-ph-tag">Illustration slot</span>
        <strong>{slot.id}</strong>
        <span>{slot.w} x {slot.h} · public/illustrations/{slot.id}.webp</span>
        {showPrompt && (
          <details className="illo-ph-prompt">
            <summary>AI prompt</summary>
            <p>{BRAND_TEMPLATE(slot)}</p>
          </details>
        )}
      </div>
    </div>
  );
}
