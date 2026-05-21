"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Home, Users, Settings, BookOpen, Bell, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

type Role = "student" | "teacher" | "admin"

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const roles = [
    { id: "student" as Role, label: "Student", description: "Access courses and grades", icon: Home },
    { id: "teacher" as Role, label: "Teacher", description: "Manage classes", icon: Users },
    { id: "admin" as Role, label: "Admin", description: "Campus management", icon: Settings },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Store role in localStorage for demo purposes
    localStorage.setItem("userRole", selectedRole)
    localStorage.setItem("userEmail", email)
    
    // Redirect based on role
    router.push(`/dashboard/${selectedRole}`)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Blue Gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-blue-500 to-blue-600 text-white p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-16">
            <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center text-xl font-bold">
              CC
            </div>
            <div>
              <h1 className="text-2xl font-bold">Campus Connect</h1>
              <p className="text-blue-200">Smart Campus Management</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <FeatureItem
              icon={<BookOpen className="h-6 w-6" />}
              title="Course Management"
              description="Manage classes, assignments, and grades"
              bgColor="bg-gradient-to-br from-green-400 to-green-500"
            />
            <FeatureItem
              icon={<Bell className="h-6 w-6" />}
              title="Real-time Notifications"
              description="Stay updated with campus announcements"
              bgColor="bg-gradient-to-br from-red-400 to-red-500"
            />
            <FeatureItem
              icon={<MapPin className="h-6 w-6" />}
              title="Resource Booking"
              description="Reserve classrooms and facilities"
              bgColor="bg-gradient-to-br from-orange-400 to-red-400"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your campus account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select your role:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-center",
                      selectedRole === role.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <role.icon className={cn(
                      "h-6 w-6 mx-auto mb-2",
                      selectedRole === role.id ? "text-blue-600" : "text-gray-400"
                    )} />
                    <span className={cn(
                      "block text-sm font-medium",
                      selectedRole === role.id ? "text-blue-600" : "text-gray-700"
                    )}>
                      {role.label}
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">
                      {role.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="your.email@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-white"
                  required
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-gray-600">
            Don&apos;t have an account?{" "}
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Contact Admin
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ 
  icon, 
  title, 
  description, 
  bgColor 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  bgColor: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bgColor)}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-blue-200 text-sm">{description}</p>
      </div>
    </div>
  )
}
