import { useEffect, useState } from "react";
import { ArrowLeft, Bot, Sparkles, Copy, Check, Trash2, Save, Send } from "lucide-react";
import { api } from "../api";
import { AI_LABELS, toDate, ticketCode } from "../utils";
import { PriorityBadge, StatusBadge } from "./Badges";

export default function TicketDetail({ id, meta, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState(null);
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  function load(data) {
    setTicket(data);
    setForm({
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: data.status,
      assigned_to: data.assigned_to ?? "",
    });
  }

  useEffect(() => {
    api.getTicket(id).then(load).catch((e) => setError(e.message));
  }, [id]);

  const update = (key) => (e) => {
    setMessage("");
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.updateTicket(id, form);
      onBack?.();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ticket #${id}? This action is irreversible.`)) return;
    try {
      await api.deleteTicket(id);
      onBack();
    } catch (err) {
      setError(err.message);
    }
  }

  async function draft() {
    setDrafting(true);
    setError("");
    try {
      setReply(await api.draftReply(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDrafting(false);
    }
  }

  const copyDraft = () => {
    if (!reply?.reply) return;
    navigator.clipboard?.writeText(reply.reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!ticket || !form) {
    return error ? (
      <p className="error error-3d" role="alert">{error}</p>
    ) : (
      <div className="boot-pulse">
        <div className="pulse-loader" />
        <p className="muted">Loading ticket record #{id}…</p>
      </div>
    );
  }

  return (
    <>
      <div className="detail-top-nav">
        <button className="back-link-3d" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to Ticket Index</span>
        </button>
      </div>

      <header className="page-head page-head-3d">
        <div>
          <div className="detail-id-badge">
            <span className="code-badge">{ticketCode(ticket.id)}</span>
            <span className="dot-sep">·</span>
            <span>Created {toDate(ticket.created_at).toLocaleDateString()}</span>
          </div>
          <h1>{ticket.title}</h1>
          <p className="sub">
            Reported by <strong>{ticket.requester_name}</strong> on {toDate(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="t-badges-3d">
          <PriorityBadge value={ticket.priority} />
          <StatusBadge value={ticket.status} />
        </div>
      </header>

      <div className="detail-grid-3d">
        <form className="panel-3d form" onSubmit={save}>
          <div className="panel-head-3d">
            <h2>Ticket Properties</h2>
          </div>

          <label className="field field-3d">
            <span>Title</span>
            <div className="input-wrap-3d">
              <input
                required
                minLength={3}
                maxLength={150}
                value={form.title}
                onChange={update("title")}
              />
            </div>
          </label>

          <label className="field field-3d">
            <span>Problem Description</span>
            <div className="input-wrap-3d">
              <textarea
                required
                minLength={10}
                rows={5}
                value={form.description}
                onChange={update("description")}
              />
            </div>
          </label>

          <div className="row">
            <label className="field field-3d">
              <span>Status</span>
              <div className="select-wrap-3d">
                <select value={form.status} onChange={update("status")}>
                  {meta.statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </label>
            <label className="field field-3d">
              <span>Priority</span>
              <div className="select-wrap-3d">
                <select value={form.priority} onChange={update("priority")}>
                  {meta.priorities.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="row">
            <label className="field field-3d">
              <span>Category</span>
              <div className="select-wrap-3d">
                <select value={form.category} onChange={update("category")}>
                  {meta.categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </label>
            <label className="field field-3d">
              <span>Assigned Engineer</span>
              <div className="select-wrap-3d">
                <select value={form.assigned_to} onChange={update("assigned_to")}>
                  <option value="">Unassigned</option>
                  {meta.staff.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          {error && <p className="error error-3d" role="alert">{error}</p>}
          {message && <div className="notice-success-3d" role="status"><Check size={16} />{message}</div>}

          <div className="form-actions-bar">
            <button type="button" className="btn-3d danger-3d" onClick={remove}>
              <Trash2 size={16} aria-hidden="true" />
              <span>Delete Ticket</span>
            </button>
            <button className="btn-3d primary-3d btn-submit-3d" disabled={saving} type="submit">
              <Save size={16} aria-hidden="true" />
              <span>{saving ? "Saving Changes…" : "Save Changes"}</span>
            </button>
          </div>
        </form>

        <aside className="panel-3d ai-aside-3d">
          <div className="ai-aside-header">
            <span className="ai-aside-icon">
              <Bot size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>AI Support Copilot</h2>
              <small>Automated triage & smart resolutions</small>
            </div>
          </div>

          <div className="ai-block-3d">
            <div className="ai-block-title">
              <Sparkles size={14} className="sparkle-icon" />
              <span>Suggested Fix from Triage</span>
            </div>
            {ticket.ai_solution ? (
              <pre className="solution-3d">{ticket.ai_solution}</pre>
            ) : (
              <p className="muted empty-ai">No automated resolution solution stored for this ticket.</p>
            )}
          </div>

          <div className="ai-block-3d">
            <div className="ai-block-title">
              <Send size={14} />
              <span>Smart Response Generator</span>
            </div>
            <button className="btn-3d ai-action-btn" onClick={draft} disabled={drafting}>
              <Sparkles size={15} />
              <span>{drafting ? "Synthesizing response…" : reply ? "Regenerate Draft" : "Draft AI Reply"}</span>
            </button>

            {reply && (
              <div className="ai-draft-box-3d" aria-live="polite">
                <div className="draft-meta-3d">
                  <span>Engine: {AI_LABELS[reply.source] ?? reply.source}</span>
                </div>
                <div className="input-wrap-3d">
                  <textarea
                    rows={7}
                    value={reply.reply}
                    onChange={(e) => setReply({ ...reply, reply: e.target.value })}
                  />
                </div>
                <button className="btn-3d copy-btn-3d" onClick={copyDraft}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy to Clipboard"}</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}