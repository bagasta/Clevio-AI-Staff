import { motion } from 'framer-motion'
import { Bot, MessageSquare, MoreVertical, Plus, Clock, Calendar } from 'lucide-react'

interface Agent {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'training'
  conversations?: number
  lastActive?: string
  model?: string
  createdAt?: string
  whatsappConnected?: boolean
  is_active?: boolean | null
  active?: boolean | null
  isActive?: boolean | null
  statusRaw?: string | null
}

interface RecentAgentsProps {
  agents?: Agent[]
  loading?: boolean
  onCreateAgent?: () => void
  onAgentClick?: (agent: Agent) => void
  className?: string
}

const EmptyState = ({ onCreateAgent }: { onCreateAgent?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    {/* Icon */}
    <div className="w-16 h-16 rounded-2xl bg-[#FAF6F1]">
      <Bot className="h-8 w-8 text-[#8D7F71]" />
    </div>

    {/* Text */}
    <h3 className="text-lg font-bold text-[#2D2216]">
      No agents yet
    </h3>
    <p className="text-[#5D4037]">
      Create your first AI agent to start automating your customer service and sales conversations.
    </p>

    {/* CTA Button */}
    <button
      onClick={onCreateAgent}
      className="px-6 py-3 bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:from-[#1A1410] hover:to-[#0D0A08] text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(45,34,22,0.2)] hover:shadow-[0_6px_16px_rgba(45,34,22,0.28)] active:scale-[0.98] transition-all flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      Create Your First Agent
    </button>
  </motion.div>
)

const AgentCard = ({
  agent,
  onClick
}: {
  agent: Agent;
  onClick?: (agent: Agent) => void
}) => {
  const normalizedActive =
    agent.is_active || agent.isActive || (agent.statusRaw === 'active') || Boolean(agent.active)
  const normalizedStatus: Agent['status'] = normalizedActive ? 'active' : agent.status
  
  const statusConfig = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Active' },
    inactive: { bg: 'bg-[#FAF6F1]', text: 'text-[#8D7F71]', label: 'Inactive' },
    training: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Training' },
  }

  const config = statusConfig[normalizedStatus] || statusConfig.inactive

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="cursor-pointer"
      onClick={() => onClick?.(agent)}
    >
      <div className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC]/30 rounded-2xl p-4 hover:bg-white/90 transition-all shadow-sm hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E68A44]/10 to-[#D87A36]/5 border border-[#E68A44]/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-[#E68A44]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[#2D2216]">
                {agent.name}
              </h4>
              {agent.model && (
                <p className="text-xs text-[#8D7F71]">
                  {agent.model}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
              {config.label}
            </span>
            {agent.whatsappConnected && (
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                WA
              </span>
            )}
            <button
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[#8D7F71] hover:bg-[#FAF6F1] transition-colors"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        {agent.description && (
          <p className="text-sm text-[#5D4037] line-clamp-2 mb-3">
            {agent.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#8D7F71] pt-3 border-t border-[#E0D4BC]/30">
          {agent.conversations !== undefined && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="font-medium">{agent.conversations.toLocaleString()} chats</span>
            </div>
          )}
          {agent.lastActive && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">Active {agent.lastActive}</span>
            </div>
          )}
          {agent.createdAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">{agent.createdAt}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const LoadingState = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white/80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#E0D4BC]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-[#E0D4BC]" />
            <div className="h-3 w-1/2 bg-[#E0D4BC]" />
          </div>
          <div className="h-6 w-16 bg-[#E0D4BC]" />
        </div>
      </div>
    ))}
  </div>
)

export function RecentAgents({
  agents = [],
  loading = false,
  onCreateAgent,
  onAgentClick,
  className
}: RecentAgentsProps) {
  const hasAgents = agents.length > 0

  // Sort agents by creation date (most recent first) and take only the first 5
  const sortedAgents = [...agents]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 5)

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#E0D4BC]/50">
        <h3 className="text-lg font-bold text-[#2D2216]">Recent Agents</h3>

        {hasAgents && (
          <button
            onClick={onCreateAgent}
            className="px-4 py-2 bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:from-[#1A1410] hover:to-[#0D0A08] text-white font-bold text-sm rounded-xl shadow-[0_4px_16px_rgba(45,34,22,0.24)] hover:shadow-[0_6px_24px_rgba(45,34,22,0.32)] active:scale-[0.98] transition-all flex items-center gap-1.5 border-0"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <LoadingState />
        ) : hasAgents ? (
          <div className="space-y-3">
            {sortedAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                {...(onAgentClick && { onClick: onAgentClick })}
              />
            ))}
          </div>
        ) : onCreateAgent ? (
          <EmptyState onCreateAgent={onCreateAgent} />
        ) : null}
      </div>
    </div>
  )
}
