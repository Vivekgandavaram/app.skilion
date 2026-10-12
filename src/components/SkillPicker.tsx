"use client";
import { useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { SKILL_SUGGESTIONS } from "@/data/skill-suggestions";
import { skillsFor } from "@/data/taxonomy";
import { normSkill } from "@/lib/skills";

/** Tag input with suggestions. Values are display names; the server normalises them again. */
export default function SkillPicker({ value, onChange, max = 30, id = "skills", domain, subdomain }: { domain?: string; subdomain?: string; value: string[]; onChange: (v: string[]) => void; max?: number; id?: string }) {
  const [text, setText] = useState("");
  const [focus, setFocus] = useState(false);
  const have = useMemo(() => new Set(value.map((v) => normSkill(v).slug)), [value]);
  const suggestions = useMemo(() => {
    const t = text.trim().toLowerCase();
    const pool = [...new Set([...skillsFor(domain, subdomain), ...SKILL_SUGGESTIONS])];
    return pool.filter((s) => !have.has(normSkill(s).slug) && (!t || s.toLowerCase().includes(t))).slice(0, 8);
  }, [text, have, domain, subdomain]);
  const add = (raw: string) => {
    const n = normSkill(raw);
    if (!n.name || have.has(n.slug) || value.length >= max) return;
    onChange([...value, n.name]); setText("");
  };
  return (
    <div className="stack-sm">
      <div className="chips" aria-live="polite">
        {value.map((s) => <span key={s} className="chip">{s}<button type="button" className="link-btn" style={{ display: "inline-flex", textDecoration: "none" }} aria-label={`Remove ${s}`} onClick={() => onChange(value.filter((x) => x !== s))}><X size={14} /></button></span>)}
      </div>
      <div className="row-nowrap">
        <input id={id} className="input" value={text} placeholder="Type a skill and press Enter" onChange={(e) => setText(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 120)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); if (text.trim()) add(text); } if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1)); }} maxLength={40} />
        <button type="button" className="btn btn-soft" onClick={() => text.trim() && add(text)} aria-label="Add skill"><Plus /></button>
      </div>
      {(focus || text || subdomain) && suggestions.length > 0 && (
        <div className="chips" aria-label="Suggested skills">
          {suggestions.map((s) => <button type="button" key={s} className="chip chip-line" onMouseDown={(e) => e.preventDefault()} onClick={() => add(s)}>{s}</button>)}
        </div>
      )}
      {value.length >= max - 5 && <span className="help">{value.length}/{max} skills</span>}
    </div>
  );
}
