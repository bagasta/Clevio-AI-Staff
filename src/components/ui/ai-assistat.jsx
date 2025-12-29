"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Trash2, AlertCircle, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

const INITIAL_GREETING =
  "Hai! Mohon bantu saya menyesuaikan template ini dengan kebutuhan saya.";

const getInitCache = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!window.__aiAssistInitCache) {
    window.__aiAssistInitCache = new Map();
  }

  return window.__aiAssistInitCache;
};

const MESSAGE_FIELD_PICKERS = [
  (data) => data?.output,
  (data) => data?.message,
  (data) => data?.response,
  (data) => data?.text,
  (data) => data?.data?.output,
  (data) => data?.data?.message,
  (data) => data?.ai_response,
  (data) => data?.aiResponse,
  (data) => data?.content,
];

const toDisplayString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value) || typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      console.warn("[AiAssistat] Failed to stringify message value:", err);
      return String(value);
    }
  }

  return String(value);
};

const extractMessageText = (data, fallback = "") => {
  for (const picker of MESSAGE_FIELD_PICKERS) {
    const candidate = picker(data);
    if (candidate !== undefined && candidate !== null) {
      const text = toDisplayString(candidate);
      if (text.trim() !== "") {
        return text;
      }
    }
  }

  return fallback;
};

const safeParseJson = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.length) {
    return null;
  }
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      console.warn("[AiAssistat] Unable to parse JSON string:", error);
    }
  }
  return null;
};

const normalizeAgentData = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return safeParseJson(value) ?? { summary: value };
  }
  if (typeof value === "object") {
    return value;
  }
  return null;
};

const pickAgentData = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (Array.isArray(payload)) {
    const [first] = payload;
    if (first && typeof first === "object") {
      const normalizedFirst = normalizeAgentData(first);
      if (normalizedFirst) return normalizedFirst;
    }

    const normalizedArray = normalizeAgentData(payload);
    if (normalizedArray) return normalizedArray;
  }

  const candidates = [
    payload.agent_data,
    payload.agentData,
    payload.agent,
    payload.data?.agent_data,
    payload.data?.agentData,
    payload.data?.agent,
    payload.response?.agent_data,
    payload.response?.agentData,
  ];

  if (payload.system_prompt || payload.google_tools || payload.mcp_tools) {
    candidates.unshift(payload);
  }
  for (const candidate of candidates) {
    const normalized = normalizeAgentData(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const detectCompletionStatus = (payload) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (Array.isArray(payload)) {
    return payload.length > 0;
  }
  const statusCandidates = [
    payload.status,
    payload.state,
    payload.result,
    payload.outcome,
    payload.data?.status,
    payload.data?.state,
    payload.data?.result,
    payload.data?.outcome,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  if (
    statusCandidates.some((value) =>
      ["completed", "complete", "done", "success", "finished"].includes(value),
    )
  ) {
    return true;
  }
  if (
    payload.success === true ||
    payload.completed === true ||
    payload.finished === true ||
    payload.data?.success === true ||
    payload.data?.completed === true
  ) {
    return true;
  }
  return Boolean(pickAgentData(payload));
};

const buildCompletionResult = (payload) => {
  const agentData = pickAgentData(payload);
  const isCompleted = detectCompletionStatus(payload) || Boolean(agentData);
  return {
    isCompleted,
    agentData: agentData || null,
  };
};


const AIMessageBar = ({
  title = "AI Assistant",
  description = "Chat with our AI assistant",
  webhookUrl,
  metadata = {},
  sessionId,
  onMessageReceived,
  onComplete,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(null);
  const initCompletedRef = useRef(false);
  const metadataRef = useRef(metadata ?? {});
  const messageCallbackRef = useRef(onMessageReceived);
  const completeCallbackRef = useRef(onComplete);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (textareaRef.current && input) {
      const target = textareaRef.current;
      target.style.height = 'auto';
      target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
    metadataRef.current = metadata ?? {};
  }, [metadata]);

  useEffect(() => {
    messageCallbackRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    completeCallbackRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!webhookUrl || !sessionId || !metadataRef.current) {
      console.warn("[AiAssistat] Missing required props");
      return;
    }

    const cache = getInitCache();
    const cached = cache?.get(sessionId);
    let cancelled = false;

    const applyResult = (result) => {
      if (cancelled) return;

      initCompletedRef.current = true;
      setError(null);
      setMessages(result.messages);
      setIsTyping(false);

      if (messageCallbackRef.current) {
        messageCallbackRef.current(result.data);
      }

      if (result.completionData && completeCallbackRef.current) {
        completeCallbackRef.current(result.completionData);
      }
    };

    const handleError = (err) => {
      if (cancelled) return;

      console.error("[AiAssistat] ❌ Initial message failed:", err);
      setError(err.message || "Failed to connect to AI assistant");
      setIsTyping(false);
    };

    if (cached?.result) {
      console.log(
        "[AiAssistat] ⚡ Using cached initial response for session:",
        sessionId
      );
      applyResult(cached.result);
      return;
    }

    setIsTyping(true);
    setError(null);

    const fetchPromise =
      cached?.promise ?? fetchInitialResponse(webhookUrl, sessionId);

    if (cached?.promise) {
      console.log(
        "[AiAssistat] ⏳ Waiting for in-flight initialization for session:",
        sessionId
      );
    }

    if (!cached?.promise && cache) {
      cache.set(sessionId, { promise: fetchPromise });
    }

    fetchPromise
      .then((result) => {
        if (cache) {
          cache.set(sessionId, { result });
        }
        console.log(
          "[AiAssistat] ✅ Initial response resolved for session:",
          sessionId
        );
        applyResult(result);
      })
      .catch((err) => {
        if (cache) {
          cache.delete(sessionId);
        }
        console.error(
          "[AiAssistat] ❌ Initial response failed for session:",
          sessionId,
          err
        );
        handleError(err);
      });

    return () => {
      cancelled = true;
    };
  }, [webhookUrl, sessionId]);

  const fetchInitialResponse = async (currentWebhookUrl, currentSessionId) => {
    const metadataSnapshot = metadataRef.current ?? {};
    const { session_id, ...cleanMetadata } = metadataSnapshot;

    const payload = {
      sessionId: currentSessionId,
      chatInput: INITIAL_GREETING,
      ...cleanMetadata,
    };

    console.log("[AiAssistat] 🚀 Sending initial message to:", currentWebhookUrl);
    console.log("[AiAssistat] 📦 Payload:", payload);

    const response = await fetch(currentWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("[AiAssistat] Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    console.log("[AiAssistat] Content-Type:", contentType);

    const responseClone = response.clone();
    const rawText = await responseClone.text();
    console.log("[AiAssistat] Raw response:", rawText);

    if (!rawText || rawText.trim() === "") {
      throw new Error("Empty response from n8n webhook");
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("[AiAssistat] JSON parse error:", parseError);
      throw new Error(`Invalid JSON: ${rawText.substring(0, 100)}`);
    }

    console.log("[AiAssistat] ✅ Initial response FULL:", data);

    const aiMessageText = extractMessageText(data);

    console.log("[AiAssistat] 💬 Extracted message:", aiMessageText);

    let initialMessage;

    if (aiMessageText) {
      initialMessage = {
        id: Date.now(),
        text: aiMessageText,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } else {
      console.warn("[AiAssistat] ⚠️ No message in response");
      initialMessage = {
        id: Date.now(),
        text: "Hi! I'm ready to help you customize this agent template. Let's get started!",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }

    const completion = buildCompletionResult(data);

    return {
      data,
      messages: [initialMessage],
      completionData: completion.isCompleted ? completion.agentData : undefined,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      console.log("[AiAssistat] 📤 Sending user message:", userMessage.text);

      // CRITICAL: Remove session_id from metadata
      const { session_id, ...cleanMetadata } = metadataRef.current || {};

      const payload = {
        sessionId, // ✅ Only camelCase
        chatInput: userMessage.text,
        ...cleanMetadata,
      };

      console.log("[AiAssistat] 📦 Payload:", payload);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("[AiAssistat] Response status:", response.status);
      console.log("[AiAssistat] Response headers:", response.headers);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // CRITICAL: Check if response has content
      const contentType = response.headers.get("content-type");
      console.log("[AiAssistat] Content-Type:", contentType);

      // Clone response to read text first
      const responseClone = response.clone();
      const rawText = await responseClone.text();
      console.log("[AiAssistat] Raw response text:", rawText);

      // Check if response is empty
      if (!rawText || rawText.trim() === "") {
        throw new Error("Empty response from n8n webhook");
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error("[AiAssistat] JSON parse error:", parseError);
        console.error("[AiAssistat] Invalid JSON:", rawText);
        throw new Error(
          `Invalid JSON response: ${rawText.substring(0, 100)}...`
        );
      }

      console.log("[AiAssistat] 📥 AI response:", data);
      const completion = buildCompletionResult(data);
      if (completion.isCompleted) {
        console.log(
          "[AiAssistat] 🧩 Extracted agent data:",
          completion.agentData
        );
      }

      const aiResponse = {
        id: Date.now() + 1,
        text: extractMessageText(data, "I received your message."),
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiResponse]);

      if (messageCallbackRef.current) {
        messageCallbackRef.current(data);
      }

      if (completion.isCompleted && completion.agentData) {
        console.log("[AiAssistat] 🎉 Interview completed!", completion.agentData);
        completeCallbackRef.current?.(completion.agentData);
      } else {
        console.log("[AiAssistat] ⏳ Waiting for final n8n payload…");
      }
    } catch (err) {
      console.error("[AiAssistat] ❌ Send message failed:", err);
      setError(err.message || "Failed to send message");

      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAF6F1]">
      {/* Header - Only show if title exists */}
      {title && (
        <div className="flex-shrink-0 border-b border-[#E0D4BC] bg-white/80 backdrop-blur-xl px-4 py-3">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E68A44]/10">
                <Bot className="h-4 w-4 text-[#E68A44]" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-[#2D2216] truncate">{title}</h2>
                {description && (
                  <p className="text-xs text-[#5D4037] hidden sm:block truncate">{description}</p>
                )}
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#5D4037] hover:bg-[#FAF6F1] transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 border-b border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 max-w-xl mx-auto">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Messages - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
        <div className="max-w-xl mx-auto space-y-3">
          {messages.length === 0 && !isTyping && (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="flex h-12 w-12 mx-auto mb-3 items-center justify-center rounded-xl bg-[#E68A44]/10">
                  <Bot className="h-6 w-6 text-[#E68A44]" />
                </div>
                <h3 className="text-base font-bold text-[#2D2216] mb-1">Ready to customize your agent</h3>
                <p className="text-[#5D4037] text-sm">I'll help you configure this template</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-end gap-2 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  message.sender === "user" ? "bg-[#2D2216] text-white" : "bg-[#E68A44]/10 text-[#E68A44]"
                }`}>
                  {message.sender === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.sender === "user"
                    ? "bg-[#2D2216] text-white rounded-br-sm"
                    : "bg-white border border-[#E0D4BC] text-[#2D2216] rounded-bl-sm"
                }`}>
                  {message.sender === "ai" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:text-[#2D2216] prose-strong:text-[#2D2216] prose-ul:my-1 prose-li:my-0 text-sm leading-relaxed">
                          <ReactMarkdown 
                            components={{
                                 a: ({node, ...props}) => <a className="text-[#E68A44] underline font-medium" target="_blank" {...props} />
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                      </div>
                  ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                  )}
                  <span className={`mt-1 block text-xs ${message.sender === "user" ? "text-white/60" : "text-[#5D4037]/60"}`}>
                    {message.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E68A44]/10 text-[#E68A44]">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-white border border-[#E0D4BC] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#5D4037] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#5D4037] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#5D4037] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-[#E0D4BC] bg-white p-2 sm:p-3">
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
          <div className={`flex items-end gap-2 rounded-xl border px-3 py-2 transition-all ${
            isFocused ? "border-[#E68A44] bg-white shadow-sm" : "border-[#E0D4BC] bg-[#FAF6F1]"
          }`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) handleSubmit(e);
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-[#2D2216] placeholder-[#5D4037]/50 focus:outline-none"
              style={{ minHeight: "40px", maxHeight: "100px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2D2216] text-white hover:bg-[#1A1410] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIMessageBar;
