#pragma once
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <map>
#include <unordered_set>
#include <memory>
#include <algorithm>
#include <functional>
#include <stdexcept>
#include <regex>
#include <chrono>
#include <iomanip>

// ==================== UTILITIES ====================
namespace Utils {

    // Simple SHA-256-like hash using std (no OpenSSL dependency)
    // For production, replace with bcrypt or OpenSSL SHA-256
    std::string hashPassword(const std::string& password) {
        std::hash<std::string> hasher;
        size_t hashed = hasher(password + "campus_salt_2024");
        std::stringstream ss;
        ss << std::hex << std::setw(16) << std::setfill('0') << hashed;
        return ss.str();
    }

    bool verifyPassword(const std::string& plain, const std::string& hashed) {
        return hashPassword(plain) == hashed;
    }

    bool isValidEmail(const std::string& email) {
        static const std::regex pattern(R"([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})");
        return std::regex_match(email, pattern);
    }

    bool isValidGrade(float grade) {
        return grade >= 0.0f && grade <= 4.0f;
    }

    std::string trim(const std::string& s) {
        size_t start = s.find_first_not_of(" \t\r\n");
        size_t end   = s.find_last_not_of(" \t\r\n");
        return (start == std::string::npos) ? "" : s.substr(start, end - start + 1);
    }

    // Escape commas/semicolons for safe CSV serialization
    std::string escape(const std::string& s) {
        std::string out;
        for (char c : s) {
            if (c == '|' || c == '\\') out += '\\';
            out += c;
        }
        return out;
    }

    std::string unescape(const std::string& s) {
        std::string out;
        bool esc = false;
        for (char c : s) {
            if (esc) { out += c; esc = false; }
            else if (c == '\\') esc = true;
            else out += c;
        }
        return out;
    }

    // Split on a single delimiter character (respects escape)
    std::vector<std::string> split(const std::string& s, char delim) {
        std::vector<std::string> parts;
        std::string cur;
        bool esc = false;
        for (char c : s) {
            if (esc) { cur += c; esc = false; }
            else if (c == '\\') esc = true;
            else if (c == delim) { parts.push_back(cur); cur.clear(); }
            else cur += c;
        }
        parts.push_back(cur);
        return parts;
    }

    std::string generateToken() {
        auto now = std::chrono::system_clock::now().time_since_epoch().count();
        std::hash<std::string> h;
        return std::to_string(h(std::to_string(now)));
    }
}

// ==================== BASE USER CLASS ====================
class User {
protected:
    std::string id;
    std::string name;
    std::string email;
    std::string passwordHash;  // FIXED: store hash, never plaintext
    std::string role;

public:
    User(std::string id, std::string name, std::string email,
         std::string passwordHash, std::string role)
        : id(std::move(id)), name(std::move(name)), email(std::move(email)),
          passwordHash(std::move(passwordHash)), role(std::move(role)) {}

    virtual ~User() = default;

    std::string getId()    const { return id; }
    std::string getName()  const { return name; }
    std::string getEmail() const { return email; }
    std::string getRole()  const { return role; }
    std::string getPasswordHash() const { return passwordHash; }

    bool authenticate(const std::string& plainPassword) const {
        return Utils::verifyPassword(plainPassword, passwordHash);
    }

    void setName(const std::string& n)  { name = Utils::trim(n); }
    void setEmail(const std::string& e) { email = e; }

    void setPassword(const std::string& plainPassword) {
        passwordHash = Utils::hashPassword(plainPassword);
    }

    virtual void displayInfo() const {
        std::cout << "ID: " << id << " | Name: " << name
                  << " | Email: " << email << " | Role: " << role << std::endl;
    }

    // Serialize uses pipe '|' as delimiter to avoid comma conflicts with names
    virtual std::string serialize() const {
        return Utils::escape(id) + "|" + Utils::escape(name) + "|" +
               Utils::escape(email) + "|" + passwordHash + "|" + role;
    }

    virtual std::string toJson() const {
        return "{\"id\":\"" + id + "\",\"name\":\"" + name +
               "\",\"email\":\"" + email + "\",\"role\":\"" + role + "\"}";
    }
};

// ==================== STUDENT CLASS ====================
class Student : public User {
private:
    std::string department;
    int semester;
    std::unordered_set<std::string> enrolledCourses; // FIXED: O(1) lookup
    std::map<std::string, float> grades;

public:
    Student(std::string id, std::string name, std::string email,
            std::string passwordHash, std::string dept, int sem)
        : User(std::move(id), std::move(name), std::move(email),
               std::move(passwordHash), "student"),
          department(std::move(dept)), semester(sem) {}

    std::string getDepartment() const { return department; }
    int getSemester()           const { return semester; }

    std::vector<std::string> getCourses() const {
        return std::vector<std::string>(enrolledCourses.begin(), enrolledCourses.end());
    }

    bool isEnrolled(const std::string& courseId) const {
        return enrolledCourses.count(courseId) > 0;
    }

    bool enrollCourse(const std::string& courseId) {
        return enrolledCourses.insert(courseId).second;
    }

    bool dropCourse(const std::string& courseId) {
        return enrolledCourses.erase(courseId) > 0;
    }

    void setGrade(const std::string& courseId, float grade) {
        if (!Utils::isValidGrade(grade))
            throw std::invalid_argument("Grade must be between 0.0 and 4.0");
        grades[courseId] = grade;
    }

    float getGrade(const std::string& courseId) const {
        auto it = grades.find(courseId);
        return (it != grades.end()) ? it->second : -1.0f;
    }

    // FIXED: credit-weighted GPA (weights provided by caller)
    float calculateGPA(const std::map<std::string, int>& courseCredits = {}) const {
        if (grades.empty()) return 0.0f;
        float totalPoints = 0.0f;
        int   totalCredits = 0;
        for (const auto& [cid, grade] : grades) {
            int credits = 1;
            auto it = courseCredits.find(cid);
            if (it != courseCredits.end()) credits = it->second;
            totalPoints  += grade * credits;
            totalCredits += credits;
        }
        return totalCredits > 0 ? totalPoints / totalCredits : 0.0f;
    }

    void displayInfo() const override {
        User::displayInfo();
        std::cout << "Department: " << department << " | Semester: " << semester << std::endl;
    }

    std::string serialize() const override {
        std::string data = User::serialize() + "|" +
                           Utils::escape(department) + "|" + std::to_string(semester) + "|COURSES:";
        for (const auto& c : enrolledCourses) data += Utils::escape(c) + ";";
        data += "|GRADES:";
        for (const auto& [cid, g] : grades)
            data += Utils::escape(cid) + "=" + std::to_string(g) + ";";
        return data;
    }

    std::string toJson() const override {
        std::string json = "{\"id\":\"" + id + "\",\"name\":\"" + name +
            "\",\"email\":\"" + email + "\",\"role\":\"student\"" +
            ",\"department\":\"" + department + "\",\"semester\":" + std::to_string(semester) +
            ",\"gpa\":" + std::to_string(calculateGPA()) +
            ",\"courses\":[";
        bool first = true;
        for (const auto& c : enrolledCourses) {
            if (!first) json += ",";
            json += "\"" + c + "\"";
            first = false;
        }
        json += "],\"grades\":{";
        first = true;
        for (const auto& [cid, g] : grades) {
            if (!first) json += ",";
            json += "\"" + cid + "\":" + std::to_string(g);
            first = false;
        }
        json += "}}";
        return json;
    }

    static std::shared_ptr<Student> deserialize(const std::string& line) {
        auto parts = Utils::split(line, '|');
        if (parts.size() < 7) throw std::runtime_error("Invalid student data: " + line);

        auto s = std::make_shared<Student>(
            Utils::unescape(parts[0]), Utils::unescape(parts[1]),
            Utils::unescape(parts[2]), parts[3],   // passwordHash stored as-is
            Utils::unescape(parts[5]), std::stoi(parts[6])
        );

        // Parse COURSES section
        if (parts.size() > 7) {
            std::string coursesStr = parts[7].substr(8); // strip "COURSES:"
            if (!coursesStr.empty()) {
                auto courses = Utils::split(coursesStr, ';');
                for (const auto& c : courses)
                    if (!c.empty()) s->enrollCourse(Utils::unescape(c));
            }
        }
        // Parse GRADES section
        if (parts.size() > 8) {
            std::string gradesStr = parts[8].substr(7); // strip "GRADES:"
            if (!gradesStr.empty()) {
                auto entries = Utils::split(gradesStr, ';');
                for (const auto& e : entries) {
                    auto kv = Utils::split(e, '=');
                    if (kv.size() == 2 && !kv[0].empty())
                        s->grades[Utils::unescape(kv[0])] = std::stof(kv[1]);
                }
            }
        }
        return s;
    }
};

// ==================== TEACHER CLASS ====================
class Teacher : public User {
private:
    std::string department;
    std::string designation;
    std::unordered_set<std::string> assignedCourses;
    std::string officeRoom;

public:
    Teacher(std::string id, std::string name, std::string email,
            std::string passwordHash, std::string dept, std::string desig, std::string office = "")
        : User(std::move(id), std::move(name), std::move(email),
               std::move(passwordHash), "teacher"),
          department(std::move(dept)), designation(std::move(desig)),
          officeRoom(std::move(office)) {}

    std::string getDepartment()  const { return department; }
    std::string getDesignation() const { return designation; }
    std::string getOffice()      const { return officeRoom; }

    std::vector<std::string> getCourses() const {
        return std::vector<std::string>(assignedCourses.begin(), assignedCourses.end());
    }

    void assignCourse(const std::string& courseId)  { assignedCourses.insert(courseId); }
    void removeCourse(const std::string& courseId)  { assignedCourses.erase(courseId); }

    void displayInfo() const override {
        User::displayInfo();
        std::cout << "Department: " << department << " | Designation: " << designation
                  << " | Office: " << officeRoom << std::endl;
    }

    std::string serialize() const override {
        std::string data = User::serialize() + "|" +
            Utils::escape(department) + "|" + Utils::escape(designation) + "|" +
            Utils::escape(officeRoom) + "|COURSES:";
        for (const auto& c : assignedCourses) data += Utils::escape(c) + ";";
        return data;
    }

    std::string toJson() const override {
        std::string json = "{\"id\":\"" + id + "\",\"name\":\"" + name +
            "\",\"email\":\"" + email + "\",\"role\":\"teacher\"" +
            ",\"department\":\"" + department + "\",\"designation\":\"" + designation +
            "\",\"office\":\"" + officeRoom + "\",\"courses\":[";
        bool first = true;
        for (const auto& c : assignedCourses) {
            if (!first) json += ",";
            json += "\"" + c + "\"";
            first = false;
        }
        json += "]}";
        return json;
    }

    static std::shared_ptr<Teacher> deserialize(const std::string& line) {
        auto parts = Utils::split(line, '|');
        if (parts.size() < 9) throw std::runtime_error("Invalid teacher data: " + line);

        auto t = std::make_shared<Teacher>(
            Utils::unescape(parts[0]), Utils::unescape(parts[1]),
            Utils::unescape(parts[2]), parts[3],
            Utils::unescape(parts[5]), Utils::unescape(parts[6]), Utils::unescape(parts[7])
        );
        std::string coursesStr = parts[8].substr(8);
        if (!coursesStr.empty()) {
            auto courses = Utils::split(coursesStr, ';');
            for (const auto& c : courses)
                if (!c.empty()) t->assignCourse(Utils::unescape(c));
        }
        return t;
    }
};

// ==================== ADMIN CLASS ====================
class Admin : public User {
private:
    std::string accessLevel;

public:
    Admin(std::string id, std::string name, std::string email,
          std::string passwordHash, std::string level = "full")
        : User(std::move(id), std::move(name), std::move(email),
               std::move(passwordHash), "admin"),
          accessLevel(std::move(level)) {}

    std::string getAccessLevel() const { return accessLevel; }

    void displayInfo() const override {
        User::displayInfo();
        std::cout << "Access Level: " << accessLevel << std::endl;
    }

    std::string serialize() const override {
        return User::serialize() + "|" + Utils::escape(accessLevel);
    }

    std::string toJson() const override {
        return "{\"id\":\"" + id + "\",\"name\":\"" + name +
               "\",\"email\":\"" + email + "\",\"role\":\"admin\"" +
               ",\"accessLevel\":\"" + accessLevel + "\"}";
    }

    static std::shared_ptr<Admin> deserialize(const std::string& line) {
        auto parts = Utils::split(line, '|');
        if (parts.size() < 6) throw std::runtime_error("Invalid admin data: " + line);
        return std::make_shared<Admin>(
            Utils::unescape(parts[0]), Utils::unescape(parts[1]),
            Utils::unescape(parts[2]), parts[3], Utils::unescape(parts[5])
        );
    }
};

// ==================== COURSE CLASS ====================
class Course {
private:
    std::string courseId;
    std::string courseName;
    std::string department;
    int credits;
    std::string teacherId;
    int maxCapacity;
    std::unordered_set<std::string> enrolledStudents; // FIXED: O(1) lookup

public:
    Course(std::string id, std::string name, std::string dept,
           int cred, int capacity = 50)
        : courseId(std::move(id)), courseName(std::move(name)),
          department(std::move(dept)), credits(cred), maxCapacity(capacity) {}

    std::string getId()         const { return courseId; }
    std::string getName()       const { return courseName; }
    std::string getDepartment() const { return department; }
    int getCredits()            const { return credits; }
    std::string getTeacherId()  const { return teacherId; }
    int getMaxCapacity()        const { return maxCapacity; }
    int getEnrollmentCount()    const { return (int)enrolledStudents.size(); }
    bool isFull()               const { return (int)enrolledStudents.size() >= maxCapacity; }

    void assignTeacher(const std::string& tId) { teacherId = tId; }

    bool enrollStudent(const std::string& studentId) {
        if (isFull()) return false;
        return enrolledStudents.insert(studentId).second;
    }

    bool removeStudent(const std::string& studentId) {
        return enrolledStudents.erase(studentId) > 0;
    }

    std::vector<std::string> getEnrolledStudents() const {
        return std::vector<std::string>(enrolledStudents.begin(), enrolledStudents.end());
    }

    bool hasStudent(const std::string& sid) const {
        return enrolledStudents.count(sid) > 0;
    }

    void display() const {
        std::cout << "Course: " << courseId << " - " << courseName
                  << " | Dept: " << department << " | Credits: " << credits
                  << " | Enrolled: " << enrolledStudents.size() << "/" << maxCapacity << std::endl;
    }

    std::string serialize() const {
        std::string data = Utils::escape(courseId) + "|" + Utils::escape(courseName) + "|" +
            Utils::escape(department) + "|" + std::to_string(credits) + "|" +
            std::to_string(maxCapacity) + "|" + Utils::escape(teacherId) + "|STUDENTS:";
        for (const auto& s : enrolledStudents) data += Utils::escape(s) + ";";
        return data;
    }

    std::string toJson() const {
        std::string json = "{\"id\":\"" + courseId + "\",\"name\":\"" + courseName +
            "\",\"department\":\"" + department + "\",\"credits\":" + std::to_string(credits) +
            ",\"maxCapacity\":" + std::to_string(maxCapacity) +
            ",\"enrolled\":" + std::to_string(enrolledStudents.size()) +
            ",\"teacherId\":\"" + teacherId + "\",\"students\":[";
        bool first = true;
        for (const auto& s : enrolledStudents) {
            if (!first) json += ",";
            json += "\"" + s + "\"";
            first = false;
        }
        json += "]}";
        return json;
    }

    static std::shared_ptr<Course> deserialize(const std::string& line) {
        auto parts = Utils::split(line, '|');
        if (parts.size() < 7) throw std::runtime_error("Invalid course data: " + line);

        auto c = std::make_shared<Course>(
            Utils::unescape(parts[0]), Utils::unescape(parts[1]),
            Utils::unescape(parts[2]), std::stoi(parts[3]), std::stoi(parts[4])
        );
        c->teacherId = Utils::unescape(parts[5]);

        std::string studentsStr = parts[6].substr(9); // strip "STUDENTS:"
        if (!studentsStr.empty()) {
            auto students = Utils::split(studentsStr, ';');
            for (const auto& s : students)
                if (!s.empty()) c->enrolledStudents.insert(Utils::unescape(s));
        }
        return c;
    }
};
