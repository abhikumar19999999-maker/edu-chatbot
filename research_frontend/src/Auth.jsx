import React, { useState } from "react";

const Icon = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const MailIcon = () => <Icon><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></Icon>;
const LockIcon = () => <Icon><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></Icon>;
const EyeIcon = ({ hidden }) => <Icon><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>{hidden && <path d="m3 3 18 18"/>}</Icon>;
const LoginIcon = () => <Icon><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M13 5V3h7v18h-7v-2"/></Icon>;
const UserPlusIcon = () => <Icon><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3-5.2 6.5-5.2s5.9 1.8 6.5 5.2"/><path d="M18 8v6M15 11h6"/></Icon>;
const ShieldIcon = () => <Icon size={21}><path d="M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></Icon>;
const GraduationIcon = () => <Icon size={21}><path d="m3 9 9-4 9 4-9 4-9-4Z"/><path d="M7 11v5c2.8 2.4 7.2 2.4 10 0v-5"/><path d="M21 10v5"/></Icon>;

export default function Auth({ request, onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const data = await request(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("edubot_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <section className="auth-card" aria-label="EduBot authentication">
        <div className="auth-brand-mark" aria-hidden="true">🤖</div>
        <div className="auth-brand">Edu<span>Bot</span></div>
        <p className="auth-subtitle">AI-powered educational assistant</p>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "active" : ""}
            onClick={() => switchMode("login")}
          >
            <LoginIcon />
            <span>Sign in</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? "active" : ""}
            onClick={() => switchMode("register")}
          >
            <UserPlusIcon />
            <span>Create account</span>
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <label className="auth-field">
              <span className="auth-field-icon"><UserPlusIcon /></span>
              <input
                autoComplete="name"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span className="auth-field-icon"><MailIcon /></span>
            <input
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-field-icon"><LockIcon /></span>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="Password (8+ characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon hidden={showPassword} />
            </button>
          </label>

          {mode === "login" && (
            <div className="auth-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="custom-check">✓</span>
                <span>Remember me</span>
              </label>
              <button type="button" className="forgot-link" disabled title="Password recovery is not configured yet">
                Forgot password?
              </button>
            </div>
          )}

          {error && <div className="error-box" role="alert">{error}</div>}

          <button className="auth-submit" disabled={busy} type="submit">
            <span>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</span>
            <span className="submit-arrow">→</span>
          </button>
        </form>

        <div className="auth-security">
          <ShieldIcon />
          <span>Secure session <b>•</b> HttpOnly cookie</span>
        </div>
      </section>

      <footer className="auth-footer">
        <GraduationIcon />
        <span>Built for students. <strong>Grounded in knowledge.</strong></span>
      </footer>
    </main>
  );
}
