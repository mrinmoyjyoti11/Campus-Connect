"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Calendar,
  Bell,
  GraduationCap,
  Clock,
  FileText,
  TrendingUp,
  Award,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function StudentDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const sidebarItems = [
    { icon: BookOpen, label: "My Courses", active: true },
    { icon: Calendar, label: "Schedule" },
    { icon: FileText, label: "Assignments" },
    { icon: TrendingUp, label: "Grades" },
    { icon: Bell, label: "Notifications" },
    { icon: Users, label: "Study Groups" },
  ]

  const enrolledCourses = [
    { name: "Data Structures", code: "CS201", progress: 75, instructor: "Dr. Smith", nextClass: "Today, 10:00 AM" },
    { name: "Calculus II", code: "MATH202", progress: 60, instructor: "Prof. Johnson", nextClass: "Tomorrow, 2:00 PM" },
    { name: "Physics I", code: "PHY101", progress: 85, instructor: "Dr. Williams", nextClass: "Wed, 11:00 AM" },
    { name: "English Literature", code: "ENG105", progress: 45, instructor: "Ms. Davis", nextClass: "Thu, 3:00 PM" },
  ]

  const upcomingAssignments = [
    { title: "Algorithm Analysis Report", course: "CS201", due: "Tomorrow", priority: "high" },
    { title: "Integration Problem Set", course: "MATH202", due: "3 days", priority: "medium" },
    { title: "Lab Report: Motion", course: "PHY101", due: "5 days", priority: "low" },
  ]

  const recentGrades = [
    { assignment: "Midterm Exam", course: "CS201", grade: "A", score: "92/100" },
    { assignment: "Quiz 3", course: "MATH202", grade: "B+", score: "87/100" },
    { assignment: "Lab Practical", course: "PHY101", grade: "A-", score: "90/100" },
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
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
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
                  ? "bg-blue-50 text-blue-600"
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
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome back, Alex!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  3
                </span>
              </Button>
              <Avatar>
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-blue-600 text-white">AS</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Enrolled Courses</p>
                    <p className="text-3xl font-bold mt-1">4</p>
                  </div>
                  <BookOpen className="h-10 w-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Current GPA</p>
                    <p className="text-3xl font-bold mt-1">3.75</p>
                  </div>
                  <Award className="h-10 w-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Pending Tasks</p>
                    <p className="text-3xl font-bold mt-1">7</p>
                  </div>
                  <Clock className="h-10 w-10 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Attendance</p>
                    <p className="text-3xl font-bold mt-1">92%</p>
                  </div>
                  <GraduationCap className="h-10 w-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrolled Courses */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Courses</CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.code}
                      className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{course.name}</h3>
                          <p className="text-sm text-gray-500">
                            {course.code} • {course.instructor}
                          </p>
                        </div>
                        <Badge variant="secondary">{course.nextClass}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Upcoming Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Assignments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingAssignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          assignment.priority === "high"
                            ? "bg-red-500"
                            : assignment.priority === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {assignment.title}
                        </p>
                        <p className="text-xs text-gray-500">{assignment.course}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {assignment.due}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Grades */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Grades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentGrades.map((grade, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {grade.assignment}
                        </p>
                        <p className="text-xs text-gray-500">{grade.course}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-gray-900">{grade.grade}</span>
                        </div>
                        <p className="text-xs text-gray-500">{grade.score}</p>
                      </div>
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
