import { useEffect, useState } from "react";
import { api } from "../api";
import { AI_LABELS, toDate } from "../utils";
import { PriorityBadge, StatusBadge } from "./Badges";

export default function TicketDetail({ id, meta, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState(null);
  const [drafting, setDrafting] = useState(false);

  function load(data) {
    setTicket(data);
    setForm({
      title: data.title, description: data.description, category: data.category,
      priority: data.priority, status: data.status, assigned_to: data.assigned_to ?? "",
    });
  }

  useEffect(() => {
    api.getTicket(id).then(load).catch((e) => setError(e.message));
  }, [id]);

  const update = (key) => (e) => { setMessage(""); setForm((f) => ({ ...f, [key]: e.target.value })); };

  async function save(e) {
    e.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      load(await api.updateTicket(id, form));
      setMessage("Changes saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ticket #${id}? This cannot be undone.`)) return;
    try { await api.deleteTicket(id); onBack(); } catch (err) { setError(err.message); }
  }

  async function draft() {
    setDrafting(true); setError("");
    try { setReply(await api.draftReply(id)); } catch (err) { setError(err.message); } finally { setDrafting(false); }
  }

  if (!ticket || !form) {
    return error ? <p className="error" role="alert">{error}</p> : <p className="muted">Loading ticket…</p>;
  }

  return (
    <>
      <button className="link" onClick={onBack}>Back to tickets</button>
      <header className="page-head">
        <h1>#{ticket.id} {ticket.title}</h1>
        <div className="t-badges"><PriorityBadge value={ticket.priority} /><StatusBadge value={ticket.status} /></div>
      </header>
      <p className="muted">
        Reported by {ticket.requester_name} on {toDate(ticket.created_at).toLocaleString()}
      </p>

      <div className="detail-grid">
        <form className="panel form" onSubmit={save}>
          <h2>Manage ticket</h2>
          <label className="field">
            <span>Title</span>
            <input required minLength={3} maxLength={150} value={form.title} onChange={update("title")} />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea required minLength={10} rows={5} value={form.description} onChange={update("description")} />
          </label>
          <div className="row">
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={update("status")}>{meta.statuses.map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select value={form.priority} onChange={update("priority")}>{meta.priorities.map((p) => <option key={p}>{p}</option>)}</select>
            </label>
          </div>
          <div className="row">
            <label className="field">
              <span>Category</span>
              <select value={form.category} onChange={update("category")}>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="field">
              <span>Assigned to</span>
              <select value={form.assigned_to} onChange={update("assigned_to")}>
                <option value="">Unassigned</option>
                {meta.staff.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          {message && <p className="ok" role="status">{message}</p>}
          <div className="actions">
            <button type="button" className="btn danger" onClick={remove}>Delete ticket</button>
            <button className="btn primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          </div>
        </form>

        <aside className="panel">
          <h2>AI assistant</h2>
          <p className="solution-title">Suggested fix from triage</p>
          {ticket.ai_solution
            ? <pre className="solution">{ticket.ai_solution}</pre>
            : <p className="muted">No AI suggestion was saved with this ticket.</p>}

          <p className="solution-title">Reply to the employee</p>
          <button className="btn" onClick={draft} disabled={drafting}>
            {drafting ? "Writing…" : reply ? "Write another draft" : "Draft a reply"}
          </button>
          {reply && (
            <div aria-live="polite">
              <p className="muted">Drafted by {AI_LABELS[reply.source] ?? reply.source}. Edit before sending.</p>
              <textarea rows={8} value={reply.reply} onChange={(e) => setReply({ ...reply, reply: e.target.value })} />
              <button className="btn" onClick={() => navigator.clipboard?.writeText(reply.reply)}>Copy reply</button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}