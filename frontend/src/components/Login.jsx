import { useState } from "react";
import { Headset, Sparkles, Shield, User, KeyRound, ArrowRight } from "lucide-react";
import { api, setToken } from "../api";
import Scene3D from "./Scene3D";
import Card3D from "./Card3D";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [selectedRole, setSelectedRole] = useState("admin"); // Admin tab selected by default
  const [form, setForm] = useState({
    name: "",
    email: "abc@example.com",
    password: "Abc12345",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  const update = (key) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
    if (key === "email") {
      if (val === "abc@example.com") setSelectedRole("admin");
      else if (val === "testuser@example.com") setSelectedRole("user");
      else setSelectedRole(null);
    }
  };

  async function submit(e) {
    if (e) e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = isLogin
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      setToken(data.access_token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  // Quick Demo fill buttons for hassle-free evaluation
  const selectPreset = (role, email, password) => {
    setSelectedRole(role);
    setForm((f) => ({ ...f, email, password }));
    setError("");
  };

  return (
    <div className="login-wrap-3d">
      <Scene3D variant="hero" className="login-scene-bg" />
      <div className="login-glow-orb login-glow-1" aria-hidden="true" />
      <div className="login-glow-orb login-glow-2" aria-hidden="true" />

      <Card3D className="login-card-3d" maxTilt={6} scale={1.01}>
        <div className="brand brand-3d">
          <span className="brand-mark brand-mark-3d">
            <Headset size={20} aria-hidden="true" />
          </span>
          <div>
            <strong className="brand-title-3d">HelpDesk</strong>
            <small className="brand-sub-3d">AI-Powered IT Support</small>
          </div>
        </div>

        <div className="login-header-text">
          <h1>{isLogin ? "Welcome back" : "Create account"}</h1>
          <p className="muted">
            {isLogin
              ? "Sign in to access your IT operations workspace."
              : "Register to submit and track support tickets."}
          </p>
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="demo-credentials-3d">
          <div className="demo-chip-label">
            <Sparkles size={13} className="sparkle-icon" aria-hidden="true" />
            <span>Quick Demo Auto-Fill:</span>
          </div>
          <div className="demo-chips">
            <button
              type="button"
              className={`chip-btn-3d ${selectedRole === "admin" ? "active" : ""}`}
              onClick={() => selectPreset("admin", "abc@example.com", "Abc12345")}
              title="IT Administrator"
            >
              <Shield size={13} /> Admin
            </button>
            <button
              type="button"
              className={`chip-btn-3d ${selectedRole === "user" ? "active" : ""}`}
              onClick={() => selectPreset("user", "testuser@example.com", "Test12345")}
              title="Employee / Requester"
            >
              <User size={13} /> Test User
            </button>
          </div>
        </div>

        <form className="form form-3d" onSubmit={submit}>
          {!isLogin && (
            <label className="field field-3d">
              <span>Full name</span>
              <div className="input-wrap-3d">
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="e.g. Alex Morgan"
                  value={form.name}
                  onChange={update("name")}
                />
              </div>
            </label>
          )}

          <label className="field field-3d">
            <span>Work Email</span>
            <div className="input-wrap-3d">
              <input
                type="email"
                required
                maxLength={120}
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={update("email")}
              />
            </div>
          </label>

          <label className="field field-3d">
            <span>Password</span>
            <div className="input-wrap-3d">
              <input
                type="password"
                required
                minLength={isLogin ? 1 : 8}
                maxLength={72}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={form.password}
                onChange={update("password")}
              />
            </div>
            {!isLogin && <span className="hint">At least 8 characters.</span>}
          </label>

          {error && <p className="error error-3d" role="alert">{error}</p>}

          <button className="btn-3d primary-3d wide" disabled={busy} type="submit">
            <span>{busy ? "Authenticating…" : isLogin ? "Sign in to Workspace" : "Create Account"}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        <div className="login-footer-3d">
          <button
            type="button"
            className="link center"
            onClick={() => {
              setMode(isLogin ? "register" : "login");
              setError("");
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card3D>
    </div>
  );
}