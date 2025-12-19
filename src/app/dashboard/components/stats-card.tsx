import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import NumberFlow from '@number-flow/react'

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.15, ease: 'easeInOut' }
      }}
      whileTap={{ scale: 0.99 }}
      className={className}
    >
      <div className="bg-white/90">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold text-[#8D7F71]">
              {title}
            </p>

            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-3xl font-extrabold text-[#2D2216]">
                <NumberFlow
                  value={value}
                  format={{
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }}
                />
              </p>

              {trend && (
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  trend.isPositive ? "text-emerald-600" : "text-red-500"
                }`}>
                  {trend.isPositive ? '↑' : '↓'}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>

            {description && (
              <p className="text-sm text-[#5D4037]">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#E68A44]/10 to-[#D87A36]/5 border border-[#E68A44]/20">
            <Icon className="h-6 w-6 text-[#E68A44]" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}