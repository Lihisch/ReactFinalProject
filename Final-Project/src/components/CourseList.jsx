import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function CourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  const loadCoursesFromLocalStorage = useCallback(() => {
    const storedCourses = localStorage.getItem('courses');
    if (storedCourses) {
      setCourses(JSON.parse(storedCourses));
    }
  }, []);

  useEffect(() => {
    // Load courses from local storage on component mount
    loadCoursesFromLocalStorage();
  }, [loadCoursesFromLocalStorage]);

  useEffect(() => {
    // Save courses to local storage whenever the courses state changes
    localStorage.setItem('courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    // Load courses from local storage on component mount
    loadCoursesFromLocalStorage();
  }, [loadCoursesFromLocalStorage]);

  const handleNewCourseClick = () => {
    navigate('/courseform');
  };

  const addCourse = (newCourse) => {
    setCourses([...courses, newCourse]);
  };
  
  // Example data for 8 courses (replace with actual data from CourseForm)
  // This will be removed once we have the actual data from the form
  const initializeCourses = useCallback(() => {
    if (courses.length === 0) {
      const initialCourses = [
        {
          courseName: "Introduction to React",
          courseId: "CS101",
          courseType: "Lecture",
          creditPoints: "3",
          semester: "A",
          professorsName: "Dr. Smith",
          dayOfWeek: "Monday",
          courseHours: "10:00",
          description: "A basic introduction to React.",
          startingDate: "2024-09-01",
          maxStudents: "30",
        },
        {
          courseName: "Advanced JavaScript",
          courseId: "CS201",
          courseType: "Lecture",
          creditPoints: "4",
          semester: "B",
          professorsName: "Prof. Johnson",
          dayOfWeek: "Tuesday",
          courseHours: "13:00",
          description: "Advanced concepts in JavaScript.",
          startingDate: "2025-01-15",
          maxStudents: "25",
        },
        {
          courseName: "Web Development Fundamentals",
          courseId: "WD101",
          courseType: "Lecture",
          creditPoints: "3",
          semester: "A",
          professorsName: "Dr. Lee",
          dayOfWeek: "Wednesday",
          courseHours: "09:00",
          description: "The basics of web development.",
          startingDate: "2024-09-05",
          maxStudents: "40",
        },
        {
          courseName: "Database Management",
          courseId: "DB201",
          courseType: "Lab",
          creditPoints: "4",
          semester: "B",
          professorsName: "Dr. Smith",
          dayOfWeek: "Thursday",
          courseHours: "14:00",
          description: "Managing databases effectively.",
          startingDate: "2025-01-20",
          maxStudents: "20",
        },
        {
          courseName: "UI/UX Design Principles",
          courseId: "UX101",
          courseType: "Seminar",
          creditPoints: "2",
          semester: "Summer",
          professorsName: "Prof. Johnson",
          dayOfWeek: "Friday",
          courseHours: "11:00",
          description: "Understanding UI/UX design.",
          startingDate: "2024-06-10",
          maxStudents: "15",
        },
        {
          courseName: "Python Programming",
          courseId: "PY101",
          courseType: "Lecture",
          creditPoints: "3",
          semester: "A",
          professorsName: "Dr. Lee",
          dayOfWeek: "Monday",
          courseHours: "15:00",
          description: "Introduction to Python programming.",
          startingDate: "2024-09-10",
          maxStudents: "35",
        },
        {
          courseName: "Mobile App Development",
          courseId: "MA201",
          courseType: "Lab",
          creditPoints: "4",
          semester: "B",
          professorsName: "Dr. Smith",
          dayOfWeek: "Tuesday",
          courseHours: "16:00",
          description: "Developing mobile applications.",
          startingDate: "2025-01-25",
          maxStudents: "20",
        },
        {
          courseName: "Data Structures and Algorithms",
          courseId: "DSA301",
          courseType: "Lecture",
          creditPoints: "4",
          semester: "A",
          professorsName: "Prof. Johnson",
          dayOfWeek: "Wednesday",
          courseHours: "12:00",
          description: "In-depth study of data structures.",
          startingDate: "2024-09-15",
          maxStudents: "30",
        },
      ];
      setCourses(initialCourses);
    }
  }, [courses.length]);

  useEffect(() => {
    initializeCourses();
  }, [initializeCourses]);


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Course List
        </Typography>
        <Button variant="contained" onClick={handleNewCourseClick}>
          New Course
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="course table">
          <TableHead>
            <TableRow>
              <TableCell>Course Name</TableCell>
              <TableCell>Course ID</TableCell>
              <TableCell>Course Type</TableCell>
              <TableCell>Credit Points</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Professor</TableCell>
              <TableCell>Day of Week</TableCell>
              <TableCell>Course Hours</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Starting Date</TableCell>
              <TableCell>Max Students</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course, index) => (
              <TableRow
                key={index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {course.courseName}
                </TableCell>
                <TableCell>{course.courseId}</TableCell>
                <TableCell>{course.courseType}</TableCell>
                <TableCell>{course.creditPoints}</TableCell>
                <TableCell>{course.semester}</TableCell>
                <TableCell>{course.professorsName}</TableCell>
                <TableCell>{course.dayOfWeek}</TableCell>
                <TableCell>{course.courseHours}</TableCell>
                <TableCell>{course.description}</TableCell>
                <TableCell>{course.startingDate}</TableCell>
                <TableCell>{course.maxStudents}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
