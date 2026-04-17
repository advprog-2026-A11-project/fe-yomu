import { useEffect, useState } from "react";
import { Message } from "@/app/forums/MessageCard";

type UseMessagesOptions = Readonly<{
  readingId?: string;
}>;

export function useMessages({ readingId }: UseMessagesOptions = {}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    
    let url = "/api/messages";
    if (readingId) {
      url += `?readingId=${encodeURIComponent(readingId)}`;
    }
    
    fetch(url, { cache: "no-store" })
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
  }, [readingId]);

  return { messages, loading, error, load };
}
