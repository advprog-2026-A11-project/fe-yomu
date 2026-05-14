import { useEffect, useState } from "react";
import { Message } from "@/app/forums/MessageCard";

type UseMessagesOptions = Readonly<{
  readingId?: string;
}>;

export function useMessages({ readingId }: UseMessagesOptions = {}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    
    let url = "/api/messages";
    if (readingId) {
      url += `?readingId=${encodeURIComponent(readingId)}`;
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
