"use client";

import { useEffect, useState } from "react";

type Message = {
  id: string;
  content: string;
  createdAt?: string | null;
};

export default function ForumsPage() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<null | Message>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formContent, setFormContent] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/messages", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const createMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const payload = { content: formContent }; // no author when creating
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status} ${await res.text()}`);
      setFormContent("");
      setShowCreate(false);
      load();
    } catch (err) {
      setError(String(err));
    }
  };

  const startEdit = (m: Message) => {
    setEditing(m);
    setFormContent(m.content);
  };

  const saveEdit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editing) return;
    try {
      const payload = { content: formContent };
      const res = await fetch(`/api/messages/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status} ${await res.text()}`);
      setEditing(null);
      setFormContent("");
      load();
    } catch (err) {
      setError(String(err));
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status} ${await res.text()}`);
      load();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="" style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Forums</h2>
        <div>
          {!showCreate && (
            <button type="button" onClick={() => setShowCreate(true)} className="btn">Create message</button>
          )}
          {showCreate && (
            <button type="button" onClick={() => { setShowCreate(false); setFormContent(""); }} className="btn-ghost" style={{ marginLeft: 8 }}>Cancel</button>
          )}
        </div>
      </div>

      {showCreate && (
        <form onSubmit={createMessage} className="card" style={{ marginTop: 12, marginBottom: 18 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Content</label>
            <textarea required value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={3} />
          </div>
          <div>
            <button type="submit" className="btn">Post</button>
          </div>
        </form>
      )}

      {loading && <p>Loading messages...</p>}
      {error && <p style={{ color: "var(--danger)" }}>Error: {error}</p>}

      {messages && messages.length === 0 && <p>No messages yet.</p>}

      {messages && messages.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
          {messages.map((m) => (
            <li key={m.id} className="card" style={{ marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Message</div>
                  <div style={{ marginTop: "0.25rem" }}>{m.content}</div>
                  {m.createdAt && <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>{new Date(m.createdAt).toLocaleString()}</div>}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => startEdit(m)} className="btn">Edit</button>
                  <button type="button" onClick={() => deleteMessage(m.id)} className="btn-danger">Delete</button>
                </div>
              </div>

              {editing && editing.id === m.id && (
                <form onSubmit={saveEdit} className="" style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Content</label>
                    <textarea required value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={3} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" className="btn">Save</button>
                    <button type="button" onClick={() => { setEditing(null); setFormContent(""); }} className="btn-ghost">Cancel</button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
