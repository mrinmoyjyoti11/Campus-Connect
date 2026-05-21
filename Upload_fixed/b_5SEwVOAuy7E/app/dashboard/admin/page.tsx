"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  Bell,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plus,
  TrendingUp,
  TrendingDown,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Users, label: "Users" },
    { icon: GraduationCap, label: "Students" },
    { icon: Users, label: "Teachers" },
    { icon: Building2, label: "Departments" },
    { icon: Calendar, label: "Academic Calendar" },
    { icon: FileText, label: "Reports" },
    { icon: Bell, label: "Announcements" },
    { icon: Settings, label: "Settings" },
  ]

  const recentRegistrations = [
    { name: "Sarah Johnson", type: "Student", department: "Computer Science", date: "Today", status: "pending" },
    { name: "Dr. Michael Chen", type: "Teacher", department: "Mathematics", date: "Today", status: "approved" },
    { name: "Emily Davis", type: "Student", department: "Physics", date: "Yesterday", status: "pending" },
    { name: "James Wilson", type: "Student", department: "Engineering", date: "Yesterday", status: "approved" },
  ]

  const departmentStats = [
    { name: "Computer Science", students: 450, teachers: 25, utilization: 85 },
    { name: "Mathematics", students: 380, teachers: 20, utilization: 78 },
    { name: "Physics", students: 320, teachers: 18, utilization: 72 },
    { name: "Engineering", students: 520, teachers: 30, utilization: 90 },
  ]

  const systemAlerts = [
    { title: "Server Maintenance", description: "Scheduled for Sunday 2 AM", type: "warning", time: "2 hours ago" },
    { title: "New Semester Started", description: "Spring 2024 is now active", type: "success", time: "1 day ago" },
    { title: "Low Storage Warning", description: "85% storage capacity used", type: "error", time: "3 days ago" },
  ]

  const quickActions = [
    { icon: UserPlus, label: "Add User", color: "bg-blue-500" },
    { icon: Building2, label: "New Department", color: "bg-green-500" },
    { icon: Calendar, label: "Schedule Event", color: "bg-purple-500" },
    { icon: Bell, label: "Send Announcement", color: "bg-orange-500" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                CC
              </div>
              <div>
                <span className="font-bold text-lg block">Campus Connect</span>
                <span className="text-xs text-slate-400">Admin Portal</span>
              </div>
            </div>
            <button className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="px-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                item.active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm">Campus Management Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  8
                </span>
              </Button>
              <Avatar>
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-slate-900 text-white">AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Students</p>
                    <p className="text-3xl font-bold mt-1 text-gray-900">1,670</p>
                    <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>+12% from last semester</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <GraduationCap className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Teachers</p>
                    <p className="text-3xl font-bold mt-1 text-gray-900">93</p>
                    <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>+5 new this month</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Users className="h-7 w-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Departments</p>
                    <p className="text-3xl font-bold mt-1 text-gray-900">12</p>
                    <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm">
                      <Building2 className="h-4 w-4" />
                      <span>All operational</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Active Courses</p>
                    <p className="text-3xl font-bold mt-1 text-gray-900">248</p>
                    <div className="flex items-center gap-1 mt-2 text-orange-600 text-sm">
                      <TrendingDown className="h-4 w-4" />
                      <span>-3 from last semester</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="h-7 w-7 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-gray-50"
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Registrations */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Registrations</CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                          <th className="pb-3 font-medium">Name</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Department</th>
                          <th className="pb-3 font-medium">Date</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {recentRegistrations.map((reg, index) => (
                          <tr key={index} className="text-sm">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                    {reg.name.split(" ").map(n => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-gray-900">{reg.name}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <Badge variant="secondary">{reg.type}</Badge>
                            </td>
                            <td className="py-4 text-gray-600">{reg.department}</td>
                            <td className="py-4 text-gray-500">{reg.date}</td>
                            <td className="py-4">
                              <Badge
                                className={cn(
                                  reg.status === "approved"
                                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                                )}
                              >
                                {reg.status === "approved" ? (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {reg.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Department Statistics */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Department Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {departmentStats.map((dept, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{dept.name}</h4>
                          <p className="text-sm text-gray-500">
                            {dept.students} students • {dept.teachers} teachers
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            dept.utilization >= 85
                              ? "bg-green-100 text-green-700"
                              : dept.utilization >= 70
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {dept.utilization}% capacity
                        </Badge>
                      </div>
                      <Progress value={dept.utilization} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {systemAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg border-l-4",
                        alert.type === "warning" && "bg-yellow-50 border-yellow-500",
                        alert.type === "success" && "bg-green-50 border-green-500",
                        alert.type === "error" && "bg-red-50 border-red-500"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className={cn(
                            "h-5 w-5 mt-0.5",
                            alert.type === "warning" && "text-yellow-600",
                            alert.type === "success" && "text-green-600",
                            alert.type === "error" && "text-red-600"
                          )}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{alert.title}</p>
                          <p className="text-sm text-gray-600">{alert.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Campus Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campus Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Buildings</p>
                        <p className="text-sm text-gray-500">Total facilities</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">8</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Classrooms</p>
                        <p className="text-sm text-gray-500">Available today</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">156</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Staff Members</p>
                        <p className="text-sm text-gray-500">Non-teaching</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">42</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
