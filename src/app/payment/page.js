"use client";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Calendar,
  CheckCircle,
  CreditCard,
  ShieldCheck,
  Gift,
  Zap,
  Loader2,
  ArrowRight,
  Check,
  AlertCircle,
  } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  readTrialAgentPayload,
  clearTrialAgentPayload,
} from "@/lib/trialStorage";
import { markTrialEmailUsed } from "@/lib/trialGuard";
import toast, { Toaster } from 'react-hot-toast';

const toastStyle = {
  background: '#FFFFFF',
  color: '#2D2216',
  padding: '16px 20px',
  borderRadius: '20px',
  border: '1px solid #E0D4BC',
  boxShadow: '0 8px 24px rgba(45, 34, 22, 0.12), 0 2px 8px rgba(45, 34, 22, 0.08)',
  fontSize: '14px',
  fontWeight: '600',
};

const PLAN_OPTIONS = [
  {
    code: "TRIAL",
    name: "Free Trial",
    subtitle: "Perfect for getting started",
    price: "0",
    duration_days: 14,
    badge: "Start free",
    description: "Test Clevio for two weeks with full access to core features.",
    features: [
      "Create up to 2 agents",
      "Sample knowledge base",
      "Community support",
      "Basic automation tools",
    ],
    icon: Gift,
    highlight: "0 Rp - No credit card required",
  },
  {
    code: "PRO_M",
    name: "Pro Monthly",
    subtitle: "Popular for growing businesses",
    price: "750000",
    originalPrice: "1000000",
    duration_days: 30,
    badge: "Most popular",
    description: "Scale your team with monthly flexibility and all features.",
    features: [
      "Unlimited agents",
      "WhatsApp automation",
      "Advanced tools & RAG",
      "Priority chat support",
      "Custom integrations",
    ],
    icon: Calendar,
    recommended: true,
    highlight: "25% OFF for limited time",
  },
  {
    code: "PRO_Y",
    name: "Pro Yearly",
    subtitle: "Best value for established businesses",
    price: "1000000",
    duration_days: 365,
    badge: "Best value",
    description: "Maximize savings with comprehensive yearly coverage.",
    features: [
      "Everything in Pro Monthly",
      "Dedicated success manager",
      "Early feature access",
      "1:1 onboarding workshop",
      "Custom training sessions",
    ],
    icon: Zap,
    discountNote: "Save Rp 1.000.000 vs monthly",
    highlight: "Most popular choice",
  },
];

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] via-[#F5F2ED] to-[#EDE8E1] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#2D2216] to-[#1A1410] flex items-center justify-center mx-auto shadow-[0_4px_16px_rgba(45,34,22,0.24)]">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#2D2216]">Loading Payment Details</h3>
              <p className="text-sm text-[#5D4037]">Please wait while we prepare your payment options...</p>
            </div>
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPlan = searchParams?.get("plan") || "";
  const queryEmail = searchParams?.get("email") || "";
  const queryUserId = searchParams?.get("user_id") || "";
  const searchStatus = searchParams?.get("status");
  const searchOrderId = searchParams?.get("order_id");
  const transactionStatusQuery = searchParams?.get("transaction_status") || "";
  const [plans] = useState(PLAN_OPTIONS);
  const [selectedPlan, setSelectedPlan] = useState(queryPlan);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(searchOrderId || "");
  const [storedPlan, setStoredPlan] = useState(queryPlan);
  const [pendingRegistration, setPendingRegistration] = useState(() =>
    queryEmail && queryUserId
      ? { email: String(queryEmail), user_id: String(queryUserId) }
      : null
  );
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [statusState, setStatusState] = useState({
    state: "idle",
    message: "",
  });
  const [orderSuffix, setOrderSuffix] = useState(() => Date.now().toString());
  const {
    user,
    loading: authLoading,
    updateSubscription,
    applySubscription,
  } = useAuth();
  const hasRedirectedRef = useRef(false);
  const [trialAgentDraft, setTrialAgentDraft] = useState(null);
  const [trialCredentials, setTrialCredentials] = useState(null);

  const extractPlanFromOrderId = (value) => {
    if (!value || typeof value !== "string") {
      return null;
    }
    const segments = value.split("-");
    return segments[segments.length - 1] || null;
  };

  const resolvePendingPlan = useCallback(
    (candidateOrderId) => {
      if (storedPlan) return storedPlan;
      if (selectedPlan) return selectedPlan;
      return extractPlanFromOrderId(candidateOrderId);
    },
    [selectedPlan, storedPlan]
  );

  const clearTrialCredentials = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem("trialRegistrationCredentials");
      } catch (error) {
        console.warn("Failed to clear trial credentials from storage", error);
      }
    }
    setTrialCredentials(null);
  }, []);

  const completeTrialProvisioning = useCallback(
    async (activeEmail) => {
      if (!trialAgentDraft?.agentPayload || !activeEmail) {
        return;
      }

      const agentPayload = {
        ...trialAgentDraft.agentPayload,
      };
      if (!agentPayload.plan_code) {
        agentPayload.plan_code = "TRIAL";
      }

      // Check if we have an API key before attempting to create agent
      const hasApiKey = apiService.hasApiKey();
      if (!hasApiKey) {
        // No API key available - preserve payload for creation after login
        console.warn("[Trial] No API key available for agent creation. Payload will be created after login.");
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              "trialPendingAgentPayload",
              JSON.stringify({ agentPayload, email: activeEmail, createdAt: new Date().toISOString() })
            );
          }
        } catch (err) {
          console.warn("[Trial] Failed to preserve agent payload for later", err);
        }
        setTrialAgentDraft(null);
        clearTrialCredentials();
        return;
      }

      try {
        await apiService.createAgent(agentPayload);
        setTrialAgentDraft(null);
        clearTrialCredentials();
      } catch (createError) {
        console.error("[Trial] Failed to create agent during trial provisioning", createError);
        // Preserve payload for later creation
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              "trialPendingAgentPayload",
              JSON.stringify({ agentPayload, email: activeEmail, createdAt: new Date().toISOString() })
            );
          }
        } catch (err) {
          console.warn("[Trial] Failed to preserve agent payload for later", err);
        }
        setTrialAgentDraft(null);
        clearTrialCredentials();
      }
    },
    [trialAgentDraft, clearTrialCredentials]
  );

  const finalizeSuccess = useCallback(
    async (latestOrderId, overrides = {}) => {
      if (isFinalizing) {
        return;
      }
      setIsFinalizing(true);

      try {
        const effectiveOrderId = latestOrderId || orderId || null;
        const planCodeOverride =
          overrides.planCode || resolvePendingPlan(effectiveOrderId);

        const normalizedPlanCode = planCodeOverride
          ? String(planCodeOverride).toUpperCase()
          : null;

        if (normalizedPlanCode) {
          apiService.setPlanCode(planCodeOverride);
        }

        const resolvedEmail =
          overrides.email ||
          user?.email ||
          pendingRegistration?.email ||
          queryEmail ||
          "";

        if (normalizedPlanCode === "TRIAL" && resolvedEmail) {
          try {
            await completeTrialProvisioning(resolvedEmail);
          } catch (err) {
            console.warn("Failed to complete trial provisioning", err);
          }
        } else if (!normalizedPlanCode) {
          clearTrialCredentials();
          clearTrialAgentPayload();
          setTrialAgentDraft(null);
        }

        if (user) {
          try {
            await updateSubscription?.();
          } catch (err) {
            console.warn(
              "Failed to refresh subscription after settlement",
              err
            );
          }

          if (planCodeOverride) {
            applySubscription?.({
              is_active: true,
              plan_code: planCodeOverride,
            });
          }

          setOrderId("");
          setOrderSuffix(Date.now().toString());
          setStoredPlan("");
          setPendingRegistration(null);
          setStatusState({
            state: "success",
            message: "Payment successful! Taking you to your dashboard.",
          });
          toast.success("Payment successful! Redirecting to dashboard...", { style: toastStyle });
          hasRedirectedRef.current = true;
          router.replace("/dashboard");
          return;
        }

        setOrderId("");
        setOrderSuffix(Date.now().toString());
        setStoredPlan("");
        setPendingRegistration(null);
        setStatusState({
          state: "success",
          message: "Payment settled! Please log in to continue.",
        });
        toast.success("Payment settled! Please log in to continue.", { style: toastStyle });
        const loginParams = new URLSearchParams({ settlement: "1" });
        if (normalizedPlanCode === "TRIAL") {
          loginParams.set("trial", "1");
        }
        if (resolvedEmail) {
          loginParams.set("email", resolvedEmail);
        }
        hasRedirectedRef.current = true;
        router.replace(`/login?${loginParams.toString()}`);
      } finally {
        setIsFinalizing(false);
      }
    },
    [
      applySubscription,
      clearTrialCredentials,
      completeTrialProvisioning,
      isFinalizing,
      orderId,
      pendingRegistration,
      queryEmail,
      resolvePendingPlan,
      router,
      updateSubscription,
      user,
    ]
  );

  useEffect(() => {
    if (queryEmail && queryUserId) {
      setPendingRegistration({
        email: String(queryEmail),
        user_id: String(queryUserId),
      });
    }
    if (queryPlan) {
      setStoredPlan(queryPlan);
      apiService.setPlanCode(queryPlan);
    }
    if (searchOrderId) {
      setOrderId(searchOrderId);
      apiService.setLastOrderId(searchOrderId);
    }
  }, [queryEmail, queryPlan, queryUserId, searchOrderId]);

  useEffect(() => {
    const snapshot = readTrialAgentPayload();
    if (snapshot) {
      setTrialAgentDraft(snapshot);
    }
    return () => {
      try {
        clearTrialAgentPayload();
      } catch (error) {
        console.warn("Failed to clear pending trial agent payload", error);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.sessionStorage.getItem(
      "trialRegistrationCredentials"
    );
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTrialCredentials(parsed);
      } catch (error) {
        console.warn("Failed to parse stored trial credentials", error);
        window.sessionStorage.removeItem("trialRegistrationCredentials");
      }
    }

    return () => {
      try {
        window.sessionStorage.removeItem("trialRegistrationCredentials");
      } catch (error) {
        console.warn("Failed to clear trial credentials from storage", error);
      }
    };
  }, []);

  const isSettled = useCallback((transaction, raw) => {
    const candidates = [
      transaction?.transaction_status,
      raw?.transaction_status,
      transaction?.status,
      raw?.status,
      transaction?.payment_status,
      raw?.payment_status,
    ];

    for (const value of candidates) {
      if (value === true) {
        return true;
      }
      if (typeof value === "string" && value.trim()) {
        const normalized = value.trim().toLowerCase();
        if (
          [
            "settlement",
            "capture",
            "settled",
            "success",
            "paid",
            "paid_off",
            "payment_successful",
          ].includes(normalized)
        ) {
          return true;
        }
      }
    }

    if (transaction?.success === true || raw?.success === true) {
      return true;
    }

    return false;
  }, []);

  const fetchTransactionStatus = useCallback(async () => {
    try {
      const response = await apiService.getInformationN8N(orderId, orderSuffix);

      if (!response) {
        return { transaction: null, raw: null };
      }

      const normalized = (() => {
        if (Array.isArray(response)) {
          return response[0] || null;
        }

        if (response?.data) {
          if (Array.isArray(response.data)) {
            return response.data[0] || null;
          }
          return response.data;
        }

        if (response?.payload) {
          if (Array.isArray(response.payload)) {
            return response.payload[0] || null;
          }
          return response.payload;
        }

        if (response?.result) {
          if (Array.isArray(response.result)) {
            return response.result[0] || null;
          }
          return response.result;
        }

        return response;
      })();

      if (
        normalized &&
        response?.transaction_status &&
        !normalized.transaction_status
      ) {
        normalized.transaction_status = response.transaction_status;
      }

      console.log("[payment] n8n status payload", {
        orderId,
        raw: response,
        normalized,
      });

      const apiAccessToken =
        response?.api_access_token ||
        response?.access_token ||
        normalized?.api_access_token ||
        normalized?.access_token ||
        null;

      if (apiAccessToken) {
        apiService.setApiKey(apiAccessToken);
      }

      const sessionToken =
        response?.session_token ||
        response?.session_access_token ||
        normalized?.session_token ||
        normalized?.session_access_token ||
        null;

      if (sessionToken) {
        apiService.setSessionToken(sessionToken);
      }

      return { transaction: normalized, raw: response };
    } catch (error) {
      console.warn("Unable to fetch payment status from n8n", error);
      return { transaction: null, raw: null };
    }
  }, [orderId, orderSuffix]);

  const verifyPayment = useCallback(
    async ({ silent = false } = {}) => {
      if (!user && !pendingRegistration) {
        return;
      }
      if (!silent) {
        setStatusState({
          state: "checking",
          message: "Confirming your payment with our system...",
        });
      }
      try {
        const { transaction, raw } = await fetchTransactionStatus();

        const derivedOrderId =
          transaction?.order_id || raw?.order_id || raw?.orderId || null;
        if (!orderId && derivedOrderId) {
          setOrderId(derivedOrderId);
          apiService.setLastOrderId(derivedOrderId);
        }

        const transactionStatus = transaction?.transaction_status
          ? String(transaction.transaction_status).toLowerCase()
          : raw?.transaction_status
          ? String(raw.transaction_status).toLowerCase()
          : null;

        if (
          transactionStatus === "settlement" ||
          transactionStatus === "capture" ||
          isSettled(transaction, raw)
        ) {
          await finalizeSuccess(derivedOrderId ?? orderId);
          return;
        }

        if (
          transactionStatus &&
          transactionStatus !== "settlement" &&
          transactionStatus !== "capture" &&
          !isSettled(transaction, raw)
        ) {
          if (!silent) {
            setStatusState({ state: "idle", message: "" });
            const msg = transactionStatus === "pending"
              ? "Your payment is still pending. We will keep checking automatically."
              : `Latest payment status: ${transactionStatus}.`;
            toast.error(msg, { style: toastStyle, duration: 5000 });
          }
          return;
        }

        if (!silent) {
          setStatusState({ state: "idle", message: "" });
          toast.error("We have not received a settlement confirmation yet.", { style: toastStyle, duration: 5000 });
        }
      } catch (_err) {
        if (!silent) {
          setStatusState({ state: "idle", message: "" });
          toast.error("Could not confirm your payment. Please refresh or try again.", { style: toastStyle });
        }
      }
    },
    [
      fetchTransactionStatus,
      orderId,
      finalizeSuccess,
      pendingRegistration,
      isSettled,
      user,
    ]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user?.subscription?.is_active) {
      const cachedOrder =
        typeof apiService.getLastOrderId === "function"
          ? apiService.getLastOrderId()
          : null;
      const activeOrderId = orderId || cachedOrder || null;
      if (!activeOrderId) {
        return;
      }
      const run = async () => {
        await finalizeSuccess(activeOrderId, {
          planCode: resolvePendingPlan(activeOrderId),
        });
      };
      void run();
      return;
    }

    if (!orderId) {
      const rememberedOrderId =
        searchOrderId ||
        (typeof apiService.getLastOrderId === "function"
          ? apiService.getLastOrderId()
          : null);
      if (rememberedOrderId) {
        setOrderId(rememberedOrderId);
        apiService.setLastOrderId(rememberedOrderId);
      }
    }

    if (searchStatus || searchOrderId || orderId) {
      verifyPayment();
    }
  }, [
    authLoading,
    user,
    verifyPayment,
    searchStatus,
    searchOrderId,
    orderId,
    finalizeSuccess,
    resolvePendingPlan,
  ]);

  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }
    const normalized = transactionStatusQuery.toLowerCase();
    if (
      normalized &&
      ["settlement", "capture", "success", "paid", "paid_off"].includes(
        normalized
      )
    ) {
      const effectiveOrderId = searchOrderId || orderId || null;
      const planCodeOverride = resolvePendingPlan(effectiveOrderId);
      void finalizeSuccess(effectiveOrderId, {
        planCode: planCodeOverride,
        email: pendingRegistration?.email || queryEmail || "",
      });
    }
  }, [
    finalizeSuccess,
    orderId,
    pendingRegistration?.email,
    queryEmail,
    resolvePendingPlan,
    searchOrderId,
    transactionStatusQuery,
  ]);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const interval = setInterval(() => {
      void verifyPayment({ silent: true });
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId, verifyPayment]);

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error("Please select a payment plan", { style: toastStyle });
      return;
    }

    const registrationEmail =
      pendingRegistration?.email || queryEmail || "";
    const registrationUserId =
      pendingRegistration?.user_id || queryUserId || "";

    const activeEmail = registrationEmail || user?.email || "";
    const activeUserId = registrationUserId || user?.user_id || "";

    if (!activeEmail || !activeUserId) {
      toast.error("Missing registrant information. Please restart registration.", { style: toastStyle });
      return;
    }

    if (selectedPlan === "TRIAL") {
      if (!trialAgentDraft?.agentPayload) {
        toast.error("We lost your trial configuration. Please restart from the template gallery.", { style: toastStyle });
        return;
      }
      if (!trialCredentials?.password) {
        toast.error("Trial activation requires your registration credentials. Please restart.", { style: toastStyle });
        return;
      }

      setLoading(true);
      setStatusState({
        state: "processing",
        message: "Activating your free trial…",
      });

      try {
        const response = await fetch(
          "https://n8n.srv651498.hstgr.cloud/webhook/registerTrial",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: activeUserId,
              email: activeEmail,
              password: trialCredentials.password,
              plan_code: "TRIAL",
            }),
          }
        );

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(
            detail || "Trial activation webhook returned an error."
          );
        }

        const data = await response.json().catch(() => ({}));
        const webhookApiKey =
          data?.access_token ||
          data?.token ||
          data?.api_key ||
          data?.apiKey ||
          null;

        if (webhookApiKey) {
          apiService.setApiKey(webhookApiKey);
        } else {
          // n8n webhook succeeded but didn't return API key
          // Wait a moment for backend to activate the account, then retry with backoff
          const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          const maxRetries = 3;
          let apiKeyGenerated = false;
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            // Wait before each attempt (500ms, 1000ms, 1500ms)
            await delay(attempt * 500);
            
            try {
              await apiService.generateApiKey({
                username: activeEmail,
                password: trialCredentials.password,
                planCode: "TRIAL",
              });
              apiKeyGenerated = true;
              break;
            } catch (keyError) {
              const errorMessage = String(keyError?.message || "").toLowerCase();
              const isInactiveError = errorMessage.includes("inactive");
              
              console.warn(`[Trial] API key generation attempt ${attempt}/${maxRetries} failed`, {
                error: keyError?.message,
                isInactiveError,
              });
              
              // If it's not an inactive error, throw immediately
              if (!isInactiveError) {
                throw keyError;
              }
              
              // If this is the last attempt with credentials, try the trial endpoint
              if (attempt === maxRetries) {
                console.warn("[Trial] Account still inactive. Trying /auth/api-key/trial endpoint...");
                try {
                  // Fallback: use trial endpoint which doesn't require active account
                  const trialKeyResponse = await fetch(
                    `${apiService.baseUrl}/auth/api-key/trial`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ip_user: "frontend-trial",
                        email: activeEmail,
                        user_id: activeUserId,
                      }),
                    }
                  );
                  
                  if (trialKeyResponse.ok) {
                    const trialKeyData = await trialKeyResponse.json().catch(() => ({}));
                    const trialKey =
                      trialKeyData?.access_token ||
                      trialKeyData?.token ||
                      trialKeyData?.api_key ||
                      null;
                    if (trialKey) {
                      apiService.setApiKey(trialKey);
                      apiKeyGenerated = true;
                      console.log("[Trial] Successfully obtained API key via trial endpoint");
                    }
                  }
                } catch (trialEndpointError) {
                  console.warn("[Trial] Trial endpoint fallback failed", trialEndpointError);
                }
                
                if (!apiKeyGenerated) {
                  console.warn("[Trial] All API key generation methods failed. Login flow will handle activation.");
                }
              }
            }
          }
        }

        apiService.setPlanCode("TRIAL");
        markTrialEmailUsed(activeEmail);
        setStoredPlan("TRIAL");

        await completeTrialProvisioning(activeEmail);

        setStatusState({
          state: "success",
          message: "Trial activated! Redirecting you to login.",
        });
        toast.success("Trial activated! Redirecting to login...", { style: toastStyle });
        hasRedirectedRef.current = true;
        const loginParams = new URLSearchParams({ trial: "1" });
        loginParams.set("email", activeEmail);
        router.replace(`/login?${loginParams.toString()}`);
      } catch (error) {
        console.error("Trial activation failed", error);
        toast.error(error?.message || "Failed to activate free trial. Please try again.", { style: toastStyle });
        setStatusState({
          state: "error",
          message: "Trial activation failed.",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      const planDetails = PLAN_OPTIONS.find(
        (plan) => plan.code === selectedPlan
      );

      const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      setOrderSuffix(uniqueSuffix);

      const chargeValue = planDetails?.price || "0";
      const webhookPayload = {
        user_id: activeUserId,
        email: activeEmail,
        plan_code: selectedPlan,
        charge: chargeValue,
        harga: chargeValue,
        order_suffix: uniqueSuffix,
        source: "frontend",
      };

      setStoredPlan(selectedPlan);
      apiService.setPlanCode(selectedPlan);

      const webhookResponse = await apiService.notifyPaymentWebhook(
        webhookPayload
      );
      console.log("[payment] webhook response", webhookResponse);

      if (webhookResponse?.access_token) {
        apiService.setApiKey(webhookResponse.access_token);
      }

      const paymentMessage =
        webhookResponse?.message ||
        `Payment request submitted for ${planDetails?.name || selectedPlan}.`;
      toast.success(paymentMessage, { style: toastStyle });

      const generatedOrderId =
        webhookResponse?.order_id || webhookResponse?.data?.order_id || null;
      const transactionStatusRaw =
        webhookResponse?.transaction_status ||
        webhookResponse?.data?.transaction_status ||
        null;
      const statusRaw =
        webhookResponse?.status || webhookResponse?.data?.status || null;
      const normalizedTransactionStatus =
        typeof transactionStatusRaw === "string"
          ? transactionStatusRaw.toLowerCase()
          : null;
      const normalizedStatus =
        typeof statusRaw === "string" ? statusRaw.toLowerCase() : null;
      const settlementStates = new Set(["settlement", "capture", "completed"]);
      const isImmediateSettlement =
        settlementStates.has(normalizedTransactionStatus || "") ||
        settlementStates.has(normalizedStatus || "") ||
        (webhookResponse?.success === true &&
          normalizedTransactionStatus === "settlement");
      if (generatedOrderId) {
        setOrderId(generatedOrderId);
        apiService.setLastOrderId(generatedOrderId);
      } else {
        setOrderId("");
        apiService.clearLastOrderId();
      }

      const paymentRedirect =
        webhookResponse?.redirect_url ||
        webhookResponse?.redirectUrl ||
        webhookResponse?.payment_url ||
        webhookResponse?.url ||
        webhookResponse?.snap_url ||
        webhookResponse?.deeplink_url ||
        webhookResponse?.data?.redirect_url ||
        webhookResponse?.data?.payment_url ||
        webhookResponse?.data?.snap_url ||
        webhookResponse?.data?.url ||
        "";
      if (paymentRedirect) {
        setStatusState({
          state: "checking",
          message: "Redirecting you to the Midtrans payment page...",
        });
        try {
          window.location.assign(paymentRedirect);
        } catch (_err) {
          window.location.href = paymentRedirect;
        }
        return;
      }

      if (isImmediateSettlement) {
        await finalizeSuccess(generatedOrderId, { planCode: selectedPlan });
        return;
      }

      setStatusState({
        state: "checking",
        message: "Waiting for payment confirmation...",
      });

      if (generatedOrderId) {
        void verifyPayment({ silent: true });
      } else {
        toast.error("Payment request submitted. Please check your email for instructions.", { style: toastStyle, duration: 6000 });
        console.warn(
          "Payment webhook response did not include a redirect URL or settlement status",
          webhookResponse
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed", { style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    const numericPrice =
      typeof price === "string" ? Number(price) : Number(price || 0);
    if (numericPrice === 0) {
      return "Free";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number.isNaN(numericPrice) ? 0 : numericPrice);
  };

  const renderStatusOverlay = () => {
    if (statusState.state === "idle") {
      return null;
    }
    const isChecking = statusState.state === "checking" || statusState.state === "processing";
    const isError = statusState.state === "error";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.24)] border border-white/60"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
            {isChecking ? (
              <div className="bg-gradient-to-b from-[#2D2216] to-[#1A1410] rounded-full h-16 w-16 flex items-center justify-center shadow-[0_4px_16px_rgba(45,34,22,0.24)]">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            ) : isError ? (
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full h-16 w-16 flex items-center justify-center shadow-[0_4px_16px_rgba(220,38,38,0.24)]">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full h-16 w-16 flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.24)]">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#2D2216] mb-2">
            {isChecking ? "Processing Payment" : isError ? "Payment Failed" : "Payment Successful"}
          </h2>
          <p className="text-[#5D4037] font-medium">{statusState.message}</p>

          {!isChecking && !isError && (
            <div className="mt-6">
              <div className="w-full bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  <span>Transaction confirmed</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] via-[#F5F2ED] to-[#EDE8E1] relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Subtle gradient orbs */}
      <div className="absolute top-[-5%] right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-[#E68A44]/10 to-[#D87A36]/5 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-[#2D2216]/5 to-transparent rounded-full blur-3xl opacity-30"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {renderStatusOverlay()}

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2D2216]">
              Choose Your Perfect Plan
            </h1>
            <p className="text-base md:text-lg text-[#5D4037] max-w-2xl mx-auto font-medium">
              Unlock powerful AI automation, WhatsApp workflows, and dedicated support
            </p>
          </div>
        </motion.div>

        {/* Trust Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-[#5D4037] font-medium">
            <BadgeCheck className="h-4 w-4 text-[#E68A44]" />
            <span>Secure Payment Processing</span>
          </div>
        </motion.div>

        {/* Plan Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:gap-6 lg:grid-cols-3 mb-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <PlanCard
                plan={plan}
                isSelected={selectedPlan === plan.code}
                onSelect={() => setSelectedPlan(plan.code)}
                formatPrice={formatPrice}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Payment Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-4"
        >
          <button
            onClick={handlePayment}
            disabled={loading || !selectedPlan}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:from-[#1A1410] hover:to-[#0D0A08] text-white font-bold rounded-2xl shadow-[0_4px_16px_rgba(45,34,22,0.24),0_1px_4px_rgba(45,34,22,0.12)] hover:shadow-[0_6px_24px_rgba(45,34,22,0.32),0_2px_8px_rgba(45,34,22,0.16)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue to Payment
                <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </button>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#5D4037]">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#E0D4BC] shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#E0D4BC] shadow-sm">
              <CreditCard className="h-4 w-4 text-[#E68A44]" />
              <span className="font-medium">Bank Transfer</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#E0D4BC] shadow-sm">
              <BadgeCheck className="h-4 w-4 text-[#E68A44]" />
              <span className="font-medium">Instant Access</span>
            </div>
          </div>

          <p className="text-xs text-[#8D7F71] font-medium">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function PlanCard({ plan, isSelected, onSelect, formatPrice }) {
  const Icon = plan.icon || Gift;
  return (
    <div
      className={`relative cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] rounded-[24px] h-full ${
        isSelected
          ? "ring-2 ring-[#E68A44] ring-offset-2"
          : ""
      }`}
      onClick={onSelect}
    >
      <div className={`bg-white/95 backdrop-blur-xl rounded-[24px] p-5 md:p-6 shadow-[0_4px_20px_rgba(45,34,22,0.06),0_2px_6px_rgba(45,34,22,0.04)] border h-full flex flex-col ${
        isSelected ? "border-[#E68A44]" : "border-[#E0D4BC] hover:border-[#E68A44]/40"
      }`}>
        {plan.badge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <div
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md whitespace-nowrap ${
                plan.recommended
                  ? "bg-gradient-to-b from-[#2D2216] to-[#1A1410] text-white"
                  : "bg-white text-[#5D4037] border border-[#E0D4BC]"
              }`}
            >
              {plan.badge}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-3 pt-2">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${
            isSelected ? "bg-[#E68A44]/10 border-[#E68A44]/20" : "bg-[#FAF6F1] border-[#E0D4BC]"
          }`}>
            <Icon
              className={`h-6 w-6 ${
                isSelected ? "text-[#E68A44]" : "text-[#8D7F71]"
              }`}
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#2D2216]">{plan.name}</h3>
            <p className="text-xs text-[#5D4037] mt-0.5 font-medium">{plan.subtitle}</p>
          </div>
        </div>

        {/* Price Section */}
        <div className="py-4 border-y border-[#E0D4BC] my-4 space-y-2">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1 flex-wrap">
              <span className="text-2xl md:text-3xl font-extrabold text-[#2D2216]">
                {formatPrice(plan.price)}
              </span>
              <span className="text-sm text-[#8D7F71] font-medium">/month</span>
            </div>

            {plan.originalPrice && (
              <div className="text-xs text-[#8D7F71] line-through mt-1">
                {formatPrice(plan.originalPrice)}
              </div>
            )}

            {plan.discountNote && (
              <div className="flex items-center justify-center mt-2">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {plan.discountNote}
                </span>
              </div>
            )}
          </div>

          {plan.highlight && (
            <div className="flex items-center justify-center gap-1.5">
              <Gift className="h-3 w-3 text-[#E68A44]" />
              <span className="text-xs font-semibold text-[#E68A44]">{plan.highlight}</span>
            </div>
          )}
        </div>

        {/* Select Button */}
        <button
          onClick={onSelect}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
            isSelected
              ? "bg-gradient-to-b from-[#2D2216] to-[#1A1410] text-white shadow-[0_4px_12px_rgba(45,34,22,0.2)]"
              : "bg-white border-2 border-[#E0D4BC] text-[#5D4037] hover:bg-[#FAF6F1] hover:border-[#E68A44]/40"
          }`}
        >
          {plan.code === "TRIAL" ? "Get Started" : isSelected ? "Selected" : "Choose Plan"}
        </button>

        {/* Features */}
        <div className="mt-4 flex-1">
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  isSelected ? "text-[#E68A44]" : "text-[#8D7F71]"
                }`} />
                <span className="text-xs text-[#5D4037] font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <input
        type="radio"
        name="plan"
        value={plan.code}
        checked={isSelected}
        onChange={onSelect}
        className="sr-only"
      />
    </div>
  );
}
