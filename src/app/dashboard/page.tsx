"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, RefreshCw, Plus, Users, Loader2 } from "lucide-react";

import { useDashboardData } from "./hooks/useDashboardData";
import { useMobileDetection } from "./hooks/useMobileDetection";
import { useDashboardActions } from "./hooks/useDashboardActions";
import { StatsCard } from "./components/stats-card";
import { RecentAgents } from "./components/recent-agents";

// Loading state component
const DashboardSkeleton = () => (
  <div className="space-y-8">
    {/* Header Skeleton */}
    <div className="space-y-2">
      <div className="h-8 w-40 bg-[#E0D4BC] rounded-lg animate-pulse" />
      <div className="h-5 w-80 bg-[#E0D4BC]/60 rounded-lg animate-pulse" />
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#E0D4BC] shadow-sm animate-pulse">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="h-3 w-24 bg-[#E0D4BC] rounded" />
              <div className="h-10 w-16 bg-[#E0D4BC] rounded" />
              <div className="h-4 w-32 bg-[#E0D4BC]/60 rounded" />
            </div>
            <div className="w-12 h-12 bg-[#E68A44]/10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>

    {/* Recent Agents Skeleton */}
      <div className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 border-b border-[#E0D4BC] flex justify-between items-center">
          <div className="h-6 w-32 bg-[#E0D4BC] rounded" />
          <div className="h-10 w-20 bg-[#2D2216]/10 rounded-xl" />
        </div>
        <div className="p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#FAF6F1]/50 rounded-xl p-4 border border-[#E0D4BC]/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#E0D4BC] rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-40 bg-[#E0D4BC] rounded" />
                  <div className="h-3 w-24 bg-[#E0D4BC]/60 rounded" />
                </div>
                <div className="h-6 w-16 bg-[#E0D4BC] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
  </div>
);

// Empty state component
const DashboardEmpty = ({ onCreateAgent }: { onCreateAgent: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[400px] text-center px-4"
  >
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] flex items-center justify-center mb-8 shadow-[0_8px_24px_rgba(45,34,22,0.24)]">
      <Bot className="h-10 w-10 text-white" />
    </div>

    <h1 className="text-2xl md:text-3xl font-bold text-[#2D2216] mb-4">
      Welcome to Clevio AI Staff
    </h1>

    <p className="text-[#5D4037] text-base md:text-lg max-w-md mb-8">
      Create your first AI agent to start automating customer service and sales conversations 24/7.
    </p>

    <button
      onClick={onCreateAgent}
      className="px-8 py-4 bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:from-[#1A1410] hover:to-[#0D0A08] text-white font-bold rounded-2xl shadow-[0_4px_16px_rgba(45,34,22,0.24)] hover:shadow-[0_6px_24px_rgba(45,34,22,0.32)] active:scale-[0.98] transition-all flex items-center gap-2"
    >
      <Plus className="h-5 w-5" />
      Create Your First Agent
    </button>
  </motion.div>
);


export default function Dashboard() {
  const {
    agents,
    stats,
    loading,
    error,
    authLoading,
    user,
    loadDashboardData,
  } = useDashboardData();

  const isMobile = useMobileDetection();
  const { handleCreateAgent, handleAgentClick } = useDashboardActions();

  // Authentication and subscription checks
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!user.subscription?.is_active) {
      window.location.href = "/payment";
      return;
    }

    loadDashboardData();
  }, [authLoading, user, loadDashboardData]);

  if (authLoading || loading) {
    return (
      <div className="py-4">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white/90">
          <div className="w-16 h-16 rounded-2xl bg-red-50">
            <RefreshCw className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-[#2D2216]">
            Error Loading Dashboard
          </h3>
          <p className="text-[#5D4037]">{error}</p>
          <button 
            onClick={loadDashboardData} 
            className="px-6 py-3 rounded-xl border-2 border-[#E0D4BC]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasAgents = agents.length > 0;

  return (
    <div className="py-2">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-[#2D2216]">
          Dashboard
        </h1>
        <p className="text-[#5D4037]">
          Welcome back, {user?.name || "User"}! Here&apos;s what&apos;s happening with your AI agents.
        </p>
      </motion.div>

      {!hasAgents ? (
        <DashboardEmpty onCreateAgent={handleCreateAgent} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              title="Total Agents"
              value={stats.totalAgents}
              icon={Bot}
              description="AI assistants created"
            />

            <StatsCard
              title="WhatsApp Connected"
              value={stats.connectedWhatsApp}
              icon={Users}
              description="Active integrations"
            />
          </div>

          {/* Recent Agents */}
          <RecentAgents
            agents={agents}
            onCreateAgent={handleCreateAgent}
            onAgentClick={handleAgentClick}
          />
        </motion.div>
      )}
    </div>
  );
}
