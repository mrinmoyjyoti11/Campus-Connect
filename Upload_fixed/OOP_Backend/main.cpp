/*
 * main.cpp  —  Console UI (unchanged interface, uses fixed backend)
 *
 * Compile:
 *   g++ -std=c++17 -O2 -o campus_console main.cpp -lpthread
 *
 * For the web API instead, compile api_server.cpp.
 */

#include "campus_service.h"
#include <limits>

// ---- Safe integer input ----
int readInt(const std::string& prompt) {
    int val;
    while (true) {
        std::cout << prompt;
        if (std::cin >> val) { std::cin.ignore(); return val; }
        std::cout << "Please enter a valid number.\n";
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    }
}

// ---- Safe float input ----
float readFloat(const std::string& prompt) {
    float val;
    while (true) {
        std::cout << prompt;
        if (std::cin >> val) { std::cin.ignore(); return val; }
        std::cout << "Please enter a valid number.\n";
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    }
}

std::string readLine(const std::string& prompt) {
    std::cout << prompt;
    std::string s;
    std::getline(std::cin, s);
    return Utils::trim(s);
}

void printResult(const ApiResponse& r) {
    if (r.statusCode >= 200 && r.statusCode < 300)
        std::cout << "[OK] " << r.body << "\n";
    else
        std::cout << "[Error " << r.statusCode << "] " << r.body << "\n";
}

// ==================== MENUS ====================

void displayMainMenu() {
    std::cout << "\n========================================\n";
    std::cout << "   SMART CAMPUS MANAGEMENT SYSTEM\n";
    std::cout << "========================================\n";
    std::cout << "1. Login\n2. Exit\nChoice: ";
}

void displayAdminMenu() {
    std::cout << "\n----- ADMIN PANEL -----\n"
              << "1.  Add Student\n2.  Add Teacher\n3.  Add Course\n"
              << "4.  Assign Teacher to Course\n5.  View All Students\n"
              << "6.  View All Teachers\n7.  View All Courses\n"
              << "8.  Remove Student\n9.  Remove Teacher\n10. Logout\nChoice: ";
}

void displayTeacherMenu() {
    std::cout << "\n----- TEACHER PANEL -----\n"
              << "1. View My Courses\n2. View Students in Course\n"
              << "3. Assign Grade\n4. View My Info\n5. Logout\nChoice: ";
}

void displayStudentMenu() {
    std::cout << "\n----- STUDENT PANEL -----\n"
              << "1. View Available Courses\n2. Enroll in Course\n"
              << "3. View My Courses\n4. View My Grades\n"
              << "5. View My Info\n6. Logout\nChoice: ";
}

int main() {
    CampusManagementSystem cms;
    int choice;

    while (true) {
        displayMainMenu();
        choice = readInt("");

        if (choice == 2) { std::cout << "Goodbye!\n"; break; }

        if (choice == 1) {
            std::string email    = readLine("Email: ");
            std::string password = readLine("Password: ");

            auto loginResp = cms.login(email, password);
            if (loginResp.statusCode != 200) {
                std::cout << "Invalid credentials!\n";
                continue;
            }

            // Extract token and role from JSON response
            std::string token = jsonGet(loginResp.body, "token");  // reuse helper from api_server
            std::string role  = jsonGet(loginResp.body, "role");
            std::string uid   = jsonGet(loginResp.body, "userId");
            std::cout << "Welcome! Role: " << role << "\n";

            // ---- ADMIN SESSION ----
            if (role == "admin") {
                while (true) {
                    displayAdminMenu();
                    choice = readInt("");
                    if (choice == 10) { cms.logout(token); break; }
                    switch (choice) {
                        case 1: {
                            auto name = readLine("Name: ");
                            auto em   = readLine("Email: ");
                            auto pw   = readLine("Password: ");
                            auto dept = readLine("Department: ");
                            int sem   = readInt("Semester (1-8): ");
                            printResult(cms.addStudent(token, name, em, pw, dept, sem));
                            break;
                        }
                        case 2: {
                            auto name  = readLine("Name: ");
                            auto em    = readLine("Email: ");
                            auto pw    = readLine("Password: ");
                            auto dept  = readLine("Department: ");
                            auto desig = readLine("Designation: ");
                            auto off   = readLine("Office Room: ");
                            printResult(cms.addTeacher(token, name, em, pw, dept, desig, off));
                            break;
                        }
                        case 3: {
                            auto name = readLine("Course Name: ");
                            auto dept = readLine("Department: ");
                            int credits = readInt("Credits: ");
                            int cap     = readInt("Max Capacity: ");
                            printResult(cms.addCourse(token, name, dept, credits, cap));
                            break;
                        }
                        case 4: {
                            auto tid = readLine("Teacher ID: ");
                            auto cid = readLine("Course ID: ");
                            printResult(cms.assignTeacherToCourse(token, tid, cid));
                            break;
                        }
                        case 5: {
                            auto r = cms.getAllStudents(token);
                            std::cout << r.body << "\n"; break;
                        }
                        case 6: {
                            auto r = cms.getAllTeachers(token);
                            std::cout << r.body << "\n"; break;
                        }
                        case 7: {
                            for (const auto& c : cms.getAllCoursesVec()) c->display();
                            break;
                        }
                        case 8: {
                            auto id = readLine("Student ID: ");
                            printResult(cms.removeStudent(token, id)); break;
                        }
                        case 9: {
                            auto id = readLine("Teacher ID: ");
                            printResult(cms.removeTeacher(token, id)); break;
                        }
                    }
                }
            }

            // ---- TEACHER SESSION ----
            else if (role == "teacher") {
                Teacher* teacher = cms.findTeacher(uid);
                while (teacher && true) {
                    displayTeacherMenu();
                    choice = readInt("");
                    if (choice == 5) { cms.logout(token); break; }
                    switch (choice) {
                        case 1:
                            for (const auto& cid : teacher->getCourses()) {
                                Course* c = cms.findCourse(cid);
                                if (c) c->display();
                            }
                            break;
                        case 2: {
                            auto cid = readLine("Course ID: ");
                            Course* c = cms.findCourse(cid);
                            if (c) for (const auto& sid : c->getEnrolledStudents()) {
                                Student* s = cms.findStudent(sid);
                                if (s) s->displayInfo();
                            }
                            break;
                        }
                        case 3: {
                            auto sid = readLine("Student ID: ");
                            auto cid = readLine("Course ID: ");
                            float g  = readFloat("Grade (0.0–4.0): ");
                            printResult(cms.assignGrade(token, sid, cid, g));
                            break;
                        }
                        case 4: teacher->displayInfo(); break;
                    }
                }
            }

            // ---- STUDENT SESSION ----
            else if (role == "student") {
                Student* student = cms.findStudent(uid);
                while (student && true) {
                    displayStudentMenu();
                    choice = readInt("");
                    if (choice == 6) { cms.logout(token); break; }
                    switch (choice) {
                        case 1:
                            for (const auto& c : cms.getAllCoursesVec()) c->display();
                            break;
                        case 2: {
                            auto cid = readLine("Course ID: ");
                            printResult(cms.enrollStudentInCourse(token, student->getId(), cid));
                            break;
                        }
                        case 3:
                            for (const auto& cid : student->getCourses()) {
                                Course* c = cms.findCourse(cid);
                                if (c) c->display();
                            }
                            break;
                        case 4: {
                            auto r = cms.getStudentGrades(token, student->getId());
                            std::cout << r.body << "\n"; break;
                        }
                        case 5: student->displayInfo(); break;
                    }
                }
            }
        }
    }
    return 0;
}
