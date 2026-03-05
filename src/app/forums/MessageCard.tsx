"use client";

import { useState } from "react";

export type Message = {
  id: string;
  content: string;
  createdAt?: string | null;
  replies?: Message[];
  parentId?: string | null;
};

type MessageCardProps = {
  message: Message;
  depth?: number;
  onReload: () => void;
  onError: (err: string) => void;
};

export function MessageCard({
  message,
  depth = 0,
  onReload,
  onError,
}: MessageCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [collapsed, setCollapsed] = useState(false);

  const isTopLevel = depth === 0;
  const hasReplies = message.replies && message.replies.length > 0;
  const replyCount = message.replies?.length || 0;
  const maxIndent = 10;

  const createReply = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const res = await fetch(`/api/messages/${message.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });
      if (!res.ok) throw new Error(`Reply failed: ${res.status} ${await res.text()}`);
      setReplyContent("");
      setShowReplyForm(false);
      onReload();
    } catch (err) {
      onError(String(err));
    }
  };

  const updateMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const endpoint = isTopLevel
        ? `/api/messages/${message.id}`
        : `/api/messages/${message.parentId}/replies/${message.id}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status} ${await res.text()}`);
      setEditing(false);
      onReload();
    } catch (err) {
      onError(String(err));
    }
  };

  const deleteMessage = async () => {
    const confirmMsg = isTopLevel ? "Delete this message?" : "Delete this reply?";
    if (!confirm(confirmMsg)) return;
    try {
      const endpoint = isTopLevel
        ? `/api/messages/${message.id}`
        : `/api/messages/${message.parentId}/replies/${message.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status} ${await res.text()}`);
      onReload();
    } catch (err) {
      onError(String(err));
    }
  };

  const containerStyle: React.CSSProperties = isTopLevel
    ? { marginBottom: "1rem" }
    : {
        marginLeft: Math.min(depth - 1, maxIndent) * 16,
        borderLeft: "2px solid var(--border, #ddd)",
        paddingLeft: 12,
        marginTop: 8,
      };

  const cardStyle: React.CSSProperties = isTopLevel
    ? {}
    : { padding: "8px 0" };

  const fontSize = isTopLevel ? "1rem" : "0.9rem";
  const smallFontSize = isTopLevel ? "0.85rem" : "0.8rem";
  const buttonPadding = isTopLevel ? "4px 8px" : "2px 6px";

  return (
    <div style={containerStyle}>
      <div className={isTopLevel ? "card" : ""} style={cardStyle}>
        {!editing ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              {isTopLevel && <div style={{ fontWeight: 700, marginBottom: 4 }}>Message</div>}
              <div style={{ fontSize }}>{message.content}</div>
              {message.createdAt && (
                <div style={{ marginTop: "0.5rem", fontSize: smallFontSize, color: "var(--text-muted, #666)" }}>
                  {new Date(message.createdAt).toLocaleString()}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="btn-ghost"
                style={{ fontSize: smallFontSize, padding: buttonPadding }}
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setEditContent(message.content);
                }}
                className="btn"
                style={{ fontSize: smallFontSize, padding: buttonPadding }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={deleteMessage}
                className="btn-danger"
                style={{ fontSize: smallFontSize, padding: buttonPadding }}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={updateMessage} style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: smallFontSize }}>
                Edit {isTopLevel ? "Message" : "Reply"}
              </label>
              <textarea
                required
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={isTopLevel ? 3 : 2}
                style={{ fontSize }}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="submit" className="btn" style={{ fontSize: smallFontSize, padding: buttonPadding }}>
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-ghost"
                style={{ fontSize: smallFontSize, padding: buttonPadding }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {showReplyForm && (
          <form onSubmit={createReply} style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: smallFontSize }}>Write a reply</label>
              <textarea
                required
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                placeholder="Write your reply..."
                style={{ fontSize }}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="submit" className="btn" style={{ fontSize: smallFontSize, padding: buttonPadding }}>
                Post Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent("");
                }}
                className="btn-ghost"
                style={{ fontSize: smallFontSize, padding: buttonPadding }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {hasReplies && (
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="btn-ghost"
              style={{
                fontSize: smallFontSize,
                padding: buttonPadding,
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--text-muted, #666)",
              }}
            >
              <span style={{ fontSize: "0.7rem" }}>{collapsed ? "▶" : "▼"}</span>
              {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
            </button>
            {!collapsed && (
              <div style={{ marginTop: 8 }}>
                {message.replies!.map((reply) => (
                  <MessageCard
                    key={reply.id}
                    message={{ ...reply, parentId: message.id }}
                    depth={depth + 1}
                    onReload={onReload}
                    onError={onError}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
