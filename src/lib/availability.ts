/**
 * Availability model. A person stores local hour-of-week slots: Monday 00:00 = 0 ... Sunday 23:00 = 167.
 * To compare people across time zones we convert to UTC slots using each person's *current* UTC offset.
 * Assumption (shown to users): daylight-saving shifts are ignored.
 */
export const HOURS = 168;

export function offsetHours(tz: string, at = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(at);
    const name = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
    const m = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const h = Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0);
    return m[1] === "-" ? -h : h;
  } catch {
    return 0;
  }
}
const mod = (n: number, m: number) => ((n % m) + m) % m;

export function toUtcSlots(local: number[], tz: string): number[] {
  const off = Math.round(offsetHours(tz)); // half-hour zones are rounded to the nearest hour
  return local.map((s) => mod(s - off, HOURS));
}
export function fromUtcSlots(utc: number[], tz: string): number[] {
  const off = Math.round(offsetHours(tz));
  return utc.map((s) => mod(s + off, HOURS));
}

export type Person = { id: string; name: string; timezone: string; slots: number[] };

/** counts[i] = number of people free in UTC hour-of-week i */
export function overlap(people: Person[]) {
  const counts = new Array(HOURS).fill(0);
  for (const p of people) for (const s of new Set(toUtcSlots(p.slots, p.timezone))) counts[s]++;
  return counts;
}

/** Hours per week where everyone in the group is free simultaneously. */
export function commonHours(people: Person[]) {
  if (people.length < 2) return people[0] ? new Set(people[0].slots).size : 0;
  const counts = overlap(people);
  return counts.filter((c) => c === people.length).length;
}
export function pairOverlapHours(a: Person, b: Person) {
  return commonHours([a, b]);
}

/** Re-project UTC counts onto a viewer's local week so the grid reads in their own time. */
export function heatmapFor(counts: number[], viewerTz: string): number[][] {
  const local = new Array(HOURS).fill(0);
  const off = Math.round(offsetHours(viewerTz));
  for (let u = 0; u < HOURS; u++) local[mod(u + off, HOURS)] = counts[u];
  return Array.from({ length: 7 }, (_, d) => local.slice(d * 24, d * 24 + 24));
}

export const PRESETS: Record<string, { label: string; description: string; slots: number[] }> = (() => {
  const range = (days: number[], from: number, to: number) => days.flatMap((d) => Array.from({ length: to - from }, (_, i) => d * 24 + from + i));
  return {
    after_work: { label: "After work", description: "Weekdays 7-10 pm", slots: range([0, 1, 2, 3, 4], 19, 22) },
    after_work_weekend: { label: "After work and weekends", description: "Weekdays 7-10 pm, weekends 10 am-6 pm", slots: [...range([0, 1, 2, 3, 4], 19, 22), ...range([5, 6], 10, 18)] },
    weekends: { label: "Weekends", description: "Sat and Sun, 9 am-6 pm", slots: range([5, 6], 9, 18) },
    business_hours: { label: "Business hours", description: "Weekdays 9 am-6 pm", slots: range([0, 1, 2, 3, 4], 9, 18) },
    flexible: { label: "Flexible", description: "Most days, 10 am-9 pm", slots: range([0, 1, 2, 3, 4, 5, 6], 10, 21) },
  };
})();
