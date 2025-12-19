"use client"

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Bot,
  Settings,
  X,
  Package,
  LogOut,
  Menu
} from 'lucide-react'
import { FEATURES } from '@/config/features'
import { navigateTo } from '@/lib/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface NavItem {
  key: string
  label: string
  icon: any
  path?: string
  badge?: string
  isMainAction?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'DASHBOARD',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    key: 'AGENTS',
    label: 'Agents',
    icon: Bot,
    path: '/dashboard/agents'
  },
  {
    key: 'SETTINGS',
    label: 'Settings',
    icon: Settings,
    path: '/dashboard/settings'
  },
  {
    key: 'ADD_ONS',
    label: 'Add-ons',
    icon: Package,
    path: '/coming-soon'
  }
]

// Sign Out Component
const SignOutButton = ({ isMobile = false }: { isMobile?: boolean }) => {
  const { logout } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  return (
    <motion.div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-[#8D7F71] hover:text-red-500 hover:bg-red-50"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleSignOut}
    >
      <LogOut className="h-5 w-5" />
      <span className="font-semibold text-sm">Sign Out</span>
    </motion.div>
  )
}

interface NavItemProps {
  item: NavItem
  isActive?: boolean
  isMobile?: boolean
  onClick?: () => void
}

const NavItemComponent = ({ item, isActive, isMobile = false, onClick }: NavItemProps) => {
  const feature = FEATURES[item.key]
  const status = feature?.status || 'active'
  const Icon = item.icon

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (item.path) {
      if (feature?.status === 'active') {
        window.location.href = item.path
      } else if (!feature) {
        window.location.href = item.path
      } else if (feature) {
        if (feature.status === 'coming-soon') {
          navigateTo.comingSoon()
        } else if (feature.status === 'under-development') {
          navigateTo.underDevelopment()
        }
      }
    }
  }

  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer",
        isActive
          ? "bg-gradient-to-b from-[#2D2216] to-[#1A1410] text-white shadow-[0_2px_8px_rgba(45,34,22,0.16)]"
          : "text-[#5D4037]"
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      <Icon className={cn(
        "h-5 w-5",
        isActive ? "text-white" : "text-[#8D7F71]"
      )} />

      <span className="font-semibold text-sm">{item.label}</span>

      {feature && feature.status !== 'active' && (
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50">
          Soon
        </span>
      )}
    </motion.div>
  )
}

interface DesktopNavProps {
  className?: string
}

export const DesktopNav = ({ className }: DesktopNavProps) => {
  const pathname = usePathname()

  return (
    <nav className={cn("hidden lg:block", className)}>
      <div className="bg-white/90">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = Boolean(item.path && (
              pathname === item.path ||
              (item.path !== '/dashboard' && pathname?.startsWith(item.path))
            ))
            return (
              <NavItemComponent
                key={item.key}
                item={item}
                isActive={isActive}
              />
            )
          })}

          {/* Divider */}
          <div className="my-3 border-t border-[#E0D4BC]"></div>

          {/* Sign Out Button */}
          <SignOutButton />
        </div>
      </div>
    </nav>
  )
}


export const MobileNav = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const pathname = usePathname()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Mobile Navigation Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 bg-white"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#E0D4BC]">
                <h2 className="text-lg font-bold text-[#2D2216]">Navigation</h2>
                <button
                  onClick={onClose}
                  className="h-10 w-10 rounded-xl bg-[#FAF6F1]"
                >
                  <X className="h-5 w-5 text-[#5D4037]" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 p-4">
                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = Boolean(item.path && (
                      pathname === item.path ||
                      (item.path !== '/dashboard' && pathname?.startsWith(item.path))
                    ))
                    return (
                      <NavItemComponent
                        key={item.key}
                        item={item}
                        isActive={isActive}
                        isMobile
                      />
                    )
                  })}

                  {/* Divider */}
                  <div className="my-3 border-t border-[#E0D4BC]"></div>

                  {/* Sign Out Button */}
                  <SignOutButton isMobile />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#E0D4BC]">
                <div className="flex items-center gap-2 text-xs text-[#8D7F71] font-medium">
                  <span>Powered by Clevio AI</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface BottomNavProps {
  className?: string
}

export const BottomNav = ({ className }: BottomNavProps) => {
  const pathname = usePathname()

  // Only show main navigation items in bottom nav
  const bottomNavItems = NAV_ITEMS.filter(item =>
    ['DASHBOARD', 'AGENTS', 'SETTINGS', 'ADD_ONS'].includes(item.key)
  )

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-white/95",
      className
    )}>
      <div className="flex items-center justify-around py-2 px-2">
        {bottomNavItems.map((item) => {
          const isActive = Boolean(item.path && (
            pathname === item.path ||
            (item.path !== '/dashboard' && pathname?.startsWith(item.path))
          ))
          const Icon = item.icon

          return (
            <motion.button
              key={item.key}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
                isActive
                  ? "text-[#E68A44]"
                  : "text-[#8D7F71] hover:text-[#5D4037]"
              )}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (item.path) {
                  window.location.href = item.path
                }
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}

interface MobileMenuButtonProps {
  onClick: () => void
  className?: string
}

export const MobileMenuButton = ({ onClick, className }: MobileMenuButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "lg:hidden h-10 w-10 rounded-xl bg-white/80",
        className
      )}
    >
      <Menu className="h-5 w-5 text-[#5D4037]" />
    </button>
  )
}

// Main Navigation component that handles both desktop and mobile
export default function DashboardNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <DesktopNav />
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <BottomNav />
    </>
  )
}