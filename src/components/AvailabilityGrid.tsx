"use client";
import { useRef, useState } from "react";
import { PRESETS } from "@/lib/availability";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hourLabel = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);

/** 7x24 weekly grid in the person's local time. Click or drag to paint; presets fill common patterns. */
export default function AvailabilityGrid({ slots, onChange, timezone }: { slots: number[]; onChange: (s: number[]) => void; timezone: string }) {
  const set = new Set(slots);
  const [paint, setPaint] = useState<null | boolean>(null);
  const live = useRef(new Set(slots));
  const apply = (i: number, on: boolean) => { if (on) live.current.add(i); else live.current.delete(i); onChange([...live.current].sort((a, b) => a - b)); };
  live.current = new Set(slots);
  return (
    <div className="stack">
      <div className="chips" role="group" aria-label="Presets">
        {Object.entries(PRESETS).map(([k, p]) => <button type="button" key={k} className="chip chip-line" title={p.description} onClick={() => onChange(p.slots)}>{p.label}</button>)}
        <button type="button" className="chip chip-line" onClick={() => onChange([])}>Clear</button>
      </div>
      <div className="heat-wrap" onMouseUp={() => setPaint(null)} onMouseLeave={() => setPaint(null)} onTouchEnd={() => setPaint(null)}>
        <div className="heat slot-grid" role="grid" aria-label={`Weekly availability in ${timezone}`}>
          <span />
          {Array.from({ length: 24 }, (_, h) => <span key={h} className="hdr">{h % 3 === 0 ? hourLabel(h) : ""}</span>)}
          {DAYS.map((d, di) => (
            <div key={d} style={{ display: "contents" }} role="row">
              <span className="day">{d}</span>
              {Array.from({ length: 24 }, (_, h) => {
                const i = di * 24 + h; const on = set.has(i);
                return <button type="button" key={i} role="gridcell" className={`cell ${on ? "on" : ""}`} aria-pressed={on} aria-label={`${d} ${hourLabel(h)}`}
                  onMouseDown={(e) => { e.preventDefault(); setPaint(!on); apply(i, !on); }}
                  onMouseEnter={() => paint !== null && apply(i, paint)}
                  onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); apply(i, !on); } }} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <span className="help">{slots.length} free hours a week in {timezone.replace(/_/g, " ")}. Teammates see overlap converted to their own time zone. Daylight saving changes are not applied.</span>
    </div>
  );
}
