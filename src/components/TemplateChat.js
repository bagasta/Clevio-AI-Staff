"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming utils exists, if not I'll inline helper or remove

// Constants
const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
  "https://n8n.srv651498.hstgr.cloud/webhook/44e8e63d-ebf4-4278-bdf6-ff0f8e5955fb/chat";

export default function TemplateChat({
  template,
  sessionId,
  onInterviewComplete,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // For "Agent is typing..." indicator
  
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const mountedRef = useRef(false);

  // Initialize Chat
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Optional: Send an initial "start" signal or just wait for user?
    // Usually interview bots start the conversation. Let's try to trigger it.
    // If we don't send anything, the chat is empty.
    // We'll send a hidden "start" action to wake up the agent.
    startConversation();
  }, [template, sessionId]);

  // Auto-scroll logic (Smart Scroll)
  useEffect(() => {
    if (messages.length > 0 && chatContainerRef.current) {
        const lastMsg = messages[messages.length - 1];
        const container = chatContainerRef.current;
        const lastMsgId = `msg-${messages.length - 1}`;
        const lastEl = document.getElementById(lastMsgId);

        // Allow render cycle to complete
        setTimeout(() => {
            if (!lastEl) return;

            if (lastMsg.role === 'assistant') {
                // AI Message: Scroll to TOP of message (with context)
                // Subtracting offset for "sticky header" feel, though modal header scrolls with content usually?
                // In this modal, header is fixed? No, standard modal.
                // We'll use safe scroll logic: show the start of the response.
                 const targetTop = lastEl.offsetTop - 20; // 20px padding
                 container.scrollTo({ top: targetTop, behavior: 'smooth' });
            } else {
                // User Message: Scroll to BOTTOM
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }
  }, [messages, isTyping]);

  const startConversation = async () => {
    if (!template) return;
    
    // Initial System Message or Trigger
    // We simulate a user "hello" or specific trigger payload if needed.
    // However, N8N chat nodes often wait for input.
    // We'll optimistically show a "Connecting..." state or send a hidden init.
    // Let's send a specific "start_interview" message but hide it from UI?
    // Or just send metadata.
    
    setIsTyping(true);
    try {
        await sendMessageToN8N("start_interview", true);
    } catch (err) {
        console.error("Failed to start:", err);
        // Fallback: Add a local welcome message if API fails silently or just shows standard greeting
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput("");
    
    // Reset textarea height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    // Add User Message
    const userMsg = { role: "user", text: userText };
    setMessages((prev) => [...prev, userMsg]);

    setIsLoading(true);
    setIsTyping(true);

    try {
        await sendMessageToN8N(userText);
    } catch (err) {
        setMessages((prev) => [...prev, { role: "assistant", text: "Maaf, terjadi kesalahan koneksi. Silakan coba lagi.", isError: true }]);
    } finally {
        setIsLoading(false);
        setIsTyping(false);
    }
  };

  const sendMessageToN8N = async (text, isHiddenInit = false) => {
     const payload = {
        action: "sendMessage",
        sessionId: sessionId,
        chatInput: text,
        metadata: {
            session_id: sessionId,
            template_id: template?.id,
            template_name: template?.name,
            template_category: template?.category,
             // Passing full template data might be heavy but helpful for the agent
            template_data: {
                name: template?.name,
                category: template?.category,
                description: template?.description,
                config: template?.config,
                allowed_tools: template?.allowed_tools
            }
        }
    };

    const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("API Error");

    const data = await res.json();
    
    // N8N often returns [{ output: "..." }] or just { output: "..." }
    // We need to parse the response format.
    // Assuming standard N8N Chat helper response (array or object with text).
    
    // Handle array response (common in n8n)
    const responses = Array.isArray(data) ? data : [data];
    
    responses.forEach(item => {
        // Extract text
        const responseText = item.output || item.text || item.message || "";
        
        if (responseText) {
             setMessages((prev) => [...prev, { role: "assistant", text: responseText }]);
        }

        // Check for completion signal
        // The widget checked: message?.metadata?.status === "completed"
        // We'll check the raw item for similar signals.
        // It might be nested in the response if the webhook is set up that way.
        if (item.metadata?.status === "completed" || item.status === "completed") {
             const agentData = item.metadata?.agent_data || item.agent_data;
             if (onInterviewComplete && agentData) {
                 onInterviewComplete(agentData);
             }
        }
    });

    // If it was an init call and no response, maybe show a default?
    // If hidden init, we don't add user message.
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF6F1] rounded-b-2xl overflow-hidden relative">
      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                <Bot className="w-12 h-12 text-[#E68A44] mb-3" />
                <p className="text-[#5D4037] font-medium">Memulai sesi interview...</p>
            </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            id={`msg-${idx}`}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                ? 'bg-[#5D4037] text-white' 
                : 'bg-white border border-[#E0D4BC] text-[#E68A44]'
            }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                ? 'bg-[#5D4037] text-white rounded-tr-sm'
                : 'bg-white border border-[#E0D4BC] text-[#2D2216] rounded-tl-sm'
            }`}>
               {msg.role === 'assistant' ? (
                   <ReactMarkdown 
                        className="prose prose-sm max-w-none prose-p:my-1 prose-headings:text-[#2D2216] prose-strong:text-[#2D2216] prose-ul:my-1 prose-li:my-0 text-sm leading-relaxed"
                        components={{
                             a: ({node, ...props}) => <a className="text-[#E68A44] underline font-medium" target="_blank" {...props} />
                        }}
                   >
                       {msg.text}
                   </ReactMarkdown>
               ) : (
                   <p className="text-sm dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
               )}
            </div>
          </div>
        ))}

        {isTyping && (
           <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-[#E0D4BC] text-[#E68A44] flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-[#E0D4BC] rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5 w-fit shadow-sm">
                  <span className="w-2 h-2 bg-[#E68A44]/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-[#E68A44]/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-[#E68A44]/60 rounded-full animate-bounce"></span>
              </div>
           </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[#E0D4BC]">
         <div className="relative flex items-end gap-2 bg-[#FAF6F1] border border-[#E0D4BC] rounded-xl p-2 focus-within:ring-2 focus-within:ring-[#E68A44]/20 transition-all">
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                placeholder="Tulis jawaban anda..."
                rows={1}
                className="w-full bg-transparent border-none outline-none text-[#2D2216] text-sm resize-none py-2 px-2 min-h-[40px]"
                disabled={isLoading}
            />
            <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="mb-1 p-2 rounded-lg bg-[#5D4037] text-white hover:bg-[#4E342E] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
         </div>
      </div>
    </div>
  );
}
