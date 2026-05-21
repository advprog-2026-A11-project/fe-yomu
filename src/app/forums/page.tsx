"use client";

import { useState } from "react";
import { MessageCard } from "./MessageCard";
import { useMessages } from "@/app/hooks/useMessages";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/auth-headers";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ content: formContent }),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status} ${await res.text()}`);
      setFormContent("");
      setShowCreate(false);
      await load(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleError = (err: string) => setError(err);

  return (
    <ProtectedRoute description="Sign in to join the forums.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p className="yomu-eyebrow">Community</p>
              <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                Discussion Forum
              </h1>
              <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
                Share your thoughts, ask questions, and learn together.
              </p>
            </div>

            {isAuthenticated && (
              !showCreate ? (
                <Button variant="primary" pill leftIcon="+" onClick={() => setShowCreate(true)}>
                  New Message
                </Button>
              ) : (
                <Button variant="ghost" pill onClick={() => { setShowCreate(false); setFormContent(""); }}>
                  Cancel
                </Button>
              )
            )}
          </div>

          {showCreate && (
            <Card style={{ marginBottom: "1.5rem" }}>
              <form onSubmit={createMessage}>
                <Textarea
                  label="Message"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={3}
                  placeholder="What's on your mind?"
                />
                <div style={{ marginTop: "1rem" }}>
                  <Button type="submit" variant="primary" pill loading={creating} disabled={creating || !formContent.trim()}>
                    Post
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>Error: {error}</div>}
          {loading && <LoadingState message="Loading messages..." />}

          {!loading && messages?.length === 0 && (
            <EmptyState
              icon="💬"
              title="No Messages Yet"
              description="Be the first to start a discussion!"
            />
          )}

          {messages && messages.length > 0 && (
            <div style={{ display: "grid", gap: "1rem" }}>
              {messages.map((m) => (
                <MessageCard
                  key={m.id}
                  message={m}
                  depth={0}
                  onReload={() => load(true)}
                  onError={handleError}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
