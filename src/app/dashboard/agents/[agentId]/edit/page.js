"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Settings,
  Edit,
  Loader2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import AgentForm from "../../components/AgentForm";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import GOOGLE_SCOPE_MAP from "@/data/google_scope_tools.json";

const collectScopesFromMap = (toolIds = []) => {
  const scopes = new Set();
  (toolIds || []).forEach((toolId) => {
    const normalized =
      typeof toolId === "string" ? toolId.trim().toLowerCase() : "";
    if (!normalized) return;
    const mapped = GOOGLE_SCOPE_MAP?.[normalized];
    if (Array.isArray(mapped)) {
      mapped.forEach((scope) => scope && scopes.add(scope));
    }
  });
  return Array.from(scopes);
};

const mapAgentToInitialValues = (agent) => {
  if (!agent) return null;

  const toolSet = new Set();
  const addArray = (arr) => {
    (arr || []).forEach((t) => {
      if (typeof t === "string") toolSet.add(t.trim());
    });
  };
  const addObject = (obj) => {
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      Object.entries(obj).forEach(([k, v]) => {
        if (v && typeof k === "string") toolSet.add(k.trim());
      });
    }
  };

  addArray(agent.tools);
  addObject(agent.tools);
  addArray(agent.allowed_tools);
  addArray(agent.google_tools);
  addArray(agent.config?.google_tools);

  const mcpTools = Array.isArray(agent.mcp_tools)
    ? agent.mcp_tools
    : Array.isArray(agent.config?.mcp_tools)
    ? agent.config.mcp_tools
    : [];
  const googleTools = Array.isArray(agent.google_tools)
    ? agent.google_tools
    : Array.isArray(agent.config?.google_tools)
    ? agent.config.google_tools
    : [];

  return {
    name: agent.name ?? "",
    tools: Array.from(toolSet),
    google_tools: googleTools,
    mcp_tools: mcpTools,
    systemPrompt:
      agent.config?.system_message ?? agent.config?.system_prompt ?? "",
    model: agent.config?.model ?? agent.config?.llm_model ?? "gpt-4o-mini",
    temperature: agent.config?.temperature ?? 0.7,
    maxTokens: agent.config?.max_tokens ?? 1000,
    memoryType: agent.config?.memory_type ?? "buffer",
    reasoningStrategy: agent.config?.reasoning_strategy ?? "react",
  };
};

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!params?.agentId || authLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const abortController = new AbortController();

    const loadAgent = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiService.getAgent(params.agentId);
        if (!abortController.signal.aborted) {
          setAgent(data);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error("Failed to load agent for editing:", err);
          setError(
            err?.message ||
              "Unable to load this agent. Please try again later."
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadAgent();

    return () => abortController.abort();
  }, [params?.agentId, authLoading, user, router]);

  const initialValues = useMemo(
    () => mapAgentToInitialValues(agent),
    [agent]
  );

  const handleUpdate = async (payload) => {
    if (!params?.agentId) return;

    setIsSubmitting(true);
    try {
      const updated = await apiService.updateAgent(params.agentId, payload);

      let authUrl = updated?.auth_url || null;
      let authState = updated?.auth_state || null;

      // If google tools selected, kick off auth
      const googleTools =
        Array.isArray(payload?.google_tools) && payload.google_tools.length > 0
          ? payload.google_tools
          : Array.isArray(updated?.google_tools) && updated.google_tools.length > 0
          ? updated.google_tools
          : [];

      if (googleTools.length > 0) {
        try {
          let scopes = collectScopesFromMap(googleTools);
          if (scopes.length === 0) {
            const scopesResp = await apiService.getRequiredToolScopes(googleTools);
            if (Array.isArray(scopesResp?.scopes) && scopesResp.scopes.length > 0) {
              scopes = scopesResp.scopes;
            }
          }
          if (scopes.length === 0) {
            scopes = ["https://www.googleapis.com/auth/gmail.readonly"];
          }
          const googleAuth = await apiService.startGoogleAuth(scopes, updated.id);
          authUrl = googleAuth?.auth_url || googleAuth?.authUrl || authUrl;
          authState = googleAuth?.auth_state || googleAuth?.authState || authState;
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("pendingGoogleConnectAgent", updated.id.toString());
          }
        } catch (error) {
          console.error("Failed to initiate Google OAuth on update", error);
        }
      }

      const paramsSearch = new URLSearchParams();
      if (authUrl) {
        paramsSearch.set("authUrl", authUrl);
        if (authState) {
          paramsSearch.set("authState", authState);
        }
      }

      router.push(
        paramsSearch.toString()
          ? `/dashboard/agents/${updated.id}?${paramsSearch.toString()}`
          : `/dashboard/agents/${updated.id}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F1] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#2D2216] flex items-center justify-center mx-auto shadow-xl shadow-[#2D2216]/20">
            <Loader2 className="h-8 w-8 text-[#E68A44] animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-[#2D2216]">Loading Agent</h3>
            <p className="text-sm text-[#5D4037]">Please wait while we fetch your agent details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF6F1] flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-[#E0D4BC] bg-white/80 backdrop-blur-xl shadow-xl">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#2D2216] mb-2">
              Error Loading Agent
            </h3>
            <p className="text-[#5D4037] mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full border-[#E0D4BC] text-[#2D2216] hover:bg-[#FAF6F1]"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  const normalizedPlanCode = (
    user?.subscription?.plan_code ||
    user?.subscription?.planCode ||
    ""
  )
    .toString()
    .toLowerCase();

  console.log('[Agent Edit] Current plan code:', normalizedPlanCode);

  const isTrialPlan = Boolean(
    user?.is_trial || normalizedPlanCode === "trial"
  );
  const isProMonthlyPlan = normalizedPlanCode === "pro_m";

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 ml-16"
        >
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/agents/${params.agentId}`}
              className="group flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-[#E0D4BC] flex items-center justify-center shadow-sm hover:shadow-md hover:border-[#E68A44] transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 text-[#8D7F71] group-hover:text-[#E68A44] transition-colors" />
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D2216] to-[#1A1410] flex items-center justify-center shadow-lg shadow-[#2D2216]/20">
                <Edit className="h-5 w-5 text-[#E68A44]" />
              </div>
              <h1 className="text-xl font-bold text-[#2D2216] tracking-tight">Edit Agent</h1>
            </div>
          </div>
        </motion.div>

        {/* Agent Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* We removed the outer Card wrapper here to prevent double-bordering. 
              The AgentForm component has its own internal styling. */}
          <AgentForm
            mode="edit"
            initialValues={initialValues}
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
            isTrialPlan={isTrialPlan}
            isProMonthlyPlan={isProMonthlyPlan}
          />
        </motion.div>
      </div>
    </div>
  );
}
