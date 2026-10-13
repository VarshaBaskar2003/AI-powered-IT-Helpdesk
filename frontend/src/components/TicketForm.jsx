import { useState } from "react";
import { Sparkles, Send, X, Bot, CheckCircle, Ticket, ShieldAlert, Cpu } from "lucide-react";
import { api } from "../api";
import { AI_LABELS } from "../utils";
import Card3D from "./Card3D";

export default function TicketForm({ meta, onCreated, onCancel }) {
  const [form, setForm] = useState({ title: "", description: "", category: "Other", priority: "Medium" });
  const [ai, setAi] = useState(null); // { category, priority, solution, source }
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
    <div className="new-ticket-page-wrap">
      {/* 3D Dispatcher Hero Banner */}
      <header className="page-head page-head-3d">
        <div>
          <div className="badge-live-ops">
            <span className="live-dot" /> Incident Dispatcher
          </div>
          <h1>Create New Ticket</h1>
          <p className="sub">
            Report an IT hardware, software, or network incident. Our neural triage engine evaluates priority and provides instant resolution playbooks.
          </p>
        </div>
      </header>

      {/* Floating 3D Telemetry Feature Pills */}
      <div className="form-feature-strip-3d">
        <div className="feature-chip-3d">
          <span className="feature-chip-icon"><Cpu size={14} /></span>
          <span>Automated AI Triage</span>
        </div>
        <div className="feature-chip-3d">
          <span className="feature-chip-icon ok"><CheckCircle size={14} /></span>
          <span>SLA Tracking Active</span>
        </div>
        <div className="feature-chip-3d">
          <span className="feature-chip-icon"><Ticket size={14} /></span>
          <span>Instant Queue Routing</span>
        </div>
      </div>

      <Card3D className="ticket-form-card-3d" maxTilt={2.5} scale={1} glare={false}>
        <form className="form form-3d-layout" onSubmit={submit}>
          <label className="field field-3d">
            <span className="field-label-text">Incident Title</span>
            <div className="input-wrap-3d">
              <input
                required
                minLength={3}
                maxLength={150}
                placeholder="e.g. VPN gateway connection timeout or Monitor not powering on"
                value={form.title}
                onChange={update("title")}
              />
            </div>
          </label>

          <label className="field field-3d">
            <span className="field-label-text">Problem Description & Diagnostics</span>
            <div className="input-wrap-3d">
              <textarea
                required
                minLength={10}
                maxLength={3000}
                rows={5}
                placeholder="Provide exact error codes, device hostname, affected apps, and steps already attempted."
                value={form.description}
                onChange={update("description")}
              />
            </div>
          </label>

          {/* 3D Neural AI Incident Triage Card */}
          <div className="ai-box-3d">
            <div className="ai-head-3d">
              <div className="ai-title-group">
                <span className="ai-icon-pulse">
                  <Bot size={20} aria-hidden="true" />
                </span>
                <div>
                  <strong>Neural AI Incident Triage</strong>
                  <p className="muted">Auto-classifies priority and searches knowledge base for immediate fixes.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-3d ai-pill-btn"
                onClick={suggest}
                disabled={analyzing || form.description.trim().length < 5}
              >
                <Sparkles size={15} className={analyzing ? "spin-icon" : "sparkle-icon"} aria-hidden="true" />
                <span>{analyzing ? "Triaging with AI…" : ai ? "Re-evaluate with AI" : "Run AI Triage"}</span>
              </button>
            </div>

            {ai && (
              <div className="ai-result-3d" aria-live="polite">
                <div className="ai-source-tag">
                  <CheckCircle size={14} className="text-ok" />
                  <span>Triage Model: {AI_LABELS[ai.source] ?? ai.source}</span>
                </div>
                <div className="row">
                  <label className="field field-3d">
                    <span className="field-label-text">Suggested Category</span>
                    <div className="select-wrap-3d">
                      <select value={form.category} onChange={update("category")}>
                        {meta.categories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <label className="field field-3d">
                    <span className="field-label-text">Suggested Priority</span>
                    <div className="select-wrap-3d">
                      <select value={form.priority} onChange={update("priority")}>
                        {meta.priorities.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>
                <div className="ai-solution-block">
                  <span className="solution-title-3d">Automated Instant Resolution Plan:</span>
                  <pre className="solution-3d">{ai.solution}</pre>
                </div>
              </div>
            )}
          </div>

          {error && <p className="error error-3d" role="alert">{error}</p>}

          {/* Action Buttons with comfortable gap and 3D depth */}
          <div className="form-actions-bar">
            <button type="button" className="btn-3d btn-secondary-3d" onClick={onCancel}>
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button className="btn-3d primary-3d btn-submit-3d" disabled={saving} type="submit">
              <Send size={16} />
              <span>{saving ? "Submitting Ticket…" : "Submit Ticket"}</span>
            </button>
          </div>
        </form>
      </Card3D>
    </div>
  );
}