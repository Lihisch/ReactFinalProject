// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Help from './components/Help';
import Info from './components/Info';
import Grades from './components/Grades';
import Courses from './components/Courses';
import Assignments from './components/Assignments';
import CoursesManagement from './components/CoursesManagement';
import CourseForm from './components/CourseForm';
import StudentsManagement from './components/StudentsManagement';
import StudentForm from './components/StudentForm';
import EnrollmentForm from './components/EnrollmentForm';
import GradesManagement from './components/GradesManagement';
import GradesForm from './components/GradesForm';
import AssignmentsManagement from './components/AssignmentsManagement';
import AssignmentsForm from './components/AssignmentsForm';

import './App.css';

// --- Define Storage Keys ---
const STUDENTS_STORAGE_KEY = 'students';
const COURSES_STORAGE_KEY = 'courses';
const ASSIGNMENTS_STORAGE_KEY = 'assignments';
// const GRADES_STORAGE_KEY = 'grades'; // Consider merging with submissions later if redundant
const SUBMISSIONS_STORAGE_KEY = 'submissions';


function App() {
  const [userType, setUserType] = useState('admin');
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Load students from localStorage
    const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (stored) {
      setStudents(JSON.parse(stored));
    }

    // --- Initialize Local Storage if empty ---
    try {
      // Check and seed students
      if (localStorage.getItem(STUDENTS_STORAGE_KEY) === null) {
        console.log('LocalStorage: Initializing students...');
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
      }

      // Check and seed courses
      if (localStorage.getItem(COURSES_STORAGE_KEY) === null) {
        console.log('LocalStorage: Initializing courses...');
        localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(initialCourses));
      }

      // Check and seed assignments
      if (localStorage.getItem(ASSIGNMENTS_STORAGE_KEY) === null) {
        console.log('LocalStorage: Initializing assignments...');
        localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(initialAssignments));
      }

      // Check and seed submissions
      if (localStorage.getItem(SUBMISSIONS_STORAGE_KEY) === null) {
        console.log('LocalStorage: Initializing submissions...');
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(initialSubmissions));
      }

    } catch (error) {
      console.error("LocalStorage: Error during initialization:", error);
    }
  }, []); 

  const handleRoleChange = (newRole) => {
    setUserType(newRole);
    if (newRole === 'admin') {
      setStudentId('');
    }
  };

  const handleStudentChange = (newStudentId) => {
    setStudentId(newStudentId);
  };

  return (
    <div className="container">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/help" element={<Help />} />
        <Route path="/info" element={<Info />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/coursesmanagement" element={<CoursesManagement />} />
        <Route path="/courseform" element={<CourseForm />} />
        <Route path="/courseform/:courseId" element={<CourseForm />} />
        <Route path="/studentsmanagement" element={<StudentsManagement />} />
        <Route path="/studentform" element={<StudentForm />} />
        <Route path="/studentform/:studentId" element={<StudentForm />} />
        <Route path="/enrollmentform" element={<EnrollmentForm />} />
        <Route path="/gradesmanagement" element={<GradesManagement />} />
        <Route path="/gradesform" element={<GradesForm />} />
        <Route path="/assignmentsmanagement" element={<AssignmentsManagement />} />
        <Route path="/assignmentsform" element={<AssignmentsForm />} />
        <Route path="/assignmentsform/:assignmentId" element={<AssignmentsForm />} />
      </Routes>
    </div>
  );
}

export default App;
