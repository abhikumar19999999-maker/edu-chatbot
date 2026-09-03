import React, { useEffect, useState } from "react";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Admin from "./Admin";
import ChatView from "./ChatView";
import "./admin.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const APP = API + "/app";

export async function request(path, options = {}) {
  const r = await fetch(APP + path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  let d = {};
  try { d = await r.json(); } catch {}
  if (!r.ok) throw Error(d.detail || d.message || `HTTP ${r.status}`);
  return d;
}

function Home({ onLogin, onRegister }) {
  return (
    <main className="home-page">
      <div className="home-orb home-orb-one" />
      <div className="home-orb home-orb-two" />
      <nav className="home-nav">
        <div className="home-brand"><span className="home-brand-mark">🤖</span> Edu<span>Bot</span></div>
        <div className="home-nav-actions">
          <button className="home-link" onClick={onLogin}>Sign in</button>
          <button className="home-nav-button" onClick={onRegister}>Get started</button>
        </div>
      </nav>
      <section className="home-hero">
        <div className="home-badge">✦ AI-POWERED LEARNING ASSISTANT</div>
        <h1>Learn smarter with <span>EduBot</span></h1>
        <p>Ask academic questions, explore subjects, and get intelligent answers grounded in educational knowledge.</p>
        <div className="home-actions">
          <button className="home-primary" onClick={onRegister}>Start learning <span>→</span></button>
          <button className="home-secondary" onClick={onLogin}>Sign in</button>
        </div>
        <div className="home-trust"><span>✓</span> Grounded answers &nbsp; <span>✓</span> Academic subjects &nbsp; <span>✓</span> Secure student sessions</div>
      </section>
      <section className="home-features">
        <article><div>🧠</div><h3>AI-Powered</h3><p>Natural-language answers designed to make learning easier.</p></article>
        <article><div>📚</div><h3>Knowledge Grounded</h3><p>Responses are supported by relevant educational material.</p></article>
        <article><div>📊</div><h3>Track Progress</h3><p>Review conversations and learning activity from your dashboard.</p></article>
      </section>
      <footer className="home-footer">Built for students. <strong>Grounded in knowledge.</strong></footer>
    </main>
  );
}

function HomeStyles() {
  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [view, setView] = useState("home");
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [conversation, setConversation] = useState(null);
  const [health, setHealth] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState(false);

  const refreshHistory = async () => { try { const d = await request("/chat/history"); setHistory(d.conversations || []); } catch {} };
  const refreshHealth = () => fetch(API + "/health", { cache: "no-store" }).then(r => r.json()).then(setHealth).catch(() => setHealth({ success: false }));
  const loadDashboard = async () => { try { setDashboardData(await request("/dashboard")); setView("dashboard"); setMenu(false); } catch (e) { alert(e.message); } };
  const loadAdmin = async () => { try { setAdminData(await request("/admin/dashboard")); setView("admin"); setMenu(false); } catch (e) { alert(e.message); } };

  useEffect(() => {
    request("/auth/me").then(d => { setUser(d.user); setView("chat"); }).catch(() => {}).finally(() => setChecking(false));
  }, []);
  useEffect(() => { if (user) { request("/subjects").then(d => setSubjects(d.subjects || [])).catch(() => {}); refreshHistory(); refreshHealth(); } }, [user]);

  const newChat = () => { setConversation(null); setMessages([]); setMsg(""); setSubject(""); setView("chat"); setMenu(false); };
  const openChat = async id => { try { const d = await request(`/chat/${id}`); setConversation(d.conversation); setSubject(d.conversation.subject?._id || ""); setMessages(d.messages || []); setView("chat"); setMenu(false); } catch (e) { alert(e.message); } };
  const send = async e => {
    e?.preventDefault(); const text = msg.trim(); if (!text || loading) return;
    setMessages(x => [...x, { sender: "user", content: text }]); setMsg(""); setLoading(true);
    try {
      const started = performance.now();
      const d = await request("/chat", { method: "POST", body: JSON.stringify({ message: text, conversationId: conversation?.id || null, subjectId: subject || null }) });
      const latency = d.latency_ms ?? Math.round(performance.now() - started);
      setConversation(d.conversation); setMessages(x => [...x, { sender: "bot", content: d.message, _id: d.messageData?.bot?._id, sources: d.sources || [], grounded: d.grounded, latency }]); await refreshHistory();
    } catch (e) { setMessages(x => [...x, { sender: "bot", content: `Sorry, something went wrong: ${e.message}`, error: true }]); }
    finally { setLoading(false); }
  };
  const feedback = async (id, rating, helpful) => { if (!id) return; try { await request("/feedback", { method: "POST", body: JSON.stringify({ messageId: id, rating, helpful, comment: "" }) }); setMessages(x => x.map(m => m._id === id ? { ...m, feedback: helpful } : m)); } catch (e) { alert(e.message); } };
  const logout = async () => { try { await request("/auth/logout", { method: "POST" }); } catch {} setUser(null); setMessages([]); setHistory([]); setConversation(null); setDashboardData(null); setAdminData(null); setView("home"); };
  const refreshAdmin = async () => { await request("/subjects").then(d => setSubjects(d.subjects || [])).catch(() => {}); try { setAdminData(await request("/admin/dashboard")); } catch {} refreshHealth(); };

  if (checking) return <div className="loading-screen">Loading EduBot…</div>;
  if (!user && view === "home") return <Home onLogin={() => setView("login")} onRegister={() => setView("register")} />;
  if (!user && (view === "login" || view === "register")) return <Auth request={request} onLogin={setUser} initialMode={view} />;
  if (!user) return <Home onLogin={() => setView("login")} onRegister={() => setView("register")} />;

  const ready = health?.initialization_status === "ready";
  return <div className="app-shell"><aside className={`sidebar ${menu ? "open" : ""}`}><div><div className="brand-row"><div className="brand-mark">🤖</div><div><div className="brand-name">Edu<span>Bot</span></div><div className="brand-subtitle">Your Academic AI Assistant</div></div></div><button className="new-chat" onClick={newChat}>＋ New conversation</button><nav className="nav-links"><button className={view === "chat" ? "active" : ""} onClick={() => { setView("chat"); setMenu(false); }}>💬 Chat</button><button className={view === "dashboard" ? "active" : ""} onClick={loadDashboard}>📊 Dashboard</button>{user.role === "admin" && <button className={view === "admin" ? "active" : ""} onClick={loadAdmin}>🛠️ Admin Center</button>}</nav><div className="sidebar-label">Subjects</div><div className="subject-list"><button className={!subject ? "active" : ""} onClick={() => { setSubject(""); setView("chat"); }}>✦ All subjects</button>{subjects.map(s => <button key={s._id} className={subject === s._id ? "active" : ""} onClick={() => { setSubject(s._id); setView("chat"); }}>{s.icon || "📚"} {s.name}</button>)}</div><div className="sidebar-label">Recent conversations</div><div className="history">{history.slice(0, 15).map(c => <button key={c._id} className={conversation?.id === c._id ? "active" : ""} onClick={() => openChat(c._id)}><strong>{c.title}</strong><small>{c.subject?.name || "General"}</small></button>)}{!history.length && <small className="muted">No conversations yet</small>}</div></div><div className="profile"><div className="avatar">{(user.name || "U")[0].toUpperCase()}</div><div className="profile-info"><strong>{user.name}</strong><small>{user.email}</small></div><button onClick={logout} title="Log out">↪</button></div></aside>{menu && <button className="backdrop" onClick={() => setMenu(false)} aria-label="Close menu" />}<main className="chat-main"><header className="chat-header"><div className="header-left"><button className="menu-button" onClick={() => setMenu(true)}>☰</button><div><div className="chat-title-row"><h1>{view === "chat" ? "EduBot" : view === "dashboard" ? "Student Dashboard" : "Admin Center"}</h1><span className={`status-pill ${ready ? "online" : ""}`}><i />{ready ? "AI Service: Online" : "AI Service: Starting"}</span></div><p>{view === "chat" ? `AI educational assistant · ${subjects.find(s => s._id === subject)?.name || "All subjects"}` : view === "dashboard" ? "Learning analytics and progress" : "Administration and knowledge management"}</p></div></div><div className="header-actions"><button className="icon-button" onClick={refreshHealth} title="Refresh service status">↻</button><span className="user-chip">{user.role}</span><div className="header-avatar">{(user.name || "U")[0].toUpperCase()}<i /></div></div></header>{view === "chat" && <ChatView messages={messages} loading={loading} msg={msg} setMsg={setMsg} send={send} feedback={feedback} health={health} subjects={subjects} subject={subject} setSubject={setSubject} newChat={newChat} />} {view === "dashboard" && <Dashboard data={dashboardData} />} {view === "admin" && <Admin data={adminData} subjects={subjects} onChanged={refreshAdmin} />}</main></div>;
}
