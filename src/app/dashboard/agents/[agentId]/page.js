"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { motion } from "framer-motion";
import {
  Bot,
  Settings,
  MessageSquare,
  Upload,
  FileText,
  RefreshCw,
  Trash2,
  Send,
  Loader2,
  QrCode,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  File,
  Clock,
  HardDrive,
  Shield,
  Smartphone,
  Zap,
  ChevronRight,
  Power,
  Mail,
  Calendar,
  User,
  ExternalLink,
  Wifi,
  WifiOff,
  MessageCircle,
} from "lucide-react";
import {
  describeWhatsAppStatus,
  toneToBadgeClasses,
} from "@/lib/whatsappStatus";
import { resolveSessionQrImage } from "@/lib/whatsappQr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import GOOGLE_SCOPE_MAP from "@/data/google_scope_tools.json";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const GOOGLE_AUTH_TOOL_OVERRIDES = {
  gmail: "Gmail",
  calendar: "Google Calendar",
};

const UPGRADE_PLAN_OPTIONS = [
  {
    code: "PRO_M",
    name: "Pro Monthly",
    priceLabel: "Rp 880.000 / bulan",
    description: "30 hari akses penuh ke semua konektor termasuk WhatsApp.",
  },
  {
    code: "PRO_Y",
    name: "Pro Yearly",
    priceLabel: "Rp 1.000.000 / tahun",
    description: "Hemat 17% untuk akses sepanjang tahun dan prioritas support.",
  },
];

const normalizeToolId = (value) =>
  (typeof value === "string" ? value : "").trim().toLowerCase();

const titleCase = (input) =>
  input
    .split(/[^a-z0-9]+/gi)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");

const isGoogleToolId = (toolId) => {
  const normalized = normalizeToolId(toolId);
  if (!normalized) {
    return false;
  }
  if (normalized === "gmail" || normalized === "calendar") {
    return true;
  }
  if (normalized.startsWith("gmail") || normalized.startsWith("calendar")) {
    return true;
  }
  return normalized.includes("google");
};

const formatGoogleToolLabel = (toolId) => {
  const normalized = normalizeToolId(toolId);
  if (!normalized) {
    return "Google Workspace";
  }
  if (GOOGLE_AUTH_TOOL_OVERRIDES[normalized]) {
    return GOOGLE_AUTH_TOOL_OVERRIDES[normalized];
  }
  if (normalized.startsWith("gmail")) {
    const suffix = normalized.slice("gmail".length).replace(/^[^a-z0-9]+/i, "");
    return suffix ? `Gmail ${titleCase(suffix)}` : "Gmail";
  }
  if (normalized.startsWith("google")) {
    const suffix = normalized
      .slice("google".length)
      .replace(/^[^a-z0-9]+/i, "");
    return suffix ? `Google ${titleCase(suffix)}` : "Google";
  }
  if (normalized.includes("google")) {
    return titleCase(normalized.replace(/google/gi, "Google"));
  }
  return titleCase(normalized);
};

const WHATSAPP_QR_PREPARATION_SECONDS = 30;
const WHATSAPP_QR_EXPIRY_SECONDS = 60;
const GOOGLE_CONNECT_PROMPT_KEY = "pendingGoogleConnectAgent";
const DEFAULT_GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const DEFAULT_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

const EMPTY_WHATSAPP_SESSION = {
  status: "inactive",
  isActive: false,
  qrImage: null,
  qrUrl: null,
  updatedAt: null,
  raw: null,
};

const collectScopesFromMap = (toolIds = []) => {
  const scopes = new Set();
  (toolIds || []).forEach((toolId) => {
    const normalized = normalizeToolId(toolId);
    if (!normalized) return;
    const mapped = GOOGLE_SCOPE_MAP?.[normalized];
    if (Array.isArray(mapped)) {
      mapped.forEach((scope) => {
        if (scope) scopes.add(scope);
      });
    }
  });
  return Array.from(scopes);
};

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const agentIdParam = params?.agentId || null;

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRagDeleting, setIsRagDeleting] = useState(false);
  
  const [deleteDialogState, setDeleteDialogState] = useState({
    isOpen: false,
    type: null,
    data: null, // for RAG doc
    title: "",
    description: ""
  });

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(() => `dashboard-session-${Date.now()}`);
  const [knowledge, setKnowledge] = useState([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);
  const [knowledgeError, setKnowledgeError] = useState("");
  const [knowledgeSuccess, setKnowledgeSuccess] = useState("");
  const [selectedKnowledgeFiles, setSelectedKnowledgeFiles] = useState([]);
  const [knowledgeUploading, setKnowledgeUploading] = useState(false);
  const [knowledgeInputKey, setKnowledgeInputKey] = useState(() => Date.now());
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [whatsAppStatusLoading, setWhatsAppStatusLoading] = useState(false);
  const [whatsAppError, setWhatsAppError] = useState("");
  const [whatsAppQr, setWhatsAppQr] = useState(null);
  const [showWhatsAppQr, setShowWhatsAppQr] = useState(false);
  const [whatsAppSessionInfo, setWhatsAppSessionInfo] = useState(
    EMPTY_WHATSAPP_SESSION
  );
  const [whatsAppDeleting, setWhatsAppDeleting] = useState(false);
  const [whatsAppReconnecting, setWhatsAppReconnecting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState("PRO_M");
  const [upgradeProcessing, setUpgradeProcessing] = useState(false);
  const [showGoogleConnectModal, setShowGoogleConnectModal] = useState(false);
  const [googleAuthStarting, setGoogleAuthStarting] = useState(false);
  const [confirmSkipGoogleConnect, setConfirmSkipGoogleConnect] = useState(false);
  const [googleAuthPollingEnabled, setGoogleAuthPollingEnabled] = useState(false);
  const qrPollAbortRef = useRef(null);
  const whatsAppStatusLoadingRef = useRef(false);
  const whatsAppQrUserClosedRef = useRef(false);
  const qrFlowAbortRef = useRef(null);
  const qrPreparationTimerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [whatsAppRefreshMap, setWhatsAppRefreshMap] = useState({});
  const [whatsAppErrors, setWhatsAppErrors] = useState({});
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);
  const autoGooglePromptShownRef = useRef(false);
  const autoGoogleFirstLoadRef = useRef(false);

  const queryAuthUrl = searchParams?.get("authUrl") || null;
  const queryAuthState = searchParams?.get("authState") || null;

  const [googleAuthInfo, setGoogleAuthInfo] = useState(() => ({
    agentId: agentIdParam,
    status: queryAuthUrl ? "pending" : "idle",
    authUrl: queryAuthUrl,
    authState: queryAuthState,
    tokens: [],
    requiredScopes: [],
    grantedScopes: [],
    missingScopes: [],
    lastCheckedAt: null,
  }));
  const [googleAuthError, setGoogleAuthError] = useState("");
  const [googleAuthChecking, setGoogleAuthChecking] = useState(false);
  const googleAuthPollRef = useRef(null);
  const googleAuthCheckingRef = useRef(false);
  const initialGoogleAuthCheckDoneRef = useRef(false);
  const googleStatusLastCheckRef = useRef(0);

  const normalizedUserPlan = useMemo(() => {
    const planCode =
      user?.subscription?.plan_code ||
      user?.subscription?.planCode;
    console.log('[Agent Detail] Current plan code:', planCode);
    return typeof planCode === "string" ? planCode.trim().toLowerCase() : null;
  }, [user?.subscription?.plan_code, user?.subscription?.planCode]);

  const isTrialPlan = Boolean(user?.is_trial || normalizedUserPlan === "trial");

  const closeWhatsAppQrPreview = useCallback(() => {
    whatsAppQrUserClosedRef.current = true;
    if (qrFlowAbortRef.current) {
      qrFlowAbortRef.current.abort();
      qrFlowAbortRef.current = null;
    }
    if (qrPreparationTimerRef.current) {
      clearTimeout(qrPreparationTimerRef.current);
      qrPreparationTimerRef.current = null;
    }
    setShowWhatsAppQr(false);
    setWhatsAppQr(null);
    setWhatsAppError("");
  }, []);

  useEffect(() => {
    const upcomingAuthUrl = queryAuthUrl || null;
    const upcomingAuthState = queryAuthState || null;
    const nextAgentId = agentIdParam;

    setGoogleAuthInfo((previous) => {
      const prevAgentId = previous?.agentId ?? null;
      const prevAuthUrl = previous?.authUrl ?? null;
      const prevAuthState = previous?.authState ?? null;

      const hasAgentChanged = prevAgentId !== nextAgentId;
      const hasAuthChanged =
        prevAuthUrl !== upcomingAuthUrl || prevAuthState !== upcomingAuthState;

      if (!hasAgentChanged && !hasAuthChanged) {
        return previous;
      }

      if (
        !hasAgentChanged &&
        previous?.status === "connected" &&
        !upcomingAuthUrl
      ) {
        if (
          prevAuthUrl === null &&
          prevAuthState === null &&
          prevAgentId === nextAgentId
        ) {
          return previous;
        }
        return {
          ...previous,
          agentId: nextAgentId,
          authUrl: null,
          authState: null,
        };
      }

      return {
        agentId: nextAgentId,
        status: upcomingAuthUrl ? "pending" : "idle",
        authUrl: upcomingAuthUrl,
        authState: upcomingAuthState,
        tokens: [],
        requiredScopes: [],
        grantedScopes: [],
        missingScopes: [],
        lastCheckedAt: null,
      };
    });

    setGoogleAuthError("");
  }, [agentIdParam, queryAuthUrl, queryAuthState]);

  
  const handleUpgradeRedirect = useCallback(() => {
    if (!selectedUpgradePlan) {
      return;
    }
    setUpgradeProcessing(true);
    try {
      const params = new URLSearchParams({
        plan: selectedUpgradePlan,
        source: "whatsapp-upgrade",
      });
      if (user?.email) {
        params.set("email", user.email);
      }
      if (user?.user_id) {
        params.set("user_id", user.user_id);
      }
      router.push(`/payment?${params.toString()}`);
    } finally {
      setUpgradeProcessing(false);
      setShowUpgradeModal(false);
    }
  }, [router, selectedUpgradePlan, user?.email, user?.user_id]);

  const agentToolIds = useMemo(() => {
    const collected = new Set();

    const addTool = (value) => {
      const normalized = normalizeToolId(value);
      if (normalized) {
        collected.add(normalized);
      }
    };

    const addFrom = (value) => {
      if (!value) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(addTool);
        return;
      }
      if (typeof value === "string") {
        addTool(value);
        return;
      }
      if (typeof value === "object") {
        Object.entries(value).forEach(([key, flag]) => {
          if (flag) {
            addTool(key);
          }
        });
      }
    };

    // Allowed tools deprecated; only consider tools array/object
    addFrom(agent?.tools);
    addFrom(agent?.allowed_tools);
    addFrom(agent?.allowedTools);
    addFrom(agent?.google_tools);
    addFrom(agent?.config?.google_tools);
    addFrom(agent?.mcp_tools); // fallback if backend mislabels Google tools
    addFrom(agent?.config?.mcp_tools);
    addFrom(agent?.config?.allowed_tools);

    return collected;
  }, [agent]);

  const googleToolIds = useMemo(
    () => Array.from(agentToolIds).filter(isGoogleToolId),
    [agentToolIds]
  );

  const requiresGoogleAuth = googleToolIds.length > 0;
  const showGoogleIntegrationCard = true; // Google tools should be visible for all plans if selected

  const googleAuthStatus = googleAuthInfo.status;
  const googleAuthPending = googleAuthStatus === "pending";
  const googleAuthConnected = googleAuthStatus === "connected";
  const googleAuthUrl = googleAuthConnected ? null : googleAuthInfo.authUrl;
  const googleAuthTokens = Array.isArray(googleAuthInfo.tokens)
    ? googleAuthInfo.tokens
    : [];
  const googleAuthPrimaryToken =
    googleAuthTokens.length > 0 ? googleAuthTokens[0] : null;
  const googleToolSummary = useMemo(() => {
    const labels = googleToolIds.map(formatGoogleToolLabel);
    return Array.from(new Set(labels)).join(", ");
  }, [googleToolIds]);

  const googleGrantedScopesDisplay = useMemo(() => {
    const googleGrantedScopes = Array.isArray(googleAuthInfo.grantedScopes)
      ? googleAuthInfo.grantedScopes
      : [];

    const items = [];
    const pushUnique = (key, label, Icon) => {
      if (!items.some((entry) => entry.key === key)) {
        items.push({ key, label, Icon });
      }
    };

    googleGrantedScopes.forEach((scope) => {
      const value = (scope || "").toLowerCase();
      if (!value) return;

      if (
        value.includes("mail.google.com") ||
        value.includes("gmail.readonly")
      ) {
        pushUnique(
          "gmail-readonly",
          "Baca email (tanpa mengirim/mengedit)",
          Mail
        );
        return;
      }

      if (
        value.includes("userinfo.email") ||
        value.includes("userinfo.profile") ||
        value === "openid"
      ) {
        pushUnique("profile", "Lihat profil & alamat email", User);
        return;
      }

      pushUnique(value, scope, Info);
    });

    return items;
  }, [googleAuthInfo.grantedScopes]);

  const clearGoogleAuthPoll = useCallback(() => {
    if (googleAuthPollRef.current) {
      clearInterval(googleAuthPollRef.current);
      googleAuthPollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (qrFlowAbortRef.current) {
        qrFlowAbortRef.current.abort();
        qrFlowAbortRef.current = null;
      }
      if (qrPreparationTimerRef.current) {
        clearTimeout(qrPreparationTimerRef.current);
        qrPreparationTimerRef.current = null;
      }
    };
  }, []);

  const checkGoogleAuthStatus = useCallback(async () => {
    if (!user || !requiresGoogleAuth || !agentIdParam) {
      return { status: "idle", authUrl: null };
    }
    if (googleAuthCheckingRef.current) {
      return { status: "idle", authUrl: null };
    }

    // Debounce: prevent duplicate calls within 2 seconds (handles React Strict Mode)
    // using ref instead of sessionStorage so it DOES reset on page reload/navigation
    const now = Date.now();
    if (now - googleStatusLastCheckRef.current < 2000) {
      console.log("[GoogleAuth] Skipping - debounced (called within 2 seconds)");
      return { status: "idle", authUrl: null };
    }
    googleStatusLastCheckRef.current = now;

    googleAuthCheckingRef.current = true;
    setGoogleAuthChecking(true);
    setGoogleAuthError("");


    try {
      const response = await apiService.checkGoogleAuthStatus(agentIdParam);
      
      // Debug logging to help diagnose refresh issues
      console.log("[GoogleAuth] Refresh status response:", {
        raw: response,
        status: response?.status,
        refreshed: response?.refreshed,
        tokens: response?.tokens?.length || 0,
        requiredScopes: response?.required_scopes?.length || 0,
        grantedScopes: response?.granted_scopes?.length || 0,
        missingScopes: response?.missing_scopes?.length || 0,
      });
      
      const statusValue =
        typeof response?.status === "string"
          ? response.status.toLowerCase()
          : null;
      const refreshed = response?.refreshed === true;
      const tokens = Array.isArray(response?.tokens) ? response.tokens : [];
      const requiredScopes = Array.isArray(response?.required_scopes)
        ? response.required_scopes
        : [];
      const grantedScopes = Array.isArray(response?.granted_scopes)
        ? response.granted_scopes
        : [];
      const missingScopes = Array.isArray(response?.missing_scopes)
        ? response.missing_scopes
        : [];
      const hasTokens = tokens.length > 0;
      const hasGrantedScopes = grantedScopes.length > 0;
      const hasMissing = missingScopes.length > 0;
      
      // Also check for "connected" or "success" status from backend
      const isConnectedStatus = ["authenticated", "connected", "success", "active"].includes(statusValue || "");
      
      console.log("[GoogleAuth] Evaluated conditions:", {
        hasTokens,
        hasGrantedScopes,
        statusValue,
        refreshed,
        hasMissing,
        isConnectedStatus,
        willBeConnected: (hasTokens || hasGrantedScopes || isConnectedStatus || refreshed) && !hasMissing,
      });

      // Check if granted scopes are sufficient - if we have multiple key scopes, consider connected
      // Backend may report missing_scopes inaccurately, so be more permissive
      const hasKeyScopes = grantedScopes.some(s => 
        s.includes("gmail") || s.includes("calendar") || s.includes("drive") || s.includes("docs") || s.includes("sheets")
      );
      const hasSufficientScopes = grantedScopes.length >= 3;
      const effectivelyConnected = hasGrantedScopes && (hasSufficientScopes || hasKeyScopes);

      console.log("[GoogleAuth] Additional checks:", {
        hasKeyScopes,
        hasSufficientScopes,
        effectivelyConnected,
      });

      // Mark connected when:
      // 1. Standard case: has tokens or status indicates connected, with no missing scopes
      // 2. Override case: effectively connected based on granted scopes (backend may be wrong about missing)
      if ((hasTokens || isConnectedStatus || refreshed) && !hasMissing || effectivelyConnected) {
        setGoogleAuthInfo({
          agentId: agentIdParam,
          status: "connected",
          authUrl: null,
          authState: null,
          tokens,
          requiredScopes,
          grantedScopes,
          missingScopes,
          lastCheckedAt: Date.now(),
        });
        clearGoogleAuthPoll();

        // Clear sessionStorage after successful Google auth connection
        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.removeItem(GOOGLE_CONNECT_PROMPT_KEY);
            window.sessionStorage.removeItem("pendingGoogleConnectAgent");
          } catch (error) {
            console.warn("Failed to clear Google auth sessionStorage:", error);
          }
        }

        if (agentIdParam && (queryAuthUrl || queryAuthState)) {
          router.replace(`/dashboard/agents/${agentIdParam}`);
        }

        return { status: "connected", authUrl: null };
      }


      if (response?.auth_url) {
        setGoogleAuthInfo({
          agentId: agentIdParam,
          status: "pending",
          authUrl: response.auth_url,
          authState: response.auth_state || null,
          tokens: response?.tokens || [],
          requiredScopes,
          grantedScopes,
          missingScopes,
          lastCheckedAt: Date.now(),
        });
        return { status: "pending", authUrl: response.auth_url };
      }

      setGoogleAuthInfo((previous) => {
        const fallbackStatus =
          previous?.status === "connected" && !hasMissing
            ? "connected"
            : hasMissing
            ? "pending"
            : "idle";
        return {
          agentId: agentIdParam,
          status: fallbackStatus,
          authUrl:
            previous?.status === "connected" && !hasMissing
              ? null
              : response?.auth_url || previous?.authUrl || null,
          authState:
            previous?.status === "connected" && !hasMissing
              ? null
              : response?.auth_state || previous?.authState || null,
          tokens:
            previous?.status === "connected" && !hasMissing
              ? previous.tokens
              : tokens,
          requiredScopes: requiredScopes.length
            ? requiredScopes
            : previous?.requiredScopes || [],
          grantedScopes: grantedScopes.length
            ? grantedScopes
            : previous?.grantedScopes || [],
          missingScopes: missingScopes.length
            ? missingScopes
            : previous?.missingScopes || [],
          lastCheckedAt: Date.now(),
        };
      });

      return { status: hasMissing ? "pending" : "idle", authUrl: null };
    } catch (err) {
      const fallback =
        err?.message ||
        "Unable to verify Google authentication status right now.";
      setGoogleAuthError(fallback);
      return { status: "error", authUrl: null };
    } finally {
      googleAuthCheckingRef.current = false;
      setGoogleAuthChecking(false);
    }
  }, [
    user,
    requiresGoogleAuth,
    agentIdParam,
    queryAuthUrl,
    queryAuthState,
    router,
    clearGoogleAuthPoll,
  ]);

  // Manual-only: do not auto refresh status; polling starts only after user explicitly clicks refresh/connect button
  // Additionally, stop polling when page is not visible (user navigated away)

  useEffect(() => {
    if (
      !requiresGoogleAuth ||
      googleAuthInfo.status !== "pending" ||
      !googleAuthPollingEnabled
    ) {
      clearGoogleAuthPoll();
      return;
    }

    const startPolling = () => {
      if (!googleAuthPollRef.current) {
        googleAuthPollRef.current = setInterval(() => {
          // Only check if page is visible
          if (typeof document !== 'undefined' && !document.hidden) {
            void checkGoogleAuthStatus();
          }
        }, 3000);
      }
    };

    const stopPolling = () => {
      clearGoogleAuthPoll();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (googleAuthPollingEnabled && googleAuthInfo.status === "pending") {
        startPolling();
      }
    };

    // Start polling if conditions are met
    startPolling();

    // Add visibility change listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      stopPolling();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [
    requiresGoogleAuth,
    googleAuthInfo.status,
    googleAuthPollingEnabled,
    checkGoogleAuthStatus,
    clearGoogleAuthPoll,
  ]);

  const openGoogleConnectModal = useCallback(() => {
    // Always allow manual open; we'll show error message inside if truly not needed
    setConfirmSkipGoogleConnect(false);
    setShowGoogleConnectModal(true);
    // Don't trigger checkGoogleAuthStatus here - it causes double refresh
    // Status check is handled by polling effect or manual Refresh button
  }, []);


  const closeGoogleConnectModal = useCallback(() => {
    setShowGoogleConnectModal(false);
    setConfirmSkipGoogleConnect(false);
  }, []);

  // NOTE: Removed redundant useEffects that were causing double API calls
  // Google auth status is now checked only once in the initial load effect (line ~1316)

  useEffect(() => {
    if (googleAuthConnected && showGoogleConnectModal) {
      closeGoogleConnectModal();
    }
    if (googleAuthConnected) {
      setGoogleAuthPollingEnabled(false);
    }
  }, [googleAuthConnected, showGoogleConnectModal, closeGoogleConnectModal]);

  // Check for pending Google Auth trigger from Trial creation
  useEffect(() => {
    if (typeof window !== "undefined" && agentIdParam) {
      const pendingAgentId = window.localStorage.getItem("trialPendingGoogleAuthAgentId");
      if (pendingAgentId && pendingAgentId === agentIdParam) {
        // Clear it so it doesn't trigger again on reload
        window.localStorage.removeItem("trialPendingGoogleAuthAgentId");
        
        // Open the modal to prompt user to connect
        // We delay slightly to ensure UI is ready
        const timer = setTimeout(() => {
            setShowGoogleConnectModal(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [agentIdParam]);

  const fetchRequiredGoogleScopes = useCallback(async () => {
    const uniqueTools = Array.from(new Set(googleToolIds));
    if (!uniqueTools.length) {
      return [DEFAULT_GMAIL_SCOPE];
    }

    // Local mapping first
    const mappedScopes = collectScopesFromMap(uniqueTools);
    if (mappedScopes.length > 0) {
      return mappedScopes;
    }

    try {
      const response = await apiService.getRequiredToolScopes(uniqueTools);
      if (Array.isArray(response?.scopes) && response.scopes.length > 0) {
        return response.scopes;
      }
    } catch (error) {
      console.warn("Failed to fetch required Google scopes:", error);
    }

    const fallback = new Set([DEFAULT_GMAIL_SCOPE]);
    if (uniqueTools.some((tool) => tool.includes("calendar"))) {
      fallback.add(DEFAULT_CALENDAR_SCOPE);
    }
    return Array.from(fallback);
  }, [googleToolIds]);

  const handleGoogleConnectNow = useCallback(async () => {
    if (!agent?.id) {
      return;
    }

    if (googleAuthStarting) {
      return;
    }

    setGoogleAuthError("");

    if (googleAuthUrl && typeof window !== "undefined") {
      window.open(googleAuthUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setGoogleAuthStarting(true);
    setGoogleAuthPollingEnabled(true);
    try {
      const scopes = await fetchRequiredGoogleScopes();
      const response = await apiService.startGoogleAuth(scopes, agent.id);
      const authLink = response?.auth_url || response?.authUrl || null;
      const authState = response?.auth_state || response?.authState || null;

      if (authLink && typeof window !== "undefined") {
        window.open(authLink, "_blank", "noopener,noreferrer");
        setGoogleAuthInfo((previous) => ({
          ...previous,
          agentId: agent.id,
          status: "pending",
          authUrl: authLink,
          authState,
        }));
      } else {
        setGoogleAuthError(
          response?.message ||
            "We couldn't generate a Google authorization link. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to start Google OAuth:", error);
      setGoogleAuthError(
        error?.message || "Unable to start Google authorization."
      );
    } finally {
      setGoogleAuthStarting(false);
    }
  }, [
    agent?.id,
    googleAuthUrl,
    googleAuthStarting,
    fetchRequiredGoogleScopes,
  ]);

  const handleSkipGoogleConnect = useCallback(() => {
    if (!confirmSkipGoogleConnect) {
      setConfirmSkipGoogleConnect(true);
      return;
    }
    closeGoogleConnectModal();
  }, [confirmSkipGoogleConnect, closeGoogleConnectModal]);

  useEffect(
    () => () => {
      clearGoogleAuthPoll();
    },
    [clearGoogleAuthPoll]
  );

  const loadAgent = useCallback(async () => {
    if (!agentIdParam) {
      setError("Missing agent identifier in the URL.");
      setAgent(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await apiService.getAgent(agentIdParam);
      setAgent(data || null);
    } catch (err) {
      console.error("Failed to load agent:", err);
      setAgent(null);
      setError(
        err?.message ||
          "Unable to load this agent right now. Please try again shortly."
      );
    } finally {
      setLoading(false);
    }
  }, [agentIdParam]);

  // WhatsApp functions - define before useEffect to avoid ReferenceError
  const getApiKeyForWhatsApp = useCallback(async () => {
    let apiKey =
      (typeof apiService.getCurrentApiKey === "function"
        ? apiService.getCurrentApiKey()
        : null) ||
      user?.subscription?.api_key ||
      user?.subscription?.apiKey ||
      null;

    if (!apiKey && agent?.config?.api_key) {
      apiKey = agent.config.api_key;
    }

    if (!apiKey) {
      try {
        await apiService.ensureApiKey();
        apiKey =
          typeof apiService.getCurrentApiKey === "function"
            ? apiService.getCurrentApiKey()
            : null;
      } catch (err) {
        console.warn(
          "Unable to auto-generate API key for WhatsApp session",
          err
        );
      }
    }

    if (!apiKey) {
      throw new Error(
        "API key unavailable. Please refresh your session or generate an API key before linking WhatsApp."
      );
    }

    return apiKey;
  }, [agent?.config?.api_key, user?.subscription]);

  // New WhatsApp status refresh function - consistent with agents page
  const handleRefreshWhatsAppStatus = useCallback(async (agentId = null) => {
    const targetAgentId = agentId || agent?.id;
    if (!targetAgentId) return;

    setWhatsAppErrors((prev) => {
      const next = { ...prev };
      delete next[targetAgentId];
      return next;
    });

    setWhatsAppRefreshMap((prev) => ({ ...prev, [targetAgentId]: true }));

    try {
      await apiService.ensureApiKey();
      const statusData = await apiService.getWhatsAppConnectionStatus(targetAgentId);

      console.log('Status data from API:', statusData);

      // Update agent with WhatsApp status - using the correct field names from the new API response
      setAgent(prevAgent =>
        prevAgent?.id === targetAgentId
          ? {
              ...prevAgent,
              whatsapp_connected: statusData?.connected || statusData?.isActive || false,
              whatsapp_status: statusData?.status || 'unknown',
              last_message_at: statusData?.lastConnectedAt || prevAgent.last_message_at
            }
          : prevAgent
      );

      // Update session info
      setWhatsAppSessionInfo({
        ...EMPTY_WHATSAPP_SESSION,
        isActive: statusData?.connected || statusData?.isActive || false,
        status: statusData?.status || 'unknown',
        lastConnectedAt: statusData?.lastConnectedAt || null,
        raw: statusData
      });
    } catch (error) {
      console.log('WhatsApp status check result:', error?.message);

      // Handle "Session not found" gracefully - this is normal for agents without WhatsApp
      const errorMessage = error?.message || "";
      if (errorMessage.includes('Session not found') ||
          errorMessage.includes('Not found') ||
          errorMessage.includes('session not found')) {

        // This is normal - agent doesn't have a WhatsApp session yet
        // Set status to not connected without showing error
        setAgent(prevAgent =>
          prevAgent?.id === targetAgentId
            ? {
                ...prevAgent,
                whatsapp_connected: false,
                whatsapp_status: 'not_connected',
                last_message_at: prevAgent.last_message_at
              }
            : prevAgent
        );

        // Update session info to reflect no session
        setWhatsAppSessionInfo({
          ...EMPTY_WHATSAPP_SESSION,
          isActive: false,
          status: 'not_connected',
          lastConnectedAt: null,
          raw: null
        });

        console.log(`Agent ${targetAgentId} has no WhatsApp session (this is normal)`);
      } else {
        // For other errors, show the error message
        console.error('Error refreshing WhatsApp status:', error);
        setWhatsAppErrors((prev) => ({
          ...prev,
          [targetAgentId]: error?.message || "Unable to refresh WhatsApp status. Please try again."
        }));
      }
    } finally {
      setWhatsAppRefreshMap((prev) => {
        const next = { ...prev };
        delete next[targetAgentId];
        return next;
      });
    }
  }, [agent?.id]);

  // WhatsApp connection handler
  const handleConnectWhatsApp = useCallback(async () => {
    if (!agent) {
      return;
    }

    if (isTrialPlan) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      await apiService.ensureApiKey();
      const apiKey = await getApiKeyForWhatsApp();

      // First, create WhatsApp session (ignore "session_created" gating; always try fetch QR)
      const sessionData = await apiService.createWhatsAppSession({
        userId: user?.user_id || '',
        agentId: agent.id,
        agentName: agent.name,
        apiKey
      });

      // Then fetch QR code
      const qrData = await apiService.fetchWhatsAppQr(agent.id);
      const qrImage =
        resolveSessionQrImage(qrData) ||
        resolveSessionQrImage(sessionData) ||
        qrData?.qr?.base64 ||
        qrData?.qr?.image ||
        null;

      if (!qrImage) {
        throw new Error('QR code unavailable right now. Please retry in a moment.');
      }

      // Show QR modal
      setShowWhatsAppQr(true);
      setWhatsAppQr(qrImage);
      setWhatsAppError("");

      // Update agent status
      setAgent(prevAgent =>
        prevAgent?.id === agent.id
          ? {
              ...prevAgent,
              whatsapp_connected: false,
              whatsapp_status: 'connecting'
            }
          : prevAgent
      );

      // Update session info
      setWhatsAppSessionInfo({
        ...EMPTY_WHATSAPP_SESSION,
        isActive: false,
        status: 'connecting',
        raw: sessionData
      });

      // Start polling for status updates
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await apiService.getWhatsAppConnectionStatus(agent.id);
          console.log('Polling status data:', statusData);

          // Check for connected status using multiple possible fields
          const isConnected = statusData?.connected ||
                            statusData?.isActive ||
                            statusData?.status === 'connected';

          if (isConnected) {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setShowWhatsAppQr(false);

            // Update agent status to connected
            setAgent(prevAgent =>
              prevAgent?.id === agent.id
                ? {
                    ...prevAgent,
                    whatsapp_connected: true,
                    whatsapp_status: 'connected',
                    last_message_at: statusData?.lastConnectedAt || prevAgent.last_message_at
                  }
                : prevAgent
            );

            // Update session info
            setWhatsAppSessionInfo({
              ...EMPTY_WHATSAPP_SESSION,
              isActive: true,
              status: 'connected',
              lastConnectedAt: statusData?.lastConnectedAt || null,
              raw: statusData
            });
          }
        } catch (error) {
          console.error('Error polling WhatsApp status:', error);
        }
      }, 3000);

      // Stop polling after 5 minutes
      setTimeout(() => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      }, 300000);

    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      setWhatsAppErrors((prev) => ({
        ...prev,
        [agent.id]: 'Failed to connect WhatsApp: ' + (error.message || 'Unknown error')
      }));
      setShowWhatsAppQr(false);
    }
  }, [agent, isTrialPlan, getApiKeyForWhatsApp, user?.user_id]);

  // WhatsApp disconnect handler
  const handleDisconnectWhatsApp = useCallback(async () => {
    if (!agent?.id) {
      return;
    }

    try {
      // Clear any existing error
      setWhatsAppErrors((prev) => {
        const next = { ...prev };
        delete next[agent.id];
        return next;
      });

      // Set loading state
      setWhatsAppRefreshMap((prev) => ({ ...prev, [agent.id]: true }));

      await apiService.ensureApiKey();
      console.log(`Disconnecting WhatsApp for agent: ${agent.id}`);

      // Call disconnect API
      await apiService.disconnectWhatsApp(agent.id);

      // Update agent status to disconnected
      setAgent(prevAgent =>
        prevAgent?.id === agent.id
          ? {
              ...prevAgent,
              whatsapp_connected: false,
              whatsapp_status: 'disconnected'
            }
          : prevAgent
      );

      // Update session info
      setWhatsAppSessionInfo({
        ...EMPTY_WHATSAPP_SESSION,
        isActive: false,
        status: 'disconnected'
      });

      console.log(`Successfully disconnected WhatsApp for agent: ${agent.id}`);

      // Optional: Refresh status after a short delay to ensure backend is updated
      setTimeout(async () => {
        try {
          await handleRefreshWhatsAppStatus();
        } catch (error) {
          console.log('Status refresh after disconnect failed, but disconnect was successful');
        }
      }, 1000);

    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      setWhatsAppErrors((prev) => ({
        ...prev,
        [agent.id]: error?.message || "Unable to disconnect WhatsApp. Please try again."
      }));
    } finally {
      setWhatsAppRefreshMap((prev) => {
        const next = { ...prev };
        delete next[agent.id];
        return next;
      });
    }
  }, [agent?.id, handleRefreshWhatsAppStatus]);

  // WhatsApp reconnect handler
  const handleWhatsAppReconnect = useCallback(async () => {
    if (!agent?.id) {
      return;
    }
    if (isTrialPlan) {
      setShowUpgradeModal(true);
      return;
    }

    setWhatsAppError("");
    setWhatsAppReconnecting(true);
    try {
      const session = await apiService.reconnectWhatsAppSession(agent.id);
      setWhatsAppSessionInfo(session || EMPTY_WHATSAPP_SESSION);

      const qr = resolveSessionQrImage(session);
      if (qr) {
        setShowWhatsAppQr(true);
        setWhatsAppQr(qr);
      }

      await handleRefreshWhatsAppStatus();
    } catch (error) {
      setWhatsAppError(
        error?.message || "Unable to reconnect WhatsApp session right now."
      );
    } finally {
      setWhatsAppReconnecting(false);
    }
  }, [agent?.id, isTrialPlan, handleRefreshWhatsAppStatus]);

  // WhatsApp delete handler
  // WhatsApp delete handler (Triggers Modal)
  const handleWhatsAppDeleteClick = useCallback(() => {
    setDeleteDialogState({
      isOpen: true,
      type: "WHATSAPP",
      title: "Delete WhatsApp Session?",
      description: "This will disconnect the agent from WhatsApp. You will need to scan the QR code again to reconnect."
    });
  }, []);

  const executeWhatsAppDelete = useCallback(async () => {
    if (!agent?.id) return;
    setWhatsAppError("");
    setWhatsAppDeleting(true);
    try {
      await apiService.deleteWhatsAppSession(agent.id);
      toast.success("WhatsApp session deleted successfully");
      setShowWhatsAppQr(false);
      setWhatsAppSessionInfo(EMPTY_WHATSAPP_SESSION);

      // Update agent status
      setAgent(prevAgent =>
        prevAgent?.id === agent.id
          ? {
              ...prevAgent,
              whatsapp_connected: false,
              whatsapp_status: 'disconnected'
            }
          : prevAgent
      );

      await handleRefreshWhatsAppStatus();
      setDeleteDialogState(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("WhatsApp delete error:", error);
      toast.error(error?.message || "Unable to delete WhatsApp session right now.");
      setWhatsAppError(
        error?.message || "Unable to delete WhatsApp session right now."
      );
    } finally {
      setWhatsAppDeleting(false);
    }
  }, [agent?.id, handleRefreshWhatsAppStatus]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setAgent(null);
      setLoading(false);
      setError("You need to sign in to view this agent.");
      return;
    }

    void loadAgent();
  }, [authLoading, user, loadAgent]);

  // Load WhatsApp status when agent is loaded
  useEffect(() => {
    if (agent?.id && !authLoading && user) {
      // Load initial WhatsApp status
      handleRefreshWhatsAppStatus(agent.id);
    }
  }, [agent?.id, authLoading, user, handleRefreshWhatsAppStatus]);

  // Load Google Auth status when agent is loaded and requires Google auth - ONCE ONLY
  useEffect(() => {
    // Skip if already checked for this agent
    if (initialGoogleAuthCheckDoneRef.current) {
      return;
    }
    
    if (agent?.id && !authLoading && user && requiresGoogleAuth) {
      // Mark as done BEFORE calling to prevent race conditions
      initialGoogleAuthCheckDoneRef.current = true;
      console.log("[GoogleAuth] Initial load - checking status for agent:", agent.id);
      void checkGoogleAuthStatus();
    }
  }, [agent?.id, authLoading, user, requiresGoogleAuth, isTrialPlan, checkGoogleAuthStatus]);

  // Reset ref when agent changes (navigating to different agent)
  useEffect(() => {
    return () => {
      initialGoogleAuthCheckDoneRef.current = false;
    };
  }, [agent?.id]);



  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Load knowledge documents when agent is loaded
  useEffect(() => {
    if (!agent?.id) {
      setKnowledge([]);
      setKnowledgeLoading(false);
      return;
    }

    setKnowledgeLoading(true);
    setKnowledgeError("");
    apiService
      .getAgentDocuments(agent.id)
      .then((response) => {
        const items = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
          ? response.data
          : [];
        setKnowledge(items);
      })
      .catch((error) => {
        console.error("Failed to load knowledge:", error);
        setKnowledgeError(
          error?.message || "Unable to load knowledge documents."
        );
      })
      .finally(() => {
        setKnowledgeLoading(false);
      });
  }, [agent?.id]);

  const refreshWhatsAppSession = useCallback(async () => {
    if (whatsAppStatusLoadingRef.current) {
      return;
    }

    if (!agent?.id) {
      setWhatsAppSessionInfo(EMPTY_WHATSAPP_SESSION);
      return;
    }

    whatsAppStatusLoadingRef.current = true;
    setWhatsAppStatusLoading(true);
    setWhatsAppError("");

    try {
      const session = await apiService.getWhatsAppSession(agent.id);
      const currentQrValue = resolveSessionQrImage(session);

      setWhatsAppSessionInfo((previous) => {
        const prev = previous || EMPTY_WHATSAPP_SESSION;

        if (showWhatsAppQr) {
          return session;
        }

        if (prev.isActive && !session.isActive) {
          const nextStatus = (session.status || "").toLowerCase();
          const shouldPreserve =
            !currentQrValue &&
            (!nextStatus ||
              ["inactive", "not_linked", "not_found", "unknown"].includes(
                nextStatus
              ));

          if (shouldPreserve) {
            return {
              ...prev,
              updatedAt: session.updatedAt || prev.updatedAt || null,
              raw: session.raw || prev.raw || null,
            };
          }
        }

        return session;
      });

      if (showWhatsAppQr) {
        if (currentQrValue) {
          setWhatsAppQr(currentQrValue);
        }

        if (session.isActive && !whatsAppQrUserClosedRef.current) {
          // Optional: Tampilkan success message
        }
      }
    } catch (err) {
      setWhatsAppError(
        err?.message ||
          "Unable to load WhatsApp session status right now. Please try again."
      );
    } finally {
      whatsAppStatusLoadingRef.current = false;
      setWhatsAppStatusLoading(false);
    }
  }, [agent?.id, showWhatsAppQr]);

  useEffect(() => {
    if (
      showWhatsAppQr &&
      whatsAppSessionInfo.isActive &&
      !whatsAppQrUserClosedRef.current
    ) {
      const timer = setTimeout(() => {
        closeWhatsAppQrPreview();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [showWhatsAppQr, whatsAppSessionInfo.isActive, closeWhatsAppQrPreview]);

  
  
  const requiresWhatsApp = useMemo(() => {
    if (whatsAppSessionInfo.isActive) {
      return false;
    }
    const statusRaw =
      whatsAppSessionInfo.status ||
      (whatsAppSessionInfo.isActive ? "active" : "inactive") ||
      "";
    const status = statusRaw.toLowerCase();

    return (
      status !== "inactive" &&
      status !== "not_found" &&
      Boolean(whatsAppSessionInfo.raw)
    );
  }, [whatsAppSessionInfo]);

  const whatsAppStatusDescriptor = useMemo(
    () => describeWhatsAppStatus(whatsAppSessionInfo),
    [whatsAppSessionInfo]
  );
  const whatsAppStatusLabel = whatsAppStatusDescriptor.label;
  const whatsAppStatusClasses = toneToBadgeClasses(
    whatsAppStatusDescriptor.tone,
    { loading: whatsAppStatusLoading }
  );

  const agentDescription = useMemo(() => {
    const parts = [];

    if (agent?.description) {
      parts.push(agent.description);
    }

    if (googleToolIds.length > 0) {
      const suffix = googleAuthPending ? " (authorization pending)" : "";
      googleToolIds.forEach((toolId) => {
        const label = formatGoogleToolLabel(toolId);
        if (!parts.includes(label + suffix)) {
          parts.push(label + suffix);
        }
      });
    }

    if (!parts.includes("WhatsApp")) {
      parts.push("WhatsApp");
    }

    return parts.join(", ");
  }, [agent?.description, googleToolIds, googleAuthPending]);

  const whatsAppQrIsImage = useMemo(() => {
    if (typeof whatsAppQr !== "string" || !whatsAppQr) {
      return false;
    }
    return (
      whatsAppQr.startsWith("data:image") ||
      whatsAppQr.startsWith("http://") ||
      whatsAppQr.startsWith("https://")
    );
  }, [whatsAppQr]);

  
  // Agent Delete Handler (Triggers Modal)
  const handleDeleteClick = () => {
    setDeleteDialogState({
      isOpen: true,
      type: "AGENT",
      title: "Delete Agent?",
      description: "Are you sure you want to delete this agent? All chat history and configuration will be lost. This action cannot be undone."
    });
  };

  const executeAgentDelete = async () => {
    if (!agent) return;
    setDeleteError("");
    setIsDeleting(true);
    try {
      console.log("🚀 Calling apiService.deleteAgent...");
      const res = await apiService.deleteAgent(agent.id);
      console.log("✅ Agent deleted successfully:", res);
      toast.success("Agent deleted successfully");
      router.push("/dashboard/agents");
    } catch (err) {
      console.error("❌ Failed to delete agent:", err);
      toast.error(err?.message || "Unable to delete this agent. Please try again.");
      setDeleteError(
        err?.message || "Unable to delete this agent. Please try again."
      );
      // specific error: still open modal? no we want to close it maybe?
      // Actually usually keep it open or close it. I'll close it.
      setDeleteDialogState(prev => ({ ...prev, isOpen: false }));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "Unknown";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Unknown";
    return parsed.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown";
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return "Unknown";
    return parsed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F1] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#2D2216] flex items-center justify-center mx-auto shadow-lg">
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Error Loading Agent
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadAgent} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
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

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#2D2216] flex items-center justify-center shadow-lg">
                      <Bot className="h-8 w-8 md:h-10 md:w-10 text-[#E68A44]" />
                    </div>
                    {/* Status Indicator */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                      agent.status === "ACTIVE" ? "bg-green-500" : "bg-gray-400"
                    )}></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#2D2216] break-words mb-2">
                      {agent.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[#5D4037]">
                      <div className="flex items-center gap-1">
                        <span className="text-xs uppercase tracking-wide font-bold opacity-70">ID:</span>
                        <code className="px-2 py-1 rounded-lg bg-[#FAF6F1] border border-[#E0D4BC] text-xs font-mono break-all text-[#2D2216]">
                          {agent.id}
                        </code>
                      </div>
                    </div>
                    {deleteError && (
                      <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{deleteError}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
                  <Link
                    href={`/dashboard/agents/${agent.id}/edit`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D2216] hover:bg-[#1A1410] text-white transition-all text-sm font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Settings className="h-4 w-4" />
                    Edit
                  </Link>
                  <Button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    size="sm"
                    style={{ background: '#DC2626' }}
                    className="text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                  <Badge
                    variant={agent.status === "ACTIVE" ? "success" : "secondary"}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-full",
                      agent.status === "ACTIVE"
                        ? "bg-[#E6F4EA] text-[#1E8E3E] border border-[#CEEAD6]"
                        : "bg-[#FAF6F1] text-[#5D4037] border border-[#E0D4BC]"
                    )}
                  >
                    {agent.status || "UNKNOWN"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2-Column Layout: Info (Left) | Test Chat (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Agent Information */}
          <div className="lg:col-span-2 space-y-8">
        {/* Google Auth Section */}
        {showGoogleIntegrationCard && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#2D2216]/5 flex items-center justify-center">
                         <Shield className="h-5 w-5 text-[#2D2216]" />
                    </div>
                    <CardTitle className="text-lg font-bold text-[#2D2216]">Google Integration</CardTitle>
                  </div>
                  <Badge
                    variant={googleAuthConnected ? "success" : googleAuthPending ? "warning" : "secondary"}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-full border shadow-sm",
                      googleAuthConnected
                        ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#CEEAD6]"
                        : googleAuthPending
                        ? "bg-[#FEF7E0] text-[#B06000] border-[#FCE8B2]"
                        : "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]"
                    )}
                  >
                    {googleAuthConnected
                      ? "Connected"
                      : googleAuthPending
                      ? "Waiting for approval"
                      : "Not connected"}
                  </Badge>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  {requiresGoogleAuth ? (
                    <p>
                      {googleAuthConnected
                        ? "Google Workspace actions are active for this agent."
                        : googleToolSummary
                        ? `This agent needs access to ${googleToolSummary}.`
                        : "Connect your Google Workspace account so Gmail and Calendar automations can run."}
                    </p>
                  ) : (
                    <p>
                      Aktifkan Gmail atau Calendar dari AgentForm terlebih dahulu supaya koneksi Google
                      tersedia. Setelah menambahkan tools tersebut, kembali ke halaman ini untuk menghubungkan akun.
                    </p>
                  )}
                  {googleAuthPrimaryToken?.expires_at && googleAuthConnected && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Access valid until {formatDateTime(googleAuthPrimaryToken.expires_at)}. Reconnect if the date
                        passes.
                      </span>
                    </div>
                  )}
                  {googleGrantedScopesDisplay.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="h-3.5 w-3.5" />
                        <span>Akses Google yang sudah diizinkan:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {googleGrantedScopesDisplay.map(({ key, label, Icon }) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {requiresGoogleAuth && googleToolSummary && (
                  <div className="flex flex-wrap gap-2">
                    {googleToolSummary.split(",").map((label) => {
                      const trimmed = label.trim();
                      if (!trimmed) return null;
                      const icon = trimmed.toLowerCase().includes("calendar") ? Calendar : Mail;
                      return (
                        <div
                          key={trimmed}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700"
                        >
                          {icon === Calendar ? (
                            <Calendar className="h-3 w-3 text-[#E68A44]" />
                          ) : (
                            <Mail className="h-3 w-3 text-red-500" />
                          )}
                          <span>{trimmed}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {/* Only show Connect Google button when NOT connected */}
                  {!googleAuthConnected && (
                    <Button
                      onClick={openGoogleConnectModal}
                      disabled={googleAuthChecking || googleAuthStarting}
                      style={{ background: '#2D2216' }}
                      className="text-white shadow-lg rounded-xl font-medium transition-all duration-200 hover:opacity-90"
                    >
                      {googleAuthStarting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Opening Google...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Connect Google
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    onClick={() => {
                      setGoogleAuthPollingEnabled(true);
                      void checkGoogleAuthStatus();
                    }}
                    disabled={googleAuthChecking}
                    variant="outline"
                    size="sm"
                  >
                    {googleAuthChecking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Status
                      </>
                    )}
                  </Button>
                </div>

                {googleAuthError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{googleAuthError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Configuration Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#2D2216]">
                <Settings className="h-5 w-5 text-[#E68A44]" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[#E68A44]" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Channel</span>
                  </div>
                  <p className="text-sm bg-[#FAF6F1] rounded-xl px-3 py-2 border border-[#E0D4BC] text-[#2D2216]">
                    {agentDescription?.includes('WhatsApp') ? 'WhatsApp' : 'Default'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#E68A44]" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</span>
                  </div>
                  <p className="text-sm bg-[#FAF6F1] rounded-xl px-3 py-2 border border-[#E0D4BC] text-[#2D2216]">
                    {agent.created_at ? formatDateTime(agent.created_at) : "Unknown"}
                  </p>
                </div>
              </div>

              {(agent.config?.system_message || agent.config?.system_prompt) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#E68A44]" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System Prompt</span>
                  </div>
                  <div className="relative">
                    <pre className={cn(
                      "whitespace-pre-wrap text-sm leading-relaxed text-[#2D2216] bg-[#FAF6F1] rounded-2xl p-4 border border-[#E0D4BC] font-mono overflow-hidden transition-all duration-300",
                      isSystemPromptExpanded ? "max-h-none" : "max-h-32"
                    )}>
                      {agent.config.system_message || agent.config.system_prompt}
                    </pre>
                    {/* Read More Toggle */}
                    <div className={cn(
                      "flex justify-center",
                      !isSystemPromptExpanded && "absolute bottom-0 left-0 right-0 pt-8 bg-gradient-to-t from-[#FAF6F1] to-transparent pb-2 rounded-b-2xl"
                    )}>
                      <button
                        onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)}
                        className="text-xs font-semibold text-[#E68A44] hover:text-[#D5793B] bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-[#E0D4BC] hover:bg-white transition-all shadow-sm"
                      >
                        {isSystemPromptExpanded ? "Read Less" : "Read More"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Integration Section */}
              {(agent?.config?.google_tools && Array.isArray(agent.config.google_tools) && agent.config.google_tools.length > 0) && (
                <div className="border-t border-border pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-[#E68A44]/20 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-[#E68A44]" />
                      </div>
                      <CardTitle className="text-lg">Google Integration</CardTitle>
                    </div>
                    <Badge
                      variant={googleAuthInfo.status === 'connected' ? "success" : "muted"}
                      className="px-3 py-1"
                    >
                      {googleAuthInfo.status === 'connected' ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>

                  <div className="bg-[#FAF6F1]/50 rounded-2xl p-5 border border-[#E0D4BC]">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {googleAuthInfo.status === 'connected' ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-amber-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#2D2216] mb-1">
                          {googleAuthInfo.status === 'connected'
                            ? 'Google Workspace Connected'
                            : 'Google Workspace Required'}
                        </h4>

                        <p className="text-xs text-[#5D4037] mb-3 leading-relaxed">
                          {googleAuthInfo.status === 'connected'
                            ? 'Your agent can access Gmail and Calendar to perform automated tasks.'
                            : 'Connect your Google account to enable Gmail and Calendar automation for this agent.'}
                        </p>

                        {/* Active Google Tools */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {agent.config.google_tools.map((tool, index) => {
                            let icon = Mail;
                            let label = tool;

                            if (tool.toLowerCase().includes('gmail')) {
                              icon = Mail;
                              label = 'Gmail';
                            } else if (tool.toLowerCase().includes('calendar')) {
                              icon = Calendar;
                              label = 'Calendar';
                            }

                            return (
                              <div key={index} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-[#E0D4BC] shadow-sm">
                                {icon === Mail ? (
                                  <Mail className="h-3.5 w-3.5 text-[#EA4335]" />
                                ) : (
                                  <Calendar className="h-3.5 w-3.5 text-[#E68A44]" />
                                )}
                                <span className="text-xs font-semibold text-[#2D2216]">{label}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action Button */}
                        {googleAuthInfo.status !== 'connected' && (
                          <Button
                            onClick={() => setShowGoogleConnectModal(true)}
                            style={{ background: '#2D2216' }}
                            className="w-full sm:w-auto text-white font-medium shadow-lg hover:opacity-90 transition-all"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect Google Account
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </CardContent>
          </Card>
        </motion.div>

        {/* Knowledge/RAG Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Knowledge Base (RAG)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-sm text-[#5D4037] leading-relaxed">
                Upload up to 10 documents (PDF, PPTX, DOCX, TXT), 20 MB per file, to enrich this agent&apos;s context.
              </div>

              {(knowledgeError || knowledgeSuccess) && (
                <div
                  className={cn(
                    "p-3 rounded-lg text-sm",
                    knowledgeError
                      ? "bg-destructive/10 border border-destructive/20 text-destructive"
                      : "bg-success/10 border border-success/20 text-success"
                  )}
                >
                  {knowledgeError || knowledgeSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col space-y-3">
                  <input
                    key={knowledgeInputKey}
                    type="file"
                    multiple
                    accept=".pdf,.pptx,.docx,.txt"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setKnowledgeSuccess("");
                      setKnowledgeError("");

                      if (!files.length) {
                        setSelectedKnowledgeFiles([]);
                        setKnowledgeInputKey(Date.now());
                        return;
                      }

                      if (files.length > 10) {
                        setKnowledgeError("You can upload up to 10 files at a time.");
                        setKnowledgeInputKey(Date.now());
                        return;
                      }

                      const oversized = files.find((file) => file.size > 20 * 1024 * 1024);
                      if (oversized) {
                        setKnowledgeError(
                          `${oversized.name} exceeds the 20 MB size limit. Please remove it.`
                        );
                        setKnowledgeInputKey(Date.now());
                        return;
                      }

                      setSelectedKnowledgeFiles(files);
                    }}
                    className="w-full text-sm text-[#5D4037] cursor-pointer file:mr-4 file:rounded-xl file:border-0 file:bg-[#2D2216] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white file:cursor-pointer hover:file:bg-[#1A1410] file:transition-all"
                    disabled={knowledgeUploading}
                  />
                  <Button
                    onClick={async () => {
                      if (!agent || !selectedKnowledgeFiles.length) {
                        setKnowledgeError("Select at least one file to upload.");
                        return;
                      }

                      setKnowledgeUploading(true);
                      setKnowledgeError("");
                      setKnowledgeSuccess("");
                      try {
                        await apiService.uploadAgentDocuments(agent.id, selectedKnowledgeFiles);
                        // Refresh knowledge list
                        const docs = await apiService.getAgentDocuments(agent.id);
                        const items = Array.isArray(docs)
                          ? docs
                          : Array.isArray(docs?.items)
                          ? docs.items
                          : Array.isArray(docs?.data)
                          ? docs.data
                          : [];
                        setKnowledge(items);
                        setKnowledgeSuccess("Knowledge uploaded successfully.");
                        toast.success("Knowledge uploaded successfully");
                        setSelectedKnowledgeFiles([]);
                        setKnowledgeInputKey(Date.now());
                      } catch (err) {
                        toast.error(err?.message || "Failed to upload knowledge. Please try again.");
                        setKnowledgeError(
                          err?.message || "Failed to upload knowledge. Please try again."
                        );
                      } finally {
                        setKnowledgeUploading(false);
                      }
                    }}
                    disabled={
                      knowledgeUploading || selectedKnowledgeFiles.length === 0
                    }
                    style={{ background: '#2D2216' }}
                    className="w-full text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:opacity-90"
                  >
                    {knowledgeUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Documents
                      </>
                    )}
                  </Button>
                </div>

                {selectedKnowledgeFiles.length > 0 && (
                  <div className="rounded-xl border border-dashed border-[#E0D4BC] bg-[#FAF6F1]/50 p-4">
                    <p className="text-sm font-medium text-[#2D2216] mb-2">
                      Files ready to upload:
                    </p>
                    <ul className="space-y-2 text-sm text-[#5D4037]">
                      {selectedKnowledgeFiles.map((file) => (
                        <li key={file.name} className="break-all flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#E68A44]" />
                          <span>{file.name}</span>
                          <span className="text-xs opacity-70">
                            ({formatBytes(file.size)})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Upload History
                </h3>
                {knowledgeLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-[#E68A44]" />
                  </div>
                ) : knowledge.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No knowledge documents uploaded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {knowledge.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-xl border border-[#E0D4BC] bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground break-words flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                {doc.filename}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded{" "}
                                {formatDateTime(doc.createdAt || doc.created_at)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                const documentId = doc?.id || doc?.upload_id || doc?.uploadId;
                                if (!documentId) {
                                   toast.error("Invalid document ID");
                                   return;
                                }
                                setDeleteDialogState({
                                  isOpen: true,
                                  type: "RAG",
                                  data: { documentId, filename: doc.filename },
                                  title: "Remove Document?",
                                  description: `Are you sure you want to remove "${doc.filename}"? This will delete all associated knowledge embeddings.`
                                });
                              }}

                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                            <span className="break-words flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              Size: {formatBytes(doc.sizeBytes ?? doc.size_bytes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <File className="h-3 w-3" />
                              Type: {doc.contentType || doc.content_type || "Unknown"}
                            </span>
                            <span className="break-all sm:col-span-2 flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              ID: {doc.id || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
          </div>

          {/* Right Column - Test Agent Chat (Sticky) */}
          <div className="lg:col-span-1 space-y-8">
        {/* Test Agent Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Test the Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Start a quick conversation to verify your configuration. Messages here use the live agent and tools you selected.
              </p>

              <div className="space-y-4">
                <div className="h-80 lg:h-[400px] overflow-y-auto rounded-2xl border border-[#E0D4BC] bg-[#FAF6F1] p-4 flex flex-col space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="m-auto text-center text-sm text-muted-foreground px-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#2D2216]/5 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-6 w-6 text-[#2D2216]" />
                      </div>
                      <p className="font-semibold text-[#2D2216]">No messages yet</p>
                      <p className="mt-1">
                        Ask your agent something, for example:{" "}
                        <span className="italic">
                          &ldquo;Summarise the last unread email in my inbox.&rdquo;
                        </span>
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((message) => {
                      const isUser = message.role === "user";
                      const bubbleClasses = isUser
                        ? "ml-auto bg-[#2D2216] text-[#FAF6F1] shadow-md"
                        : message.error
                        ? "mr-auto bg-red-50 text-red-900 border border-red-200"
                        : "mr-auto bg-white text-[#2D2216] border border-[#E0D4BC] shadow-sm";

                      return (
                        <div key={message.id} className="max-w-[85%] sm:max-w-[80%]">
                          <div
                            className={cn(
                              "rounded-2xl px-3 py-2 sm:px-4 sm:py-2 shadow-sm",
                              bubbleClasses
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {isUser ? "You" : "Agent"} ·{" "}
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {chatError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{chatError}</p>
                  </div>
                )}

                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!chatInput.trim() || !agent) {
                      return;
                    }

                    const userMessage = {
                      id: `user-${Date.now()}`,
                      role: "user",
                      text: chatInput.trim(),
                      timestamp: Date.now(),
                    };

                    setChatMessages((prev) => [...prev, userMessage]);
                    setChatInput("");
                    setChatError("");
                    setIsSending(true);

                    try {
                      const response = await apiService.executeAgent(
                        agent.id,
                        userMessage.text,
                        {},
                        sessionId
                      );

                      const payload = response?.response;
                      let replyText;
                      if (typeof payload === "string") {
                        replyText = payload;
                      } else if (payload?.output) {
                        replyText = payload.output;
                      } else if (payload?.result) {
                        replyText = payload.result;
                      } else if (
                        response?.message &&
                        response.message !== "Agent execution started"
                      ) {
                        replyText = response.message;
                      } else {
                        replyText =
                          "Execution completed. Check intermediate steps for additional context.";
                      }

                      const assistantMessage = {
                        id: `assistant-${Date.now()}`,
                        role: "assistant",
                        text: replyText,
                        timestamp: Date.now(),
                        details: payload?.intermediate_steps || payload?.tools_used || null,
                      };

                      setChatMessages((prev) => [...prev, assistantMessage]);
                    } catch (err) {
                      console.error("Failed to execute agent:", err);
                      setChatError(err?.message || "Agent failed to respond.");
                      setChatMessages((prev) => [
                        ...prev,
                        {
                          id: `assistant-error-${Date.now()}`,
                          role: "assistant",
                          text: "Sorry, I ran into an error while processing that request. Please try again.",
                          timestamp: Date.now(),
                          error: true,
                        },
                      ]);
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Type a message..."
                      className="w-full rounded-xl border border-[#E0D4BC] bg-white px-4 py-3 text-sm text-[#2D2216] placeholder:text-[#5D4037]/50 focus:outline-none focus:ring-2 focus:ring-[#E68A44]/20 focus:border-[#E68A44] transition-all pr-4"
                      disabled={isSending}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSending || !chatInput.trim()}
                    size="sm"
                    style={{ background: '#2D2216' }}
                    className="rounded-xl text-white shadow-lg hover:shadow-xl transition-all hover:opacity-90 px-4"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* WhatsApp Integration (Moved to Right Column) */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[#2D2216] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center shadow-md">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  WhatsApp
                </CardTitle>
                <Badge
                    variant={agent?.whatsapp_connected ? "success" : "secondary"}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md",
                      agent?.whatsapp_connected
                        ? "bg-[#E6F4EA] text-[#1E8E3E] border border-[#CEEAD6]"
                        : "bg-[#FAF6F1] text-[#5D4037] border border-[#E0D4BC]"
                    )}
                  >
                    {agent?.whatsapp_connected ? "Active" : "Offline"}
                  </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {whatsAppErrors[agent?.id] && !showWhatsAppQr && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">
                    {whatsAppErrors[agent.id]}
                  </div>
                )}

                <div className="bg-[#FAF6F1] rounded-xl border border-[#E0D4BC] p-4 text-center space-y-3 min-h-[200px] flex flex-col justify-center">
                    <p className="text-xs text-[#5D4037] leading-relaxed">
                        {agent?.whatsapp_connected
                            ? "Agent is actively responding to messages on WhatsApp."
                            : (whatsAppErrors[agent?.id] || "").includes("session already exists") 
                                ? "A session already exists. Please delete it before connecting again."
                                : "Connect your agent to enable WhatsApp messaging capabilities."}
                    </p>

                    {(whatsAppErrors[agent?.id] || "").includes("session already exists") ? (
                        <Button
                            type="button"
                            onClick={handleWhatsAppDeleteClick}
                            disabled={whatsAppDeleting || Boolean(whatsAppRefreshMap[agent?.id])}
                            style={{ background: '#DC2626' }}
                            className="w-full text-white shadow-md hover:shadow-lg transition-all rounded-xl font-medium"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Existing Session
                        </Button>
                    ) : !agent?.whatsapp_connected ? (
                      <Button
                        onClick={handleConnectWhatsApp}
                        disabled={Boolean(whatsAppRefreshMap[agent?.id])}
                        style={{ background: '#25D366' }}
                        className="w-full text-white shadow-md hover:shadow-lg transition-all rounded-xl font-medium"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Connect WhatsApp
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handleConnectWhatsApp}
                          disabled={Boolean(whatsAppRefreshMap[agent?.id])}
                          variant="outline"
                          className="w-full border-green-200 text-green-700 hover:bg-green-50 rounded-xl"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Re-scan QR
                        </Button>
                        <Button
                          onClick={handleDisconnectWhatsApp}
                          disabled={Boolean(whatsAppRefreshMap[agent?.id])}
                          variant="outline"
                          className="w-full border-red-200 text-red-700 hover:bg-red-50 rounded-xl"
                        >
                          <WifiOff className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                    )}
                </div>
            </CardContent>
          </Card>
        </motion.div>
          </div>
        </div>
      </div>

      {/* WhatsApp QR Modal - Apple Style */}
      {showWhatsAppQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md rounded-3xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/20 shadow-2xl backdrop-blur-xl p-8 max-h-[90vh] overflow-y-auto"
          >
            <Button
              onClick={closeWhatsAppQrPreview}
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
                <QrCode className="h-8 w-8 text-white" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Connect WhatsApp
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scan this QR code to link your agent to WhatsApp
                </p>
              </div>

              <div className="space-y-6">
                {agent?.whatsapp_connected ? (
                  <div className="space-y-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xl font-semibold text-green-600">Successfully Connected</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        WhatsApp is now connected to this agent. Messages can be sent and received.
                      </p>
                      {agent?.last_message_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Connected at {formatDateTime(agent.last_message_at)}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={closeWhatsAppQrPreview}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {whatsAppLoading ? (
                      <div className="space-y-6">
                        <div className="w-20 h-20 rounded-full border-4 border-gray-200 border-t-green-500 animate-spin mx-auto"></div>
                        <div className="space-y-3">
                          <p className="text-lg font-medium text-gray-900 dark:text-white">Generating QR Code...</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Please wait while we prepare your WhatsApp connection
                          </p>
                        </div>
                      </div>
                    ) : whatsAppQr ? (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
                          <Image
                            src={whatsAppQr.startsWith('data:') ? whatsAppQr : `data:image/png;base64,${whatsAppQr}`}
                            alt="WhatsApp QR Code"
                            width={256}
                            height={256}
                            unoptimized
                            className="h-auto w-64 mx-auto"
                          />
                        </div>

                        
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 space-y-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-base">How to connect:</h4>
                          <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                              <span>Open WhatsApp on your phone</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                              <span>Go to <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                              <span>Scan this QR code to connect</span>
                            </li>
                          </ol>
                        </div>

                        <div className="flex flex-col gap-3">
                          
                          <Button
                            onClick={handleRefreshWhatsAppStatus}
                            disabled={Boolean(whatsAppRefreshMap[agent?.id])}
                            variant="outline"
                            className="w-full rounded-full py-3 font-medium border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            {whatsAppRefreshMap[agent?.id] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Refreshing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Status
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={closeWhatsAppQrPreview}
                            variant="ghost"
                            className="w-full rounded-full py-3 font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-green-500 animate-spin mx-auto"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Preparing QR code... This may take a few seconds.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl rounded-3xl bg-white/95 backdrop-blur-xl border border-[#E0D4BC] p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <Button
              onClick={() => {
                setShowUpgradeModal(false);
                setUpgradeProcessing(false);
              }}
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Upgrade Required
                </h3>
                <p className="text-muted-foreground">
                  WhatsApp integration isn&apos;t available on the trial plan.
                  Upgrade to unlock WhatsApp messaging, automation, and QR connectivity.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {UPGRADE_PLAN_OPTIONS.map((plan) => {
                  const isActive = selectedUpgradePlan === plan.code;
                  return (
                    <button
                      key={plan.code}
                      onClick={() => setSelectedUpgradePlan(plan.code)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        isActive
                          ? "border-primary bg-primary/5 shadow-lg"
                          : "border-border hover:border-primary/60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-foreground">
                          {plan.name}
                        </span>
                        {isActive && (
                          <Badge className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {plan.priceLabel}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {plan.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setUpgradeProcessing(false);
                  }}
                  variant="outline"
                >
                  Maybe later
                </Button>
                <Button
                  onClick={handleUpgradeRedirect}
                  disabled={upgradeProcessing}
                >
                  {upgradeProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Continue to payment"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Google Connect Modal */}
      {showGoogleConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-xl border border-[#E0D4BC] p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <Button
              onClick={closeGoogleConnectModal}
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-[#E68A44]/10 flex items-center justify-center mx-auto text-[#E68A44]">
                <Power className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Connect Google to Activate Tools
                </h3>
                <p className="text-sm text-muted-foreground">
                  {googleToolSummary
                    ? `You selected ${googleToolSummary}. Authorise Google Workspace so the agent can act on your behalf.`
                    : "Authorise Google Workspace so the agent can use Gmail/Calendar actions."}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleGoogleConnectNow}
                  style={{ background: '#2D2216' }}
                  className="w-full text-white shadow-lg hover:opacity-90 transition-all"
                  disabled={googleAuthChecking || googleAuthStarting}
                >
                  {googleAuthStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Preparing Google flow...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Connect with Google
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSkipGoogleConnect}
                  variant="outline"
                  className="w-full"
                >
                  {confirmSkipGoogleConnect
                    ? "Lanjut tanpa Google (Saya paham risikonya)"
                    : "Lanjut tanpa Google"}
                </Button>
              </div>

              {confirmSkipGoogleConnect && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800 space-y-1">
                      <p>
                        Gmail dan Google Calendar tidak akan berfungsi sampai kamu
                        menyelesaikan koneksi ini. Agency harus memiliki akses resmi
                        untuk mengirim email dan membuat event.
                      </p>
                      <p>
                        Klik tombol di atas sekali lagi jika kamu ingin tetap melanjutkan
                        tanpa koneksi Google.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <Toaster position="top-center" />
      <DeleteConfirmationDialog 
        isOpen={deleteDialogState.isOpen}
        title={deleteDialogState.title}
        description={deleteDialogState.description}
        isDeleting={isDeleting || whatsAppDeleting || isRagDeleting}
        onCancel={() => setDeleteDialogState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          if (deleteDialogState.type === "AGENT") {
            await executeAgentDelete();
          } else if (deleteDialogState.type === "WHATSAPP") {
            await executeWhatsAppDelete();
          } else if (deleteDialogState.type === "RAG") {
             // RAG Execute Inline
             if (!agent?.id || !deleteDialogState.data?.documentId) return;
             setIsRagDeleting(true);
             try {
                await apiService.deleteAgentDocument(agent.id, deleteDialogState.data.documentId);
                toast.success("Knowledge document deleted");
                // Refresh
                const docs = await apiService.getAgentDocuments(agent.id);
                const items = Array.isArray(docs) ? docs : (docs?.items || docs?.data || []);
                setKnowledge(items);
                setDeleteDialogState(prev => ({ ...prev, isOpen: false }));
             } catch(err) {
                toast.error(err?.message || "Failed to delete document");
             } finally {
                setIsRagDeleting(false);
             }
          }
        }}
      />
    </div>
  );
}
