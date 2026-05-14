import { useEffect, useState } from "react";
import { Message } from "@/app/forums/MessageCard";

type UseMessagesOptions = Readonly<{
  readingId?: string;
}>;

const MESSAGE_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedMessages = {
  ts: number;
  data: Message[];
};

function cacheKey(readingId?: string): string {
  return `forum:messages:${readingId ?? "ALL"}`;
}

function readCachedMessages(readingId?: string): Message[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(cacheKey(readingId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachedMessages;
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.ts !== "number") {
      return null;
    }
    if (Date.now() - parsed.ts > MESSAGE_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(cacheKey(readingId));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedMessages(readingId: string | undefined, messages: Message[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: CachedMessages = { ts: Date.now(), data: messages };
    window.sessionStorage.setItem(cacheKey(readingId), JSON.stringify(payload));
  } catch {
    // no-op
  }
}

export function useMessages({ readingId }: UseMessagesOptions = {}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    setError(null);
    
    let url = "/api/messages";
    if (readingId) {
      url += `?readingId=${encodeURIComponent(readingId)}`;
    }
    
    if (!force) {
      const cached = readCachedMessages(readingId);
      if (cached) {
        setMessages(cached);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const detail = (await res.text()).trim();
        const suffix = detail ? ` - ${detail.slice(0, 240)}` : "";
        throw new Error(`GET ${url} failed: HTTP ${res.status}${suffix}`);
      }
      const data: unknown = await res.json();
      const allMessages = Array.isArray(data) ? data : [];
      const topLevelMessages = allMessages.filter((m: Message) => !m.parentId);
      setMessages(topLevelMessages);
      writeCachedMessages(readingId, topLevelMessages);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("failed to fetch")) {
        setError(`GET ${url} failed before response (network/proxy/backend unreachable).`);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [readingId]);

  return { messages, loading, error, load };
}
