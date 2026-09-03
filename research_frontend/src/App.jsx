import React, { useEffect, useState } from "react";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Admin from "./Admin";
import ChatView from "./ChatView";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const APP = `${API}/app`;

export async function request(path, options = {}) {
  const response = await fetch(`${APP}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.detail || data.message || `HTTP ${response.status}`);
  return data;
}

export default function App() {
  const [user, setUser] = useState(null), [checking, setChecking] = useState(true), [view, setView] = useState("chat");
  const [msg, setMsg] = useState(""), [messages, setMessages] = useState([]), [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]), [subject, setSubject] = useState(""), [conversation, setConversation] = useState(null);
  const [health, setHealth] = useState(null), [dashboardData, setDashboardData] = useState(null), [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(false), [menu, setMenu] = useState(false);

  useEffect(() => {
    request("/auth/me").then(d => setUser(d.user)).catch(() => {}).finally(() => setChecking(false));
    refreshHealth();
  }, []);

  useEffect(() => {
    if (!user) return;
    request("/subjects").then(d => setSubjects(d.subjects || [])).catch(() => {});
    refreshHistory();
  }, [user]);

  const refreshHistory = async () => { try { const d = await request("/chat/history"); setHistory(d.conversations || []); } catch {} };
  const refreshHealth = () => { fetch(`${API}/health`, { cache: "no-store" }).then(r => r.json()).then(setHealth).catch(() => setHealth({ success: false })); };
  const newChat = () => { setConversation(null); setMessages([]); setMsg(""); setSubject(""); setView("chat"); setMenu(false); };

  const openChat = async id => {
    try {
      const d = await request(`/chat/${id}`);
      setConversation(d.conversation);
      setSubject(d.conversation.subject?._id || "");
      setMessages((d.messages || []).map(m => ({ ...m, grounded: m.sender === "bot" ? Number(m.retrievalScore || 0) > 0 : false })));
      setView("chat"); setMenu(false);
    } catch (e) { alert(e.message); }
  };

  const send = async e => {
    e?.preventDefault();
    const text = msg.trim();
    if (!text || loading) return;
    setMessages(x => [...x, { sender: "user", content: text }]); setMsg(""); setLoading(true);
    try {
      const d = await request("/chat", { method: "POST", body: JSON.stringify({ message: text, conversationId: conversation?.id || null, subjectId: subject || null }) });
      setConversation(d.conversation);
      setMessages(x => [...x, { sender: "bot", content: d.message, _id: d.messageData?.bot?._id, sources: d.sources || [], grounded: d.grounded, latency: d.latency_ms }]);
      await refreshHistory();
    } catch (e) { setMessages(x => [...x, { sender: "bot", content: `Sorry, something went wrong: ${e.message}`, error: true }]); }
    finally { setLoading(false); }
  };

  const sendFeedback = async (id, rating, helpful) => {
    if (!id) return;
    try { await request("/feedback", { method: "POST", body: JSON.stringify({ messageId: id, rating, helpful, comment: "" }) }); setMessages(x => x.map(m => m._id === id ? { ...m, feedback: helpful } : m)); }
    catch (e) { alert(e.message); }
  };

  const loadDashboard = async () => { try { setDashboardData(await request("/dashboard")); setView("dashboard"); setMenu(false); } catch (e) { alert(e.message); } };
  const loadAdmin = async () => { try { setAdminData(await request("/admin/dashboard")); setView("admin"); setMenu(false); } catch (e) { alert(e.message); } };
  const logout = async () => { try { await request("/auth/logout", { method: "POST" }); } catch {} setUser(null); setMessages([]); setHistory([]); setConversation(null); };

  if (checking) return <div className="loading-screen"><div className="loading-orb">🤖</div><span>Loading EduBot…</span></div>;
  if (!user) return <Auth request={request} onLogin={setUser} />;

  return <div className="app-shell">
    <aside className={`sidebar ${menu ? "open" : ""}`}>
      <div>
        <div className="brand-row"><div className="brand-mark">🤖</div><div><div className="brand-name">Edu<span>Bot</span></div><div className="brand-subtitle">AI Learning Assistant</div></div></div>
        <button className="new-chat" onClick={newChat}>＋ New conversation</button>
        <nav className="nav-links">
          <button className={view === "chat" ? "active" : ""} onClick={() => { setView("chat"); setMenu(false); }}>💬 Chat</button>
          <button className={view === "dashboard" ? "active" : ""} onClick={loadDashboard}>📊 Dashboard</button>
          {user.role === "admin" && <button className={view === "admin" ? "active" : ""} onClick={loadAdmin}>🛠️ Admin</button>}
        </nav>
        <div className="sidebar-label">Subjects</div>
        <div className="subject-list">
          <button className={!subject ? "active" : ""} onClick={() => { setSubject(""); setView("chat"); }}>✦ All subjects</button>
          {subjects.map(s => <button key={s._id} className={subject === s._id ? "active" : ""} onClick={() => { setSubject(s._id); setView("chat"); }}>{s.icon || "📚"} {s.name}</button>)}
        </div>
        <div className="sidebar-label">Recent conversations</div>
        <div className="history">
          {history.slice(0, 15).map(c => <button key={c._id} className={conversation?.id === c._id ? "active" : ""} onClick={() => openChat(c._id)}><strong>{c.title}</strong><small>{c.subject?.name || "General"}</small></button>)}
          {!history.length && <small className="muted">No conversations yet</small>}
        </div>
      </div>
      <div className="profile"><div className="avatar">{(user.name || "U")[0].toUpperCase()}</div><div className="profile-info"><strong>{user.name}</strong><small>{user.email}</small></div><button onClick={logout} title="Log out">↪</button></div>
    </aside>
    {menu && <button className="backdrop" onClick={() => setMenu(false)} aria-label="Close menu" />}
    <main className="chat-main">
      <header className="chat-header">
        <div className="header-left"><button className="menu-button" onClick={() => setMenu(true)}>☰</button><div><div className="chat-title-row"><h1>{view === "chat" ? "EduBot" : view === "dashboard" ? "Student Dashboard" : "Admin Center"}</h1><span className={`status-pill ${health?.initialization_status === "ready" ? "online" : ""}`}><i />{health?.initialization_status === "ready" ? "Online" : "Starting"}</span></div><p>{view === "chat" ? `AI educational assistant · ${subjects.find(s => s._id === subject)?.name || "All subjects"}` : "Learning analytics and management"}</p></div></div>
        <div className="header-actions"><button className="icon-button" onClick={refreshHealth}>↻</button><span className="user-chip">{user.role}</span></div>
      </header>
      {view === "chat" && <ChatView messages={messages} loading={loading} msg={msg} setMsg={setMsg} send={send} feedback={sendFeedback} health={health} subjects={subjects} subject={subject} setSubject={setSubject} newChat={newChat} />}
      {view === "dashboard" && <Dashboard data={dashboardData} />}
      {view === "admin" && <Admin data={adminData} />}
    </main>
  </div>;
}
