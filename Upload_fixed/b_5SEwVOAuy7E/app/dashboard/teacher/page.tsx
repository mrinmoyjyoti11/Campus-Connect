"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Calendar,
  Bell,
  Users,
  Clock,
  FileText,
  CheckCircle,
  PenTool,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plus,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function TeacherDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const sidebarItems = [
    { icon: BookOpen, label: "My Classes", active: true },
    { icon: Users, label: "Students" },
    { icon: FileText, label: "Assignments" },
    { icon: PenTool, label: "Grading" },
    { icon: Calendar, label: "Schedule" },
    { icon: BarChart3, label: "Reports" },
    { icon: Bell, label: "Notifications" },
  ]

  const myClasses = [
    { name: "Data Structures", code: "CS201", students: 45, room: "Room 301", time: "10:00 AM - 11:30 AM", day: "Mon, Wed, Fri" },
    { name: "Algorithm Design", code: "CS301", students: 38, room: "Room 205", time: "2:00 PM - 3:30 PM", day: "Tue, Thu" },
    { name: "Database Systems", code: "CS401", students: 32, room: "Lab 102", time: "11:00 AM - 12:30 PM", day: "Mon, Wed" },
  ]

  const pendingGrading = [
    { assignment: "Midterm Exam", course: "CS201", submissions: 42, total: 45, deadline: "2 days" },
    { assignment: "Project Phase 1", course: "CS301", submissions: 35, total: 38, deadline: "5 days" },
    { assignment: "Lab Report 3", course: "CS401", submissions: 30, total: 32, deadline: "1 week" },
  ]

  const todaySchedule = [
    { time: "10:00 AM", class: "Data Structures", room: "Room 301", type: "Lecture" },
    { time: "11:30 AM", class: "Office Hours", room: "Office 412", type: "Office" },
    { time: "2:00 PM", class: "Algorithm Design", room: "Room 205", type: "Lecture" },
    { time: "4:00 PM", class: "Department Meeting", room: "Conference A", type: "Meeting" },
  ]

  const recentMessages = [
    { from: "John Smith", message: "Question about assignment 3...", course: "CS201", time: "10 min ago" },
    { from: "Emily Johnson", message: "Request for grade review", course: "CS301", time: "1 hour ago" },
    { from: "Michael Brown", message: "Lab equipment issue", course: "CS401", time: "2 hours ago" },
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
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold">
                CC
              </div>
              <span className="font-bold text-lg">Campus Connect</span>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
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
                  ? "bg-green-50 text-green-600"
                  : "text-gray-600 hover:bg-gray-100"
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
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome back, Dr. Smith!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  5
                </span>
              </Button>
              <Avatar>
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-green-600 text-white">DS</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Active Classes</p>
                    <p className="text-3xl font-bold mt-1">3</p>
                  </div>
                  <BookOpen className="h-10 w-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Students</p>
                    <p className="text-3xl font-bold mt-1">115</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Pending Grading</p>
                    <p className="text-3xl font-bold mt-1">107</p>
                  </div>
                  <PenTool className="h-10 w-10 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Classes Today</p>
                    <p className="text-3xl font-bold mt-1">2</p>
                  </div>
                  <Clock className="h-10 w-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Classes */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Classes</CardTitle>
                  <Button variant="ghost" size="sm" className="text-green-600">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {myClasses.map((cls) => (
                    <div
                      key={cls.code}
                      className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                          <p className="text-sm text-gray-500">{cls.code} • {cls.room}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          {cls.students} students
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {cls.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {cls.day}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pending Grading */}
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Pending Grading</CardTitle>
                  <Button variant="ghost" size="sm" className="text-green-600">
                    Grade All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingGrading.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.assignment}</p>
                          <p className="text-sm text-gray-500">{item.course}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{item.submissions}/{item.total}</span>
                        </div>
                        <p className="text-xs text-gray-500">Due in {item.deadline}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todaySchedule.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-semibold text-gray-900">{item.time}</p>
                      </div>
                      <div className="w-px h-10 bg-gray-300" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{item.class}</p>
                        <p className="text-xs text-gray-500">{item.room}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          item.type === "Lecture" && "bg-green-100 text-green-700",
                          item.type === "Office" && "bg-blue-100 text-blue-700",
                          item.type === "Meeting" && "bg-purple-100 text-purple-700"
                        )}
                      >
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Messages</CardTitle>
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentMessages.map((msg, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900">{msg.from}</p>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {msg.course}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
