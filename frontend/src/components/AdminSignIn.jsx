import { useEffect, useState } from "react";
import { ShieldCheck, Copy, Check, ArrowRight, X } from "lucide-react";
import { api, setToken } from "../api";

export default function AdminSignIn({ user, onSuccess, onCancel }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api.demoAdmin().then(setDetails).catch(() => setDetails({ enabled: false }));
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api.login(form);
      if (data.user.role !== "admin") {
        setError("That account is not an admin, so it cannot open the admin panel.");
        setBusy(false);
        return;
      }
      setToken(data.access_token);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function copy(key, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch { /* clipboard blocked */ }
  }

  return (
    <>
      <header className="page-head page-head-3d">
        <div>
          <h1>Admin Control Portal</h1>
          <p className="sub">Privileged management access for platform supervisors.</p>
        </div>
      </header>

      <form className="panel-3d form admin-signin" onSubmit={submit}>
        <div className="admin-head-3d">
          <span className="admin-icon-3d">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <h2>Administrator Authentication</h2>
            <p className="muted">Authorize with privileged credentials to unlock team governance and auditing.</p>
          </div>
        </div>

        <div className="notice-3d">
          You are currently logged in as <strong>{user.name}</strong>. Signing in with an admin account will elevate this active session.
        </div>

        <label className="field field-3d">
          <span>Admin Email Address</span>
          <div className="input-wrap-3d">
            <input
              type="email"
              required
              maxLength={120}
              autoComplete="email"
              value={form.email}
              onChange={update("email")}
            />
          </div>
        </label>

        <label className="field field-3d">
          <span>Admin Master Password</span>
          <div className="input-wrap-3d">
            <input
              type="password"
              required
              maxLength={72}
              autoComplete="current-password"
              value={form.password}
              onChange={update("password")}
            />
          </div>
        </label>

        {error && <p className="error error-3d" role="alert">{error}</p>}

        <div className="form-actions-bar">
          <button type="button" className="btn-3d btn-secondary-3d" onClick={onCancel}>
            <X size={15} />
            <span>Cancel</span>
          </button>
          <button className="btn-3d primary-3d btn-submit-3d" disabled={busy} type="submit">
            <span>{busy ? "Authenticating…" : "Unlock Admin Portal"}</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {details?.enabled && (
          <div className="cred-box-3d">
            <p className="cred-title-3d">Demo Admin Credentials Available</p>
            {[["Email", "email"], ["Password", "password"]].map(([label, key]) => (
              <div className="cred-row-3d" key={key}>
                <span>{label}</span>
                <code>{details[key]}</code>
                <button type="button" className="btn-3d sm-btn-3d" onClick={() => copy(key, details[key])}>
                  {copied === key ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied === key ? "Copied" : "Copy"}</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-3d auto-fill-btn-3d"
              onClick={() => setForm({ email: details.email, password: details.password })}
            >
              Fill Credentials into Form
            </button>
            <small>Visible in test deployment environment for convenience.</small>
          </div>
        )}
      </form>
    </>
  );
}