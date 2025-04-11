import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
  Grid,
} from '@mui/material';

export default function GradesForm() {
  const [courseCode, setCourseCode] = useState('');
  const [assignmentCode, setAssignmentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [grade, setGrade] = useState('');
  const [courseOptions, setCourseOptions] = useState([]);
  const [students, setStudents] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load courses from localStorage when the component mounts
  useEffect(() => {
    const storedCourses = JSON.parse(localStorage.getItem('courses')) || [];
    setCourseOptions(storedCourses);
  }, []);

  // Load students based on selected course
  useEffect(() => {
    if (courseCode) {
      const storedStudents = JSON.parse(localStorage.getItem('students')) || [];
      const courseStudents = storedStudents.filter(student => student.courseCode === courseCode);
      setStudents(courseStudents);
    } else {
      setStudents([]); // Reset the students if no course is selected
    }
  }, [courseCode]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!courseCode || !assignmentCode || !studentName || !studentId || !grade) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setErrorMessage('');

    // Create the new grade entry
    const newGrade = {
      courseCode,
      assignmentCode,
      studentName,
      studentId,
      grade,
    };

    // Retrieve existing grades from localStorage
    const existingGrades = JSON.parse(localStorage.getItem('grades')) || [];
    
    // Add the new grade to the existing grades
    existingGrades.push(newGrade);

    // Save updated grades back to localStorage
    localStorage.setItem('grades', JSON.stringify(existingGrades));

    // Set success message
    setSuccessMessage('Grade submitted successfully!');

    // Clear the form fields after submission
    setCourseCode('');
    setAssignmentCode('');
    setStudentName('');
    setStudentId('');
    setGrade('');
    
    // Hide the success message after a short period
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 5,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: '#f9f9f9',
        }}
      >
        <Typography variant="h5" mb={3}>
          Grades Form
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {/* Course Code Dropdown */}
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Course Code</InputLabel>
            <Select
              value={courseCode}
              label="Course Code"
              onChange={(e) => setCourseCode(e.target.value)} // Update the courseCode on change
            >
              {courseOptions.length > 0 ? (
                courseOptions.map((course) => (
                  <MenuItem key={course.courseCode} value={course.courseCode}>
                    {course.courseCode} - {course.courseName}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No courses available</MenuItem>
              )}
            </Select>
          </FormControl>

          {/* Assignment Code Dropdown */}
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Assignment Code</InputLabel>
            <Select
              value={assignmentCode}
              label="Assignment Code"
              onChange={(e) => setAssignmentCode(e.target.value)} // Update the assignmentCode on change
            >
              <MenuItem value="A1">A1</MenuItem>
              <MenuItem value="A2">A2</MenuItem>
              <MenuItem value="A3">A3</MenuItem>
            </Select>
          </FormControl>

          {/* Students Inputs (Dynamic based on selected course) */}
          <Grid container spacing={2} margin="normal">
            {students.length > 0 ? (
              students.map((student) => (
                <Grid container spacing={2} key={student.studentId} margin="normal">
                  <Grid item xs={4}>
                    <TextField
                      label="Student Name"
                      value={student.studentName}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Student ID"
                      value={student.studentId}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                </Grid>
              ))
            ) : (
              <Typography>No students found for this course.</Typography>
            )}
          </Grid>

          {/* Error Message */}
          {errorMessage && (
            <Typography color="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Typography>
          )}

          {/* Success Message */}
          {successMessage && (
            <Typography color="success" sx={{ mt: 2 }}>
              {successMessage}
            </Typography>
          )}

          {/* Submit Button */}
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }} fullWidth>
            Submit Grade
          </Button>
        </Box>
      </Box>
    </Container>
  );
}



console.log(JSON.parse(localStorage.getItem('grades')));