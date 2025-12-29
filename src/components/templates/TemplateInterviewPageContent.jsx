"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import agentTemplates from "@/data/agent-templates.json";
import AiAssistat from "@/components/ui/ai-assistat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { normalizeGoogleTools } from "@/lib/googleToolsNormalizer";

const LOADING_STEPS = [
  "Menganalisa jawaban interview...",
  "Menyusun instruksi agent...",
  "Mengkonfigurasi tools...",
  "Selesai! Mengarahkan ke form...",
];

export default function TemplateInterviewPageContent({
  fallbackPath,
  nextPath,
  redirectingCopy = {
    heading: "Creating your agent...",
    description: "We are applying your interview answers.",
  },
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const completionHandledRef = useRef(false);

  const templateQuery =
    searchParams.get("template") ?? searchParams.get("templateId");
  // ... (rest of template/session logic remains same until handleInterviewComplete)

  const template = useMemo(
    () =>
      templateQuery
        ? agentTemplates.find((t) => t.id === templateQuery)
        : undefined,
    [templateQuery],
  );

  const sessionQuery = searchParams.get("session");
  const sessionId = useMemo(() => {
    if (sessionQuery && sessionQuery.trim()) {
      return sessionQuery;
    }
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return `template-session-${window.crypto.randomUUID()}`;
    }
    return `template-session-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }, [sessionQuery]);

  useEffect(() => {
    if (!sessionQuery && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("session", sessionId);
      window.history.replaceState(null, "", `?${params.toString()}`);
    }
  }, [sessionQuery, sessionId]);

  useEffect(() => {
    if (!template && fallbackPath) {
      router.push(fallbackPath);
    }
  }, [template, fallbackPath, router]);

  useEffect(() => {
    const registerSession = async () => {
      if (!sessionId || !template?.id) {
        return;
      }
      try {
        await fetch("/api/webhook/n8n-template", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            templateId: template.id,
            userId: user?.user_id || null,
          }),
        });
      } catch (error) {
        console.error("[TemplateInterview] Failed to register session:", error);
      }
    };

    registerSession();
  }, [sessionId, template?.id, user?.user_id]);

  const metadata = useMemo(() => {
    if (!template) return null;
    return {
      template_id: template.id,
      template_name: template.name,
      template_category: template.category,
      template_data: {
        name: template.name,
        category: template.category,
        description: template.description,
        config: template.config,
        allowed_tools: template.allowed_tools,
      },
    };
  }, [template]);

  const handleInterviewComplete = useCallback(
    (rawAgentData) => {
      if (completionHandledRef.current) {
        return;
      }

      const normalizeAgentData = (agentData) => {
        if (!agentData || typeof agentData !== "object") return agentData;

        const allowedTools = new Set();

        if (Array.isArray(agentData.allowed_tools)) {
          agentData.allowed_tools.forEach((tool) => {
            if (typeof tool === "string" && tool.trim()) {
              allowedTools.add(tool.trim());
            }
          });
        }

        if (Array.isArray(agentData.mcp_tools)) {
          agentData.mcp_tools.forEach((tool) => {
            if (typeof tool === "string" && tool.trim()) {
              allowedTools.add(tool.trim());
            }
          });
        }

        const parsedGoogleTools = normalizeGoogleTools(agentData.google_tools);
        parsedGoogleTools.forEach((tool) => {
          allowedTools.add(tool);
        });

        return {
          ...agentData,
          google_tools: parsedGoogleTools,
          allowed_tools: Array.from(allowedTools),
          mcp_tools: Array.isArray(agentData.mcp_tools)
            ? agentData.mcp_tools
            : [],
        };
      };

      const agentData = normalizeAgentData(rawAgentData);
      if (!agentData) {
        console.warn("[TemplateInterview] Interview completed without agent data");
        return;
      }

      completionHandledRef.current = true;
      setIsRedirecting(true);
      setLoadingStepIndex(0);

      sessionStorage.setItem(
        "pendingAgentData",
        JSON.stringify({
          ...agentData,
          fromTemplate: true,
          templateId: template?.id,
        }),
      );

      try {
        sessionStorage.setItem("lastTemplateSessionId", sessionId);
      } catch (error) {
        console.warn("[TemplateInterview] Unable to cache last session id", error);
      }

      console.log("[TemplateInterview] Stored pendingAgentData", {
        sessionId,
        keys: Object.keys(agentData || {}),
      });

      // Simulated loading sequence (5 seconds total)
      // We have 4 steps. 
      // Step 0: 0s -> 1.5s
      // Step 1: 1.5s -> 3.0s
      // Step 2: 3.0s -> 4.5s
      // Step 3: 4.5s -> 5.0s (Quick finish)
      
      const stepDuration = 1500; // 1.5s per step roughly
      
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < LOADING_STEPS.length) {
          setLoadingStepIndex(step);
        } else {
           clearInterval(interval);
           // Completed, execute redirect
           if (nextPath) {
            const url = new URL(nextPath, window.location.origin);
            if (!url.searchParams.has("session")) {
              url.searchParams.set("session", sessionId);
            }
            console.log("[TemplateInterview] Redirecting to", url.toString());
            router.push(url.pathname + url.search);
           }
        }
      }, stepDuration);
      
    },
    [nextPath, router, sessionId, template?.id],
  );

  useEffect(() => {
    if (sessionId && template) {
      console.log("[TemplateInterview] Session ready:", {
        sessionId,
        template: template.name,
        source: sessionQuery ? "query" : "generated",
      });

      // Persist session for downstream fallback (agent form page)
      try {
        sessionStorage.setItem("lastTemplateSessionId", sessionId);
      } catch (error) {
        console.warn("[TemplateInterview] Unable to persist last session id", error);
      }
    }
  }, [sessionId, sessionQuery, template]);

  useEffect(() => {
    if (!sessionId || completionHandledRef.current) {
      return;
    }

    let active = true;

    const pollForCompletion = async () => {
      if (!active || completionHandledRef.current) {
        return;
      }
      try {
        const response = await fetch(
          `/api/webhook/n8n-template?session=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          if (response.status !== 404) {
            console.warn(
              "[TemplateInterview] Polling failed:",
              response.status,
              response.statusText,
            );
          }
          return;
        }

        const data = await response.json();
        if (data?.success && data.agentData) {
          handleInterviewComplete(data.agentData);
        }
      } catch (error) {
        console.warn("[TemplateInterview] Polling error:", error);
      }
    };

    const interval = setInterval(pollForCompletion, 4000);
    void pollForCompletion();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [sessionId, handleInterviewComplete]);

  if (!template) {
    return null;
  }

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF6F1] px-4 font-sans text-[#2D2216]">
          <div className="w-full max-w-md space-y-8 text-center">
             {/* Logo/Icon (Optional - keeping it minimal as requested) */}
             
             <div className="space-y-2">
                 <motion.h3 
                    key={loadingStepIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-2xl font-bold tracking-tight text-[#2D2216]"
                 >
                    {LOADING_STEPS[loadingStepIndex]}
                 </motion.h3>
                 <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-[#8D7F71]"
                 >
                    Building your personalized {template.name} agent...
                 </motion.p>
             </div>

             {/* Premium Progress Bar */}
             <div className="relative mx-auto h-2 w-full overflow-hidden rounded-full bg-[#E0D4BC]/30">
                 <motion.div 
                    className="h-full rounded-full bg-[#E68A44] shadow-[0_0_10px_rgba(230,138,68,0.4)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min((loadingStepIndex + 1) * 25, 100)}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                 />
             </div>
             
             {/* Percentage Indicator */}
             <motion.div 
                className="text-xs font-medium text-[#E68A44] tracking-widest uppercase"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
             >
                 {Math.min((loadingStepIndex + 1) * 25, 100)}% Completed
             </motion.div>
          </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#FAF6F1] overflow-hidden h-[calc(100dvh-11rem)] md:h-[calc(100vh-8rem)]">
      {/* Compact Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 border-b border-[#E0D4BC] bg-white/80 backdrop-blur-xl z-20"
      >
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Back Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[#E0D4BC] bg-white text-[#5D4037] hover:bg-[#FAF6F1] transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>

              {/* Template Info - Responsive */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#E68A44]/10 flex-shrink-0">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-[#E68A44]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg sm:text-xl font-bold text-[#2D2216] truncate">
                    {template.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5D4037] hidden sm:block line-clamp-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side Controls - Responsive */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Badge
                variant="secondary"
                className="bg-[#E68A44]/10 text-[#E68A44] hover:bg-[#E68A44]/20 border border-[#E68A44]/20 px-2 py-1 text-xs sm:px-3"
              >
                <span className="hidden sm:inline">{template.category}</span>
                <span className="sm:hidden">{template.category.slice(0, 3)}</span>
              </Badge>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-success/10 text-success">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-success" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Container - Takes full remaining space */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 overflow-hidden min-h-0"
      >
        <AiAssistat
          title={""}
          description=""
          webhookUrl="https://n8n.srv651498.hstgr.cloud/webhook/templateAgent"
          sessionId={sessionId}
          metadata={metadata}
          onMessageReceived={(data) => {
            console.log("[TemplateInterview] Message received:", data);
          }}
          onComplete={handleInterviewComplete}
        />
      </motion.div>
    </div>
  );
}
