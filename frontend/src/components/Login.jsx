import { useState } from "react";
import { Headset } from "lucide-react";
import { api, setToken } from "../api";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");   // "login" or "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = isLogin ? await api.login({ email: form.email, password: form.password }) : await api.register(form);
      setToken(data.access_token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <span className="brand-mark"><Headset size={18} aria-hidden="true" /></span>
          <div><strong>HelpDesk</strong><small>Support Platform</small></div>
        </div>
        <h1>{isLogin ? "Sign in" : "Create your account"}</h1>
        <p className="muted">{isLogin ? "Use your work email to continue." : "Employees can create and track IT tickets."}</p>

        <form className="form" onSubmit={submit}>
          {!isLogin && (
            <label className="field">
              <span>Full name</span>
              <input required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={update("name")} />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" required maxLength={120} autoComplete="email" value={form.email} onChange={update("email")} />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" required minLength={isLogin ? 1 : 8} maxLength={72}
                   autoComplete={isLogin ? "current-password" : "new-password"} value={form.password} onChange={update("password")} />
            {!isLogin && <span className="hint">At least 8 characters.</span>}
            <p className="muted">For demonstration purpose username:TestUser and mail: testuser@example.com and password: Test12345</p>
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn primary wide" disabled={busy}>{busy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}</button>
        </form>

        <button className="link center" onClick={() => { setMode(isLogin ? "register" : "login"); setError(""); }}>
          {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}