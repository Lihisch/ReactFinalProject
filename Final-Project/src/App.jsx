// src/App.jsx
import React from 'react';
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

function App() {
  return (
    <div>
      <Header />
      <Routes>
        {/* General Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/help" element={<Help />} />
        <Route path="/info" element={<Info />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/assignments" element={<Assignments />} />

        {/* Courses Management */}
        <Route path="/coursesmanagement" element={<CoursesManagement />} />
        <Route path="/courseform" element={<CourseForm />} /> {/* For adding a new course */}
        <Route path="/courseform/:courseId" element={<CourseForm />} /> {/* For editing an existing course */}

        {/* Students Management - UPDATED */}
        <Route path="/studentsmanagement" element={<StudentsManagement />} />
        <Route path="/studentform" element={<StudentForm />} /> {/* For adding a new student */}
        <Route path="/studentform/:studentId" element={<StudentForm />} /> {/* For editing an existing student */}
      

        {/* Enrollment Management */}
        <Route path="/enrollmentform" element={<EnrollmentForm />} />

        {/* Grades Management */}
        <Route path="/gradesmanagement" element={<GradesManagement />} />
        <Route path="/gradesform" element={<GradesForm />} />

        {/* Assignments Management */}
        <Route path="/assignmentsmanagement" element={<AssignmentsManagement />} />
        <Route path="/assignmentsform" element={<AssignmentsForm />} /> {/* For adding a new assignment */}
        <Route path="/assignmentsform/:assignmentCode" element={<AssignmentsForm />} /> {/* For editing an existing assignment */}
      </Routes>
    </div>
  );
}

export default App;
