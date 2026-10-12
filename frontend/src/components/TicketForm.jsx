import { useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../api";
import { AI_LABELS } from "../utils";

export default function TicketForm({ meta, onCreated, onCancel }) {
  const [form, setForm] = useState({ title: "", description: "", category: "Other", priority: "Medium" });
  const [ai, setAi] = useState(null);       // { category, priority, solution, source }
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function suggest() {
    setError("");
    setAnalyzing(true);
    try {
      const result = await api.analyze({ title: form.title, description: form.description });
      setAi(result);
      // AI only SUGGESTS: it pre-fills the dropdowns, the employee can still change them.
      setForm((f) => ({ ...f, category: result.category, priority: result.priority }));
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const ticket = await api.createTicket({ ...form, ai_solution: ai?.solution ?? null });
      onCreated(ticket.id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>New ticket</h1>
          <p className="sub">Tell us what is wrong. The AI can suggest a category, a priority and first steps.</p>
        </div>
      </header>
      <form className="panel form" onSubmit={submit}>
        <label className="field">
          <span>Short title</span>
          <input required minLength={3} maxLength={150} placeholder="Example: No internet on my laptop"
                 value={form.title} onChange={update("title")} />
        </label>
        <label className="field">
          <span>What is happening?</span>
          <textarea required minLength={10} maxLength={3000} rows={5}
                    placeholder="Describe the problem, any error message, and what you already tried."
                    value={form.description} onChange={update("description")} />
        </label>

        <div className="ai-box">
          <div className="ai-head">
            <div>
              <strong>Let AI triage this ticket</strong>
              <p className="muted">You can change its suggestions before you submit.</p>
            </div>
            <button type="button" className="btn" onClick={suggest}
                    disabled={analyzing || form.description.trim().length < 5}>
              <Sparkles size={16} aria-hidden="true" />
              {analyzing ? "Analysing…" : ai ? "Analyse again" : "Suggest with AI"}
            </button>
          </div>

          {ai && (
            <div className="ai-result" aria-live="polite">
              <p className="muted">Suggested by {AI_LABELS[ai.source] ?? ai.source}</p>
              <div className="row">
                <label className="field">
                  <span>Category</span>
                  <select value={form.category} onChange={update("category")}>
                    {meta.categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Priority</span>
                  <select value={form.priority} onChange={update("priority")}>
                    {meta.priorities.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <p className="solution-title">Try this first</p>
              <pre className="solution">{ai.solution}</pre>
            </div>
          )}
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={saving}>{saving ? "Creating…" : "Create ticket"}</button>
        </div>
      </form>
    </>
  );
}