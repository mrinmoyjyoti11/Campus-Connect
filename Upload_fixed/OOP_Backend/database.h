#pragma once
#include "sqlite3.h"
#include "campus_system.h"
#include <stdexcept>

// ==================== SQLITE DATABASE SERVICE ====================
// Drop-in replacement for the old FileStore (txt files)
// Just swap out FileStore for Database in campus_service.h

class Database {
    sqlite3* db = nullptr;

    void exec(const std::string& sql) {
        char* err = nullptr;
        if (sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &err) != SQLITE_OK) {
            std::string msg = err ? err : "Unknown DB error";
            sqlite3_free(err);
            throw std::runtime_error("SQL error: " + msg);
        }
    }

public:
    explicit Database(const std::string& dbPath = "campus.db") {
        if (sqlite3_open(dbPath.c_str(), &db) != SQLITE_OK)
            throw std::runtime_error("Cannot open database: " + std::string(sqlite3_errmsg(db)));

        // Enable WAL mode for better performance
        exec("PRAGMA journal_mode=WAL;");
        exec("PRAGMA foreign_keys=ON;");

        createTables();
        std::cout << "[INFO] Database ready: " << dbPath << "\n";
    }

    ~Database() {
        if (db) sqlite3_close(db);
    }

    // ==================== CREATE TABLES ====================

    void createTables() {
        exec(R"(
            CREATE TABLE IF NOT EXISTS admins (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                email       TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                access_level TEXT DEFAULT 'full'
            );
        )");

        exec(R"(
            CREATE TABLE IF NOT EXISTS students (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                email       TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                department  TEXT,
                semester    INTEGER DEFAULT 1
            );
        )");

        exec(R"(
            CREATE TABLE IF NOT EXISTS teachers (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                email       TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                department  TEXT,
                designation TEXT,
                office_room TEXT
            );
        )");

        exec(R"(
            CREATE TABLE IF NOT EXISTS courses (
                id           TEXT PRIMARY KEY,
                name         TEXT NOT NULL,
                department   TEXT,
                credits      INTEGER DEFAULT 3,
                max_capacity INTEGER DEFAULT 50,
                teacher_id   TEXT
            );
        )");

        exec(R"(
            CREATE TABLE IF NOT EXISTS enrollments (
                student_id TEXT NOT NULL,
                course_id  TEXT NOT NULL,
                PRIMARY KEY (student_id, course_id)
            );
        )");

        exec(R"(
            CREATE TABLE IF NOT EXISTS grades (
                student_id TEXT NOT NULL,
                course_id  TEXT NOT NULL,
                grade      REAL NOT NULL,
                PRIMARY KEY (student_id, course_id)
            );
        )");

        exec(R"(
            CREATE TABLE IF NOT EXISTS counters (
                key   TEXT PRIMARY KEY,
                value INTEGER DEFAULT 0
            );
        )");

        // Insert default counter values if not present
        exec("INSERT OR IGNORE INTO counters VALUES ('student', 1000);");
        exec("INSERT OR IGNORE INTO counters VALUES ('teacher', 2000);");
        exec("INSERT OR IGNORE INTO counters VALUES ('course',  100);");

        exec(R"(
            CREATE TABLE IF NOT EXISTS attendance (
                course_id   TEXT NOT NULL,
                student_id  TEXT NOT NULL,
                date        TEXT NOT NULL,
                status      TEXT NOT NULL,
                PRIMARY KEY (course_id, student_id, date)
            );
        )");

        exec(R"(
            CREATE TABLE IF NOT EXISTS assignments (
                id          TEXT PRIMARY KEY,
                course_id   TEXT NOT NULL,
                title       TEXT NOT NULL,
                description TEXT DEFAULT '',
                due_date    TEXT NOT NULL,
                created_at  TEXT NOT NULL
            );
        )");

        exec("INSERT OR IGNORE INTO counters VALUES ('assignment', 5000);");
    }

    // ==================== COUNTERS ====================

    int getCounter(const std::string& key) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db, "SELECT value FROM counters WHERE key=?", -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, key.c_str(), -1, SQLITE_STATIC);
        int val = 1000;
        if (sqlite3_step(stmt) == SQLITE_ROW) val = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
        return val;
    }

    int incrementCounter(const std::string& key) {
        exec("UPDATE counters SET value = value + 1 WHERE key = '" + key + "';");
        return getCounter(key);
    }

    // ==================== ADMINS ====================

    void saveAdmin(const Admin& a) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "INSERT OR REPLACE INTO admins VALUES (?,?,?,?,?)", -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, a.getId().c_str(),          -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, a.getName().c_str(),        -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, a.getEmail().c_str(),       -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, a.getPasswordHash().c_str(),-1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 5, a.getAccessLevel().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    std::vector<std::shared_ptr<Admin>> loadAdmins() {
        std::vector<std::shared_ptr<Admin>> result;
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db, "SELECT * FROM admins", -1, &stmt, nullptr);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            result.push_back(std::make_shared<Admin>(
                col(stmt,0), col(stmt,1), col(stmt,2), col(stmt,3), col(stmt,4)
            ));
        }
        sqlite3_finalize(stmt);
        return result;
    }

    void deleteAdmin(const std::string& id) {
        execBind("DELETE FROM admins WHERE id=?", id);
    }

    // ==================== STUDENTS ====================

    void saveStudent(const Student& s) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "INSERT OR REPLACE INTO students VALUES (?,?,?,?,?,?)", -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, s.getId().c_str(),          -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, s.getName().c_str(),        -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, s.getEmail().c_str(),       -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, s.getPasswordHash().c_str(),-1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 5, s.getDepartment().c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 6, s.getSemester());
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        // Save enrollments
        execBind("DELETE FROM enrollments WHERE student_id=?", s.getId());
        for (const auto& cid : s.getCourses()) {
            sqlite3_stmt* es;
            sqlite3_prepare_v2(db,
                "INSERT OR IGNORE INTO enrollments VALUES (?,?)", -1, &es, nullptr);
            sqlite3_bind_text(es, 1, s.getId().c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(es, 2, cid.c_str(),       -1, SQLITE_TRANSIENT);
            sqlite3_step(es);
            sqlite3_finalize(es);
        }

        // Save grades
        execBind("DELETE FROM grades WHERE student_id=?", s.getId());
        for (const auto& cid : s.getCourses()) {
            float g = s.getGrade(cid);
            if (g >= 0) {
                sqlite3_stmt* gs;
                sqlite3_prepare_v2(db,
                    "INSERT OR REPLACE INTO grades VALUES (?,?,?)", -1, &gs, nullptr);
                sqlite3_bind_text(gs, 1, s.getId().c_str(), -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(gs, 2, cid.c_str(),       -1, SQLITE_TRANSIENT);
                sqlite3_bind_double(gs, 3, g);
                sqlite3_step(gs);
                sqlite3_finalize(gs);
            }
        }
    }

    std::vector<std::shared_ptr<Student>> loadStudents() {
        std::vector<std::shared_ptr<Student>> result;
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db, "SELECT * FROM students", -1, &stmt, nullptr);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            auto s = std::make_shared<Student>(
                col(stmt,0), col(stmt,1), col(stmt,2), col(stmt,3),
                col(stmt,4), sqlite3_column_int(stmt, 5)
            );

            // Load enrollments
            sqlite3_stmt* es;
            sqlite3_prepare_v2(db,
                "SELECT course_id FROM enrollments WHERE student_id=?", -1, &es, nullptr);
            sqlite3_bind_text(es, 1, s->getId().c_str(), -1, SQLITE_TRANSIENT);
            while (sqlite3_step(es) == SQLITE_ROW)
                s->enrollCourse(col(es, 0));
            sqlite3_finalize(es);

            // Load grades
            sqlite3_stmt* gs;
            sqlite3_prepare_v2(db,
                "SELECT course_id, grade FROM grades WHERE student_id=?", -1, &gs, nullptr);
            sqlite3_bind_text(gs, 1, s->getId().c_str(), -1, SQLITE_TRANSIENT);
            while (sqlite3_step(gs) == SQLITE_ROW) {
                std::string cid = col(gs, 0);
                float grade = (float)sqlite3_column_double(gs, 1);
                s->setGrade(cid, grade);
            }
            sqlite3_finalize(gs);

            result.push_back(s);
        }
        sqlite3_finalize(stmt);
        return result;
    }

    void deleteStudent(const std::string& id) {
        execBind("DELETE FROM students    WHERE id=?",         id);
        execBind("DELETE FROM enrollments WHERE student_id=?", id);
        execBind("DELETE FROM grades      WHERE student_id=?", id);
    }

    // ==================== TEACHERS ====================

    void saveTeacher(const Teacher& t) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "INSERT OR REPLACE INTO teachers VALUES (?,?,?,?,?,?,?)", -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, t.getId().c_str(),          -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, t.getName().c_str(),        -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, t.getEmail().c_str(),       -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, t.getPasswordHash().c_str(),-1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 5, t.getDepartment().c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 6, t.getDesignation().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 7, t.getOffice().c_str(),      -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    std::vector<std::shared_ptr<Teacher>> loadTeachers() {
        std::vector<std::shared_ptr<Teacher>> result;
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db, "SELECT * FROM teachers", -1, &stmt, nullptr);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            result.push_back(std::make_shared<Teacher>(
                col(stmt,0), col(stmt,1), col(stmt,2), col(stmt,3),
                col(stmt,4), col(stmt,5), col(stmt,6)
            ));
        }
        sqlite3_finalize(stmt);
        return result;
    }

    void deleteTeacher(const std::string& id) {
        execBind("DELETE FROM teachers WHERE id=?", id);
    }

    // ==================== COURSES ====================

    void saveCourse(const Course& c) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "INSERT OR REPLACE INTO courses VALUES (?,?,?,?,?,?)", -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, c.getId().c_str(),         -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, c.getName().c_str(),       -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, c.getDepartment().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 4, c.getCredits());
        sqlite3_bind_int (stmt, 5, c.getMaxCapacity());
        sqlite3_bind_text(stmt, 6, c.getTeacherId().c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    std::vector<std::shared_ptr<Course>> loadCourses() {
        std::vector<std::shared_ptr<Course>> result;
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db, "SELECT * FROM courses", -1, &stmt, nullptr);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            auto c = std::make_shared<Course>(
                col(stmt,0), col(stmt,1), col(stmt,2),
                sqlite3_column_int(stmt, 3), sqlite3_column_int(stmt, 4)
            );
            c->assignTeacher(col(stmt, 5));

            // Load enrolled students
            sqlite3_stmt* es;
            sqlite3_prepare_v2(db,
                "SELECT student_id FROM enrollments WHERE course_id=?", -1, &es, nullptr);
            sqlite3_bind_text(es, 1, c->getId().c_str(), -1, SQLITE_TRANSIENT);
            while (sqlite3_step(es) == SQLITE_ROW)
                c->enrollStudent(col(es, 0));
            sqlite3_finalize(es);

            result.push_back(c);
        }
        sqlite3_finalize(stmt);
        return result;
    }

    void deleteCourse(const std::string& id) {
        execBind("DELETE FROM courses     WHERE id=?",        id);
        execBind("DELETE FROM enrollments WHERE course_id=?", id);
        execBind("DELETE FROM grades      WHERE course_id=?", id);
    }

    // ==================== GRADES ====================

    void saveGrade(const std::string& studentId, const std::string& courseId, float grade) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "INSERT OR REPLACE INTO grades VALUES (?,?,?)", -1, &stmt, nullptr);
        sqlite3_bind_text  (stmt, 1, studentId.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text  (stmt, 2, courseId.c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 3, grade);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    void saveEnrollment(const std::string& studentId, const std::string& courseId) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "INSERT OR IGNORE INTO enrollments VALUES (?,?)", -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, studentId.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, courseId.c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    void deleteEnrollment(const std::string& studentId, const std::string& courseId) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "DELETE FROM enrollments WHERE student_id=? AND course_id=?", -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, studentId.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, courseId.c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    bool emailExists(const std::string& email) {
        for (auto& tbl : {"students", "teachers", "admins"}) {
            sqlite3_stmt* stmt;
            std::string sql = std::string("SELECT 1 FROM ") + tbl + " WHERE email=?";
            sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
            sqlite3_bind_text(stmt, 1, email.c_str(), -1, SQLITE_TRANSIENT);
            bool found = sqlite3_step(stmt) == SQLITE_ROW;
            sqlite3_finalize(stmt);
            if (found) return true;
        }
        return false;
    }

    // ==================== ATTENDANCE ====================

    struct AttendanceRecord {
        std::string courseId, studentId, date, status;
    };

    void saveAttendance(const std::string& courseId, const std::string& studentId,
                        const std::string& date, const std::string& status) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "INSERT OR REPLACE INTO attendance(course_id,student_id,date,status) VALUES(?,?,?,?)",
            -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, courseId.c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, studentId.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, date.c_str(),      -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, status.c_str(),    -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    std::vector<AttendanceRecord> loadAttendanceForStudent(const std::string& studentId) {
        std::vector<AttendanceRecord> records;
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "SELECT course_id,student_id,date,status FROM attendance WHERE student_id=?",
            -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, studentId.c_str(), -1, SQLITE_TRANSIENT);
        while (sqlite3_step(stmt) == SQLITE_ROW)
            records.push_back({col(stmt,0), col(stmt,1), col(stmt,2), col(stmt,3)});
        sqlite3_finalize(stmt);
        return records;
    }

    std::vector<AttendanceRecord> loadAttendanceForCourse(const std::string& courseId,
                                                           const std::string& date) {
        std::vector<AttendanceRecord> records;
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "SELECT course_id,student_id,date,status FROM attendance WHERE course_id=? AND date=?",
            -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, courseId.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, date.c_str(),     -1, SQLITE_TRANSIENT);
        while (sqlite3_step(stmt) == SQLITE_ROW)
            records.push_back({col(stmt,0), col(stmt,1), col(stmt,2), col(stmt,3)});
        sqlite3_finalize(stmt);
        return records;
    }

    // ==================== ASSIGNMENTS ====================

    struct AssignmentRecord {
        std::string id, courseId, title, description, dueDate, createdAt;
    };

    std::string saveAssignment(const std::string& courseId, const std::string& title,
                               const std::string& description, const std::string& dueDate) {
        int num = getCounter("assignment");
        incrementCounter("assignment");
        std::string id = "ASN" + std::to_string(num);
        // Get current time as ISO string
        time_t now = time(nullptr);
        char buf[32]; strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S", localtime(&now));
        std::string createdAt(buf);

        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db,
            "INSERT INTO assignments(id,course_id,title,description,due_date,created_at) VALUES(?,?,?,?,?,?)",
            -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, id.c_str(),          -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, courseId.c_str(),    -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, title.c_str(),       -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, description.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 5, dueDate.c_str(),     -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 6, createdAt.c_str(),   -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return id;
    }

    std::vector<AssignmentRecord> loadAssignments(const std::string& courseId) {
        std::vector<AssignmentRecord> records;
        sqlite3_stmt* stmt;
        if (courseId.empty()) {
            sqlite3_prepare_v2(db,
                "SELECT id,course_id,title,description,due_date,created_at FROM assignments ORDER BY created_at DESC",
                -1, &stmt, nullptr);
        } else {
            sqlite3_prepare_v2(db,
                "SELECT id,course_id,title,description,due_date,created_at FROM assignments WHERE course_id=? ORDER BY due_date ASC",
                -1, &stmt, nullptr);
            sqlite3_bind_text(stmt, 1, courseId.c_str(), -1, SQLITE_TRANSIENT);
        }
        while (sqlite3_step(stmt) == SQLITE_ROW)
            records.push_back({col(stmt,0), col(stmt,1), col(stmt,2), col(stmt,3), col(stmt,4), col(stmt,5)});
        sqlite3_finalize(stmt);
        return records;
    }

    void deleteAssignment(const std::string& id) {
        execBind("DELETE FROM assignments WHERE id=?", id);
    }

private:
    // Helper: get column as string safely
    std::string col(sqlite3_stmt* stmt, int idx) {
        const char* v = (const char*)sqlite3_column_text(stmt, idx);
        return v ? v : "";
    }

    // Helper: execute SQL with one text bind parameter
    void execBind(const std::string& sql, const std::string& val) {
        sqlite3_stmt* stmt;
        sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
        sqlite3_bind_text(stmt, 1, val.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }
};
