"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Bot,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  Smartphone,
  Wifi,
  WifiOff,
  Loader2,
  MessageCircle,
  ArrowRight,
  QrCode,
  X,
  Mail,
  Calendar,
  Globe,
  FileText,
  Calculator,
  Search as SearchIcon,
  Play,
  Pause,
  StopCircle,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { toast } from "react-hot-toast"

import { useAuth } from "@/contexts/AuthContext"
import { apiService } from "@/lib/api"
import { resolveSessionQrImage } from "@/lib/whatsappQr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Agent {
  id: string
  name: string
  description?: string
  is_active: boolean
  model_name?: string
  last_message_at?: string
  whatsapp_status?: string
  created_at?: string
  whatsapp_connected?: boolean
  whatsapp_qr?: string
  config?: {
    system_message?: string
    system_prompt?: string
    google_tools?: string[]
  }
  allowed_tools?: string[]
  google_tools?: string[]
  mcp_tools?: string[]
}


const AgentsPageSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 w-32 bg-[#E0D4BC] rounded mb-2" />
        <div className="h-4 w-64 bg-[#E0D4BC]/60 rounded" />
      </div>
      <div className="h-10 w-32 bg-[#E0D4BC] rounded-xl" />
    </div>

    {/* Search Skeleton */}
    <div className="flex-1 h-12 bg-white/50 backdrop-blur-sm rounded-xl border border-[#E0D4BC] shadow-sm" />

    {/* Agents Grid Skeleton */}
    <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
           {/* Card Header Skeleton */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#E0D4BC] flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-[#E0D4BC] rounded" />
                <div className="h-4 w-1/2 bg-[#E0D4BC]/60 rounded" />
              </div>
            </div>
            <div className="h-6 w-16 bg-[#E0D4BC] rounded-full" />
          </div>

          {/* Description Skeleton */}
          <div className="space-y-2 mb-6">
            <div className="h-4 w-full bg-[#E0D4BC]/40 rounded" />
            <div className="h-4 w-2/3 bg-[#E0D4BC]/40 rounded" />
          </div>

          {/* Footer Skeleton */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E0D4BC]/30">
            <div className="h-4 w-20 bg-[#E0D4BC] rounded" />
            <div className="h-8 w-24 bg-[#E0D4BC] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

const EmptyState = ({ onCreateAgent }: { onCreateAgent: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#E0D4BC] p-8 sm:p-12 text-center bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
  >
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#2D2216]/10">
      <Bot className="h-10 w-10 text-white" />
    </div>

    <h3 className="text-2xl font-bold text-[#2D2216] mb-4">
      You haven&apos;t created any agents yet
    </h3>

    <p className="text-[#5D4037] text-lg max-w-md mx-auto mb-8">
      Build your first agent to automate workflows across Gmail, WhatsApp, and more.
    </p>

    <Button
      onClick={onCreateAgent}
      size="lg"
      className="px-8 !bg-gradient-to-b !from-[#2D2216] !to-[#1A1410] hover:!from-[#1A1410] hover:!to-[#0D0A08] text-white shadow-[0_4px_16px_rgba(45,34,22,0.24)] hover:shadow-[0_6px_24px_rgba(45,34,22,0.32)] border-0 hover-lift"
    >
      <Plus className="h-5 w-5 mr-2" />
      Create your first agent
    </Button>
  </motion.div>
)

const AgentCard = ({
  agent,
  onView,
  onRefreshStatus,
  onConnectWhatsApp,
  onDisconnectWhatsApp,
  onDeleteWhatsApp,
  refreshLoading,
  deleteLoading,
  sessionError,
  initialLoading
}: {
  agent: Agent
  onView: (agent: Agent) => void
  onRefreshStatus: (agent: Agent) => void
  onConnectWhatsApp: (agent: Agent) => void
  onDisconnectWhatsApp: (agent: Agent) => void
  onDeleteWhatsApp: (agent: Agent) => void
  refreshLoading?: boolean
  deleteLoading?: boolean
  sessionError?: string
  initialLoading?: boolean
}) => {
  // Debug logging for WhatsApp status
  console.log(`Agent ${agent.id} WhatsApp status:`, {
    whatsapp_connected: agent.whatsapp_connected,
    whatsapp_status: agent.whatsapp_status,
    last_message_at: agent.last_message_at
  })
  const statusConfig = {
    active: { label: 'Active', color: 'text-green-600' },
    inactive: { label: 'Inactive', color: 'text-gray-500' },
    training: { label: 'Training', color: 'text-yellow-600' }
  }

  const whatsappStatusConfig = {
    connected: {
      icon: Wifi,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      label: 'Connected',
      helper: 'WhatsApp is connected and ready'
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      label: 'Disconnected',
      helper: 'Connect WhatsApp to enable messaging'
    },
    connecting: {
      icon: Loader2,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      label: 'Connecting',
      helper: 'Please wait while we establish connection'
    }
  }

  const config = statusConfig[agent.is_active ? 'active' : 'inactive']

  // Dynamic WhatsApp status configuration based on agent's current status
  const getWhatsAppConfig = () => {
    const status = agent.whatsapp_status?.toLowerCase()

    if (status === 'connected' || agent.whatsapp_connected) {
      return whatsappStatusConfig.connected
    } else if (status === 'connecting') {
      return whatsappStatusConfig.connecting
    } else {
      return whatsappStatusConfig.disconnected
    }
  }

  const whatsappConfig = getWhatsAppConfig()

  const getCapabilityIcon = (capability) => {
    const iconMap = {
      'gmail': Mail,
      'gmail_get_message': Mail,
      'gmail_create_draft': Mail,
      'gmail_send_message': Mail,
      'gmail_read_messages': Mail,
      'gmail_list_messages': Mail,
      'google_calendar': Calendar,
      'google_calendar_create_event': Calendar,
      'google_calendar_list_events': Calendar,
      'google_calendar_get_event': Calendar,
      'google_sheets': FileText,
      'google_sheets_get_values': FileText,
      'google_sheets_update_values': FileText,
      'google_sheets_create_spreadsheet': FileText,
      'google_sheets_list_spreadsheets': FileText,
      'google_docs': FileText,
      'google_docs_list_documents': FileText,
      'google_docs_get_document': FileText,
      'google_docs_create_document': FileText,
      'google_docs_append_text': FileText,
      'google_docs_delete_document': FileText,
      'web_search': SearchIcon,
      'docx_generate': FileText,
      'deep_research': SearchIcon,
      'calculator_sse': Calculator,
      'WhatsApp': MessageCircle,
      'whatsapp': MessageCircle,
    };

    // Check for Gmail tools
    if (capability.toLowerCase().includes('gmail') || capability.toLowerCase().includes('google_') && capability.toLowerCase().includes('mail')) {
      return Mail;
    }

    // Check for Calendar tools
    if (capability.toLowerCase().includes('calendar') || capability.toLowerCase().includes('google_') && capability.toLowerCase().includes('cal')) {
      return Calendar;
    }

    // Check for web/search tools
    if (capability.toLowerCase().includes('search') || capability.toLowerCase().includes('web')) {
      return SearchIcon;
    }

    // Check for document tools
    if (capability.toLowerCase().includes('doc') || capability.toLowerCase().includes('generate') || capability.toLowerCase().includes('file')) {
      return FileText;
    }

    // Check for calculator
    if (capability.toLowerCase().includes('calc') || capability.toLowerCase().includes('number')) {
      return Calculator;
    }

    // Default to globe for unknown tools
    return Globe;
  };

  // Create unique capabilities with icons
  const uniqueCapabilities: Array<{ id: string; icon: any; name: string }> = [];

  const googleTools = agent?.google_tools || [];

  // Add Gmail if any Gmail tool is enabled
  if (
    googleTools.some(tool => tool.toLowerCase().includes('gmail')) ||
    agent?.allowed_tools?.some(tool => tool.toLowerCase().includes('gmail'))
  ) {
    uniqueCapabilities.push({ id: 'gmail', icon: Mail, name: 'Gmail' });
  }

  // Add Calendar if any Calendar tool is enabled
  if (
    googleTools.some(tool => tool.toLowerCase().includes('calendar')) ||
    agent?.allowed_tools?.some(tool => tool.toLowerCase().includes('calendar'))
  ) {
    uniqueCapabilities.push({ id: 'calendar', icon: Calendar, name: 'Calendar' });
  }

  // Add WhatsApp (always present)
  uniqueCapabilities.push({ id: 'whatsapp', icon: MessageCircle, name: 'WhatsApp' });

  // Add other MCP tools
  const capabilitySources = [
    ...(googleTools || []),
    ...(agent?.allowed_tools || []),
    ...(agent?.mcp_tools || []),
  ];

  capabilitySources.forEach(tool => {
    const toolLower = tool.toLowerCase();
    if (!toolLower.includes('gmail') && !toolLower.includes('calendar') && !toolLower.includes('whatsapp')) {
      const icon = getCapabilityIcon(tool);
      uniqueCapabilities.push({ id: tool, icon, name: tool });
    }
  });

  const capabilityList = uniqueCapabilities;

  const handleRefreshStatus = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onRefreshStatus(agent)
  }

  const handleConnectWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onConnectWhatsApp(agent)
  }

  const handleDisconnectWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onDisconnectWhatsApp(agent)
  }

  const handleDeleteWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteWhatsApp(agent)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="hover-lift cursor-pointer group w-full h-full"
      onClick={() => onView(agent)}
    >
      <div className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col relative group">
        
        <div className="p-6 flex flex-col h-full">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                {/* Status Indicator */}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white",
                  agent.is_active ? "bg-green-500" : "bg-gray-400"
                )}></div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg sm:text-xl text-foreground mb-2 group-hover:text-[#E68A44] transition-colors">
                  {agent.name}
                </h4>
                {agent.model_name && (
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {agent.model_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:text-right">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold",
                  config.label === 'Active' && "bg-green-100 text-green-800 ",
                  config.label === 'Inactive' && "bg-gray-100 text-gray-800 ",
                  config.label === 'Training' && "bg-yellow-100 text-yellow-800 "
                )}
              >
                <span className="inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-current opacity-70"></span>
                {config.label}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4 sm:mb-6 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
              {agent.config?.system_message || agent.config?.system_prompt || "No system prompt provided yet."}
            </p>
          </div>

          {/* Capabilities */}
          <div className="mb-4 sm:mb-6 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[13px]">
              <span className="font-medium text-[#8D7F71]">Capabilities</span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {capabilityList.slice(0, 5).map((capability) => {
                  const Icon = capability.icon;
                  return (
                    <div
                      key={capability.id}
                      className="w-8 h-8 rounded-lg border border-[#E0D4BC] bg-white flex items-center justify-center group-hover:border-[#E68A44] transition-colors"
                      title={capability.name}
                    >
                      <Icon className="h-4 w-4 text-[#8D7F71]" />
                    </div>
                  );
                })}
                {capabilityList.length > 5 && (
                  <div className="w-8 h-8 rounded-lg border border-[#E0D4BC] bg-white flex items-center justify-center">
                    <span className="text-xs font-medium text-[#8D7F71]">
                      +{capabilityList.length - 5}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* WhatsApp Status Section */}
          <div className="rounded-xl border border-[#E0D4BC] bg-[#FAF6F1] p-3 sm:p-4 mb-4 sm:mb-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  agent.whatsapp_connected ? "bg-green-100" : "bg-red-100"
                )}>
                  <whatsappConfig.icon className={cn("h-4 w-4", agent.whatsapp_connected ? "text-green-600" : "text-red-500", refreshLoading && "animate-spin")} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-xs font-bold", agent.whatsapp_connected ? "text-green-700" : "text-red-600")}>
                    WhatsApp {whatsappConfig.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <button
                  className="h-8 px-3 text-xs font-semibold rounded-lg border border-[#E0D4BC] bg-white text-[#5D4037] hover:bg-[#FAF6F1] hover:border-[#E68A44] transition-all flex items-center gap-1"
                  onClick={handleRefreshStatus}
                  disabled={refreshLoading}
                >
                  <RefreshCw className={cn("h-3 w-3", refreshLoading && "animate-spin")} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {!agent.whatsapp_connected ? (
                  <button
                    className="h-8 px-4 text-xs font-bold rounded-lg bg-gradient-to-b from-[#2D2216] to-[#1A1410] text-white hover:translate-y-[-1px] transition-all shadow-lg flex items-center gap-1"
                    onClick={handleConnectWhatsApp}
                  >
                    <MessageCircle className="h-3 w-3" />
                    Connect
                  </button>
                ) : (
                  <button
                    className="h-8 px-4 text-xs font-bold rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-all flex items-center gap-1"
                    onClick={handleDisconnectWhatsApp}
                  >
                    <WifiOff className="h-3 w-3" />
                    <span className="hidden sm:inline">Disconnect</span>
                  </button>
                )}

                <button
                  className="h-8 px-3 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 transition-all flex items-center gap-1"
                  onClick={handleDeleteWhatsApp}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[#8D7F71] mt-2">{whatsappConfig.helper}</p>
          </div>

          {/* Error Message */}
          {sessionError && (
            <div className="mb-4 sm:mb-6 flex-shrink-0">
              <p className="rounded-md bg-rose-500/10 px-3 py-2 text-[10px] sm:text-xs font-medium text-rose-600">
                {sessionError}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#E0D4BC]/50">
            <Link href={`/dashboard/agents/${agent.id}`}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E68A44] hover:text-[#2D2216] transition-colors"
                  onClick={(e: any) => e.stopPropagation()}>
              View details
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
          </div>
      </div>
    </motion.div>
  )

}


const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  isLoading,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger"
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  isLoading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-xl border border-[#E0D4BC] shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-red-100' : 'bg-[#E68A44]/10'}`}>
            {variant === 'danger' ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <Bot className="h-6 w-6 text-[#E68A44]" />
            )}
          </div>

          <h3 className="text-xl font-bold text-[#2D2216] mb-2">{title}</h3>
          <p className="text-[#5D4037] mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border-[#E0D4BC] text-[#5D4037] hover:bg-[#FAF6F1]"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "danger" ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 rounded-xl shadow-lg border-0 ${
                variant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:from-[#1A1410] hover:to-[#0D0A08]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default function AgentsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [whatsAppRefreshMap, setWhatsAppRefreshMap] = useState({})
  const [whatsAppDeleteMap, setWhatsAppDeleteMap] = useState({})
  const [whatsAppErrors, setWhatsAppErrors] = useState({})
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; agent: Agent | null; qrCode: string | null }>({
    isOpen: false,
    agent: null,
    qrCode: null
  })

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading?: boolean;
    variant?: "danger" | "primary";
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false
  })
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const closeQrModal = useCallback(() => {
    setQrModal({ isOpen: false, agent: null, qrCode: null })
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
  }, [])

  const getApiKeyForWhatsApp = useCallback(async () => {
    let apiKey = typeof apiService.getCurrentApiKey === "function"
      ? apiService.getCurrentApiKey()
      : null

    if (!apiKey) {
      try {
        await apiService.ensureApiKey()
        apiKey = typeof apiService.getCurrentApiKey === "function"
          ? apiService.getCurrentApiKey()
          : null
      } catch (err) {
        console.warn("Unable to resolve API key for WhatsApp", err)
      }
    }

    if (!apiKey) {
      throw new Error("API key unavailable. Please refresh session or generate an API key.")
    }

    return apiKey
  }, [])

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const agentsData = await apiService.getAgents()
      console.log('Raw agents data:', agentsData)

      // Fetch WhatsApp status for each agent to get the most up-to-date status
      const agentsWithStatus: Agent[] = []

      // Process agents in batches to avoid overwhelming the API
      const batchSize = 3
      for (let i = 0; i < (agentsData || []).length; i += batchSize) {
        const batch = (agentsData || []).slice(i, i + batchSize)

        const batchResults = await Promise.allSettled(
          batch.map(async (agent: Agent) => {
            try {
              // Add small delay to prevent overwhelming the API
              await new Promise(resolve => setTimeout(resolve, 100))

              const statusData = await apiService.getWhatsAppConnectionStatus(agent.id)
              console.log(`WhatsApp status for agent ${agent.id}:`, statusData)

              return {
                ...agent,
                whatsapp_connected: statusData?.connected || statusData?.isActive || agent.whatsapp_connected || false,
                whatsapp_status: statusData?.status || agent.whatsapp_status || 'unknown',
                last_message_at: statusData?.lastConnectedAt || agent.last_message_at
              }
            } catch (error) {
              console.warn(`Failed to fetch WhatsApp status for agent ${agent.id}:`, error)
              // Keep original status if fetch fails
              return {
                ...agent,
                whatsapp_connected: agent.whatsapp_connected || false,
                whatsapp_status: agent.whatsapp_status || 'unknown'
              }
            }
          })
        )

        // Add successful results to our agents list
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            agentsWithStatus.push(result.value)
          }
        })
      }

      console.log('Agents with updated WhatsApp status:', agentsWithStatus)
      setAgents(agentsWithStatus)

    } catch (error: any) {
      setError(error.message || "Failed to load agents")

      // Redirect to login if unauthorized
      if (error.message?.includes("Invalid API key") || error.message?.includes("Unauthorized")) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
      setLoadingStatus(false)
    }
  }, [router])

  // Authentication check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (!user.subscription?.is_active) {
      router.push("/payment")
      return
    }

    loadAgents()
  }, [authLoading, user, router, loadAgents])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [])

  const handleCreateAgent = () => {
    router.push('/dashboard/agents/templates')
  }

  const handleViewAgent = (agent: Agent) => {
    router.push(`/dashboard/agents/${agent.id}`)
  }

  const handleRefreshWhatsAppStatus = async (agent: Agent) => {
    const agentId = agent.id

    setWhatsAppErrors((prev) => {
      const next = { ...prev }
      delete next[agentId]
      return next
    })

    setWhatsAppRefreshMap((prev) => ({ ...prev, [agentId]: true }))

    try {
      await apiService.ensureApiKey()
      const statusData = await apiService.getWhatsAppConnectionStatus(agentId)

      console.log('Status data from API:', statusData)

      // Update agent with WhatsApp status - using the correct field names from the new API response
      setAgents(prevAgents =>
        prevAgents.map(a =>
          a.id === agentId
            ? {
                ...a,
                whatsapp_connected: statusData?.connected || statusData?.isActive || false,
                whatsapp_status: statusData?.status || 'unknown',
                last_message_at: statusData?.lastConnectedAt || a.last_message_at
              }
            : a
        )
      )
    } catch (error: any) {
      console.error('Error refreshing WhatsApp status:', error)
      setWhatsAppErrors((prev) => ({
        ...prev,
        [agentId]: error?.message || "Unable to refresh WhatsApp status. Please try again."
      }))
    } finally {
      setWhatsAppRefreshMap((prev) => {
        const next = { ...prev }
        delete next[agentId]
        return next
      })
    }
  }

  const handleConnectWhatsApp = async (agent: Agent) => {
    try {
      await apiService.ensureApiKey()
      const apiKey = await getApiKeyForWhatsApp()

      // First, create WhatsApp session (ignore "session_created" gating; always try fetch QR)
      const sessionData = await apiService.createWhatsAppSession({
        userId: user?.user_id || '',
        agentId: agent.id,
        agentName: agent.name,
        apiKey
      })

      // Then fetch QR code
      const qrData = await apiService.fetchWhatsAppQr(agent.id)
      const qrImage =
        resolveSessionQrImage(qrData) ||
        resolveSessionQrImage(sessionData) ||
        qrData?.qr?.base64 ||
        qrData?.qr?.image ||
        null

      if (!qrImage) {
        throw new Error('QR code unavailable right now. Please retry in a moment.')
      }

      // Show QR modal
      setQrModal({
        isOpen: true,
        agent: agent,
        qrCode: qrImage
      })

      // Update agent status
      setAgents(prevAgents =>
        prevAgents.map(a =>
          a.id === agent.id
            ? {
                ...a,
                whatsapp_connected: false,
                whatsapp_status: 'connecting'
              }
            : a
        )
      )

      // Start polling for status updates
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await apiService.getWhatsAppConnectionStatus(agent.id)
          console.log('Polling status data:', statusData)

          // Check for connected status using multiple possible fields
          const isConnected = statusData?.connected ||
                            statusData?.isActive ||
                            statusData?.status === 'connected'

          if (isConnected) {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
            setQrModal({ isOpen: false, agent: null, qrCode: null })

            // Update agent status to connected
            setAgents(prevAgents =>
              prevAgents.map(a =>
                a.id === agent.id
                  ? {
                      ...a,
                      whatsapp_connected: true,
                      whatsapp_status: 'connected',
                      last_message_at: statusData?.lastConnectedAt || a.last_message_at
                    }
                  : a
              )
            )
            toast.success("WhatsApp connected successfully!", {
                style: {
                  background: '#F6FBF9',
                  color: '#2D3A3A',
                  border: '1px solid #E0F2F1',
                },
                iconTheme: {
                  primary: '#0F766E',
                  secondary: '#F0FDF4',
                },
            })
          }
        } catch (error) {
          console.error('Error polling WhatsApp status:', error)
        }
      }, 3000)

      // Stop polling after 5 minutes
      setTimeout(() => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
        setQrModal(current => current.isOpen ? { isOpen: false, agent: null, qrCode: null } : current)
      }, 300000)
    } catch (error: any) {
      setWhatsAppErrors((prev) => ({
        ...prev,
        [agent.id]: 'Failed to connect WhatsApp: ' + (error.message || 'Unknown error')
      }))
    }
  }

  const handleDisconnectWhatsApp = async (agent: Agent) => {
    try {
      // Clear any existing error
      setWhatsAppErrors((prev) => {
        const next = { ...prev }
        delete next[agent.id]
        return next
      })

      // Set loading state
      setWhatsAppRefreshMap((prev) => ({ ...prev, [agent.id]: true }))

      await apiService.ensureApiKey()
      console.log(`Disconnecting WhatsApp for agent: ${agent.id}`)

      // Call disconnect API
      await apiService.disconnectWhatsApp(agent.id)

      // Update agent status to disconnected
      setAgents(prevAgents =>
        prevAgents.map(a =>
          a.id === agent.id
            ? {
                ...a,
                whatsapp_connected: false,
                whatsapp_status: 'disconnected'
              }
            : a
        )
      )

      console.log(`Successfully disconnected WhatsApp for agent: ${agent.id}`)
      toast.success("WhatsApp disconnected", {
        icon: '🔌'
      })

      // Optional: Refresh status after a short delay to ensure backend is updated
      setTimeout(async () => {
        try {
          await handleRefreshWhatsAppStatus(agent)
        } catch (error) {
          console.log('Status refresh after disconnect failed, but disconnect was successful')
        }
      }, 1000)

    } catch (error: any) {
      console.error('Error disconnecting WhatsApp:', error)
      setWhatsAppErrors((prev) => ({
        ...prev,
        [agent.id]: error?.message || "Unable to disconnect WhatsApp. Please try again."
      }))
    } finally {
      setWhatsAppRefreshMap((prev) => {
        const next = { ...prev }
        delete next[agent.id]
        return next
      })
    }
  }

  const handleDeleteWhatsAppSession = async (agent: Agent) => {
    const agentId = agent.id

    setConfirmModal({
        isOpen: true,
        title: "Disconnect & Delete Session?",
        message: "This will disconnect WhatsApp and remove the session permanently. You will need to scan the QR code again to reconnect.",
        variant: "danger",
        confirmLabel: "Delete Session",
        onConfirm: async () => {
             // Clear error for this agent
            setWhatsAppErrors((prev) => {
            const next = { ...prev }
            delete next[agentId]
            return next
            })

            setWhatsAppDeleteMap((prev) => ({ ...prev, [agentId]: true }))
            setConfirmModal(prev => ({ ...prev, isLoading: true }))

            try {
            await apiService.ensureApiKey()
            await apiService.deleteWhatsAppSession(agentId)

            // Update local state to reflect deletion
            setAgents((prevAgents) =>
                prevAgents.map((a) =>
                a.id === agentId
                    ? {
                        ...a,
                        whatsapp_connected: false,
                        whatsapp_status: 'disconnected'
                    }
                    : a
                )
            )

            // Close QR modal if it belongs to the deleted agent
            if (qrModal.isOpen && qrModal.agent?.id === agentId) {
                closeQrModal()
            }
            
            toast.success("Session deleted successfully")
            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
            } catch (error: any) {
            console.error('Error deleting WhatsApp session:', error)
            setWhatsAppErrors((prev) => ({
                ...prev,
                [agentId]: error?.message || "Unable to delete WhatsApp session. Please try again."
            }))
             setConfirmModal(prev => ({ ...prev, isLoading: false, isOpen: false }))
             toast.error("Failed to delete session")
            } finally {
            setWhatsAppDeleteMap((prev) => {
                const next = { ...prev }
                delete next[agentId]
                return next
            })
            }
        }
    })
  }

  // Filter agents based on search
  const normalizedAgents = agents.map((agent) => {
    const normalizedActive =
      agent?.is_active ||
      (agent as any)?.isActive ||
      ((agent as any)?.status === 'active') ||
      Boolean((agent as any)?.active || false)

    return {
      ...agent,
      is_active: Boolean(normalizedActive),
    }
  })

  const filteredAgents = normalizedAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.config?.system_message?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authLoading || loading) {
    return (
      <div className="container-spacing">
        <AgentsPageSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-spacing">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Error Loading Agents
            </h3>
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
            <Button onClick={loadAgents} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Your Agents
          </h1>
          <p className="text-muted-foreground">
            Manage, edit, and monitor the assistants you&apos;ve created.
          </p>
        </div>

        <Button
          onClick={handleCreateAgent}
          size="lg"
          className="!bg-gradient-to-b !from-[#2D2216] !to-[#1A1410] hover:!from-[#1A1410] hover:!to-[#0D0A08] text-white shadow-[0_4px_16px_rgba(45,34,22,0.24)] hover:shadow-[0_6px_24px_rgba(45,34,22,0.32)] border-0 hover-lift w-full sm:w-auto"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Agent
        </Button>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#E68A44] focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {agents.length === 0 ? (
          <EmptyState onCreateAgent={handleCreateAgent} />
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No agents found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-2 auto-rows-max">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onView={handleViewAgent}
                onRefreshStatus={handleRefreshWhatsAppStatus}
                onConnectWhatsApp={handleConnectWhatsApp}
                onDisconnectWhatsApp={handleDisconnectWhatsApp}
                refreshLoading={Boolean(whatsAppRefreshMap[agent.id])}
                onDeleteWhatsApp={handleDeleteWhatsAppSession}
                deleteLoading={Boolean(whatsAppDeleteMap[agent.id])}
                sessionError={whatsAppErrors[agent.id]}
                initialLoading={loadingStatus}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* QR Code Modal */}
      {qrModal.isOpen && qrModal.agent && qrModal.qrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-2xl bg-card "
          >
            <Button
              onClick={closeQrModal}
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#2D2216] to-[#1A1410] flex items-center justify-center mx-auto">
                <QrCode className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-semibold text-foreground">
                Connect WhatsApp
              </h3>

              <div className="space-y-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Open WhatsApp &gt; Linked Devices and scan this QR code to connect the agent.
                  </p>

                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl border-2 border-border shadow-lg">
                      <Image
                        src={qrModal.qrCode.startsWith('data:') ? qrModal.qrCode : `data:image/png;base64,${qrModal.qrCode}`}
                        alt="WhatsApp QR Code"
                        width={256}
                        height={256}
                        unoptimized
                        className="h-auto w-64"
                      />
                    </div>
                  </div>

                  
                  <div className="text-left space-y-2 bg-card rounded-lg p-4 ">
                    <h4 className="font-semibold text-foreground text-sm">How to connect:</h4>
                    <ol className="space-y-1 text-sm text-muted-foreground">
                      <li>1. Open WhatsApp on your phone</li>
                      <li>2. Go to <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong></li>
                      <li>3. Scan this QR code to connect</li>
                    </ol>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    
                    <Button
                      onClick={() => qrModal.agent && handleRefreshWhatsAppStatus(qrModal.agent)}
                      disabled={Boolean(qrModal.agent && whatsAppRefreshMap[qrModal.agent.id])}
                      variant="outline"
                      className="flex-1"
                    >
                      {qrModal.agent && whatsAppRefreshMap[qrModal.agent.id] ? (
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
                      onClick={closeQrModal}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      
       <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isLoading={Boolean(confirmModal.isLoading)}
        variant={confirmModal.variant || "danger"}
        confirmLabel={confirmModal.confirmLabel || "Confirm"}
      />
    </div>
  )
}
