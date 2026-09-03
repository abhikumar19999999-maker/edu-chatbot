import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function App() {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const suggestions = useMemo(() => ["What is supervised learning?", "Explain a data structure.", "What is process management in an operating system?"], []);

  const checkHealth = async () => {
    try { const response = await fetch(`${API}/health`); setHealth(await response.json()); }
    catch { setHealth({ success: false }); }
  };

  const send = async (event) => {
    event?.preventDefault();
    const query = message.trim();
    if (!query || loading) return;
    setMessages((current) => [...current, { role: "user", text: query }]);
    setMessage(""); setLoading(true);
    try {
      const response = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: query, subject: subject || null }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMessages((current) => [...current, { role: "bot", text: data.answer, sources: data.sources || [], latency: data.latency_ms, grounded: data.grounded }]);
    } catch (error) { setMessages((current) => [...current, { role: "bot", text: `Unable to reach EduBot API: ${error.message}`, error: true }]); }
    finally { setLoading(false); }
  };

  return <main className="app"><section className="card">
    <header><div className="logo">🤖</div><div className="brand"><h1>EduBot</h1><p>AI-Powered Educational Chatbot · RAG Research Prototype</p></div><button className="health" onClick={checkHealth}>API Status</button></header>
    <div className="research-bar"><span>🧠 NLP</span><span>🔎 FAISS Semantic Search</span><span>🤗 Transformer</span><span>📚 Grounded RAG</span>{health && <strong className={health.success ? "ok" : "bad"}>{health.success ? `● ${health.knowledge_records ?? 0} records` : "● Offline"}</strong>}</div>
    <div className="messages">
      {messages.length === 0 && <div className="welcome"><div className="welcome-icon">🎓</div><h2>Ask an academic question</h2><p>EduBot retrieves relevant academic knowledge with semantic search and uses the retrieved context to formulate a grounded answer.</p><div className="suggestions">{suggestions.map((item) => <button key={item} onClick={() => setMessage(item)}>{item}</button>)}</div></div>}
      {messages.map((item, index) => <article key={index} className={`message ${item.role} ${item.error ? "error" : ""}`}><div>{item.text}</div>{item.role === "bot" && item.sources?.length > 0 && <aside><b>Retrieved academic sources</b>{item.sources.map((source, i) => <small key={i}>{source.title} · {source.topic || "Academic"} · similarity {Number(source.score).toFixed(3)}</small>)}</aside>}{item.role === "bot" && !item.error && <footer>{item.grounded ? "✓ Grounded in retrieved knowledge" : "⚠ No sufficiently relevant context"}{Number.isFinite(item.latency) && ` · ${item.latency} ms`}</footer>}</article>)}
      {loading && <article className="message bot typing">Retrieving academic knowledge and preparing a grounded response…</article>}
    </div>
    <div className="pipeline"><span>Student Query</span><b>→</b><span>Embedding</span><b>→</b><span>FAISS</span><b>→</b><span>Context</span><b>→</b><span>Transformer</span></div>
    <form onSubmit={send}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a syllabus-related question…" maxLength={4000} /><input className="subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject (optional)" maxLength={200} /><button type="submit" disabled={loading}>{loading ? "…" : "Send"}</button></form>
  </section></main>;
}
createRoot(document.getElementById("root")).render(<App />);
