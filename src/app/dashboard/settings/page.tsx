"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  User,
  Shield,

  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { toast } from "react-hot-toast"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"


interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="bg-white/80 backdrop-blur-xl border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      <div className="p-6 border-b border-[#E0D4BC]/50">
        <h3 className="text-lg font-bold text-[#2D2216]">{title}</h3>
        {description && (
          <p className="text-sm text-[#5D4037] mt-1">{description}</p>
        )}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </motion.div>
)

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  })

  // Authentication check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    setFormData(prev => ({
      ...prev,
      name: user?.name || "",
      email: user?.email || ""
    }))
  }, [authLoading, user, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords don't match", {
        style: {
          background: '#FFF0F0',
          color: '#D32F2F',
          border: '1px solid #FFCDD2',
        },
        iconTheme: {
          primary: '#D32F2F',
          secondary: '#FFF0F0',
        },
      })
      return
    }

    if (!formData.newPassword) {
      toast.error("Please enter a new password", {
         style: {
          background: '#FFF0F0',
          color: '#D32F2F',
          border: '1px solid #FFCDD2',
        },
        iconTheme: {
          primary: '#D32F2F',
          secondary: '#FFF0F0',
        },
      })
      return
    }

    setLoading(true)
    try {
      const { apiService } = await import("@/lib/api")
      await apiService.updateUserPassword({ userId: user?.id, newPassword: formData.newPassword })

      // Clear password fields
      setFormData({
        newPassword: "",
        confirmPassword: ""
      })
      toast.success("Password updated successfully", {
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
    } catch (error) {
      console.error("Failed to change password:", error)
      toast.error("Failed to update password", {
        style: {
          background: '#FFF0F0',
          color: '#D32F2F',
          border: '1px solid #FFCDD2',
        },
        iconTheme: {
          primary: '#D32F2F',
          secondary: '#FFF0F0',
        },
      })
    } finally {
      setLoading(false)
    }
  }



  if (authLoading) {
    return (
      <div className="container-spacing">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2D2216] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#5D4037]">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  
  return (
    <div className="container-spacing space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2216] mb-2">
            Settings
          </h1>
          <p className="text-[#5D4037]">
            Manage your account settings and preferences.
          </p>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <SettingsSection
          title="Profile Information"
          description="View your account information."
        >
          <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#2D2216] mb-2">
                  Email Address
                </label>
                <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-4 py-3 border border-[#E0D4BC] rounded-xl bg-[#F5F2ED] text-[#5D4037] cursor-not-allowed opacity-80"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <User className="h-4 w-4 text-[#8D7F71]" />
                    </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2D2216] mb-2">
                  Account Status
                </label>
                <div className="flex items-center h-[50px]">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                    user?.is_active 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${user?.is_active ? "bg-green-500" : "bg-gray-400"}`}></span>
                    {user?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Security Settings */}
        <SettingsSection
          title="Security"
          description="Manage your password and security settings."
        >
          <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#2D2216] mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 pr-10 border border-[#E0D4BC] rounded-xl bg-white text-[#2D2216] placeholder-[#8D7F71] focus:outline-none focus:ring-2 focus:ring-[#E68A44] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8D7F71] hover:text-[#2D2216] transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2D2216] mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-[#E0D4BC] rounded-xl bg-white text-[#2D2216] placeholder-[#8D7F71] focus:outline-none focus:ring-2 focus:ring-[#E68A44] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
                <Button
                onClick={handleChangePassword}
                disabled={loading || !formData.newPassword || !formData.confirmPassword}
                className="!bg-gradient-to-b !from-[#2D2216] !to-[#1A1410] hover:!from-[#1A1410] hover:!to-[#0D0A08] text-white shadow-[0_4px_16px_rgba(45,34,22,0.24)] hover:shadow-[0_6px_24px_rgba(45,34,22,0.32)] border-0 hover-lift rounded-xl h-11 px-6 min-w-[160px]"
                >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                    <Shield className="h-4 w-4 mr-2" />
                )}
                Update Password
                </Button>
            </div>
          </div>
        </SettingsSection>

  
  

      </div>
    </div>
  )
}