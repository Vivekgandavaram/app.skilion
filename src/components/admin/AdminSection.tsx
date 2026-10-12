"use client";
import { useState } from "react";
import useSWR from "swr";
import { api, fetcher, timeAgo } from "@/lib/client";
import { Modal, Field, Skeleton, useToast } from "@/components/client-ui";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export default function AdminSection({ section, role }: { section: string; role: string }) {
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const url = { overview: "/api/admin/overview", reports: "/api/admin/reports?status=open", users: "/api/admin/users", verification: "/api/admin/verification", appeals: "/api/admin/appeals", content: "/api/admin/content", system: "/api/admin/system", audit: "/api/admin/audit" }[section]!;
  const [q, setQ] = useState(""); const [dq, setDq] = useState("");
  const { data, mutate, isLoading, error } = useSWR(section === "users" || section === "content" ? `${url}${dq ? `?q=${encodeURIComponent(dq)}` : ""}` : url, fetcher);
  const [modal, setModal] = useState<{ title: string; fields: "reason" | "resolution" | "role" | "plan"; run: (v: any) => Promise<any> } | null>(null);
  const [v, setV] = useState<any>({ reason: "", role: "user", plan: "builder_pro", days: 30, note: "" });
  const [busy, setBusy] = useState(false);
  if (isLoading) return <Skeleton h={200} />;
  if (error) return <div className="alert alert-warn">{error.message}</div>;
  const run = async () => { setBusy(true); try { await modal!.run(v); setModal(null); setV({ ...v, reason: "" }); mutate(); toast("Done.", "ok"); } catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); } };
  const ask = (title: string, fields: any, fn: (v: any) => Promise<any>) => setModal({ title, fields, run: fn });

  return (
    <div className="stack-lg">
      {section === "overview" && data && (
        <>
          <div className="grid grid-4">{[["Members", data.users], ["New this week", data.newUsers], ["Finished onboarding", data.onboarded], ["Posts", data.posts], ["Projects", data.projects], ["Open reports", data.openReports], ["Pending verifications", data.pendingVer], ["Open appeals", data.appeals]].map(([l, n]) => <div key={l as string} className="card card-pad stat"><b className="tnum">{n}</b><span>{l}</span></div>)}</div>
          {data.urgent > 0 && <div className="alert alert-warn"><span><b>{data.urgent}</b> high-severity {data.urgent === 1 ? "report is" : "reports are"} waiting. <a href="/admin/reports">Review now</a></span></div>}
          {isAdmin && <div className="card card-pad stat"><b className="tnum">{inr(data.revenue)}</b><span>Collected from {data.paid} paid orders (incl. GST)</span></div>}
          <p className="small muted">Counts exclude demo data. Nothing here is estimated.</p>
        </>
      )}

      {section === "reports" && data && (<div className="stack">{!data.items.length && <p className="muted">No open reports.</p>}{data.items.map((r: any) => (
        <div key={r.id} className="card card-pad stack-sm">
          <div className="row between"><span className="chips"><span className={`chip ${["high", "urgent"].includes(r.severity) ? "chip-hot" : "chip-line"}`}>{r.severity}</span><span className="chip">{r.target.type}</span><span className="chip chip-line">{r.reason}</span></span><span className="xs muted">{timeAgo(r.createdAt)} · by {r.reporter?.name || "unknown"}</span></div>
          {r.subject?.name && <div className="small"><b>{r.subject.name}</b> @{r.subject.handle} ({r.subject.status})</div>}
          {r.preview && <blockquote className="small" style={{ margin: 0, paddingLeft: 12, borderLeft: "3px solid var(--line)", whiteSpace: "pre-wrap" }}>{r.preview}</blockquote>}
          {r.details && <p className="small"><b>Reporter says:</b> {r.details}</p>}
          <div className="row">{(["dismiss", "warn", "remove_content", ...(isAdmin ? ["suspend_user"] : [])] as const).map((a) => <button key={a} className={`btn btn-sm ${a === "dismiss" ? "btn-ghost" : a === "suspend_user" ? "btn-danger" : "btn-soft"}`} onClick={() => ask(`${a.replace("_", " ")}`, "resolution", (x) => api.patch(`/api/admin/reports/${r.id}`, { action: a, resolution: x.reason }))}>{a.replace("_", " ")}</button>)}</div>
        </div>))}</div>)}

      {section === "users" && (<div className="stack">
        <form className="row-nowrap" onSubmit={(e) => { e.preventDefault(); setDq(q); }}><input className="input" aria-label="Search members" placeholder="Name, handle or email" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn btn-dark">Search</button></form>
        <div className="table-wrap"><table className="table"><thead><tr><th>Member</th><th>Status</th><th>Plan</th><th>Joined</th><th></th></tr></thead><tbody>{data?.items.map((u: any) => (
          <tr key={u.id}><td><b>{u.name}</b> {u.isDemo && <span className="chip chip-line">demo</span>}<div className="xs muted">@{u.handle} · {u.email}{!u.emailVerified && " (unverified)"}</div></td><td>{u.status}{u.role !== "user" && <span className="chip" style={{ marginLeft: 6 }}>{u.role}</span>}</td><td>{u.plan}</td><td className="xs">{timeAgo(u.createdAt)}</td>
            <td><div className="row" style={{ gap: 4 }}>
              {u.status === "active" ? <button className="btn btn-ghost btn-sm" onClick={() => ask("Suspend", "reason", (x) => api.patch(`/api/admin/users/${u.id}`, { action: "suspend", reason: x.reason }))}>Suspend</button> : <button className="btn btn-ghost btn-sm" onClick={() => ask("Unsuspend", "reason", (x) => api.patch(`/api/admin/users/${u.id}`, { action: "unsuspend", reason: x.reason }))}>Unsuspend</button>}
              {isAdmin && <><button className="btn btn-ghost btn-sm" onClick={() => ask("Set role", "role", (x) => api.patch(`/api/admin/users/${u.id}`, { action: "set_role", role: x.role, reason: x.reason }))}>Role</button><button className="btn btn-ghost btn-sm" onClick={() => ask("Grant plan", "plan", (x) => api.patch(`/api/admin/users/${u.id}`, { action: "grant_plan", plan: x.plan, days: Number(x.days) || 30, reason: x.reason }))}>Plan</button></>}
            </div></td></tr>))}</tbody></table></div></div>)}

      {section === "verification" && data && (<div className="stack">{!data.items.length && <p className="muted">No pending requests.</p>}{data.items.map((r: any) => (
        <div key={r.id} className="card card-pad stack-sm"><div className="row between"><b>{r.user?.name} <span className="small muted">@{r.user?.handle} · {r.user?.email}</span></b><span className="chip">{r.type}</span></div>
          <p className="small" style={{ whiteSpace: "pre-wrap" }}>{r.evidence}</p>
          <div className="row"><button className="btn btn-primary btn-sm" onClick={() => api.patch(`/api/admin/verification/${r.id}`, { decision: "approved" }).then(() => mutate()).catch((e) => toast(e.message, "err"))}>Approve</button><button className="btn btn-ghost btn-sm" onClick={() => ask("Reject", "resolution", (x) => api.patch(`/api/admin/verification/${r.id}`, { decision: "rejected", note: x.reason }))}>Reject</button></div></div>))}
        <p className="xs muted">Approve only what you checked yourself. The badge reads “Identity checked”, nothing more.</p></div>)}

      {section === "appeals" && data && (<div className="stack">{!data.items.length && <p className="muted">No appeals.</p>}{data.items.map((a: any) => (
        <div key={a.id} className="card card-pad stack-sm"><div className="row between"><b>{a.email}</b><span className="chip chip-line">{a.status}</span></div><p className="small" style={{ whiteSpace: "pre-wrap" }}>{a.message}</p><div className="xs muted">{timeAgo(a.createdAt)}</div>
          {a.status === "open" && <div className="row"><a className="btn btn-soft btn-sm" href={`mailto:${a.email}`}>Reply by email</a><a className="btn btn-ghost btn-sm" href={`/admin/users`}>Find account</a><button className="btn btn-ghost btn-sm" onClick={() => api.patch(`/api/admin/appeals/${a.id}`).then(() => mutate())}>Mark closed</button></div>}</div>))}</div>)}

      {section === "content" && (<div className="stack">
        <form className="row-nowrap" onSubmit={(e) => { e.preventDefault(); setDq(q); }}><input className="input" aria-label="Search posts" placeholder="Search posts" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn btn-dark">Search</button></form>
        {data?.items.map((p: any) => <div key={p.id} className="card card-pad-sm stack-sm"><div className="row between small"><span><b>{p.author}</b> · {p.type} · {timeAgo(p.createdAt)} {p.isDemo && <span className="chip chip-line">demo</span>}</span><button className="btn btn-ghost btn-sm" onClick={() => ask("Remove post", "reason", async (x) => { await api.del(`/api/posts/${p.id}`); })}>Remove</button></div><p className="small" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{p.text}</p></div>)}</div>)}

      {section === "system" && data && <SystemPanel data={data} mutate={mutate} />}

      {section === "audit" && data && (<div className="table-wrap"><table className="table"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Details</th></tr></thead><tbody>{data.items.map((a: any) => <tr key={a.id}><td className="xs">{new Date(a.createdAt).toLocaleString("en-IN")}</td><td>{a.actor}</td><td>{a.action}</td><td className="xs">{a.target}</td><td className="xs">{a.meta ? JSON.stringify(a.meta) : ""}</td></tr>)}</tbody></table></div>)}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.title || ""}>
        <div className="stack">
          {modal?.fields === "role" && <Field label="Role" htmlFor="m-role"><select id="m-role" className="select" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })}><option value="user">Member</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></Field>}
          {modal?.fields === "plan" && <div className="grid grid-2"><Field label="Plan" htmlFor="m-plan"><select id="m-plan" className="select" value={v.plan} onChange={(e) => setV({ ...v, plan: e.target.value })}><option value="free">Free (revoke)</option><option value="builder_pro">Builder Pro</option><option value="founder_pro">Founder Pro</option><option value="squad_workspace">Squad Workspace</option></select></Field><Field label="Days" htmlFor="m-days"><input id="m-days" className="input" type="number" min={1} max={366} value={v.days} onChange={(e) => setV({ ...v, days: e.target.value })} /></Field></div>}
          <Field label="Reason (recorded in the audit log)" htmlFor="m-reason"><textarea id="m-reason" className="textarea" rows={3} maxLength={300} value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} /></Field>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" disabled={busy || v.reason.trim().length < 3} onClick={run}>Confirm</button></div>
        </div>
      </Modal>
    </div>
  );
}

function SystemPanel({ data, mutate }: any) {
  const { toast } = useToast();
  const [f, setF] = useState(data.flags); const [confirm, setConfirm] = useState("");
  return (
    <div className="stack-lg">
      <section className="card card-pad stack"><h2 className="h3">Services</h2>{Object.entries(data.services).map(([k, on]) => <div key={k} className="row between small"><span>{k}</span><span className={`chip ${on ? "chip-ok" : "chip-line"}`}>{on ? "Configured" : "Not configured"}</span></div>)}<p className="xs muted">Shows whether environment variables are present, not whether the provider accepts them.</p></section>
      <section className="card card-pad stack"><h2 className="h3">Switches</h2>
        <label className="check"><input type="checkbox" checked={f.signupsOpen} onChange={(e) => setF({ ...f, signupsOpen: e.target.checked })} /><span><b>Signups open</b></span></label>
        <label className="check"><input type="checkbox" checked={f.aiEnabled} onChange={(e) => setF({ ...f, aiEnabled: e.target.checked })} /><span><b>AI planning on</b><span className="small muted" style={{ display: "block" }}>Off falls back to template plans and keeps working.</span></span></label>
        <Field label="Maintenance banner" help="Leave empty for none" htmlFor="sys-m"><input id="sys-m" className="input" maxLength={200} value={f.maintenance} onChange={(e) => setF({ ...f, maintenance: e.target.value })} /></Field>
        <div><button className="btn btn-primary" onClick={() => api.put("/api/admin/system", f).then(() => { toast("Saved.", "ok"); mutate(); }).catch((e) => toast(e.message, "err"))}>Save switches</button></div></section>
      <section className="card card-pad stack" style={{ borderColor: "#f0b4a6" }}><h2 className="h3">Demo data</h2><p className="small muted">{data.demo.users} demo members and {data.demo.posts} demo posts exist (from the seed script). Purge them before launch.</p>
        <div className="row"><input className="input" aria-label="Type PURGE DEMO" placeholder="Type PURGE DEMO" style={{ maxWidth: 220 }} value={confirm} onChange={(e) => setConfirm(e.target.value)} /><button className="btn btn-danger" disabled={confirm !== "PURGE DEMO"} onClick={() => api.del("/api/admin/system", { confirm }).then((r) => { toast(`Removed ${r.users} members, ${r.posts} posts.`, "ok"); setConfirm(""); mutate(); }).catch((e) => toast(e.message, "err"))}>Purge demo data</button></div></section>
    </div>
  );
}
