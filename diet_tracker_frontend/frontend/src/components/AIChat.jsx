import { useState } from "react";
import { useAuthStore } from "../store/authStore";

const QUICK_QUESTIONS = [
  "What should I eat for dinner?",
  "Am I hitting my nutrition goals?",
  "What nutrients am I missing?",
  "Suggest a healthy snack",
];

export default function AIChat() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(question) {
    const q = question || input;
    if (!q.trim()) return;

    // add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: q,
      },
    ]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:5001/nutrition/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          question: q,
        }),
      });
      const data = await response.json();

      // add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.answer,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Sorry, I could not get a response. Please try again!",
        },
      ]);
    }
    setLoading(false);
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="row gap-3 mb-3">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--cyan-tint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          🤖
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            AI Nutrition Coach
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Powered by Gemini AI + Your Data
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length === 0 && (
        <div className="col gap-2 mb-3">
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Quick questions:
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  padding: "6px 12px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  color: "var(--text)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          maxHeight: 350,
          overflowY: "auto",
          marginBottom: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 13,
              padding: 20,
            }}
          >
            Ask me anything about your nutrition! 🥗
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "ai" && (
              <div
                style={{
                  marginRight: 8,
                  fontSize: 18,
                  alignSelf: "flex-end",
                }}
              >
                🤖
              </div>
            )}
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius:
                  msg.role === "user"
                    ? "12px 12px 4px 12px"
                    : "12px 12px 12px 4px",
                fontSize: 13,
                lineHeight: 1.6,
                background:
                  msg.role === "user" ? "var(--cyan)" : "var(--surface-2)",
                color: msg.role === "user" ? "#0d0f14" : "var(--text)",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.text}
            </div>
            {msg.role === "user" && (
              <div
                style={{
                  marginLeft: 8,
                  fontSize: 18,
                  alignSelf: "flex-end",
                }}
              >
                👤
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ fontSize: 18 }}>🤖</div>
            <div
              style={{
                padding: "10px 14px",
                background: "var(--surface-2)",
                borderRadius: "12px 12px 12px 4px",
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Thinking... 🤔
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="row gap-2">
        <input
          className="input flex-1"
          placeholder="Ask about your nutrition..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          ➤
        </button>
      </div>

      {/* Clear button */}
      {messages.length > 0 && (
        <button
          onClick={() => setMessages([])}
          style={{
            marginTop: 8,
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Clear conversation
        </button>
      )}
    </div>
  );
}
