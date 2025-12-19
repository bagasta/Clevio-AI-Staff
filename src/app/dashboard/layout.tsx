"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import Image from "next/image"
import { 
  User, 
  Loader2, 
  LayoutDashboard, 
  Bot, 
  Settings, 
  Package, 
  LogOut,
  ChevronDown
} from "lucide-react"

import { BottomNav } from "./components/navigation"

const DashboardLogo = ({ width = 120, height = 120, priority = false }) => (
  <Image
    src="/clevioAISTAFF-Logo-Black.png"
    alt="Clevio AI Staff"
    width={width}
    height={height}
    priority={priority}
  />
)

const NAV_ITEMS = [
  { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'AGENTS', label: 'Agents', icon: Bot, path: '/dashboard/agents' },
  { key: 'SETTINGS', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  { key: 'ADD_ONS', label: 'Add-ons', icon: Package, path: '/coming-soon' },
]

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const { updateSubscription } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasRefreshedSubscription = useRef(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Refresh subscription info if needed
  useEffect(() => {
    if (!user) {
      hasRefreshedSubscription.current = false
      return
    }

    if (hasRefreshedSubscription.current) return
    hasRefreshedSubscription.current = true

    console.log('[Dashboard] Current user subscription:', user.subscription)
    const timer = setTimeout(() => {
      updateSubscription()
    }, 1500)

    return () => clearTimeout(timer)
  }, [user, updateSubscription])

  // Authentication check
  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (!user?.subscription?.is_active) {
      router.push("/payment")
      return
    }
  }, [loading, user, router])

  const handleSignOut = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  const handleNavClick = (path: string) => {
    setIsProfileOpen(false)
    router.push(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] via-[#F5F2ED] to-[#EDE8E1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#2D2216] to-[#1A1410] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_16px_rgba(45,34,22,0.24)]">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
          <p className="text-[#5D4037] font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] via-[#F5F2ED] to-[#EDE8E1]">
      {/* Mobile Navigation */}
      <BottomNav className="md:hidden" />

      {/* Main Content - Full width on desktop now */}
      <div className="pb-20 md:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E0D4BC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <DashboardLogo width={60} height={60} />
            </div>

            {/* Desktop Navigation - Absolutely Centered */}
            <nav className="hidden md:flex items-center gap-3 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.path || 
                  (item.path !== '/dashboard' && pathname?.startsWith(item.path))
                const Icon = item.icon
                
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.path)}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isActive 
                        ? "bg-gradient-to-b from-[#2D2216] to-[#1A1410] text-white shadow-[0_2px_8px_rgba(45,34,22,0.16)]"
                        : "text-[#5D4037] hover:bg-[#FAF6F1]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </nav>

            {/* User Profile Dropdown */}
            <div className="flex items-center gap-3" ref={profileRef}>
              {/* Plan Badge */}
              <div
                className={`hidden sm:block px-3 py-1.5 rounded-full text-xs font-bold ${
                  user?.subscription?.is_active 
                    ? "bg-[#E68A44]/10 text-[#E68A44] border border-[#E68A44]/20" 
                    : "bg-[#8D7F71]/10 text-[#8D7F71] border border-[#8D7F71]/20"
                }`}
              >
                {(() => {
                  const planCode = user?.subscription?.plan_code;
                  if (!planCode || !user?.subscription?.is_active) return "NO PLAN";
                  if (planCode === "TRIAL") return "TRIAL";
                  const cleanPlan = planCode.replace("_", " ").replace("PRO ", "").trim();
                  if (cleanPlan === "M") return "MONTHLY";
                  if (cleanPlan === "Y") return "YEARLY";
                  return cleanPlan.toUpperCase();
                })()}
              </div>

              {/* Profile Button */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[#FAF6F1] transition-colors"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-[#2D2216]">{user.name}</p>
                  <p className="text-xs text-[#8D7F71]">{user.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-b from-[#2D2216] to-[#1A1410] rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(45,34,22,0.16)]">
                  <User className="h-5 w-5 text-white" />
                </div>
                <ChevronDown className={`h-4 w-4 text-[#8D7F71] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-16 right-4 sm:right-8 w-64 bg-white rounded-2xl border border-[#E0D4BC] shadow-[0_8px_30px_rgba(45,34,22,0.12)] overflow-hidden z-50"
                  >
                    {/* User Info */}
                    <div className="p-4 border-b border-[#E0D4BC]">
                      <p className="font-bold text-[#2D2216]">{user.name}</p>
                      <p className="text-sm text-[#8D7F71]">{user.email}</p>
                    </div>

                    {/* Mobile Nav Items */}
                    <div className="p-2 md:hidden">
                      {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.path || 
                          (item.path !== '/dashboard' && pathname?.startsWith(item.path))
                        const Icon = item.icon
                        
                        return (
                          <button
                            key={item.key}
                            onClick={() => handleNavClick(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                              isActive 
                                ? "bg-[#FAF6F1] text-[#E68A44]"
                                : "text-[#5D4037] hover:bg-[#FAF6F1]"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </button>
                        )
                      })}
                      <div className="my-2 border-t border-[#E0D4BC]"></div>
                    </div>

                    {/* Sign Out */}
                    <div className="p-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
