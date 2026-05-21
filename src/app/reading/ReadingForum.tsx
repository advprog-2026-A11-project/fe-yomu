"use client";

import { useState } from "react";
import { MessageCard, Message } from "@/app/forums/MessageCard";
import { useAuth } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/auth-headers";
import { useMessages } from "@/app/hooks/useMessages";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

type ReadingForumProps = Readonly<{
  readingId: string;
}>;

export default function ReadingForum({ readingId }: ReadingForumProps) {
  const { messages, loading, error: messageError, load } = useMessages({ readingId });
  const [error, setError] = useState(messageError);
  const [showCreate, setShowCreate] = useState(false);
  const [formContent, setFormContent] = useState("");
  const [creating, setCreating] = useState(false);
  const { isAuthenticated } = useAuth();

  const createMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formContent.trim()) {
      setError("Message cannot be empty");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ content: formContent, readingId }),
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
    <section style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>Discussion Forum</h2>
        {isAuthenticated && (
          !showCreate ? (
            <Button variant="primary" size="sm" pill onClick={() => setShowCreate(true)}>
              Post a Question
            </Button>
          ) : (
            <Button variant="ghost" size="sm" pill onClick={() => { setShowCreate(false); setFormContent(""); setError(null); }}>
              Cancel
            </Button>
          )
        )}
      </div>

      {showCreate && (
        <Card style={{ marginBottom: "1.5rem" }}>
          <form onSubmit={createMessage}>
            <Textarea
              label="Your question or comment"
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={4}
              placeholder="Share your thoughts, questions, or insights about this reading..."
            />
            <div style={{ marginTop: "1rem" }}>
              <Button type="submit" variant="primary" pill loading={creating} disabled={creating || !formContent.trim()}>
                {creating ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {loading && <LoadingState message="Loading discussions..." />}

      {!loading && messages && messages.length === 0 && (
        <EmptyState
          icon="💬"
          title="No Discussions Yet"
          description="Be the first to ask a question or share your thoughts!"
        />
      )}

      {messages && messages.length > 0 && (
        <div style={{ display: "grid", gap: "1rem" }}>
          {messages.map((m: Message) => (
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
    </section>
  );
}
