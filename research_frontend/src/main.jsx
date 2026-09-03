import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const fallbackSubjects = ["Python", "DBMS", "Machine Learning", "Operating System", "Computer Networks"];
const suggestions = [
  { title: "Machine Learning", text: "What is supervised learning?", icon: "🧠" },
  { title: "DBMS", text: "What is normalization in DBMS?", icon: "🗄️" },
  { title: "Operating System", text: "What is a process in an operating system?", icon: "⚙️" },
  { title: "Computer Networks", text: "What is TCP?", icon: "🌐" },
];

function App() {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [subjects, setSubjects] = useState(fallbackSubjects);
  const [showSources, setShowSources] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);

  const isOnline = health?.success && health?.initialization_status === "ready";
  const activeSubjectLabel = subject || "All subjects";

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API}/health`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setHealth(await response.json());
    } catch {
      setHealth({ success: false, initialization_status: "offline" });
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch(`${API}/subjects`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data.subjects) && data.subjects.length) setSubjects(data.subjects);
    } catch {
      // Keep the built-in subjects when the optional endpoint is unavailable.
    }
  };

  useEffect(() => {
    checkHealth();
    loadSubjects();
  }, []);

  useEffect(() => {
    const node = messagesRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const newChat = () => {
    setMessages([]);
    setMessage("");
    setMobileMenu(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const chooseSuggestion = (text) => {
    setMessage(text);
    setMobileMenu(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const send = async (event) => {
    event?.preventDefault();
    const query = message.trim();
    if (!query || loading) return;

    setMessages((current) => [...current, { role: "user", text: query, subject }]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, subject: subject || null }),
      });
      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const error = await response.json();
          detail = error.detail || detail;
        } catch {}
        throw new Error(detail);
      }
      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: data.answer,
          sources: data.sources || [],
          latency: data.latency_ms,
          grounded: data.grounded,
        },
      ]);
      setHealth((current) => (current ? { ...current, success: true } : current));
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "bot", text: `I couldn't reach the EduBot AI service. ${error.message}`, error: true },
      ]);
      setHealth((current) => ({ ...(current || {}), success: false, initialization_status: "offline" }));
    } finally {
      setLoading(false);
    }
  };

  const statusText = useMemo(() => {
    if (!health) return "Checking AI service…";
    if (!health.success) return "API offline";
    if (health.initialization_status !== "ready") return "AI starting…";
    return `${health.knowledge_records ?? 0} knowledge records`;
  }, [health]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-row">
            <div className="brand-mark">🤖</div>
            <div>
              <div className="brand-name">Edu<span>Bot</span></div>
              <div className="brand-subtitle">AI Learning Assistant</div>
            </div>
          </div>

          <button className="new-chat" onClick={newChat}>
            <span>＋</span> New conversation
          </button>

          <div className="sidebar-label">Subjects</div>
          <div className="subject-list">
            <button className={`subject-item ${!subject ? "active" : ""}`} onClick={() => setSubject("")}>
              <span>✦</span><span>All subjects</span>
            </button>
            {subjects.map((item) => (
              <button key={item} className={`subject-item ${subject === item ? "active" : ""}`} onClick={() => setSubject(item)}>
                <span className="subject-dot">•</span><span>{item}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="research-card">
            <div className="research-icon">⌁</div>
            <div>
              <strong>Research prototype</strong>
              <span>FastAPI · FAISS · RAG</span>
            </div>
          </div>
          <div className="sidebar-footer">Built for academic learning</div>
        </div>
      </aside>

      {mobileMenu && <button className="backdrop" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}

      <main className="chat-main">
        <header className="chat-header">
          <div className="header-left">
            <button className="menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu">☰</button>
            <div>
              <div className="chat-title-row">
                <h1>EduBot</h1>
                <span className={`status-pill ${isOnline ? "online" : ""}`}><i />{isOnline ? "Online" : "Connecting"}</span>
              </div>
              <p>AI-powered educational assistant · <strong>{activeSubjectLabel}</strong></p>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-button" onClick={checkHealth} title="Check API status">↻</button>
            <button className="status-button" onClick={checkHealth}>
              <span className={`status-dot ${isOnline ? "online" : ""}`} /> API Status
            </button>
          </div>
        </header>

        <section className="chat-messages" ref={messagesRef}>
          {messages.length === 0 && (
            <div className="welcome">
              <div className="welcome-glow"><div className="welcome-robot">🤖</div></div>
              <span className="eyebrow">YOUR ACADEMIC AI ASSISTANT</span>
              <h2>Learn smarter with <span>EduBot</span></h2>
              <p>Ask questions from your syllabus and get clear answers backed by retrieved academic knowledge.</p>
              <div className="feature-row">
                <span>✓ Semantic retrieval</span><span>✓ Grounded answers</span><span>✓ Source visibility</span>
              </div>
              <div className="suggestions">
                {suggestions.map((item) => (
                  <button key={item.text} onClick={() => chooseSuggestion(item.text)}>
                    <span className="suggestion-icon">{item.icon}</span>
                    <span><small>{item.title}</small><strong>{item.text}</strong></span>
                    <b>→</b>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((item, index) => (
            <article key={index} className={`message-row ${item.role}`}>
              {item.role === "bot" && <div className="bot-avatar">🤖</div>}
              <div className="message-content">
                <div className={`message-bubble ${item.error ? "error" : ""}`}>{item.text}</div>
                {item.role === "bot" && !item.error && item.sources?.length > 0 && (
                  <div className="answer-panel">
                    <button className="sources-toggle" onClick={() => setShowSources((value) => !value)}>
                      <span>▣</span><strong>{item.sources.length} retrieved source{item.sources.length > 1 ? "s" : ""}</strong><span>{showSources ? "⌃" : "⌄"}</span>
                    </button>
                    {showSources && <div className="sources-list">{item.sources.map((source, i) => (
                      <div className="source-item" key={i}>
                        <div><strong>{source.title}</strong><small>{source.topic || "Academic knowledge"}</small></div>
                        <span>{Number(source.score).toFixed(3)}</span>
                      </div>
                    ))}</div>}
                    <div className="answer-meta">
                      <span className={item.grounded ? "grounded" : "not-grounded"}>{item.grounded ? "✓ Grounded in retrieved knowledge" : "⚠ No sufficiently relevant context"}</span>
                      {Number.isFinite(item.latency) && <span>{item.latency} ms</span>}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}

          {loading && (
            <article className="message-row bot">
              <div className="bot-avatar">🤖</div>
              <div className="message-content"><div className="typing-card"><div className="typing-dots"><i/><i/><i/></div><span>Searching academic knowledge…</span></div></div>
            </article>
          )}
        </section>

        <div className="composer-wrap">
          <div className="composer-tools">
            <span><span className={`live-dot ${isOnline ? "" : "idle"}`} /> {statusText}</span>
            <button onClick={() => setSubject("")}>Clear subject</button>
          </div>
          <form className="composer" onSubmit={send}>
            <textarea ref={inputRef} value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(event); } }} placeholder="Ask an academic question…" maxLength={4000} rows={1} />
            <button className="send-button" type="submit" disabled={loading || !message.trim()} aria-label="Send message">➤</button>
          </form>
          <div className="composer-note">EduBot uses retrieved academic material to keep answers relevant and grounded.</div>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
