import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api, setToken } from "../api";

// Shown when someone who is not an admin clicks "Admin panel" in the sidebar.
export default function AdminSignIn({ user, onSuccess, onCancel }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [details, setDetails] = useState(null);   // admin email and password for the box at the bottom (if switched on)
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
      // Only switch accounts if this really is an admin. Otherwise you stay signed in as you.
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
    } catch { /* clipboard blocked: the text is on screen anyway */ }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Admin panel</h1>
          <p className="sub">For administrators only.</p>
        </div>
      </header>

      <form className="panel form admin-signin" onSubmit={submit}>
        <div className="admin-head">
          <span className="admin-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
          <div>
            <h2>Admin sign-in</h2>
            <p className="muted">Sign in with an admin account to manage the team and see every ticket.</p>
            <p className="muted">For demonstration purpose admin mail: abc@example.com and password: Abc12345</p>
          </div>
        </div>

        <p className="notice">You are signed in as <b>{user.name}</b>. Signing in as an admin will sign you out of this account.</p>

        <label className="field">
          <span>Admin email</span>
          <input type="email" required maxLength={120} autoComplete="email" value={form.email} onChange={update("email")} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" required maxLength={72} autoComplete="current-password" value={form.password} onChange={update("password")} />
        </label>

        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? "Signing in…" : "Sign in as admin"}</button>
        </div>

        {details?.enabled && (
          <div className="cred-box">
            <p className="cred-title">Admin login details</p>
            {[["Email", "email"], ["Password", "password"]].map(([label, key]) => (
              <div className="cred-row" key={key}>
                <span>{label}</span>
                <code>{details[key]}</code>
                <button type="button" className="btn sm" onClick={() => copy(key, details[key])}>
                  {copied === key ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
            <button type="button" className="btn" onClick={() => setForm({ email: details.email, password: details.password })}>
              Fill in the form
            </button>
            <small>Shown on purpose for this demo. Never reuse a real password here.</small>
          </div>
        )}
      </form>
    </>
  );
}