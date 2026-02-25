"use client";

import { useState, useEffect } from "react";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

export default function ConversationPage() {
  const [email, setEmail] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (id: number) => {
    try {
      const res = await fetch(`/api/conversations/${id}/history`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m: { id: number; role: string; content: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })));
      }
    } catch {
      setMessages([]);
    }
  };

  const startConversation = async () => {
    setError(null);
    if (!email.trim()) return;
    try {
      const res = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to start");
        return;
      }
      setConversationId(json.conversationId);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    }
  };

  const resumeLatest = async () => {
    setError(null);
    if (!email.trim()) return;
    try {
      const res = await fetch(`/api/conversations/latest?email=${encodeURIComponent(email.trim())}`);
      const json = await res.json();
      if (res.ok && json.conversationId) {
        setConversationId(json.conversationId);
        await loadHistory(json.conversationId);
      } else {
        setError("No previous conversation. Start a new one.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume");
    }
  };

  useEffect(() => {
    if (conversationId) loadHistory(conversationId);
  }, [conversationId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !conversationId || streaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);
    setStreamBuffer("");
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to send");
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("No response body");
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamBuffer(fullText);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
      setStreamBuffer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-neutral-900">
          SERGENT — Career Advisor
        </h1>

        {!conversationId ? (
          <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Your email (must have completed onboarding)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={startConversation}
                className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Start new conversation
              </button>
              <button
                onClick={resumeLatest}
                className="rounded-md border border-neutral-300 px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Resume latest
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
              Conversation #{conversationId} — Chat with SERGENT about your phase and evidence.
            </div>

            <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              {messages.map((m, i) => (
                <div
                  key={m.id ?? i}
                  className={`rounded-lg p-3 ${
                    m.role === "user"
                      ? "ml-8 bg-blue-50 text-blue-900"
                      : "mr-8 bg-neutral-100 text-neutral-900"
                  }`}
                >
                  <span className="text-xs font-medium opacity-70">
                    {m.role === "user" ? "You" : "SERGENT"}
                  </span>
                  <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {streaming && streamBuffer && (
                <div className="mr-8 rounded-lg bg-neutral-100 p-3">
                  <span className="text-xs font-medium opacity-70">SERGENT</span>
                  <p className="mt-1 whitespace-pre-wrap">{streamBuffer}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="mt-4 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask SERGENT anything..."
                disabled={streaming}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {streaming ? "..." : "Send"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
