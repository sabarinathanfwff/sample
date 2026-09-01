const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'students.db');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      date_of_birth TEXT,
      enrollment_date TEXT DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'active'
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT UNIQUE NOT NULL,
      course_name TEXT NOT NULL,
      credits INTEGER DEFAULT 3,
      instructor TEXT,
      semester TEXT
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrollment_date TEXT DEFAULT CURRENT_DATE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrollment_id INTEGER NOT NULL,
      assignment_name TEXT NOT NULL,
      score REAL,
      max_score REAL DEFAULT 100,
      weight REAL DEFAULT 1,
      date_recorded TEXT DEFAULT CURRENT_DATE,
      FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
    CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
    CREATE INDEX IF NOT EXISTS idx_grades_enrollment ON grades(enrollment_id);
  `);
}

const student = {
  create(data) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.student_id,
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.date_of_birth || null,
      data.status || 'active'
    );
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  },

  findByStudentId(studentId) {
    const db = getDb();
    return db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId);
  },

  findAll({ search, status, limit = 50, offset = 0 } = {}) {
    const db = getDb();
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR student_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY last_name, first_name LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  count({ search, status } = {}) {
    const db = getDb();
    let query = 'SELECT COUNT(*) as count FROM students WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR student_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    return db.prepare(query).get(...params).count;
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    db.prepare(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM students WHERE id = ?').run(id);
  }
};

const course = {
  create(data) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO courses (course_code, course_name, credits, instructor, semester)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.course_code,
      data.course_name,
      data.credits || 3,
      data.instructor || null,
      data.semester || null
    );
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  },

  findAll({ search, limit = 50, offset = 0 } = {}) {
    const db = getDb();
    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (course_code LIKE ? OR course_name LIKE ? OR instructor LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY course_code LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  count({ search } = {}) {
    const db = getDb();
    let query = 'SELECT COUNT(*) as count FROM courses WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (course_code LIKE ? OR course_name LIKE ? OR instructor LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    return db.prepare(query).get(...params).count;
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    db.prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  }
};

const enrollment = {
  create(studentId, courseId) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)
    `);
    const result = stmt.run(studentId, courseId);
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT e.*, s.first_name, s.last_name, s.student_id as student_code,
             c.course_code, c.course_name
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = ?
    `).get(id);
  },

  findByStudent(studentId) {
    const db = getDb();
    return db.prepare(`
      SELECT e.*, c.course_code, c.course_name, c.credits, c.instructor
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
      ORDER BY c.course_code
    `).all(studentId);
  },

  findByCourse(courseId) {
    const db = getDb();
    return db.prepare(`
      SELECT e.*, s.first_name, s.last_name, s.student_id as student_code, s.email
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      WHERE e.course_id = ?
      ORDER BY s.last_name, s.first_name
    `).all(courseId);
  },

  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM enrollments WHERE id = ?').run(id);
  }
};

const grade = {
  create(data) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO grades (enrollment_id, assignment_name, score, max_score, weight)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.enrollment_id,
      data.assignment_name,
      data.score,
      data.max_score || 100,
      data.weight || 1
    );
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT g.*, e.student_id, e.course_id
      FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.id
      WHERE g.id = ?
    `).get(id);
  },

  findByEnrollment(enrollmentId) {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM grades WHERE enrollment_id = ? ORDER BY date_recorded DESC
    `).all(enrollmentId);
  },

  findByStudent(studentId) {
    const db = getDb();
    return db.prepare(`
      SELECT g.*, e.course_id, c.course_code, c.course_name
      FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
      ORDER BY c.course_code, g.date_recorded DESC
    `).all(studentId);
  },

  update(id, data) {
    const db = getDb();
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    db.prepare(`UPDATE grades SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM grades WHERE id = ?').run(id);
  }
};

const report = {
  getStudentGPA(studentId) {
    const db = getDb();
    const enrollments = db.prepare(`
      SELECT e.id as enrollment_id, c.course_name, c.course_code, c.credits
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
    `).all(studentId);

    const result = [];
    let totalPoints = 0;
    let totalCredits = 0;

    for (const enrollment of enrollments) {
      const grades = db.prepare(`
        SELECT score, max_score, weight FROM grades WHERE enrollment_id = ?
      `).all(enrollment.enrollment_id);

      let weightedScore = 0;
      let totalWeight = 0;

      for (const grade of grades) {
        const percentage = (grade.score / grade.max_score) * 100;
        weightedScore += percentage * grade.weight;
        totalWeight += grade.weight;
      }

      const avgScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const gradePoint = scoreToGPA(avgScore);

      result.push({
        ...enrollment,
        average_score: avgScore.toFixed(2),
        grade_point: gradePoint.toFixed(2),
        letter_grade: scoreToLetter(avgScore)
      });

      totalPoints += gradePoint * enrollment.credits;
      totalCredits += enrollment.credits;
    }

    return {
      courses: result,
      gpa: totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00',
      total_credits: totalCredits
    };
  },

  getCourseStats(courseId) {
    const db = getDb();
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    if (!course) return null;

    const enrollments = db.prepare(`
      SELECT e.id as enrollment_id, s.id as student_id, s.first_name, s.last_name, s.student_id as student_code
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      WHERE e.course_id = ?
    `).all(courseId);

    const studentGrades = [];
    const scoreDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalAvg = 0;

    for (const enrollment of enrollments) {
      const grades = db.prepare(`
        SELECT score, max_score, weight FROM grades WHERE enrollment_id = ?
      `).all(enrollment.enrollment_id);

      let weightedScore = 0;
      let totalWeight = 0;

      for (const grade of grades) {
        const percentage = (grade.score / grade.max_score) * 100;
        weightedScore += percentage * grade.weight;
        totalWeight += grade.weight;
      }

      const avgScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const letter = scoreToLetter(avgScore);
      scoreDistribution[letter[0]]++;

      studentGrades.push({
        ...enrollment,
        average_score: avgScore.toFixed(2),
        letter_grade: letter
      });

      totalAvg += avgScore;
    }

    return {
      course,
      students: studentGrades,
      enrollment_count: enrollments.length,
      class_average: enrollments.length > 0 ? (totalAvg / enrollments.length).toFixed(2) : '0.00',
      grade_distribution: scoreDistribution
    };
  },

  getEnrollmentStats() {
    const db = getDb();
    return db.prepare(`
      SELECT c.id, c.course_code, c.course_name, c.instructor,
             COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      GROUP BY c.id
      ORDER BY enrollment_count DESC
    `).all();
  }
};

function scoreToGPA(score) {
  if (score >= 93) return 4.0;
  if (score >= 90) return 3.7;
  if (score >= 87) return 3.3;
  if (score >= 83) return 3.0;
  if (score >= 80) return 2.7;
  if (score >= 77) return 2.3;
  if (score >= 73) return 2.0;
  if (score >= 70) return 1.7;
  if (score >= 67) return 1.3;
  if (score >= 63) return 1.0;
  if (score >= 60) return 0.7;
  return 0.0;
}

function scoreToLetter(score) {
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 60) return 'D';
  return 'F';
}

module.exports = {
  getDb,
  student,
  course,
  enrollment,
  grade,
  report
};
