const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Home/Dashboard
app.get('/', (req, res) => {
  const stats = {
    totalStudents: db.student.count(),
    totalCourses: db.course.count(),
    enrollments: db.report.getEnrollmentStats()
  };
  res.render('index', { stats });
});

// Student Routes
app.get('/students', (req, res) => {
  const { search, status, page = 1 } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;

  const students = db.student.findAll({ search, status, limit, offset });
  const total = db.student.count({ search, status });
  const totalPages = Math.ceil(total / limit);

  res.render('students/index', {
    students,
    search: search || '',
    status: status || '',
    page: parseInt(page),
    totalPages,
    total
  });
});

app.get('/students/new', (req, res) => {
  res.render('students/new', { student: {}, errors: [] });
});

app.post('/students', (req, res) => {
  const { student_id, first_name, last_name, email, phone, date_of_birth, status } = req.body;
  const errors = [];

  if (!student_id) errors.push('Student ID is required');
  if (!first_name) errors.push('First name is required');
  if (!last_name) errors.push('Last name is required');

  if (errors.length > 0) {
    return res.render('students/new', { student: req.body, errors });
  }

  try {
    const existing = db.student.findByStudentId(student_id);
    if (existing) {
      errors.push('Student ID already exists');
      return res.render('students/new', { student: req.body, errors });
    }

    const student = db.student.create({ student_id, first_name, last_name, email, phone, date_of_birth, status });
    res.redirect(`/students/${student.id}`);
  } catch (err) {
    errors.push(err.message);
    res.render('students/new', { student: req.body, errors });
  }
});

app.get('/students/:id', (req, res) => {
  const student = db.student.findById(req.params.id);
  if (!student) {
    return res.status(404).render('error', { message: 'Student not found' });
  }

  const enrollments = db.enrollment.findByStudent(student.id);
  const grades = db.grade.findByStudent(student.id);
  const gpa = db.report.getStudentGPA(student.id);
  const allCourses = db.course.findAll({ limit: 1000 });

  res.render('students/show', { student, enrollments, grades, gpa, allCourses });
});

app.get('/students/:id/edit', (req, res) => {
  const student = db.student.findById(req.params.id);
  if (!student) {
    return res.status(404).render('error', { message: 'Student not found' });
  }
  res.render('students/edit', { student, errors: [] });
});

app.post('/students/:id', (req, res) => {
  const { first_name, last_name, email, phone, date_of_birth, status } = req.body;
  const errors = [];

  if (!first_name) errors.push('First name is required');
  if (!last_name) errors.push('Last name is required');

  if (errors.length > 0) {
    return res.render('students/edit', { student: { ...req.body, id: req.params.id }, errors });
  }

  try {
    db.student.update(req.params.id, { first_name, last_name, email, phone, date_of_birth, status });
    res.redirect(`/students/${req.params.id}`);
  } catch (err) {
    errors.push(err.message);
    res.render('students/edit', { student: { ...req.body, id: req.params.id }, errors });
  }
});

app.post('/students/:id/delete', (req, res) => {
  db.student.delete(req.params.id);
  res.redirect('/students');
});

app.post('/students/:id/enroll', (req, res) => {
  const { course_id } = req.body;
  try {
    db.enrollment.create(req.params.id, course_id);
  } catch (err) {
    // Already enrolled or error
  }
  res.redirect(`/students/${req.params.id}`);
});

app.post('/students/:id/unenroll/:enrollmentId', (req, res) => {
  db.enrollment.delete(req.params.enrollmentId);
  res.redirect(`/students/${req.params.id}`);
});

// Course Routes
app.get('/courses', (req, res) => {
  const { search, page = 1 } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;

  const courses = db.course.findAll({ search, limit, offset });
  const total = db.course.count({ search });
  const totalPages = Math.ceil(total / limit);

  res.render('courses/index', {
    courses,
    search: search || '',
    page: parseInt(page),
    totalPages,
    total
  });
});

app.get('/courses/new', (req, res) => {
  res.render('courses/new', { course: {}, errors: [] });
});

app.post('/courses', (req, res) => {
  const { course_code, course_name, credits, instructor, semester } = req.body;
  const errors = [];

  if (!course_code) errors.push('Course code is required');
  if (!course_name) errors.push('Course name is required');

  if (errors.length > 0) {
    return res.render('courses/new', { course: req.body, errors });
  }

  try {
    const course = db.course.create({ course_code, course_name, credits, instructor, semester });
    res.redirect(`/courses/${course.id}`);
  } catch (err) {
    errors.push(err.message);
    res.render('courses/new', { course: req.body, errors });
  }
});

app.get('/courses/:id', (req, res) => {
  const course = db.course.findById(req.params.id);
  if (!course) {
    return res.status(404).render('error', { message: 'Course not found' });
  }

  const enrolledStudents = db.enrollment.findByCourse(course.id);
  const stats = db.report.getCourseStats(course.id);
  const allStudents = db.student.findAll({ limit: 1000 });

  res.render('courses/show', { course, enrolledStudents, stats, allStudents });
});

app.get('/courses/:id/edit', (req, res) => {
  const course = db.course.findById(req.params.id);
  if (!course) {
    return res.status(404).render('error', { message: 'Course not found' });
  }
  res.render('courses/edit', { course, errors: [] });
});

app.post('/courses/:id', (req, res) => {
  const { course_name, credits, instructor, semester } = req.body;
  const errors = [];

  if (!course_name) errors.push('Course name is required');

  if (errors.length > 0) {
    return res.render('courses/edit', { course: { ...req.body, id: req.params.id }, errors });
  }

  try {
    db.course.update(req.params.id, { course_name, credits, instructor, semester });
    res.redirect(`/courses/${req.params.id}`);
  } catch (err) {
    errors.push(err.message);
    res.render('courses/edit', { course: { ...req.body, id: req.params.id }, errors });
  }
});

app.post('/courses/:id/delete', (req, res) => {
  db.course.delete(req.params.id);
  res.redirect('/courses');
});

app.post('/courses/:id/enroll', (req, res) => {
  const { student_id } = req.body;
  try {
    db.enrollment.create(student_id, req.params.id);
  } catch (err) {
    // Already enrolled or error
  }
  res.redirect(`/courses/${req.params.id}`);
});

app.post('/courses/:id/unenroll/:enrollmentId', (req, res) => {
  db.enrollment.delete(req.params.enrollmentId);
  res.redirect(`/courses/${req.params.id}`);
});

// Grade Routes
app.post('/grades', (req, res) => {
  const { enrollment_id, assignment_name, score, max_score, weight } = req.body;

  try {
    db.grade.create({
      enrollment_id,
      assignment_name,
      score: parseFloat(score),
      max_score: parseFloat(max_score) || 100,
      weight: parseFloat(weight) || 1
    });
  } catch (err) {
    // Error handling
  }

  const enrollment = db.enrollment.findById(enrollment_id);
  res.redirect(`/students/${enrollment.student_id}`);
});

app.post('/grades/:id/delete', (req, res) => {
  const grade = db.grade.findById(req.params.id);
  if (grade) {
    db.grade.delete(req.params.id);
    res.redirect(`/students/${grade.student_id}`);
  } else {
    res.redirect('/students');
  }
});

// Report Routes
app.get('/reports', (req, res) => {
  const enrollmentStats = db.report.getEnrollmentStats();
  const courses = db.course.findAll({ limit: 100 });

  res.render('reports/index', { enrollmentStats, courses, selectedCourse: null, courseStats: null });
});

app.get('/reports/course/:id', (req, res) => {
  const enrollmentStats = db.report.getEnrollmentStats();
  const courses = db.course.findAll({ limit: 100 });
  const courseStats = db.report.getCourseStats(req.params.id);

  res.render('reports/index', {
    enrollmentStats,
    courses,
    selectedCourse: req.params.id,
    courseStats
  });
});

app.get('/reports/student/:id', (req, res) => {
  const student = db.student.findById(req.params.id);
  if (!student) {
    return res.status(404).render('error', { message: 'Student not found' });
  }

  const gpa = db.report.getStudentGPA(student.id);
  res.render('reports/student', { student, gpa });
});

// Search Route
app.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.render('search', { query: '', students: [], courses: [] });
  }

  const students = db.student.findAll({ search: q, limit: 20 });
  const courses = db.course.findAll({ search: q, limit: 20 });

  res.render('search', { query: q, students, courses });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.listen(PORT, () => {
  console.log(`Student Management System running at http://localhost:${PORT}`);
});

module.exports = app;
