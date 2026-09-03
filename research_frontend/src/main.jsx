import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App(){
  const [message,setMessage]=useState("");
  const [messages,setMessages]=useState([]);
  const [loading,setLoading]=useState(false);
  const send=async(e)=>{
    e.preventDefault(); if(!message.trim()||loading)return;
    const q=message.trim(); setMessages(m=>[...m,{role:"user",text:q}]); setMessage(""); setLoading(true);
    try{
      const r=await fetch(`${API}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q})});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const d=await r.json(); setMessages(m=>[...m,{role:"bot",text:d.answer,sources:d.sources||[]}]);
    }catch(err){setMessages(m=>[...m,{role:"bot",text:`Unable to reach EduBot API: ${err.message}`}]);}
    finally{setLoading(false)}
  };
  return <main className="app"><section className="card"><header><div className="logo">🤖</div><div><h1>EduBot</h1><p>AI-Powered Educational Chatbot</p></div></header><div className="messages">{messages.length===0&&<div className="welcome"><h2>Ask an academic question</h2><p>Responses are grounded in retrieved syllabus-aligned knowledge.</p></div>}{messages.map((m,i)=><article key={i} className={m.role}><div>{m.text}</div>{m.sources?.length>0&&<aside><b>Retrieved sources</b>{m.sources.map((s,j)=><small key={j}>{s.title} · score {s.score.toFixed(3)}</small>)}</aside>}</article>)}{loading&&<article className="bot">Retrieving knowledge and preparing a response…</article>}</div><form onSubmit={send}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask a question…"/><button>Send</button></form></section></main>
}
createRoot(document.getElementById("root")).render(<App/>);
