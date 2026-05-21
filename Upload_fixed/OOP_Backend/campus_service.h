#pragma once
#include "campus_system.h"
#include "database.h"
#include <stdexcept>

// ==================== AUTH SERVICE ====================
class AuthService {
    std::map<std::string, std::string> activeSessions;
    std::map<std::string, std::string> sessionRoles;
public:
    std::string createSession(const std::string& userId, const std::string& role) {
        std::string token = Utils::generateToken();
        activeSessions[token] = userId;
        sessionRoles[token]   = role;
        return token;
    }
    bool validateSession(const std::string& token) const { return activeSessions.count(token) > 0; }
    std::string getUserId(const std::string& token) const {
        auto it = activeSessions.find(token);
        return (it != activeSessions.end()) ? it->second : "";
    }
    std::string getRole(const std::string& token) const {
        auto it = sessionRoles.find(token);
        return (it != sessionRoles.end()) ? it->second : "";
    }
    void invalidateSession(const std::string& token) {
        activeSessions.erase(token); sessionRoles.erase(token);
    }
};

// ==================== HTTP RESPONSE HELPER ====================
struct ApiResponse {
    int statusCode;
    std::string body;
    static ApiResponse ok(const std::string& json)                         { return { 200, json }; }
    static ApiResponse created(const std::string& json)                    { return { 201, json }; }
    static ApiResponse badRequest(const std::string& msg)                  { return { 400, "{\"error\":\"" + msg + "\"}" }; }
    static ApiResponse unauthorized(const std::string& msg = "Unauthorized"){ return { 401, "{\"error\":\"" + msg + "\"}" }; }
    static ApiResponse forbidden(const std::string& msg = "Forbidden")     { return { 403, "{\"error\":\"" + msg + "\"}" }; }
    static ApiResponse notFound(const std::string& msg = "Not found")      { return { 404, "{\"error\":\"" + msg + "\"}" }; }
    static ApiResponse serverError(const std::string& msg)                 { return { 500, "{\"error\":\"" + msg + "\"}" }; }
};

// ==================== CAMPUS MANAGEMENT SYSTEM ====================
class CampusManagementSystem {
private:
    std::vector<std::shared_ptr<Student>> students;
    std::vector<std::shared_ptr<Teacher>> teachers;
    std::vector<std::shared_ptr<Admin>>   admins;
    std::vector<std::shared_ptr<Course>>  courses;
    Database    db;
    AuthService auth;
    int studentCounter = 1000;
    int teacherCounter = 2000;
    int courseCounter  = 100;

    std::shared_ptr<Student> findStudentPtr(const std::string& id) const {
        for (auto& s : students) if (s->getId() == id) return s; return nullptr;
    }
    std::shared_ptr<Teacher> findTeacherPtr(const std::string& id) const {
        for (auto& t : teachers) if (t->getId() == id) return t; return nullptr;
    }
    std::shared_ptr<Course> findCoursePtr(const std::string& id) const {
        for (auto& c : courses) if (c->getId() == id) return c; return nullptr;
    }
    bool hasRole(const std::string& token, const std::string& requiredRole) const {
        return auth.validateSession(token) && auth.getRole(token) == requiredRole;
    }
    bool isAdminOrTeacher(const std::string& token) const {
        if (!auth.validateSession(token)) return false;
        auto role = auth.getRole(token);
        return role == "admin" || role == "teacher";
    }
    std::map<std::string, int> buildCreditMap() const {
        std::map<std::string, int> m;
        for (const auto& c : courses) m[c->getId()] = c->getCredits();
        return m;
    }

public:
    explicit CampusManagementSystem(const std::string& dbPath = "campus.db") : db(dbPath) {
        loadData();
        if (admins.empty()) {
            auto a = std::make_shared<Admin>(
                "ADMIN001", "System Admin", "admin@campus.edu",
                Utils::hashPassword("admin123"), "full"
            );
            admins.push_back(a);
            db.saveAdmin(*a);
            std::cout << "[INFO] Default admin created. Login: admin@campus.edu / admin123\n";
        }
    }

    ApiResponse login(const std::string& email, const std::string& password) {
        auto tryLogin = [&](auto& list) -> std::string {
            for (auto& u : list)
                if (u->getEmail() == email && u->authenticate(password))
                    return auth.createSession(u->getId(), u->getRole());
            return "";
        };
        std::string token = tryLogin(admins);
        if (token.empty()) token = tryLogin(teachers);
        if (token.empty()) token = tryLogin(students);
        if (token.empty()) return ApiResponse::unauthorized("Invalid email or password");
        return ApiResponse::ok(
            "{\"token\":\"" + token + "\",\"userId\":\"" + auth.getUserId(token) +
            "\",\"role\":\"" + auth.getRole(token) + "\"}"
        );
    }

    ApiResponse logout(const std::string& token) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        auth.invalidateSession(token);
        return ApiResponse::ok("{\"message\":\"Logged out\"}");
    }

    ApiResponse addStudent(const std::string& token, const std::string& name,
                           const std::string& email, const std::string& password,
                           const std::string& dept, int semester) {
        if (!hasRole(token, "admin")) return ApiResponse::forbidden("Only admins can add students");
        if (name.empty() || email.empty() || password.empty() || dept.empty())
            return ApiResponse::badRequest("All fields are required");
        if (!Utils::isValidEmail(email)) return ApiResponse::badRequest("Invalid email address");
        if (password.length() < 6) return ApiResponse::badRequest("Password must be at least 6 characters");
        if (semester < 1 || semester > 8) return ApiResponse::badRequest("Semester must be between 1 and 8");
        if (db.emailExists(email)) return ApiResponse::badRequest("Email already registered");
        studentCounter = db.incrementCounter("student");
        std::string id = "STU" + std::to_string(studentCounter);
        auto s = std::make_shared<Student>(id, Utils::trim(name), email, Utils::hashPassword(password), dept, semester);
        students.push_back(s);
        db.saveStudent(*s);
        return ApiResponse::created("{\"id\":\"" + id + "\",\"message\":\"Student created\"}");
    }

    ApiResponse getStudent(const std::string& token, const std::string& studentId) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        if (auth.getRole(token) == "student" && auth.getUserId(token) != studentId)
            return ApiResponse::forbidden("Access denied");
        auto s = findStudentPtr(studentId);
        if (!s) return ApiResponse::notFound("Student not found");
        return ApiResponse::ok(s->toJson());
    }

    ApiResponse getAllStudents(const std::string& token) {
        if (!isAdminOrTeacher(token)) return ApiResponse::forbidden();
        std::string json = "["; bool first = true;
        for (const auto& s : students) { if (!first) json += ","; json += s->toJson(); first = false; }
        return ApiResponse::ok(json + "]");
    }

    ApiResponse removeStudent(const std::string& token, const std::string& studentId) {
        if (!hasRole(token, "admin")) return ApiResponse::forbidden();
        auto it = std::remove_if(students.begin(), students.end(),
            [&](const std::shared_ptr<Student>& s) { return s->getId() == studentId; });
        if (it == students.end()) return ApiResponse::notFound("Student not found");
        students.erase(it, students.end());
        db.deleteStudent(studentId);
        return ApiResponse::ok("{\"message\":\"Student removed\"}");
    }

    ApiResponse addTeacher(const std::string& token, const std::string& name,
                           const std::string& email, const std::string& password,
                           const std::string& dept, const std::string& designation,
                           const std::string& office = "") {
        if (!hasRole(token, "admin")) return ApiResponse::forbidden();
        if (name.empty() || email.empty() || password.empty() || dept.empty() || designation.empty())
            return ApiResponse::badRequest("All required fields must be provided");
        if (!Utils::isValidEmail(email)) return ApiResponse::badRequest("Invalid email address");
        if (password.length() < 6) return ApiResponse::badRequest("Password must be at least 6 characters");
        if (db.emailExists(email)) return ApiResponse::badRequest("Email already registered");
        teacherCounter = db.incrementCounter("teacher");
        std::string id = "TCH" + std::to_string(teacherCounter);
        auto t = std::make_shared<Teacher>(id, Utils::trim(name), email, Utils::hashPassword(password), dept, designation, office);
        teachers.push_back(t);
        db.saveTeacher(*t);
        return ApiResponse::created("{\"id\":\"" + id + "\",\"message\":\"Teacher created\"}");
    }

    ApiResponse getAllTeachers(const std::string& token) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        std::string json = "["; bool first = true;
        for (const auto& t : teachers) { if (!first) json += ","; json += t->toJson(); first = false; }
        return ApiResponse::ok(json + "]");
    }

    ApiResponse removeTeacher(const std::string& token, const std::string& teacherId) {
        if (!hasRole(token, "admin")) return ApiResponse::forbidden();
        auto it = std::remove_if(teachers.begin(), teachers.end(),
            [&](const std::shared_ptr<Teacher>& t) { return t->getId() == teacherId; });
        if (it == teachers.end()) return ApiResponse::notFound("Teacher not found");
        teachers.erase(it, teachers.end());
        db.deleteTeacher(teacherId);
        return ApiResponse::ok("{\"message\":\"Teacher removed\"}");
    }

    ApiResponse addCourse(const std::string& token, const std::string& name,
                          const std::string& dept, int credits, int capacity = 50) {
        if (!hasRole(token, "admin")) return ApiResponse::forbidden();
        if (name.empty() || dept.empty()) return ApiResponse::badRequest("Name and department are required");
        if (credits < 1 || credits > 6) return ApiResponse::badRequest("Credits must be between 1 and 6");
        if (capacity < 1 || capacity > 500) return ApiResponse::badRequest("Capacity must be between 1 and 500");
        courseCounter = db.incrementCounter("course");
        std::string id = "CRS" + std::to_string(courseCounter);
        auto c = std::make_shared<Course>(id, Utils::trim(name), dept, credits, capacity);
        courses.push_back(c);
        db.saveCourse(*c);
        return ApiResponse::created("{\"id\":\"" + id + "\",\"message\":\"Course created\"}");
    }

    ApiResponse getAllCourses(const std::string& token) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        std::string json = "["; bool first = true;
        for (const auto& c : courses) { if (!first) json += ","; json += c->toJson(); first = false; }
        return ApiResponse::ok(json + "]");
    }

    ApiResponse removeCourse(const std::string& token, const std::string& courseId) {
        if (!hasRole(token, "admin")) return ApiResponse::forbidden();
        auto it = std::remove_if(courses.begin(), courses.end(),
            [&](const std::shared_ptr<Course>& c) { return c->getId() == courseId; });
        if (it == courses.end()) return ApiResponse::notFound("Course not found");
        courses.erase(it, courses.end());
        db.deleteCourse(courseId);
        return ApiResponse::ok("{\"message\":\"Course removed\"}");
    }

    ApiResponse enrollStudentInCourse(const std::string& token,
                                      const std::string& studentId, const std::string& courseId) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        if (auth.getRole(token) == "student" && auth.getUserId(token) != studentId)
            return ApiResponse::forbidden("Students can only enroll themselves");
        auto student = findStudentPtr(studentId);
        auto course  = findCoursePtr(courseId);
        if (!student) return ApiResponse::notFound("Student not found");
        if (!course)  return ApiResponse::notFound("Course not found");
        if (course->isFull()) return ApiResponse::badRequest("Course is full");
        if (student->isEnrolled(courseId)) return ApiResponse::badRequest("Already enrolled in this course");
        course->enrollStudent(studentId);
        student->enrollCourse(courseId);
        db.saveEnrollment(studentId, courseId);
        return ApiResponse::ok("{\"message\":\"Enrolled successfully\"}");
    }

    ApiResponse dropStudentFromCourse(const std::string& token,
                                      const std::string& studentId, const std::string& courseId) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        if (auth.getRole(token) == "student" && auth.getUserId(token) != studentId)
            return ApiResponse::forbidden("Access denied");
        auto student = findStudentPtr(studentId);
        auto course  = findCoursePtr(courseId);
        if (!student) return ApiResponse::notFound("Student not found");
        if (!course)  return ApiResponse::notFound("Course not found");
        student->dropCourse(courseId);
        course->removeStudent(studentId);
        db.deleteEnrollment(studentId, courseId);
        return ApiResponse::ok("{\"message\":\"Course dropped\"}");
    }

    ApiResponse assignTeacherToCourse(const std::string& token,
                                      const std::string& teacherId, const std::string& courseId) {
        if (!hasRole(token, "admin")) return ApiResponse::forbidden();
        auto teacher = findTeacherPtr(teacherId);
        auto course  = findCoursePtr(courseId);
        if (!teacher) return ApiResponse::notFound("Teacher not found");
        if (!course)  return ApiResponse::notFound("Course not found");
        course->assignTeacher(teacherId);
        teacher->assignCourse(courseId);
        db.saveCourse(*course);
        db.saveTeacher(*teacher);
        return ApiResponse::ok("{\"message\":\"Teacher assigned\"}");
    }

    ApiResponse assignGrade(const std::string& token, const std::string& studentId,
                            const std::string& courseId, float grade) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        auto role = auth.getRole(token);
        if (role == "student") return ApiResponse::forbidden("Students cannot assign grades");
        if (role == "teacher") {
            auto course = findCoursePtr(courseId);
            if (!course) return ApiResponse::notFound("Course not found");
            if (course->getTeacherId() != auth.getUserId(token))
                return ApiResponse::forbidden("You are not assigned to this course");
            if (!course->hasStudent(studentId))
                return ApiResponse::badRequest("Student is not enrolled in this course");
        }
        if (!Utils::isValidGrade(grade)) return ApiResponse::badRequest("Grade must be between 0.0 and 4.0");
        auto student = findStudentPtr(studentId);
        if (!student) return ApiResponse::notFound("Student not found");
        try {
            student->setGrade(courseId, grade);
            db.saveGrade(studentId, courseId, grade);
        } catch (const std::invalid_argument& e) {
            return ApiResponse::badRequest(e.what());
        }
        return ApiResponse::ok("{\"message\":\"Grade assigned\"}");
    }

    ApiResponse getStudentGrades(const std::string& token, const std::string& studentId) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        if (auth.getRole(token) == "student" && auth.getUserId(token) != studentId)
            return ApiResponse::forbidden("Access denied");
        auto student = findStudentPtr(studentId);
        if (!student) return ApiResponse::notFound("Student not found");
        auto creditMap = buildCreditMap();
        std::string json = "{\"studentId\":\"" + studentId +
            "\",\"gpa\":" + std::to_string(student->calculateGPA(creditMap)) + ",\"grades\":{";
        bool first = true;
        for (const auto& cid : student->getCourses()) {
            float g = student->getGrade(cid);
            if (g >= 0) { if (!first) json += ","; json += "\"" + cid + "\":" + std::to_string(g); first = false; }
        }
        return ApiResponse::ok(json + "}}");
    }

    // ==================== ATTENDANCE ====================

    ApiResponse markAttendance(const std::string& token, const std::string& courseId,
                               const std::string& studentId, const std::string& date,
                               const std::string& status) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        std::string role = auth.getRole(token);
        if (role == "student") return ApiResponse::forbidden("Students cannot mark attendance");
        if (status != "present" && status != "absent")
            return ApiResponse::badRequest("status must be 'present' or 'absent'");
        db.saveAttendance(courseId, studentId, date, status);
        return ApiResponse::ok("{\"message\":\"Attendance marked\"}");
    }

    ApiResponse getStudentAttendance(const std::string& token, const std::string& studentId) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        if (auth.getRole(token) == "student" && auth.getUserId(token) != studentId)
            return ApiResponse::forbidden("Access denied");
        auto records = db.loadAttendanceForStudent(studentId);
        // Group by courseId
        std::map<std::string, std::map<std::string,std::string>> byCourse;
        for (auto& r : records) byCourse[r.courseId][r.date] = r.status;
        std::string json = "{\"studentId\":\"" + studentId + "\",\"attendance\":{";
        bool firstC = true;
        for (auto& [cid, dates] : byCourse) {
            if (!firstC) json += ",";
            json += "\"" + cid + "\":{";
            bool firstD = true;
            for (auto& [d, s] : dates) {
                if (!firstD) json += ",";
                json += "\"" + d + "\":\"" + s + "\"";
                firstD = false;
            }
            json += "}";
            firstC = false;
        }
        json += "}}";
        return ApiResponse::ok(json);
    }

    ApiResponse getCourseAttendance(const std::string& token, const std::string& courseId,
                                    const std::string& date) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        auto records = db.loadAttendanceForCourse(courseId, date);
        std::string json = "{\"courseId\":\"" + courseId + "\",\"date\":\"" + date + "\",\"records\":[";
        bool first = true;
        for (auto& r : records) {
            if (!first) json += ",";
            json += "{\"studentId\":\"" + r.studentId + "\",\"status\":\"" + r.status + "\"}";
            first = false;
        }
        json += "]}";
        return ApiResponse::ok(json);
    }

    // ==================== ASSIGNMENTS ====================

    ApiResponse createAssignment(const std::string& token, const std::string& courseId,
                                 const std::string& title, const std::string& description,
                                 const std::string& dueDate) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        if (auth.getRole(token) == "student") return ApiResponse::forbidden("Students cannot create assignments");
        std::string id = db.saveAssignment(courseId, title, description, dueDate);
        return ApiResponse::created("{\"id\":\"" + id + "\",\"message\":\"Assignment created\"}");
    }

    ApiResponse getAssignments(const std::string& token, const std::string& courseId) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        auto assignments = db.loadAssignments(courseId);
        std::string json = "[";
        bool first = true;
        for (auto& a : assignments) {
            if (!first) json += ",";
            // Escape description for JSON
            std::string desc = a.description;
            std::string escaped; for (char c : desc) { if (c=='"') escaped += "\\\""; else escaped += c; }
            json += "{\"id\":\"" + a.id + "\",\"courseId\":\"" + a.courseId +
                    "\",\"title\":\"" + a.title + "\",\"description\":\"" + escaped +
                    "\",\"dueDate\":\"" + a.dueDate + "\",\"createdAt\":\"" + a.createdAt + "\"}";
            first = false;
        }
        json += "]";
        return ApiResponse::ok(json);
    }

    ApiResponse deleteAssignment(const std::string& token, const std::string& id) {
        if (!auth.validateSession(token)) return ApiResponse::unauthorized();
        if (auth.getRole(token) == "student") return ApiResponse::forbidden("Students cannot delete assignments");
        db.deleteAssignment(id);
        return ApiResponse::ok("{\"message\":\"Assignment deleted\"}");
    }

    void loadData() {
        try {
            admins   = db.loadAdmins();
            students = db.loadStudents();
            teachers = db.loadTeachers();
            courses  = db.loadCourses();
            studentCounter = db.getCounter("student");
            teacherCounter = db.getCounter("teacher");
            courseCounter  = db.getCounter("course");
            std::cout << "[INFO] Loaded " << students.size() << " students, "
                      << teachers.size() << " teachers, "
                      << courses.size()  << " courses from database.\n";
        } catch (const std::exception& e) {
            std::cerr << "[ERROR] Failed to load data: " << e.what() << std::endl;
        }
    }

    Student* findStudent(const std::string& id) { return findStudentPtr(id).get(); }
    Teacher* findTeacher(const std::string& id) { return findTeacherPtr(id).get(); }
    Course*  findCourse(const std::string& id)  { return findCoursePtr(id).get(); }
    const std::vector<std::shared_ptr<Student>>& getAllStudentsVec() const { return students; }
    const std::vector<std::shared_ptr<Teacher>>& getAllTeachersVec() const { return teachers; }
    const std::vector<std::shared_ptr<Course>>&  getAllCoursesVec()  const { return courses; }
};
