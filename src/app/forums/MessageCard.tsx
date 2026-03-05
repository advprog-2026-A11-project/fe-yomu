"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Message = {
  id: string;
  content: string;
  createdAt?: string | null;
  replies?: Message[];
  parentId?: string | null;
};

type ReactionType =
  | "UPVOTE"
  | "DOWNVOTE"
  | "FIRE"
  | "ROCKET"
  | "LAUGH"
  | "PARTY"
  | "THINKING";

type EmojiReactionType = Exclude<ReactionType, "UPVOTE" | "DOWNVOTE">;

type Reaction = {
  id: string;
  userId: string;
  reactionType: ReactionType;
  createdAt?: string | null;
};

type MessageCardProps = {
  message: Message;
  depth?: number;
  onReload: () => void;
  onError: (err: string) => void;
};

const USER_ID_STORAGE_KEY = "forum-user-id";
const ACTIVE_REACTION_COLOR = "#f97316";

const EMOJI_REACTIONS: Array<{ type: EmojiReactionType; emoji: string; label: string }> = [
  { type: "FIRE", emoji: "🔥", label: "Fire" },
  { type: "ROCKET", emoji: "🚀", label: "Rocket" },
  { type: "LAUGH", emoji: "😂", label: "Laugh" },
  { type: "PARTY", emoji: "🎉", label: "Party" },
  { type: "THINKING", emoji: "🤔", label: "Thinking" },
];

function createAnonymousUserId(): string {
  if (typeof window === "undefined") {
    return "forum-user-anonymous";
  }

  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof window.crypto !== "undefined" && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `forum-user-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(USER_ID_STORAGE_KEY, generated);
  return generated;
}

function UpvoteIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4L4.5 12H9.5V20H14.5V12H19.5L12 4Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function DownvoteIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20L19.5 12H14.5V4H9.5V12H4.5L12 20Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EmojiPickerIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path
        d="M8.5 14.5C9.3 15.8 10.6 16.5 12 16.5C13.4 16.5 14.7 15.8 15.5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {active && <circle cx="19" cy="5" r="2.5" fill="currentColor" />}
    </svg>
  );
}

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
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  const isTopLevel = depth === 0;
  const hasReplies = message.replies && message.replies.length > 0;
  const replyCount = message.replies?.length || 0;
  const maxIndent = 10;

  useEffect(() => {
    setUserId(createAnonymousUserId());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadReactions = async () => {
      try {
        const res = await fetch(`/api/messages/${message.id}/reactions`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Reaction load failed: ${res.status} ${await res.text()}`);

        const data: unknown = await res.json();
        if (!cancelled) {
          setReactions(Array.isArray(data) ? (data as Reaction[]) : []);
        }
      } catch (err) {
        if (!cancelled) {
          onError(String(err));
        }
      }
    };

    loadReactions();

    return () => {
      cancelled = true;
    };
  }, [message.id, onError]);

  useEffect(() => {
    if (!emojiPickerOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!emojiPickerRef.current?.contains(event.target as Node)) {
        setEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [emojiPickerOpen]);

  const userReactionTypes = useMemo(() => {
    if (!userId) {
      return new Set<ReactionType>();
    }

    return new Set(
      reactions
        .filter((reaction) => reaction.userId === userId)
        .map((reaction) => reaction.reactionType)
    );
  }, [reactions, userId]);

  const reactionCounts = useMemo<Record<ReactionType, number>>(() => {
    const counts: Record<ReactionType, number> = {
      UPVOTE: 0,
      DOWNVOTE: 0,
      FIRE: 0,
      ROCKET: 0,
      LAUGH: 0,
      PARTY: 0,
      THINKING: 0,
    };

    for (const reaction of reactions) {
      counts[reaction.reactionType] += 1;
    }

    return counts;
  }, [reactions]);

  const visibleEmojiCounts = EMOJI_REACTIONS.filter(
    ({ type }) => reactionCounts[type] > 0
  );

  const refreshReactions = async () => {
    const res = await fetch(`/api/messages/${message.id}/reactions`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Reaction refresh failed: ${res.status} ${await res.text()}`);
    }

    const data: unknown = await res.json();
    setReactions(Array.isArray(data) ? (data as Reaction[]) : []);
  };

  const addReaction = async (reactionType: ReactionType) => {
    if (!userId) {
      return;
    }

    const res = await fetch(`/api/messages/${message.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reactionType }),
    });

    if (!res.ok && res.status !== 409) {
      throw new Error(`Add reaction failed: ${res.status} ${await res.text()}`);
    }
  };

  const removeReaction = async (reactionType: ReactionType) => {
    if (!userId) {
      return;
    }

    const res = await fetch(`/api/messages/${message.id}/reactions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reactionType }),
    });

    if (!res.ok && res.status !== 404) {
      throw new Error(`Remove reaction failed: ${res.status} ${await res.text()}`);
    }
  };

  const handleVoteClick = async (reactionType: "UPVOTE" | "DOWNVOTE") => {
    if (!userId || reactionBusy) {
      return;
    }

    setReactionBusy(true);
    try {
      if (userReactionTypes.has(reactionType)) {
        await removeReaction(reactionType);
      } else {
        await addReaction(reactionType);
      }
      await refreshReactions();
    } catch (err) {
      onError(String(err));
    } finally {
      setReactionBusy(false);
    }
  };

  const handleEmojiClick = async (reactionType: EmojiReactionType) => {
    if (!userId || reactionBusy) {
      return;
    }

    setReactionBusy(true);
    try {
      if (userReactionTypes.has(reactionType)) {
        await removeReaction(reactionType);
      } else {
        await addReaction(reactionType);
      }
      await refreshReactions();
    } catch (err) {
      onError(String(err));
    } finally {
      setReactionBusy(false);
    }
  };

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

  const cardStyle: React.CSSProperties = isTopLevel ? {} : { padding: "8px 0" };

  const fontSize = isTopLevel ? "1rem" : "0.9rem";
  const smallFontSize = isTopLevel ? "0.85rem" : "0.8rem";
  const buttonPadding = isTopLevel ? "4px 8px" : "2px 6px";
  const reactionButtonEnabled = Boolean(userId) && !reactionBusy;

  const reactionButtonStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    border: `1px solid ${active ? ACTIVE_REACTION_COLOR : "var(--input-border, #cbd5e1)"}`,
    background: active ? "rgba(249, 115, 22, 0.12)" : "#fff",
    color: active ? ACTIVE_REACTION_COLOR : "var(--text-muted, #666)",
    padding: isTopLevel ? "3px 8px" : "2px 7px",
    fontSize: smallFontSize,
    fontWeight: 600,
    cursor: reactionButtonEnabled ? "pointer" : "not-allowed",
    opacity: reactionButtonEnabled ? 1 : 0.6,
  });

  const emojiTriggerVisible = isHovered || emojiPickerOpen;

  return (
    <div style={containerStyle}>
      <div
        className={isTopLevel ? "card" : ""}
        style={cardStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    void handleVoteClick("UPVOTE");
                  }}
                  style={reactionButtonStyle(userReactionTypes.has("UPVOTE"))}
                  disabled={!reactionButtonEnabled}
                  aria-label="Upvote"
                  title="Upvote"
                >
                  <UpvoteIcon active={userReactionTypes.has("UPVOTE")} />
                  <span>{reactionCounts.UPVOTE}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleVoteClick("DOWNVOTE");
                  }}
                  style={reactionButtonStyle(userReactionTypes.has("DOWNVOTE"))}
                  disabled={!reactionButtonEnabled}
                  aria-label="Downvote"
                  title="Downvote"
                >
                  <DownvoteIcon active={userReactionTypes.has("DOWNVOTE")} />
                  <span>{reactionCounts.DOWNVOTE}</span>
                </button>

                {visibleEmojiCounts.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {visibleEmojiCounts.map(({ type, emoji, label }) => {
                      const active = userReactionTypes.has(type);

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            void handleEmojiClick(type);
                          }}
                          disabled={!reactionButtonEnabled}
                          aria-label={label}
                          title={label}
                          style={{
                            ...reactionButtonStyle(active),
                            padding: isTopLevel ? "2px 7px" : "1px 6px",
                            fontWeight: 500,
                          }}
                        >
                          <span>{emoji}</span>
                          <span>{reactionCounts[type]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <div ref={emojiPickerRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setEmojiPickerOpen((current) => !current)}
                  style={{
                    ...reactionButtonStyle(false),
                    padding: isTopLevel ? "4px" : "3px",
                    opacity: emojiTriggerVisible ? 1 : 0,
                    pointerEvents: emojiTriggerVisible ? "auto" : "none",
                    transition: "opacity 140ms ease",
                  }}
                  aria-label="Open emoji reactions"
                  title="Emoji reactions"
                >
                  <EmojiPickerIcon active={false} />
                </button>

                {emojiPickerOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: "calc(100% + 8px)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 20,
                      display: "flex",
                      gap: 6,
                      padding: 8,
                      borderRadius: 12,
                      border: "1px solid var(--border, #ddd)",
                      background: "#fff",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                  >
                    {EMOJI_REACTIONS.map(({ type, emoji, label }) => {
                      const active = userReactionTypes.has(type);

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            void handleEmojiClick(type);
                          }}
                          style={reactionButtonStyle(active)}
                          disabled={!reactionButtonEnabled}
                          aria-label={label}
                          title={label}
                        >
                          <span>{emoji}</span>
                          <span>{reactionCounts[type]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

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
