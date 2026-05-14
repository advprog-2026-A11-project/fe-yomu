"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/auth-headers";

export type Message = {
  id: string;
  content: string;
  createdAt?: string | null;
  replies?: Message[];
  parentId?: string | null;
  userId?: string;
  replyCount?: number;
  reactions?: Reaction[];
  reactionCounts?: Partial<Record<ReactionType, number>>;
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
  onReload: () => Promise<void>;
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

const ACTIVE_REACTION_COLOR = "#f97316";
const EXCLUSIVE_REACTION_GROUPS: ReactionType[][] = [["UPVOTE", "DOWNVOTE"]];

const EMOJI_REACTIONS: EmojiReactionDescriptor[] = [
  { type: "FIRE", emoji: "🔥", label: "Fire" },
  { type: "ROCKET", emoji: "🚀", label: "Rocket" },
  { type: "LAUGH", emoji: "😂", label: "Laugh" },
  { type: "PARTY", emoji: "🎉", label: "Party" },
  { type: "THINKING", emoji: "🤔", label: "Thinking" },
];

async function buildDetailedFetchError(response: Response, context: string): Promise<Error> {
  const detail = (await response.text()).trim();
  const suffix = detail ? ` - ${detail.slice(0, 240)}` : "";
  return new Error(`${context} failed: HTTP ${response.status}${suffix}`);
}

function buildNetworkFetchError(error: unknown, context: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("failed to fetch")) {
    return new Error(
      `${context} failed before response (network/proxy/backend unreachable).`
    );
  }
  return new Error(`${context} failed: ${message}`);
}

async function fetchRepliesRequest(messageId: string): Promise<Message[]> {
  const endpoint = `/api/messages/${messageId}/replies`;
  let res: Response;
  try {
    res = await fetch(endpoint, { cache: "no-store" });
  } catch (error) {
    throw buildNetworkFetchError(error, `GET ${endpoint}`);
  }
  if (!res.ok) {
    throw await buildDetailedFetchError(res, `GET ${endpoint}`);
  }
  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as Message[]) : [];
}

function emptyReactionCounts(): ReactionCounts {
  return {
    UPVOTE: 0,
    DOWNVOTE: 0,
    FIRE: 0,
    ROCKET: 0,
    LAUGH: 0,
    PARTY: 0,
    THINKING: 0,
  };
}

async function sendReactionMutation(
  messageId: string,
  reactionType: ReactionType,
  method: "POST" | "DELETE"
): Promise<void> {
  const endpoint = `/api/messages/${messageId}/reactions`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ reactionType }),
    });
  } catch (error) {
    throw buildNetworkFetchError(error, `${method} ${endpoint}`);
  }

  if (method === "POST" && !res.ok && res.status !== 409) {
    throw await buildDetailedFetchError(
      res,
      `${method} /api/messages/${messageId}/reactions`
    );
  }

  if (method === "DELETE" && !res.ok && res.status !== 404) {
    throw await buildDetailedFetchError(
      res,
      `${method} /api/messages/${messageId}/reactions`
    );
  }
}

function getMessageEndpoint(message: Message, isTopLevel: boolean): string {
  return isTopLevel
    ? `/api/messages/${message.id}`
    : `/api/messages/${message.parentId}/replies/${message.id}`;
}

async function createReplyRequest(messageId: string, content: string): Promise<void> {
  const endpoint = `/api/messages/${messageId}/replies`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    throw buildNetworkFetchError(error, `POST ${endpoint}`);
  }
  if (!res.ok) {
    throw await buildDetailedFetchError(res, `POST ${endpoint}`);
  }
}

async function updateMessageRequest(endpoint: string, content: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    throw buildNetworkFetchError(error, `PUT ${endpoint}`);
  }
  if (!res.ok) {
    throw await buildDetailedFetchError(res, `PUT ${endpoint}`);
  }
}

async function deleteMessageRequest(endpoint: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    throw buildNetworkFetchError(error, `DELETE ${endpoint}`);
  }
  if (!res.ok) {
    throw await buildDetailedFetchError(res, `DELETE ${endpoint}`);
  }
}

function useMessageComposer(params: Readonly<{
  message: Message;
  isTopLevel: boolean;
  onReload: () => Promise<void>;
  onError: (err: string) => void;
}>) {
  const { message, isTopLevel, onReload, onError } = params;
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [collapsed, setCollapsed] = useState(true);

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
      await onReload();
    });
  };

  const updateMessage = (event?: SubmitEvent) => {
    event?.preventDefault();
    const endpoint = getMessageEndpoint(message, isTopLevel);
    void runWithErrorHandling(async () => {
      await updateMessageRequest(endpoint, editContent);
      setEditing(false);
      await onReload();
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
      await onReload();
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
  const [loadedReplies, setLoadedReplies] = useState<Message[] | null>(message.replies ?? null);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const replyCount = loadedReplies?.length ?? message.replyCount ?? 0;
  const maxIndent = 10;

  const { session, isAdmin, isAuthenticated } = useAuth();
  const currentUserId = session?.profile?.id;

  const canEdit = currentUserId === message.userId;
  const canDelete = isAdmin || currentUserId === message.userId;
  const [reactionBusy, setReactionBusy] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

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

  const initialReactionCounts: ReactionCounts = useMemo(
    () => ({
      ...emptyReactionCounts(),
      ...(message.reactionCounts ?? {}),
    }),
    [message.reactionCounts]
  );
  const initialUserReactionTypes = useMemo(
    () =>
      new Set(
        (message.reactions ?? [])
          .filter((reaction) => reaction.userId === currentUserId)
          .map((reaction) => reaction.reactionType)
      ),
    [message.reactions, currentUserId]
  );
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>(initialReactionCounts);
  const [userReactionTypes, setUserReactionTypes] = useState<Set<ReactionType>>(initialUserReactionTypes);

  useEffect(() => {
    setReactionCounts(initialReactionCounts);
    setUserReactionTypes(initialUserReactionTypes);
  }, [initialReactionCounts, initialUserReactionTypes]);
  const visibleEmojiCounts = useMemo(
    () => EMOJI_REACTIONS.filter(({ type }) => reactionCounts[type] > 0),
    [reactionCounts]
  );
  const reactionButtonEnabled = isAuthenticated && !reactionBusy;

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

  const handleReactionClick = async (reactionType: ReactionType) => {
    if (!isAuthenticated || reactionBusy) {
      return;
    }

    setReactionBusy(true);
    const currentlyActive = userReactionTypes.has(reactionType);
    const method: "POST" | "DELETE" = currentlyActive ? "DELETE" : "POST";
    const prevCounts = reactionCounts;
    const prevUserTypes = userReactionTypes;

    // Optimistic UI update: avoid full message list refetch for reaction toggles.
    const nextCounts: ReactionCounts = {
      ...reactionCounts,
      [reactionType]: Math.max(
        0,
        reactionCounts[reactionType] + (method === "POST" ? 1 : -1)
      ),
    };
    const nextUserTypes = new Set(userReactionTypes);
    if (method === "POST") {
      // Mirror backend exclusive behavior (currently UPVOTE vs DOWNVOTE).
      const exclusiveGroup = EXCLUSIVE_REACTION_GROUPS.find((group) => group.includes(reactionType));
      if (exclusiveGroup) {
        for (const conflictType of exclusiveGroup) {
          if (conflictType !== reactionType && nextUserTypes.has(conflictType)) {
            nextUserTypes.delete(conflictType);
            nextCounts[conflictType] = Math.max(0, nextCounts[conflictType] - 1);
          }
        }
      }
      nextUserTypes.add(reactionType);
    } else {
      nextUserTypes.delete(reactionType);
    }
    setReactionCounts(nextCounts);
    setUserReactionTypes(nextUserTypes);

    try {
      await sendReactionMutation(message.id, reactionType, method);
    } catch (err) {
      // Roll back optimistic state if request fails.
      setReactionCounts(prevCounts);
      setUserReactionTypes(prevUserTypes);
      onError(String(err));
    } finally {
      setReactionBusy(false);
    }
  };

  useEffect(() => {
    setLoadedReplies(message.replies ?? null);
  }, [message.id, message.replies]);

  const toggleReplies = async () => {
    if (collapsed) {
      if (loadedReplies == null) {
        setLoadingReplies(true);
        try {
          const replies = await fetchRepliesRequest(message.id);
          setLoadedReplies(replies);
        } catch (err) {
          onError(String(err));
          setLoadingReplies(false);
          return;
        } finally {
          setLoadingReplies(false);
        }
      }
      setCollapsed(false);
      return;
    }
    setCollapsed(true);
  };

  const reloadRepliesForCurrentMessage = async () => {
    if (loadedReplies == null) {
      return;
    }
    const replies = await fetchRepliesRequest(message.id);
    setLoadedReplies(replies);
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
                title="Reply to this message"
              >
                Reply
              </button>
              {canEdit && (
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
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={deleteMessage}
                  className="btn-danger"
                  style={{ fontSize: smallFontSize, padding: buttonPadding }}
                >
                  Delete
                </button>
              )}
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

        <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => {
                void toggleReplies();
              }}
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
              {loadingReplies ? "Loading replies..." : `${replyCount} ${replyCount === 1 ? "Reply" : "Replies"}`}
            </button>
            {!collapsed && (
              <div style={{ marginTop: 8 }}>
                {loadedReplies && loadedReplies.length > 0 ? (
                  loadedReplies.map((reply) => (
                    <MessageCard
                      key={reply.id}
                      message={{ ...reply, parentId: message.id }}
                      depth={depth + 1}
                      onReload={async () => {
                        await onReload();
                        await reloadRepliesForCurrentMessage();
                      }}
                      onError={onError}
                    />
                  ))
                ) : (
                  <div style={{ fontSize: smallFontSize, color: "var(--text-muted, #666)" }}>
                    No replies yet.
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
