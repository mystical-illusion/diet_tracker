// import { useState } from "react";
// import { useAuthStore } from "../store/authStore";

// const QUICK_QUESTIONS = [
//   "What should I eat for dinner?",
//   "Am I hitting my nutrition goals?",
//   "What nutrients am I missing?",
//   "Suggest a healthy snack",
// ];

// export default function AIChat() {
//   const { user } = useAuthStore();
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function sendMessage(question) {
//     const q = question || input;
//     if (!q.trim()) return;

//     // add user message
//     setMessages((prev) => [
//       ...prev,
//       {
//         role: "user",
//         text: q,
//       },
//     ]);
//     setInput("");
//     setLoading(true);

//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch("http://127.0.0.1:5001/nutrition/ai-chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           user_id: user?.id,
//           question: q,
//         }),
//       });
//       const data = await response.json();

//       // add AI response
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "ai",
//           text: data.answer,
//         },
//       ]);
//     } catch {
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "ai",
//           text: "Sorry, I could not get a response. Please try again!",
//         },
//       ]);
//     }
//     setLoading(false);
//   }

//   return (
//     <div className="card">
//       {/* Header */}
//       <div className="row gap-3 mb-3">
//         <div
//           style={{
//             width: 36,
//             height: 36,
//             borderRadius: 8,
//             background: "var(--cyan-tint)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontSize: 18,
//           }}
//         >
//           🤖
//         </div>
//         <div>
//           <div style={{ fontWeight: 600, fontSize: 14 }}>
//             AI Nutrition Coach
//           </div>
//           <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
//             Powered by Gemini AI + Your Data
//           </div>
//         </div>
//       </div>

//       {/* Quick Questions */}
//       {messages.length === 0 && (
//         <div className="col gap-2 mb-3">
//           <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
//             Quick questions:
//           </div>
//           <div
//             style={{
//               display: "flex",
//               flexWrap: "wrap",
//               gap: 8,
//             }}
//           >
//             {QUICK_QUESTIONS.map((q) => (
//               <button
//                 key={q}
//                 onClick={() => sendMessage(q)}
//                 style={{
//                   padding: "6px 12px",
//                   background: "var(--surface-2)",
//                   border: "1px solid var(--border)",
//                   borderRadius: 20,
//                   fontSize: 12,
//                   cursor: "pointer",
//                   color: "var(--text)",
//                 }}
//               >
//                 {q}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Messages */}
//       <div
//         style={{
//           maxHeight: 350,
//           overflowY: "auto",
//           marginBottom: 12,
//           display: "flex",
//           flexDirection: "column",
//           gap: 12,
//         }}
//       >
//         {messages.length === 0 && (
//           <div
//             style={{
//               textAlign: "center",
//               color: "var(--text-muted)",
//               fontSize: 13,
//               padding: 20,
//             }}
//           >
//             Ask me anything about your nutrition! 🥗
//           </div>
//         )}

//         {messages.map((msg, i) => (
//           <div
//             key={i}
//             style={{
//               display: "flex",
//               justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
//             }}
//           >
//             {msg.role === "ai" && (
//               <div
//                 style={{
//                   marginRight: 8,
//                   fontSize: 18,
//                   alignSelf: "flex-end",
//                 }}
//               >
//                 🤖
//               </div>
//             )}
//             <div
//               style={{
//                 maxWidth: "80%",
//                 padding: "10px 14px",
//                 borderRadius:
//                   msg.role === "user"
//                     ? "12px 12px 4px 12px"
//                     : "12px 12px 12px 4px",
//                 fontSize: 13,
//                 lineHeight: 1.6,
//                 background:
//                   msg.role === "user" ? "var(--cyan)" : "var(--surface-2)",
//                 color: msg.role === "user" ? "#0d0f14" : "var(--text)",
//                 whiteSpace: "pre-wrap",
//               }}
//             >
//               {msg.text}
//             </div>
//             {msg.role === "user" && (
//               <div
//                 style={{
//                   marginLeft: 8,
//                   fontSize: 18,
//                   alignSelf: "flex-end",
//                 }}
//               >
//                 👤
//               </div>
//             )}
//           </div>
//         ))}

//         {loading && (
//           <div style={{ display: "flex", gap: 8 }}>
//             <div style={{ fontSize: 18 }}>🤖</div>
//             <div
//               style={{
//                 padding: "10px 14px",
//                 background: "var(--surface-2)",
//                 borderRadius: "12px 12px 12px 4px",
//                 fontSize: 13,
//                 color: "var(--text-muted)",
//               }}
//             >
//               Thinking... 🤔
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Input */}
//       <div className="row gap-2">
//         <input
//           className="input flex-1"
//           placeholder="Ask about your nutrition..."
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//           disabled={loading}
//         />
//         <button
//           className="btn btn-primary"
//           onClick={() => sendMessage()}
//           disabled={loading || !input.trim()}
//         >
//           ➤
//         </button>
//       </div>

//       {/* Clear button */}
//       {messages.length > 0 && (
//         <button
//           onClick={() => setMessages([])}
//           style={{
//             marginTop: 8,
//             background: "none",
//             border: "none",
//             color: "var(--text-muted)",
//             fontSize: 12,
//             cursor: "pointer",
//           }}
//         >
//           Clear conversation
//         </button>
//       )}
//     </div>
//   );
// }

import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function AIChat() {
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: `Hi ${user?.username || "there"}! 👋 I'm your AI Nutrition Coach. Ask me anything about your meals, calorie goals, or healthy recipes!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const newUserMsg = { id: Date.now(), sender: "user", text: userText };

    // Update conversation UI immediately
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/nutrition/ai-chat", {
        question: userText,
        history: messages,
        user_id: user?.id,
      });

      const botReply =
        response.data.answer || "I'm here to help with your nutrition goals!";
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: botReply },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Sorry, I had trouble connecting to the coach service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        background: "var(--surface-2, #15151e)",
        padding: "16px",
        borderRadius: "10px",
        marginTop: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "20px" }}>🤖</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#fff" }}>
            AI Nutrition Coach
          </div>
          <div style={{ fontSize: "11px", color: "var(--cyan, #00d2ff)" }}>
            Powered by Gemini AI + Your Data
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        style={{
          height: "240px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "10px",
          background: "#0f172a",
          borderRadius: "8px",
          border: "1px solid #334155",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              lineHeight: 1.4,
              background:
                m.sender === "user" ? "var(--cyan, #00d2ff)" : "#1e293b",
              color: m.sender === "user" ? "#000" : "#fff",
              fontWeight: m.sender === "user" ? "500" : "400",
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        style={{ display: "flex", gap: "8px", marginTop: "10px" }}
      >
        <input
          type="text"
          placeholder="Ask about your calories, protein, or diet..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "6px",
            background: "#0f172a",
            border: "1px solid #334155",
            color: "#fff",
            fontSize: "13px",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            background: "var(--cyan, #00d2ff)",
            color: "#000",
            fontWeight: "bold",
            border: "none",
            cursor: !input.trim() || loading ? "not-allowed" : "pointer",
            opacity: !input.trim() || loading ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
