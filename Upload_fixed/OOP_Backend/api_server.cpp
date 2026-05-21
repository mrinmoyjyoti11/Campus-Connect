#define _WIN32_WINNT 0x0A00
#define WINVER 0x0A00
#include <sdkddkver.h>

/*
 * api_server.cpp
 *
 * HTTP REST API bridge between the C++ backend and your HTML/JS frontend.
 *
 * SETUP:
 *   1. Download httplib (header-only, no install needed):
 *      curl -O https://raw.githubusercontent.com/yhirose/cpp-httplib/master/httplib.h
 *
 *   2. Compile:
 *      g++ -std=c++17 -O2 -o campus_api api_server.cpp -lpthread
 *
 *   3. Run:
 *      ./campus_api
 *      Server starts at http://localhost:8080
 *
 * API ENDPOINTS:
 *   POST   /api/login                          - login, returns token
 *   POST   /api/logout                         - invalidate session
 *   GET    /api/students                       - list all students (admin/teacher)
 *   GET    /api/students/:id                   - get student profile
 *   POST   /api/students                       - add student (admin)
 *   DELETE /api/students/:id                   - remove student (admin)
 *   GET    /api/teachers                       - list all teachers
 *   POST   /api/teachers                       - add teacher (admin)
 *   DELETE /api/teachers/:id                   - remove teacher (admin)
 *   GET    /api/courses                        - list all courses
 *   POST   /api/courses                        - add course (admin)
 *   DELETE /api/courses/:id                    - remove course (admin)
 *   POST   /api/courses/:id/enroll             - enroll student
 *   DELETE /api/courses/:id/enroll/:studentId  - drop student from course
 *   POST   /api/courses/:id/teacher            - assign teacher (admin)
 *   POST   /api/grades                         - assign grade (teacher/admin)
 *   GET    /api/grades/:studentId              - get student grades
 *   POST   /api/attendance                     - mark attendance for a student (teacher)
 *   GET    /api/attendance/student/:studentId  - get attendance summary for a student
 *   GET    /api/attendance/:courseId/:date     - get attendance sheet for a course on a date
 *   POST   /api/assignments                    - create assignment (teacher)
 *   GET    /api/assignments?courseId=...       - list assignments (optionally filtered by course)
 *   DELETE /api/assignments/:id               - delete assignment (teacher)
 */

#include "campus_service.h"
#include "httplib.h"   // <-- download from github.com/yhirose/cpp-httplib
#include <iostream>
#include <string>

// ---- Simple JSON field extractor (avoids needing nlohmann or rapidjson) ----
std::string jsonGet(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":";
    auto pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos += search.size();
    while (pos < json.size() && (json[pos] == ' ')) pos++;

    if (json[pos] == '"') {
        // string value
        pos++;
        std::string val;
        while (pos < json.size() && json[pos] != '"') {
            if (json[pos] == '\\') pos++; // skip escape
            val += json[pos++];
        }
        return val;
    } else {
        // numeric or bool value
        auto end = json.find_first_of(",}", pos);
        return Utils::trim(json.substr(pos, end - pos));
    }
}

// ---- CORS headers — required for browser fetch() to work ----
void addCorsHeaders(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set_header("Content-Type", "application/json");
}

// ---- Get token from Authorization header ("Bearer <token>") ----
std::string extractToken(const httplib::Request& req) {
    auto it = req.headers.find("Authorization");
    if (it == req.headers.end()) return "";
    const std::string& auth = it->second;
    if (auth.substr(0, 7) == "Bearer ") return auth.substr(7);
    return auth;
}

// ---- Send ApiResponse as HTTP response ----
void sendResponse(httplib::Response& res, const ApiResponse& r) {
    addCorsHeaders(res);
    res.status = r.statusCode;
    res.set_content(r.body, "application/json");
}

int main() {
    CampusManagementSystem cms;
    httplib::Server svr;

    // ---- CORS preflight for all routes ----
    svr.Options(".*", [](const httplib::Request&, httplib::Response& res) {
        addCorsHeaders(res);
        res.status = 204;
    });

    // ==================== AUTH ====================

    svr.Post("/api/login", [&](const httplib::Request& req, httplib::Response& res) {
        std::string email    = jsonGet(req.body, "email");
        std::string password = jsonGet(req.body, "password");
        if (email.empty() || password.empty()) {
            sendResponse(res, ApiResponse::badRequest("email and password required"));
            return;
        }
        sendResponse(res, cms.login(email, password));
    });

    svr.Post("/api/logout", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.logout(extractToken(req)));
    });

    // ==================== STUDENTS ====================

    svr.Get("/api/students", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.getAllStudents(extractToken(req)));
    });

    svr.Get(R"(/api/students/([^/]+))", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.getStudent(extractToken(req), req.matches[1]));
    });

    svr.Post("/api/students", [&](const httplib::Request& req, httplib::Response& res) {
        std::string name  = jsonGet(req.body, "name");
        std::string email = jsonGet(req.body, "email");
        std::string pass  = jsonGet(req.body, "password");
        std::string dept  = jsonGet(req.body, "department");
        std::string semStr= jsonGet(req.body, "semester");
        int sem = semStr.empty() ? 1 : std::stoi(semStr);
        sendResponse(res, cms.addStudent(extractToken(req), name, email, pass, dept, sem));
    });

    svr.Delete(R"(/api/students/([^/]+))", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.removeStudent(extractToken(req), req.matches[1]));
    });

    // ==================== TEACHERS ====================

    svr.Get("/api/teachers", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.getAllTeachers(extractToken(req)));
    });

    svr.Post("/api/teachers", [&](const httplib::Request& req, httplib::Response& res) {
        std::string name   = jsonGet(req.body, "name");
        std::string email  = jsonGet(req.body, "email");
        std::string pass   = jsonGet(req.body, "password");
        std::string dept   = jsonGet(req.body, "department");
        std::string desig  = jsonGet(req.body, "designation");
        std::string office = jsonGet(req.body, "office");
        sendResponse(res, cms.addTeacher(extractToken(req), name, email, pass, dept, desig, office));
    });

    svr.Delete(R"(/api/teachers/([^/]+))", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.removeTeacher(extractToken(req), req.matches[1]));
    });

    // ==================== COURSES ====================

    svr.Get("/api/courses", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.getAllCourses(extractToken(req)));
    });

    svr.Post("/api/courses", [&](const httplib::Request& req, httplib::Response& res) {
        std::string name    = jsonGet(req.body, "name");
        std::string dept    = jsonGet(req.body, "department");
        std::string credStr = jsonGet(req.body, "credits");
        std::string capStr  = jsonGet(req.body, "capacity");
        int credits  = credStr.empty() ? 3 : std::stoi(credStr);
        int capacity = capStr.empty()  ? 50: std::stoi(capStr);
        sendResponse(res, cms.addCourse(extractToken(req), name, dept, credits, capacity));
    });

    svr.Delete(R"(/api/courses/([^/]+))", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.removeCourse(extractToken(req), req.matches[1]));
    });

    // ==================== ENROLLMENT ====================

    // POST /api/courses/:id/enroll  body: { "studentId": "STU1001" }
    svr.Post(R"(/api/courses/([^/]+)/enroll)", [&](const httplib::Request& req, httplib::Response& res) {
        std::string studentId = jsonGet(req.body, "studentId");
        sendResponse(res, cms.enrollStudentInCourse(extractToken(req), studentId, req.matches[1]));
    });

    // DELETE /api/courses/:courseId/enroll/:studentId
    svr.Delete(R"(/api/courses/([^/]+)/enroll/([^/]+))", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.dropStudentFromCourse(extractToken(req), req.matches[2], req.matches[1]));
    });

    // POST /api/courses/:id/teacher  body: { "teacherId": "TCH2001" }
    svr.Post(R"(/api/courses/([^/]+)/teacher)", [&](const httplib::Request& req, httplib::Response& res) {
        std::string teacherId = jsonGet(req.body, "teacherId");
        sendResponse(res, cms.assignTeacherToCourse(extractToken(req), teacherId, req.matches[1]));
    });

    // ==================== GRADES ====================

    // POST /api/grades  body: { "studentId": "...", "courseId": "...", "grade": 3.5 }
    svr.Post("/api/grades", [&](const httplib::Request& req, httplib::Response& res) {
        std::string studentId = jsonGet(req.body, "studentId");
        std::string courseId  = jsonGet(req.body, "courseId");
        std::string gradeStr  = jsonGet(req.body, "grade");
        if (studentId.empty() || courseId.empty() || gradeStr.empty()) {
            sendResponse(res, ApiResponse::badRequest("studentId, courseId, grade required"));
            return;
        }
        float grade = std::stof(gradeStr);
        sendResponse(res, cms.assignGrade(extractToken(req), studentId, courseId, grade));
    });

    svr.Get(R"(/api/grades/([^/]+))", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.getStudentGrades(extractToken(req), req.matches[1]));
    });

    // ==================== ATTENDANCE ====================
    // POST /api/attendance  body: { "courseId":"...", "studentId":"...", "date":"YYYY-MM-DD", "status":"present"|"absent" }
    svr.Post("/api/attendance", [&](const httplib::Request& req, httplib::Response& res) {
        std::string courseId  = jsonGet(req.body, "courseId");
        std::string studentId = jsonGet(req.body, "studentId");
        std::string date      = jsonGet(req.body, "date");
        std::string status    = jsonGet(req.body, "status");
        if (courseId.empty() || studentId.empty() || date.empty() || status.empty()) {
            sendResponse(res, ApiResponse::badRequest("courseId, studentId, date, status required"));
            return;
        }
        sendResponse(res, cms.markAttendance(extractToken(req), courseId, studentId, date, status));
    });

    // GET /api/attendance/:studentId  - returns all attendance records for a student
    svr.Get(R"(/api/attendance/student/([^/]+))", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.getStudentAttendance(extractToken(req), req.matches[1]));
    });

    // GET /api/attendance/:courseId/:date  - returns attendance sheet for a course on a date
    svr.Get(R"(/api/attendance/([^/]+)/([^/]+))", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.getCourseAttendance(extractToken(req), req.matches[1], req.matches[2]));
    });

    // ==================== ASSIGNMENTS ====================
    // POST /api/assignments  body: { "courseId":"...", "title":"...", "description":"...", "dueDate":"YYYY-MM-DD" }
    svr.Post("/api/assignments", [&](const httplib::Request& req, httplib::Response& res) {
        std::string courseId = jsonGet(req.body, "courseId");
        std::string title    = jsonGet(req.body, "title");
        std::string desc     = jsonGet(req.body, "description");
        std::string dueDate  = jsonGet(req.body, "dueDate");
        if (courseId.empty() || title.empty() || dueDate.empty()) {
            sendResponse(res, ApiResponse::badRequest("courseId, title, dueDate required"));
            return;
        }
        sendResponse(res, cms.createAssignment(extractToken(req), courseId, title, desc, dueDate));
    });

    // GET /api/assignments?courseId=CRS101  - list assignments for one or more courses
    svr.Get("/api/assignments", [&](const httplib::Request& req, httplib::Response& res) {
        std::string courseId = req.has_param("courseId") ? req.get_param_value("courseId") : "";
        sendResponse(res, cms.getAssignments(extractToken(req), courseId));
    });

    // DELETE /api/assignments/:id
    svr.Delete(R"(/api/assignments/([^/]+))", [&](const httplib::Request& req, httplib::Response& res) {
        sendResponse(res, cms.deleteAssignment(extractToken(req), req.matches[1]));
    });

    // ==================== START SERVER ====================
    std::cout << "Campus API server running at http://localhost:8080\n";
    std::cout << "Default admin: admin@campus.edu / admin123\n";
    std::cout << "Press Ctrl+C to stop.\n";

    svr.listen("0.0.0.0", 8080);
    return 0;
}
