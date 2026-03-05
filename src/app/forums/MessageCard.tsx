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

type MessageCardProps = Readonly<{
  message: Message;
  depth?: number;
  onReload: () => void;
  onError: (err: string) => void;
}>;

type IconProps = Readonly<{ active: boolean }>;

type EmojiReactionDescriptor = Readonly<{
  type: EmojiReactionType;
  emoji: string;
  label: string;
}>;

type ReactionCounts = Record<ReactionType, number>;
type SubmitEvent = React.FormEvent | undefined;

const USER_ID_STORAGE_KEY = "forum-user-id";
const ACTIVE_REACTION_COLOR = "#f97316";

const EMOJI_REACTIONS: EmojiReactionDescriptor[] = [
  { type: "FIRE", emoji: "🔥", label: "Fire" },
  { type: "ROCKET", emoji: "🚀", label: "Rocket" },
  { type: "LAUGH", emoji: "😂", label: "Laugh" },
  { type: "PARTY", emoji: "🎉", label: "Party" },
  { type: "THINKING", emoji: "🤔", label: "Thinking" },
];

function createAnonymousUserId(): string {
  const browserWindow = globalThis.window;
  if (browserWindow === undefined) {
    throw new Error("createAnonymousUserId must run in a browser context");
  }

  const existing = browserWindow.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = globalThis.crypto.randomUUID();
  browserWindow.localStorage.setItem(USER_ID_STORAGE_KEY, generated);
  return generated;
}

function buildReactionCounts(reactions: Reaction[]): ReactionCounts {
  const counts: ReactionCounts = {
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
}

async function fetchMessageReactions(messageId: string): Promise<Reaction[]> {
  const res = await fetch(`/api/messages/${messageId}/reactions`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Reaction load failed: ${res.status} ${await res.text()}`);
  }

  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as Reaction[]) : [];
}

async function sendReactionMutation(
  messageId: string,
  userId: string,
  reactionType: ReactionType,
  method: "POST" | "DELETE"
): Promise<void> {
  const res = await fetch(`/api/messages/${messageId}/reactions`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, reactionType }),
  });

  if (method === "POST" && !res.ok && res.status !== 409) {
    throw new Error(`Add reaction failed: ${res.status} ${await res.text()}`);
  }

  if (method === "DELETE" && !res.ok && res.status !== 404) {
    throw new Error(`Remove reaction failed: ${res.status} ${await res.text()}`);
  }
}

function getMessageEndpoint(message: Message, isTopLevel: boolean): string {
  return isTopLevel
    ? `/api/messages/${message.id}`
    : `/api/messages/${message.parentId}/replies/${message.id}`;
}

async function createReplyRequest(messageId: string, content: string): Promise<void> {
  const res = await fetch(`/api/messages/${messageId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    throw new Error(`Reply failed: ${res.status} ${await res.text()}`);
  }
}

async function updateMessageRequest(endpoint: string, content: string): Promise<void> {
  const res = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    throw new Error(`Update failed: ${res.status} ${await res.text()}`);
  }
}

async function deleteMessageRequest(endpoint: string): Promise<void> {
  const res = await fetch(endpoint, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`Delete failed: ${res.status} ${await res.text()}`);
  }
}

function useMessageComposer(params: Readonly<{
  message: Message;
  isTopLevel: boolean;
  onReload: () => void;
  onError: (err: string) => void;
}>) {
  const { message, isTopLevel, onReload, onError } = params;
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [collapsed, setCollapsed] = useState(false);

  const runWithErrorHandling = async (operation: () => Promise<void>) => {
    try {
      await operation();
    } catch (err) {
      onError(String(err));
    }
  };

  const createReply = (event?: SubmitEvent) => {
    event?.preventDefault();
    void runWithErrorHandling(async () => {
      await createReplyRequest(message.id, replyContent);
      setReplyContent("");
      setShowReplyForm(false);
      onReload();
    });
  };

  const updateMessage = (event?: SubmitEvent) => {
    event?.preventDefault();
    const endpoint = getMessageEndpoint(message, isTopLevel);
    void runWithErrorHandling(async () => {
      await updateMessageRequest(endpoint, editContent);
      setEditing(false);
      onReload();
    });
  };

  const deleteMessage = () => {
    const confirmMsg = isTopLevel ? "Delete this message?" : "Delete this reply?";
    if (!confirm(confirmMsg)) {
      return;
    }

    const endpoint = getMessageEndpoint(message, isTopLevel);
    void runWithErrorHandling(async () => {
      await deleteMessageRequest(endpoint);
      onReload();
    });
  };

  const beginEditing = () => {
    setEditing(true);
    setEditContent(message.content);
  };

  const cancelReply = () => {
    setShowReplyForm(false);
    setReplyContent("");
  };

  return {
    showReplyForm,
    setShowReplyForm,
    replyContent,
    setReplyContent,
    editing,
    setEditing,
    editContent,
    setEditContent,
    collapsed,
    setCollapsed,
    createReply,
    updateMessage,
    deleteMessage,
    beginEditing,
    cancelReply,
  };
}

function useMessageReactions(messageId: string, onError: (err: string) => void) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setUserId(createAnonymousUserId());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const next = await fetchMessageReactions(messageId);
        if (!cancelled) {
          setReactions(next);
        }
      } catch (err) {
        if (!cancelled) {
          onError(String(err));
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [messageId, onError]);

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

  const reactionCounts = useMemo(() => buildReactionCounts(reactions), [reactions]);

  const visibleEmojiCounts = useMemo(
    () => EMOJI_REACTIONS.filter(({ type }) => reactionCounts[type] > 0),
    [reactionCounts]
  );

  const reactionButtonEnabled = Boolean(userId) && !reactionBusy;

  const handleReactionClick = async (reactionType: ReactionType) => {
    if (!userId || reactionBusy) {
      return;
    }

    setReactionBusy(true);
    try {
      const method = userReactionTypes.has(reactionType) ? "DELETE" : "POST";
      await sendReactionMutation(messageId, userId, reactionType, method);
      setReactions(await fetchMessageReactions(messageId));
    } catch (err) {
      onError(String(err));
    } finally {
      setReactionBusy(false);
    }
  };

  return {
    emojiPickerOpen,
    setEmojiPickerOpen,
    emojiPickerRef,
    reactionCounts,
    userReactionTypes,
    visibleEmojiCounts,
    reactionButtonEnabled,
    handleReactionClick,
  };
}

function UpvoteIcon({ active }: IconProps) {
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

function DownvoteIcon({ active }: IconProps) {
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

function EmojiPickerIcon({ active }: IconProps) {
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
}: Readonly<MessageCardProps>) {
  const isTopLevel = depth === 0;
  const hasReplies = message.replies && message.replies.length > 0;
  const replyCount = message.replies?.length || 0;
  const maxIndent = 10;

  const {
    showReplyForm,
    setShowReplyForm,
    replyContent,
    setReplyContent,
    editing,
    setEditing,
    editContent,
    setEditContent,
    collapsed,
    setCollapsed,
    createReply,
    updateMessage,
    deleteMessage,
    beginEditing,
    cancelReply,
  } = useMessageComposer({ message, isTopLevel, onReload, onError });

  const {
    emojiPickerOpen,
    setEmojiPickerOpen,
    emojiPickerRef,
    reactionCounts,
    userReactionTypes,
    visibleEmojiCounts,
    reactionButtonEnabled,
    handleReactionClick,
  } = useMessageReactions(message.id, onError);

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

  return (
    <div style={containerStyle}>
      <div className={`${isTopLevel ? "card " : ""}message-card`} style={cardStyle}>
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
                    void handleReactionClick("UPVOTE");
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
                    void handleReactionClick("DOWNVOTE");
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
                            void handleReactionClick(type);
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
                  className={`emoji-trigger ${emojiPickerOpen ? "emoji-trigger-open" : ""}`}
                  style={{
                    ...reactionButtonStyle(false),
                    padding: isTopLevel ? "4px" : "3px",
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
                            void handleReactionClick(type);
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
                  beginEditing();
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
                onClick={cancelReply}
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
