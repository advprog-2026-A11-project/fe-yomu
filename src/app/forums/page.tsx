"use client";

import { useEffect, useState } from "react";
import { MessageCard, Message } from "./MessageCard";

export default function ForumsPage() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      .then((data) => {
        const allMessages = Array.isArray(data) ? data : [];
        const topLevelMessages = allMessages.filter((m: Message) => !m.parentId);
        setMessages(topLevelMessages);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const createMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: formContent }),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status} ${await res.text()}`);
      setFormContent("");
      setShowCreate(false);
      load();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleError = (err: string) => setError(err);

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Forums</h2>
        <div>
          {!showCreate ? (
            <button type="button" onClick={() => setShowCreate(true)} className="btn">
              Create message
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setFormContent("");
              }}
              className="btn-ghost"
              style={{ marginLeft: 8 }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <form onSubmit={createMessage} className="card" style={{ marginTop: 12, marginBottom: 18 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Content</label>
            <textarea
              required
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={3}
            />
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
        <div style={{ marginTop: "1rem" }}>
          {messages.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              depth={0}
              onReload={load}
              onError={handleError}
            />
          ))}
        </div>
      )}
    </section>
  );
}
