import React, { useEffect, useState } from "react";
import { request } from "./App";

const emptyKnowledge = {
  title: "",
  question: "",
  answer: "",
  topic: "",
  keywords: "",
  difficulty: "beginner",
  source: "EduBot Knowledge Base",
  subjectId: "",
};

const emptySubject = { name: "", description: "", icon: "📚" };

export default function Admin({ data, subjects, onChanged }) {
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [knowledgeForm, setKnowledgeForm] = useState(emptyKnowledge);
  const [editingSubject, setEditingSubject] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const flash = (message, isError = false) => {
    setNotice(isError ? "" : message);
    setError(isError ? message : "");
    window.clearTimeout(flash.timer);
    flash.timer = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 3500);
  };

  const loadUsers = async () => {
    try {
      const d = await request("/admin/users");
      setUsers(d.users || []);
    } catch (e) {
      flash(e.message, true);
    }
  };

  const loadFeedback = async () => {
    try {
      const d = await request("/admin/feedback");
      setFeedback(d.feedback || []);
    } catch (e) {
      flash(e.message, true);
    }
  };

  const loadKnowledge = async () => {
    try {
      const d = await request("/admin/knowledge");
      setKnowledge(d.knowledge || []);
    } catch (e) {
      flash(e.message, true);
    }
  };

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "feedback") loadFeedback();
    if (tab === "knowledge") loadKnowledge();
  }, [tab]);

  if (!data) {
    return (
      <section className="admin-page">
        <div className="panel">
          <h2>Admin Center</h2>
          <p>Loading administration data…</p>
        </div>
      </section>
    );
  }

  const stats = data.stats || {};
  const cards = [
    ["Users", stats.users ?? stats.totalUsers ?? 0, "👥"],
    ["Students", stats.students ?? 0, "🎓"],
    ["Subjects", stats.totalSubjects ?? 0, "📚"],
    ["Knowledge", stats.knowledge ?? stats.totalKnowledge ?? 0, "🧠"],
    ["Conversations", stats.conversations ?? stats.totalConversations ?? 0, "💬"],
    ["Avg. Rating", Number(stats.averageRating ?? 0).toFixed(2), "⭐"],
  ];

  const saveSubject = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const path = editingSubject
        ? `/admin/subjects/${subjectForm.id}`
        : "/admin/subjects";
      const method = editingSubject ? "PATCH" : "POST";
      const d = await request(path, {
        method,
        body: JSON.stringify({
          name: subjectForm.name.trim(),
          description: subjectForm.description.trim(),
          icon: subjectForm.icon.trim() || "📚",
        }),
      });
      flash(d.message || (editingSubject ? "Subject updated successfully" : "Subject added successfully"));
      setSubjectForm(emptySubject);
      setEditingSubject(false);
      await onChanged?.();
    } catch (e) {
      flash(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  const editSubject = (subject) => {
    setSubjectForm({
      id: subject._id,
      name: subject.name || "",
      description: subject.description || "",
      icon: subject.icon || "📚",
    });
    setEditingSubject(true);
    setTab("subjects");
  };

  const removeSubject = async (subject) => {
    if (!window.confirm(`Deactivate subject “${subject.name}”?`)) return;
    setBusy(true);
    try {
      const d = await request(`/admin/subjects/${subject._id}`, { method: "DELETE" });
      flash(d.message || "Subject deactivated successfully");
      if (subjectForm.id === subject._id) {
        setSubjectForm(emptySubject);
        setEditingSubject(false);
      }
      await onChanged?.();
    } catch (e) {
      flash(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  const saveKnowledge = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        title: knowledgeForm.title.trim(),
        question: knowledgeForm.question.trim(),
        answer: knowledgeForm.answer.trim(),
        topic: knowledgeForm.topic.trim(),
        keywords: knowledgeForm.keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        difficulty: knowledgeForm.difficulty,
        source: knowledgeForm.source.trim() || "EduBot Knowledge Base",
        subjectId: knowledgeForm.subjectId || null,
      };
      const path = editingKnowledge
        ? `/admin/knowledge/${knowledgeForm.id}`
        : "/admin/knowledge";
      const method = editingKnowledge ? "PATCH" : "POST";
      const d = await request(path, { method, body: JSON.stringify(payload) });
      flash(d.message || (editingKnowledge ? "Knowledge updated successfully" : "Knowledge added successfully"));
      setKnowledgeForm(emptyKnowledge);
      setEditingKnowledge(false);
      await loadKnowledge();
      await onChanged?.();
    } catch (e) {
      flash(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  const editKnowledge = (item) => {
    setKnowledgeForm({
      id: item._id,
      title: item.title || "",
      question: item.question || "",
      answer: item.answer || "",
      topic: item.topic || "",
      keywords: Array.isArray(item.keywords) ? item.keywords.join(", ") : "",
      difficulty: item.difficulty || "beginner",
      source: item.source || "EduBot Knowledge Base",
      subjectId: item.subject?._id || "",
    });
    setEditingKnowledge(true);
    setTab("knowledge");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeKnowledge = async (item) => {
    if (!window.confirm(`Deactivate “${item.title}”?`)) return;
    setBusy(true);
    try {
      const d = await request(`/admin/knowledge/${item._id}`, { method: "DELETE" });
      flash(d.message || "Knowledge deactivated successfully");
      if (knowledgeForm.id === item._id) {
        setKnowledgeForm(emptyKnowledge);
        setEditingKnowledge(false);
      }
      await loadKnowledge();
      await onChanged?.();
    } catch (e) {
      flash(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  const toggleUser = async (user) => {
    try {
      const d = await request(`/admin/users/${user.id}/status?active=${!user.isActive}`, {
        method: "PATCH",
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, isActive: !item.isActive } : item
        )
      );
      flash(d.message || "User status updated");
      await onChanged?.();
    } catch (e) {
      flash(e.message, true);
    }
  };

  const reload = async () => {
    setBusy(true);
    try {
      const d = await request("/admin/reload", { method: "POST" });
      flash(`${d.message || "RAG index reloaded"} · ${d.knowledge_records ?? 0} records`);
      await onChanged?.();
      if (tab === "knowledge") await loadKnowledge();
    } catch (e) {
      flash(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h2>EduBot Control Center</h2>
          <p>Manage users, subjects, knowledge and student feedback.</p>
        </div>
        <button className="primary-small" onClick={reload} disabled={busy}>
          ↻ {busy ? "Working…" : "Reload RAG index"}
        </button>
      </div>

      {(notice || error) && (
        <div className={`notice ${error ? "error" : ""}`}>{error || notice}</div>
      )}

      <div className="stats-grid admin-stat-grid">
        {cards.map(([label, value, icon]) => (
          <div className="stat-card admin-stat-card" key={label}>
            <span>{icon}</span>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {[
          ["overview", "Overview"],
          ["users", "Users"],
          ["subjects", "Subjects"],
          ["knowledge", "Knowledge Base"],
          ["feedback", "Feedback"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="admin-grid">
          <div className="panel admin-card">
            <div className="panel-title">
              <div>
                <h3>Administration tools</h3>
                <p>Full control over the educational chatbot data.</p>
              </div>
            </div>
            <div className="admin-badges">
              <span>✓ Protected admin API</span>
              <span>✓ User activation control</span>
              <span>✓ Subject create / edit / deactivate</span>
              <span>✓ Knowledge create / edit / deactivate</span>
              <span>✓ FAISS RAG index reload</span>
              <span>✓ Student feedback review</span>
            </div>
          </div>

          <div className="panel admin-card">
            <div className="panel-title">
              <div>
                <h3>Research architecture</h3>
                <p>Core AI components used by this branch.</p>
              </div>
            </div>
            <div className="architecture-list">
              <div>🧠 Sentence Transformers <small>Semantic embeddings</small></div>
              <div>🔎 FAISS <small>Vector similarity retrieval</small></div>
              <div>📚 RAG <small>Grounded academic answers</small></div>
              <div>🗄️ MongoDB Atlas <small>Persistent application data</small></div>
            </div>
          </div>

          <div className="panel admin-card full-width-admin">
            <div className="panel-title">
              <div>
                <h3>System summary</h3>
                <p>Live counts from the protected admin API.</p>
              </div>
            </div>
            <div className="summary-strip">
              <div><strong>{stats.users ?? 0}</strong><span>Total users</span></div>
              <div><strong>{stats.students ?? 0}</strong><span>Students</span></div>
              <div><strong>{stats.totalSubjects ?? 0}</strong><span>Active subjects</span></div>
              <div><strong>{stats.knowledge ?? 0}</strong><span>Knowledge records</span></div>
              <div><strong>{stats.feedback ?? 0}</strong><span>Feedback entries</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="panel admin-card">
          <div className="panel-title">
            <div>
              <h3>User management</h3>
              <p>Enable or disable student accounts.</p>
            </div>
            <span className="count-pill">{users.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name || "Student"}</strong></td>
                    <td>{user.email}</td>
                    <td><span className="role-badge">{user.role}</span></td>
                    <td><span className={`state ${user.isActive ? "on" : "off"}`}>{user.isActive ? "Active" : "Disabled"}</span></td>
                    <td>
                      {user.role !== "admin" && (
                        <button className="table-action" onClick={() => toggleUser(user)}>
                          {user.isActive ? "Disable" : "Enable"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!users.length && <div className="panel-empty">No users found.</div>}
        </div>
      )}

      {tab === "subjects" && (
        <div className="admin-grid">
          <form className="panel admin-card admin-form" onSubmit={saveSubject}>
            <div className="panel-title">
              <div>
                <h3>{editingSubject ? "Edit subject" : "Add subject"}</h3>
                <p>{editingSubject ? "Update the selected academic subject." : "Create a new academic subject."}</p>
              </div>
            </div>
            <input placeholder="Subject name" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required />
            <textarea placeholder="Subject description" rows={4} value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} />
            <input placeholder="Icon e.g. 🧠" value={subjectForm.icon} onChange={(e) => setSubjectForm({ ...subjectForm, icon: e.target.value })} maxLength={10} />
            <div className="form-actions">
              <button className="primary-button" disabled={busy}>{editingSubject ? "Update Subject" : "Add Subject"}</button>
              {editingSubject && <button type="button" className="secondary-button" onClick={() => { setSubjectForm(emptySubject); setEditingSubject(false); }}>Cancel</button>}
            </div>
          </form>

          <div className="panel admin-card">
            <div className="panel-title">
              <div><h3>Current subjects</h3><p>Active subjects available to students.</p></div>
              <span className="count-pill">{subjects.length}</span>
            </div>
            <div className="management-list">
              {subjects.map((subject) => (
                <div className="management-item" key={subject._id}>
                  <div className="management-item-header">
                    <div>
                      <div className="management-item-title">{subject.icon || "📚"} {subject.name}</div>
                      <div className="management-item-description">{subject.description || "No description provided."}</div>
                    </div>
                    <div className="management-actions">
                      <button className="edit-btn" onClick={() => editSubject(subject)}>Edit</button>
                      <button className="delete-btn" onClick={() => removeSubject(subject)} disabled={busy}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {!subjects.length && <div className="panel-empty">No subjects found.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === "knowledge" && (
        <div className="knowledge-admin-layout">
          <form className="panel admin-card admin-form knowledge-form" onSubmit={saveKnowledge}>
            <div className="panel-title">
              <div>
                <h3>{editingKnowledge ? "Edit knowledge record" : "Add academic knowledge"}</h3>
                <p>Changes automatically rebuild the in-memory FAISS index.</p>
              </div>
            </div>
            <div className="form-grid">
              <input placeholder="Knowledge title" value={knowledgeForm.title} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })} required />
              <input placeholder="Topic" value={knowledgeForm.topic} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, topic: e.target.value })} />
              <select value={knowledgeForm.subjectId} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, subjectId: e.target.value })}>
                <option value="">No subject</option>
                {subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.icon || "📚"} {subject.name}</option>)}
              </select>
              <input placeholder="Keywords separated by commas" value={knowledgeForm.keywords} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, keywords: e.target.value })} />
              <select value={knowledgeForm.difficulty} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, difficulty: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input placeholder="Source" value={knowledgeForm.source} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, source: e.target.value })} />
            </div>
            <input placeholder="Related question" value={knowledgeForm.question} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, question: e.target.value })} />
            <textarea placeholder="Answer / academic content" rows={9} value={knowledgeForm.answer} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, answer: e.target.value })} required />
            <div className="form-actions">
              <button className="primary-button" disabled={busy}>{editingKnowledge ? "Update Knowledge" : "Add Knowledge"}</button>
              {editingKnowledge && <button type="button" className="secondary-button" onClick={() => { setKnowledgeForm(emptyKnowledge); setEditingKnowledge(false); }}>Cancel</button>}
            </div>
          </form>

          <div className="panel admin-card full-width-admin">
            <div className="panel-title">
              <div><h3>Knowledge records</h3><p>Manage the content used by semantic retrieval.</p></div>
              <span className="count-pill">{knowledge.length}</span>
            </div>
            <div className="management-list">
              {knowledge.map((item) => (
                <div className="management-item knowledge-management-item" key={item._id}>
                  <div className="management-item-header">
                    <div>
                      <div className="management-item-title">{item.title || "Untitled"}</div>
                      <div className="management-item-description">{item.answer || "No answer content."}</div>
                      <div className="management-item-meta">
                        <span>{item.subject?.icon || "📚"} {item.subject?.name || "General"}</span>
                        {item.topic && <span>Topic: {item.topic}</span>}
                        {item.difficulty && <span>{item.difficulty}</span>}
                        {item.keywords?.length > 0 && <span>{item.keywords.length} keywords</span>}
                      </div>
                    </div>
                    <div className="management-actions">
                      <button className="edit-btn" onClick={() => editKnowledge(item)}>Edit</button>
                      <button className="delete-btn" onClick={() => removeKnowledge(item)} disabled={busy}>Delete</button>
                    </div>
                  </div>
                  {item.question && <div className="knowledge-question">Q: {item.question}</div>}
                </div>
              ))}
              {!knowledge.length && <div className="panel-empty">No knowledge records found.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === "feedback" && (
        <div className="panel admin-card">
          <div className="panel-title">
            <div><h3>Student feedback</h3><p>Review ratings submitted for EduBot answers.</p></div>
            <span className="count-pill">{feedback.length}</span>
          </div>
          <div className="feedback-admin-list">
            {feedback.map((item) => (
              <div className="feedback-admin" key={item.id}>
                <div className="feedback-admin-top">
                  <div>
                    <strong className="feedback-stars">{"★".repeat(Math.max(0, Math.min(5, Number(item.rating) || 0)))}</strong>
                    <small>{item.helpful ? "Helpful" : "Not helpful"} · {item.user?.name || "Student"} · {item.user?.email || ""}</small>
                  </div>
                  <span className={`state ${item.helpful ? "on" : "off"}`}>{item.helpful ? "Helpful" : "Needs review"}</span>
                </div>
                <p>{item.comment || "No comment provided."}</p>
              </div>
            ))}
            {!feedback.length && <div className="panel-empty">No feedback yet.</div>}
          </div>
        </div>
      )}
    </section>
  );
}
