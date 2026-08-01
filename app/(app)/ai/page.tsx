"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles } from "lucide-react";
import posthog from "posthog-js";
import { apiFetch } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Can I afford to eat out this weekend?",
  "Where am I overspending?",
  "Give me a savings tip 💡",
  "How's my July budget?",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! 👋 I'm your GenZPocket AI — your no-BS money friend. Ask me anything about your spending, budget, or savings goals!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiFetch("/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversation_id: convId }),
      });
      if (!res.ok) throw new Error("AI unavailable");
      const data = await res.json();
      posthog.capture("ai_message_sent", {
        conversation_started: convId === null,
      });
      setConvId(data.conversation_id);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops, I had trouble connecting. Try again in a sec? 🔧" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-zone" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        padding: "var(--space-2) var(--space-3)",
        borderBottom: "2px solid var(--charcoal-grey)",
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <div style={{
          width: 36, height: 36,
          background: "var(--lilac-pop)", border: "2px solid var(--lilac-pop)",
          borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "2px 2px 0 var(--lilac-pop)",
        }}>
          <Bot size={20} color="var(--ink-black)" strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--paper-white)", lineHeight: 1 }}>
            AI Adviser
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--lilac-pop)", fontFamily: "var(--font-mono)" }}>
            online · gpt-4o-mini
          </p>
        </div>
      </div>

      {/* Quick prompts */}
      <div style={{ padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid #1a1a1a", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            style={{
              background: "transparent", border: "1.5px solid var(--charcoal-grey)",
              borderRadius: "var(--radius)", padding: "0.3rem 0.625rem",
              color: "var(--charcoal-grey)", fontFamily: "var(--font-body)", fontSize: "0.75rem",
              cursor: "pointer", transition: "all var(--duration-fast)",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--lilac-pop)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--lilac-pop)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--charcoal-grey)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--charcoal-grey)";
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingBottom: "7rem" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <span style={{ marginRight: "0.5rem", marginTop: "0.25rem", flexShrink: 0 }}>
                <Sparkles size={14} color="var(--lilac-pop)" />
              </span>
            )}
            <div className={msg.role === "user" ? "ai-bubble-user" : "ai-bubble-assistant"}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div className="ai-bubble-assistant" style={{ color: "var(--charcoal-grey)" }}>
              thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="ai-input-bar" style={{ position: "fixed", bottom: "4rem", left: 0, right: 0, maxWidth: "480px", margin: "0 auto" }}>
        <input
          id="ai-chat-input"
          className="ai-input"
          placeholder="Ask anything about your money..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          style={{ padding: "0.75rem", flexShrink: 0, minWidth: "unset" }}
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          id="btn-ai-send"
          aria-label="Send message"
        >
          <Send size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
