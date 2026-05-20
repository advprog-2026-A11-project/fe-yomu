"use client";

import { useState } from "react";
import { MessageCard, Message } from "@/app/forums/MessageCard";
import { useAuth } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/auth-headers";
import { useMessages } from "@/app/hooks/useMessages";

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
    <section className="mt-16 pt-12 border-t border-gray-200">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Discussion Forum</h2>
        {isAuthenticated && (
          <div>
            {!showCreate ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Post a question
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setFormContent("");
                  setError(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <form onSubmit={createMessage} className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your question or comment
            </label>
            <textarea
              required
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Share your thoughts, questions, or insights about this reading..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating || !formContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading discussions...</p>
        </div>
      )}

      {!loading && messages && messages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No discussions yet. Be the first to ask a question!</p>
        </div>
      )}

      {messages && messages.length > 0 && (
        <div className="space-y-4">
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
    </section>
  );
}
