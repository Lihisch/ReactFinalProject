// src/App.jsx
import React, { useEffect } from 'react';
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

// --- Define Initial Seed Data ---
const initialStudents = [
  { studentId: "313532939", firstName: "Lihi", lastName: "Schneider", enrolledCourses: ["B5410", "S0350"] },
  { studentId: "024562241", firstName: "Ben", lastName: "Gisser", enrolledCourses: ['R1001', 'D1510'] }, 
  { studentId: "312456789", firstName: "Lior", lastName: "Levi", enrolledCourses: ['D1510', 'I1250'] }, 
  { studentId: "321654987", firstName: "Eitan", lastName: "Cohen", enrolledCourses: ["N2001", "P2402"] },
  { studentId: "325874123", firstName: "Noa", lastName: "Talmid", enrolledCourses: ["B5410", "S0350", "R1001"] }, 
  { studentId: "345621879", firstName: "Tanya", lastName: "Babayev", enrolledCourses: ["N2001", "P2402"] }, 
  { studentId: "356987412", firstName: "Tamar", lastName: "Zilberman", enrolledCourses: ["I1250", "I3510"] }, 
  { studentId: "449182736", firstName: "Yaara", lastName: "Segal", enrolledCourses: ['S0350', 'N2001'] }, // 
  { studentId: "208123456", firstName: "Maya", lastName: "Cohen", enrolledCourses: ['O6520', 'I3510', 'R1001'] },
  { studentId: "207987654", firstName: "Ido", lastName: "Katz", enrolledCourses: ['D1510', 'P6501', 'N2001'] },
];

const initialCourses = [
  { courseId: 'R1001', courseName: 'React Development', creditPoints: 4, semester: 'A', professorsName: 'Dr. Tamar Cohen', dayOfWeek: 'Monday', startTime: '09:00', endTime: '12:00', description: 'Building modern web interfaces with React.', startingDate: '2024-10-28', courseHours: '09:00 - 12:00' },
  { courseId: 'N2001', courseName: 'Node.js Backend', creditPoints: 4, semester: 'A', professorsName: 'Prof. Avi Levi', dayOfWeek: 'Wednesday', startTime: '13:00', endTime: '16:00', description: 'Server-side development using Node.js and Express.', startingDate: '2024-10-30', courseHours: '13:00 - 16:00' },
  { courseId: 'D1510', courseName: 'Database Management Systems', creditPoints: 4, semester: 'B', professorsName: 'Dr. Yossi Ben-David', dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '13:00', description: 'Design, implementation, and management of relational databases using SQL.', startingDate: '2025-03-04', courseHours: '10:00 - 13:00' },
  { courseId: 'P2402', courseName: 'Project Management', creditPoints: 3, semester: 'A', professorsName: 'Prof. Michal Levi', dayOfWeek: 'Thursday', startTime: '14:00', endTime: '16:00', description: 'Methodologies and tools for managing complex projects.', startingDate: '2024-10-31', courseHours: '14:00 - 16:00' },
  { courseId: 'B5410', courseName: 'Business Intelligence & Analytics', creditPoints: 3, semester: 'B', professorsName: 'Dr. Ronen Bar-Ziv', dayOfWeek: 'Monday', startTime: '11:00', endTime: '13:00', description: 'Techniques for data analysis, visualization, and decision support.', startingDate: '2025-03-03', courseHours: '11:00 - 13:00' },
  { courseId: 'S0350', courseName: 'Systems Analysis and Design', creditPoints: 4, semester: 'A', professorsName: 'Prof. Galit Shavit', dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '12:00', description: 'Methodologies for analyzing information needs and designing system solutions.', startingDate: '2024-10-30', courseHours: '09:00 - 12:00' },
  { courseId: 'P6501', courseName: 'Principles of Marketing', creditPoints: 3, semester: 'A', professorsName: 'Dr. Ofer Klein', dayOfWeek: 'Tuesday', startTime: '14:00', endTime: '16:00', description: 'Introduction to marketing concepts, strategy, and the marketing mix.', startingDate: '2024-10-29', courseHours: '14:00 - 16:00' },
  { courseId: 'I3510', courseName: 'Introduction to Finance', creditPoints: 3, semester: 'B', professorsName: 'Prof. Iris Avrahami', dayOfWeek: 'Friday', startTime: '09:00', endTime: '11:00', description: 'Fundamentals of financial management, investments, and markets.', startingDate: '2025-03-07', courseHours: '09:00 - 11:00' },
  { courseId: 'O6520', courseName: 'Organizational Behavior', creditPoints: 3, semester: 'A', professorsName: 'Dr. Amir Goldberg', dayOfWeek: 'Monday', startTime: '16:00', endTime: '18:00', description: 'Understanding individual and group behavior within organizations.', startingDate: '2024-10-28', courseHours: '16:00 - 18:00' },
  { courseId: 'I1250', courseName: 'Information Systems Strategy', creditPoints: 2, semester: 'B', professorsName: 'Prof. Nava Ashkenazi', dayOfWeek: 'Thursday', startTime: '16:00', endTime: '18:00', description: 'Aligning IT strategy with business goals and competitive advantage.', startingDate: '2025-03-06', courseHours: '16:00 - 18:00' },
];

const initialAssignments = [
  { assignmentCode: "001", courseId: "N2001", courseName: "Node.js Backend", assignmentName: "Mid Term Project", assignmentType: "Individual", description: "Build a REST API with Express, including CRUD operations and basic authentication.", fileName: "", maxParticipants: 1, minParticipants: 1, submissionDate: "2024-12-15", weight: 25 },
  { assignmentCode: "002", courseId: "R1001", courseName: "React Development", assignmentName: "Component Lifecycle Exercise", assignmentType: "Individual", description: "Implement class and functional components demonstrating lifecycle methods/hooks.", fileName: "", maxParticipants: 1, minParticipants: 1, submissionDate: "2024-11-30", weight: 15 },
  { assignmentCode: "003", courseId: "D1510", courseName: "Database Management Systems", assignmentName: "Normalization Exercise", assignmentType: "Individual", description: "Normalize a given database schema to 3NF.", fileName: "", maxParticipants: 1, minParticipants: 1, submissionDate: "2025-04-10", weight: 20 },
  { assignmentCode: "004", courseId: "P2402", courseName: "Project Management", assignmentName: "Risk Assessment Plan", assignmentType: "Group", description: "Develop a risk assessment plan for a sample IT project.", fileName: "", maxParticipants: 4, minParticipants: 2, submissionDate: "2024-12-05", weight: 20 },
  { assignmentCode: "005", courseId: "B5410", courseName: "Business Intelligence & Analytics", assignmentName: "Data Visualization Dashboard", assignmentType: "Individual", description: "Create an interactive dashboard using a BI tool (e.g., Tableau, Power BI) on a provided dataset.", fileName: "", maxParticipants: 1, minParticipants: 1, submissionDate: "2025-05-01", weight: 25 },
  { assignmentCode: "006", courseId: "S0350", courseName: "Systems Analysis and Design", assignmentName: "Use Case Diagramming", assignmentType: "Individual", description: "Create detailed use case diagrams and descriptions for a given system requirement.", fileName: "", maxParticipants: 1, minParticipants: 1, submissionDate: "2024-11-20", weight: 15 },
  { assignmentCode: "007", courseId: "P6501", courseName: "Principles of Marketing", assignmentName: "Marketing Mix Analysis", assignmentType: "Individual", description: "Analyze the 4 Ps (Product, Price, Place, Promotion) for a chosen company.", fileName: "", maxParticipants: 1, minParticipants: 1, submissionDate: "2024-12-10", weight: 20 },
  { assignmentCode: "008", courseId: "I3510", courseName: "Introduction to Finance", assignmentName: "Financial Statement Analysis", assignmentType: "Individual", description: "Analyze the balance sheet and income statement of a public company.", fileName: "", maxParticipants: 1, minParticipants: 1, submissionDate: "2025-04-15", weight: 25 },
  { assignmentCode: "009", courseId: "O6520", courseName: "Organizational Behavior", assignmentName: "Team Dynamics Case Study", assignmentType: "Group", description: "Analyze a case study focusing on team conflicts and resolutions.", fileName: "", maxParticipants: 5, minParticipants: 3, submissionDate: "2024-11-25", weight: 20 },
  { assignmentCode: "010", courseId: "I1250", courseName: "Information Systems Strategy", assignmentName: "IT Alignment Paper", assignmentType: "Individual", description: "Write a short paper on how a company can align its IT strategy with its business objectives.", fileName: "", maxParticipants: 1, minParticipants: 1, submissionDate: "2025-05-10", weight: 30 }
];

const initialGrades = [ 
  { courseId: "B5410", assignmentCode: "001", studentId: "313532939", grade: 75 },  // תואם
  { courseId: "S0350", assignmentCode: "001", studentId: "449182736", grade: 85 },  // תואם
  { courseId: "N2001", assignmentCode: "004", studentId: "321654987", grade: 90 },  // תואם
  { courseId: "P2402", assignmentCode: "004", studentId: "345621879", grade: 82 },  // תואם
  { courseId: "S0350", assignmentCode: "006", studentId: "313532939", grade: 85 },  // תואם
  { courseId: "S0350", assignmentCode: "006", studentId: "449182736", grade: 88 },  // תואם
  { courseId: "D1510", assignmentCode: "003", studentId: "024562241", grade: 72 },  // תואם
  { courseId: "D1510", assignmentCode: "003", studentId: "312456789", grade: 55 },  // תואם
  { courseId: "B5410", assignmentCode: "005", studentId: "325874123", grade: 98 },  // תואם
  { courseId: "I3510", assignmentCode: "007", studentId: "208123456", grade: 75 },
];

const initialSubmissions = [
  { studentId: "024562241", courseId: "R1001", assignmentCode: "002", submitted: true, submissionDate: "2024-11-30", grade: 78, comments: "Functional, could be cleaner." }, // Updated grade to match initialGrades if desired, or keep separate
  { studentId: "313532939", courseId: "N2001", assignmentCode: "001", submitted: true, submissionDate: "2024-12-14", grade: 75, comments: "Good effort, some issues with error handling." }, // Updated grade to match initialGrades
  { studentId: "321654987", courseId: "P2402", assignmentCode: "004", submitted: true, submissionDate: "2024-12-05", grade: 90, comments: "Excellent risk plan, very detailed." },
  { studentId: "313532939", courseId: "S0350", assignmentCode: "006", submitted: true, submissionDate: "2024-11-19", grade: 85, comments: "Good understanding of use cases." },
  { studentId: "024562241", courseId: "D1510", assignmentCode: "003", submitted: true, submissionDate: "2025-04-10", grade: 72, comments: "Normalization mostly correct, minor errors in 3NF." },
  { studentId: "312456789", courseId: "D1510", assignmentCode: "003", submitted: true, submissionDate: "2025-04-12", grade: 55, comments: "Submitted late. Significant issues with normalization steps." },
  { studentId: "325874123", courseId: "B5410", assignmentCode: "005", submitted: true, submissionDate: "2025-04-30", grade: 98, comments: "Outstanding dashboard, very insightful." },
  { studentId: "345621879", courseId: "P2402", assignmentCode: "004", submitted: true, submissionDate: "2024-12-05", grade: 82, comments: "Good contribution to the group risk plan." },
  { studentId: "449182736", courseId: "S0350", assignmentCode: "006", submitted: true, submissionDate: "2024-11-20", grade: 88, comments: "Well-structured diagrams and descriptions." },
  { studentId: "208123456", courseId: "P6501", assignmentCode: "007", submitted: true, submissionDate: "2024-12-09", grade: 75, comments: "Good analysis of the marketing mix." },
  { studentId: "325874123", courseId: "R1001", assignmentCode: "002", submitted: true, submissionDate: "2024-11-30", grade: 67, comments: "Missed some edge cases." },
  { studentId: "449182736", courseId: "N2001", assignmentCode: "001", submitted: true, submissionDate: "2024-12-15", grade: 85, comments: "Well done." },
];


function App() {

  useEffect(() => {
    // --- Initialize Local Storage if empty ---
    try {
      // Check and seed students
      if (localStorage.getItem(STUDENTS_STORAGE_KEY) === null) {
        console.log('LocalStorage: Initializing students...');
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
      } else {
        // console.log('LocalStorage: Students already exist.'); // Optional: uncomment for debugging
      }

      // Check and seed courses
      if (localStorage.getItem(COURSES_STORAGE_KEY) === null) {
        console.log('LocalStorage: Initializing courses...');
        localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(initialCourses));
      } else {
        // console.log('LocalStorage: Courses already exist.');
      }

      // Check and seed assignments
      if (localStorage.getItem(ASSIGNMENTS_STORAGE_KEY) === null) {
        console.log('LocalStorage: Initializing assignments...');
        localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(initialAssignments));
      } else {
        // console.log('LocalStorage: Assignments already exist.');
      }

      // Check and seed submissions
      if (localStorage.getItem(SUBMISSIONS_STORAGE_KEY) === null) {
        console.log('LocalStorage: Initializing submissions...');
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(initialSubmissions));
      } else {
        // console.log('LocalStorage: Submissions already exist.');
      }

    } catch (error) {
      console.error("LocalStorage: Error during initialization:", error);
      // Handle potential storage errors (e.g., storage full, security restrictions)
      // You might want to show a user-facing error message here
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div>
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
