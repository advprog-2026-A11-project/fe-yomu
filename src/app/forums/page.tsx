"use client";

import { useState } from "react";
import { MessageCard } from "./MessageCard";
import { useMessages } from "@/app/hooks/useMessages";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/auth-headers";

export default function ForumsPage() {
  const { messages, loading, error: messageError, load } = useMessages();
  const [error, setError] = useState(messageError);
  const [showCreate, setShowCreate] = useState(false);
  const [formContent, setFormContent] = useState("");
  const [creating, setCreating] = useState(false);
  const { isAuthenticated } = useAuth();

  const createMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ content: formContent }),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status} ${await res.text()}`);
      setFormContent("");
      setShowCreate(false);
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleError = (err: string) => setError(err);

  return (
    <ProtectedRoute description="Sign in to join the forums.">
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Forums</h2>
          <div>
            {isAuthenticated ? (
              !showCreate ? (
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
              )
            ) : null}
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
    </ProtectedRoute>
  );
}
