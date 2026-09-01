# 🎓 Student Management System

<div align="center">

![Student Management System](https://img.icons8.com/color/96/000000/student-center.png)

**A comprehensive web-based application for managing student records, enrollments, grades, and academic reports.**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18.x-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-orange.svg)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## ✨ Features

### Student Management
- ✅ Create, view, update, and delete student records
- ✅ Search students by name, email, or student ID
- ✅ Filter students by status (active, inactive, graduated)
- ✅ Paginated student list view

### Course Management
- ✅ Create, view, update, and delete courses
- ✅ Search courses by code, name, or instructor
- ✅ Assign credits and instructors to courses

### Enrollment Management
- ✅ Enroll students in courses
- ✅ Prevent duplicate enrollments
- ✅ View enrolled students per course
- ✅ View enrolled courses per student

### Grade Management
- ✅ Add grades for student enrollments
- ✅ Support for weighted assignments
- ✅ Automatic percentage calculation
- ✅ GPA calculation (4.0 scale)

### Reporting & Analytics
- ✅ Student GPA reports
- ✅ Course statistics
- ✅ Grade distribution charts
- ✅ Enrollment statistics

### User Interface
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Clean and intuitive dashboard
- ✅ Search functionality across all entities

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### Student List
![Student List](https://via.placeholder.com/800x400?text=Student+List+Screenshot)

### Student Details
![Student Details](https://via.placeholder.com/800x400?text=Student+Details+Screenshot)

### Course Management
![Course Management](https://via.placeholder.com/800x400?text=Course+Management+Screenshot)

---

## 🛠 Technologies Used

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **SQLite** - Lightweight relational database
- **better-sqlite3** - SQLite3 driver for Node.js

### Frontend
- **EJS** - Embedded JavaScript templates
- **HTML5** - Markup language
- **CSS3** - Styling
- **JavaScript** - Client-side interactivity

### Development Tools
- **npm** - Package manager
- **Git** - Version control
- **VS Code** - Code editor

---

## 🚀 Installation

### Prerequisites
- Node.js 18.x or higher
- npm 8.x or higher

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/sabarinathanfwff/Student-management-system-.git
   cd Student-management-system-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Development Mode
```bash
npm run dev
```

---

## 📖 Usage

### Adding a Student
1. Navigate to **Students** → **Add New Student**
2. Fill in the student details (ID, name, email, etc.)
3. Click **Create Student**

### Creating a Course
1. Navigate to **Courses** → **Add New Course**
2. Enter course details (code, name, credits, instructor)
3. Click **Create Course**

### Enrolling a Student
1. Go to the student's detail page
2. Select a course from the dropdown
3. Click **Enroll**

### Adding Grades
1. Go to the student's detail page
2. Select the enrollment (course)
3. Enter assignment name, score, and weight
4. Click **Add Grade**

### Viewing Reports
1. Navigate to **Reports**
2. View enrollment statistics
3. Click on a course to see detailed statistics

---

## 📁 Project Structure

```
student-management-system/
├── server.js                 # Main application server
├── db.js                     # Database operations
├── package.json              # Project dependencies
├── .gitignore                # Git ignore file
├── views/                    # EJS templates
│   ├── layout.ejs           # Main layout
│   ├── index.ejs            # Dashboard
│   ├── students/            # Student views
│   │   ├── index.ejs        # Student list
│   │   ├── new.ejs          # Add student form
│   │   ├── edit.ejs         # Edit student form
│   │   └── show.ejs         # Student details
│   ├── courses/             # Course views
│   │   ├── index.ejs        # Course list
│   │   ├── new.ejs          # Add course form
│   │   ├── edit.ejs         # Edit course form
│   │   └── show.ejs         # Course details
│   ├── reports/             # Report views
│   │   ├── index.ejs        # Reports dashboard
│   │   └── student.ejs      # Student report
│   ├── search.ejs           # Search results
│   └── error.ejs            # Error page
├── docs/                    # Documentation
│   └── ...                  # Project report files
└── students.db              # SQLite database (created on first run)
```

---

## 🗄 Database Schema

### Students Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| student_id | TEXT | UNIQUE, NOT NULL |
| first_name | TEXT | NOT NULL |
| last_name | TEXT | NOT NULL |
| email | TEXT | UNIQUE |
| phone | TEXT | |
| date_of_birth | TEXT | |
| enrollment_date | TEXT | DEFAULT CURRENT_DATE |
| status | TEXT | DEFAULT 'active' |

### Courses Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| course_code | TEXT | UNIQUE, NOT NULL |
| course_name | TEXT | NOT NULL |
| credits | INTEGER | DEFAULT 3 |
| instructor | TEXT | |
| semester | TEXT | |

### Enrollments Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| student_id | INTEGER | FOREIGN KEY → students(id) |
| course_id | INTEGER | FOREIGN KEY → courses(id) |
| enrollment_date | TEXT | DEFAULT CURRENT_DATE |

### Grades Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| enrollment_id | INTEGER | FOREIGN KEY → enrollments(id) |
| assignment_name | TEXT | NOT NULL |
| score | REAL | NOT NULL |
| max_score | REAL | DEFAULT 100 |
| weight | REAL | DEFAULT 1 |
| date_recorded | TEXT | DEFAULT CURRENT_DATE |

---

## 🔌 API Routes

### Student Routes
| Method | Route | Description |
|--------|-------|-------------|
| GET | /students | List all students |
| GET | /students/new | Show add student form |
| POST | /students | Create new student |
| GET | /students/:id | Show student details |
| GET | /students/:id/edit | Show edit student form |
| POST | /students/:id | Update student |
| POST | /students/:id/delete | Delete student |
| POST | /students/:id/enroll | Enroll in course |
| POST | /students/:id/unenroll/:enrollmentId | Unenroll from course |

### Course Routes
| Method | Route | Description |
|--------|-------|-------------|
| GET | /courses | List all courses |
| GET | /courses/new | Show add course form |
| POST | /courses | Create new course |
| GET | /courses/:id | Show course details |
| GET | /courses/:id/edit | Show edit course form |
| POST | /courses/:id | Update course |
| POST | /courses/:id/delete | Delete course |
| POST | /courses/:id/enroll | Enroll student |
| POST | /courses/:id/unenroll/:enrollmentId | Unenroll student |

### Grade Routes
| Method | Route | Description |
|--------|-------|-------------|
| POST | /grades | Add grade |
| POST | /grades/:id/delete | Delete grade |

### Report Routes
| Method | Route | Description |
|--------|-------|-------------|
| GET | /reports | Reports dashboard |
| GET | /reports/course/:id | Course statistics |
| GET | /reports/student/:id | Student GPA report |

### Search Route
| Method | Route | Description |
|--------|-------|-------------|
| GET | /search?q=query | Search students and courses |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Your Name** - [@yourusername](https://github.com/yourusername)

Project Link: [https://github.com/sabarinathanfwff/Student-management-system-](https://github.com/sabarinathanfwff/Student-management-system-)

---

## 🙏 Acknowledgments

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express.js](https://expressjs.com/) - Web framework
- [SQLite](https://sqlite.org/) - Database engine
- [EJS](https://ejs.co/) - Template engine
- [Icons8](https://icons8.com/) - Icons

---

<div align="center">

**⭐ Star this repository if you find it helpful! ⭐**

Made with ❤️ for MCA Final Semester Project

</div>
