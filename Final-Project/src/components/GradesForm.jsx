// src/components/GradesForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  CircularProgress, // For loading states
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

// Consistent color palette
const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff'
};

// --- TEMPORARY DATA REMOVED ---

export default function GradesForm() {
  const navigate = useNavigate();

  // State for selections
  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [selectedAssignmentCode, setSelectedAssignmentCode] = useState('');

  // State for data options
  const [courseOptions, setCourseOptions] = useState([]);
  const [assignmentOptions, setAssignmentOptions] = useState([]);
  const [studentsToGrade, setStudentsToGrade] = useState([]);

  // State for grades input (object keyed by studentId)
  const [grades, setGrades] = useState({}); // { studentId1: '85', studentId2: '92' }

  // State for UI feedback
  const [loading, setLoading] = useState({ courses: true, assignments: false, students: false });
  const [errors, setErrors] = useState({}); // { studentId1: 'Grade must be 0-100', ... }
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // --- Data Fetching ---

  // Fetch courses on initial mount
  useEffect(() => {
    setLoading(prev => ({ ...prev, courses: true }));
    try {
      // Rely solely on localStorage for courses
      const storedCourses = JSON.parse(localStorage.getItem('courses')) || [];
      setCourseOptions(storedCourses);
      if (storedCourses.length === 0) {
          console.warn("No courses found in localStorage.");
          // Optionally show a snackbar message
          // setSnackbar({ open: true, message: 'No courses found. Please add courses first.', severity: 'warning' });
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setSnackbar({ open: true, message: 'Error loading courses.', severity: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  }, []);

  // Fetch assignments and students when a course is selected
  useEffect(() => {
    if (!selectedCourseCode) {
      setAssignmentOptions([]);
      setStudentsToGrade([]);
      setSelectedAssignmentCode('');
      setGrades({});
      setErrors({});
      return;
    }

    setLoading(prev => ({ ...prev, assignments: true, students: true }));
    setAssignmentOptions([]); // Clear previous options
    setStudentsToGrade([]);   // Clear previous students
    setSelectedAssignmentCode(''); // Reset assignment selection
    setGrades({}); // Reset grades
    setErrors({}); // Reset errors

    let fetchedAssignments = [];
    let fetchedStudents = [];

    try {
      // Fetch and filter assignments for the selected course from localStorage
      const allAssignments = JSON.parse(localStorage.getItem('assignments')) || [];
      fetchedAssignments = allAssignments.filter(assign => assign.courseCode === selectedCourseCode);

      // Fetch and filter students enrolled in the selected course from localStorage
      // **ASSUMPTION:** Student object has an 'enrolledCourses' array of course IDs
      const allStudents = JSON.parse(localStorage.getItem('students')) || [];
      fetchedStudents = allStudents.filter(student =>
        student && Array.isArray(student.enrolledCourses) && student.enrolledCourses.includes(selectedCourseCode)
      );

    } catch (error) {
      console.error("Error fetching assignments or students:", error);
      setSnackbar({ open: true, message: 'Error loading assignments or students.', severity: 'error' });
    } finally {
      setAssignmentOptions(fetchedAssignments);
      setStudentsToGrade(fetchedStudents);
      setLoading(prev => ({ ...prev, assignments: false, students: false }));

      // Show info messages only if a course was selected and data is missing
      if (selectedCourseCode) {
          if (fetchedStudents.length === 0) {
              setSnackbar({ open: true, message: 'No students found enrolled in this course in localStorage.', severity: 'info' });
          }
          if (fetchedAssignments.length === 0) {
              setSnackbar({ open: true, message: 'No assignments found for this course in localStorage.', severity: 'info' });
          }
      }
    }
  }, [selectedCourseCode]);


  // Fetch existing grades when an assignment is selected
  const fetchExistingGrades = useCallback(() => {
    if (!selectedCourseCode || !selectedAssignmentCode) {
        setGrades({}); // Clear grades if no assignment selected
        return;
    }

    try {
        const allGrades = JSON.parse(localStorage.getItem('grades')) || [];
        const relevantGrades = allGrades.filter(
            (g) => g && g.courseCode === selectedCourseCode && g.assignmentCode === selectedAssignmentCode // Added check for g
        );

        // Create an object { studentId: grade } for easy lookup and pre-population
        const initialGradesState = relevantGrades.reduce((acc, gradeRecord) => {
            if (gradeRecord && gradeRecord.studentId) { // Ensure gradeRecord and studentId exist
                 acc[gradeRecord.studentId] = gradeRecord.grade;
            }
            return acc;
        }, {});

        setGrades(initialGradesState);
        setErrors({}); // Clear errors when loading new grades

    } catch (error) {
        console.error("Error fetching existing grades:", error);
        setSnackbar({ open: true, message: 'Error loading existing grades.', severity: 'error' });
        setGrades({}); // Reset grades on error
    }
  }, [selectedCourseCode, selectedAssignmentCode]); // Dependencies

  useEffect(() => {
    fetchExistingGrades();
  }, [fetchExistingGrades]); // Run when the callback reference changes


  // --- Handlers ---

  const handleCourseChange = (event) => {
    setSelectedCourseCode(event.target.value);
  };

  const handleAssignmentChange = (event) => {
    setSelectedAssignmentCode(event.target.value);
  };

  const handleGradeChange = (studentId, value) => {
    const numValue = parseFloat(value);
    let errorMsg = '';
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
      errorMsg = 'Grade must be between 0 and 100';
    }
    setGrades(prev => ({ ...prev, [studentId]: value }));
    setErrors(prev => ({ ...prev, [studentId]: errorMsg }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    let isValid = true;
    const finalErrors = {};
    studentsToGrade.forEach(student => {
      if (!student || !student.studentId) return;
      const gradeValue = grades[student.studentId];
      const numValue = parseFloat(gradeValue);
      if (gradeValue !== undefined && gradeValue !== null && String(gradeValue).trim() !== '') { // Only validate if not empty
          if (isNaN(numValue) || numValue < 0 || numValue > 100) {
              finalErrors[student.studentId] = 'Grade must be between 0 and 100.';
              isValid = false;
          }
      }
    });

    setErrors(finalErrors);

    if (!isValid) {
      setSnackbar({ open: true, message: 'Please fix the errors in the grades.', severity: 'error' });
      return;
    }

    if (!selectedCourseCode || !selectedAssignmentCode) {
        setSnackbar({ open: true, message: 'Please select a course and assignment.', severity: 'warning' });
        return;
    }

    try {
      const allGrades = JSON.parse(localStorage.getItem('grades')) || [];
      const updatedGrades = [...allGrades];

      studentsToGrade.forEach(student => {
        if (!student || !student.studentId) return;
        const studentId = student.studentId;
        const newGradeValue = grades[studentId];

        const existingGradeIndex = updatedGrades.findIndex(
            (g) => g && g.studentId === studentId &&
                   g.courseCode === selectedCourseCode &&
                   g.assignmentCode === selectedAssignmentCode
        );

        if (newGradeValue !== undefined && newGradeValue !== null) {
             if (String(newGradeValue).trim() !== '') { // Grade entered
                if (existingGradeIndex > -1) {
                    updatedGrades[existingGradeIndex].grade = newGradeValue;
                    updatedGrades[existingGradeIndex].studentName = student.studentName || 'N/A';
                } else {
                    updatedGrades.push({
                        gradeId: `g_${Date.now()}_${studentId}`,
                        studentId: studentId,
                        studentName: student.studentName || 'N/A',
                        courseCode: selectedCourseCode,
                        assignmentCode: selectedAssignmentCode,
                        grade: newGradeValue,
                    });
                }
            } else { // Grade field is empty, remove existing grade if present
                 if (existingGradeIndex > -1) {
                    updatedGrades.splice(existingGradeIndex, 1);
                }
            }
        }
      });

      localStorage.setItem('grades', JSON.stringify(updatedGrades));
      setSnackbar({ open: true, message: 'Grades submitted successfully!', severity: 'success' });

    } catch (error) {
      console.error("Error submitting grades:", error);
      setSnackbar({ open: true, message: 'Error submitting grades. Please check console.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // --- Render ---

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* --- BREADCRUMBS START --- */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/GradesManagement"> {/* Adjust if route is different */}
          Manage Grades
        </Link>
        <Typography color="text.primary">Grade Assignment</Typography>
      </Breadcrumbs>
      {/* --- BREADCRUMBS END --- */}

      <Box component="form" onSubmit={handleSubmit} sx={{ backgroundColor: colors.white, p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" align="center" fontWeight="600" gutterBottom>
          Grade Assignment
        </Typography>

        <Grid container spacing={3}>
          {/* Row 1: Course and Assignment Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!selectedCourseCode && !!errors.form}>
              <InputLabel>Select Course</InputLabel>
              <Select
                name="courseCode"
                value={selectedCourseCode}
                label="Select Course"
                onChange={handleCourseChange}
                disabled={loading.courses || courseOptions.length === 0} // Disable if no courses
              >
                <MenuItem value="" disabled><em>{loading.courses ? 'Loading...' : (courseOptions.length === 0 ? 'No Courses Available' : 'Select a Course')}</em></MenuItem>
                {courseOptions.map((course) => (
                  <MenuItem key={course.courseId} value={course.courseId}>
                    {course.courseId} - {course.courseName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={!selectedCourseCode || loading.assignments} error={!selectedAssignmentCode && !!errors.form}>
              <InputLabel>Select Assignment</InputLabel>
              <Select
                name="assignmentCode"
                value={selectedAssignmentCode}
                label="Select Assignment"
                onChange={handleAssignmentChange}
              >
                <MenuItem value="" disabled><em>{loading.assignments ? 'Loading...' : (selectedCourseCode ? (assignmentOptions.length === 0 ? 'No Assignments Found' : 'Select an Assignment') : 'Select Course First')}</em></MenuItem>
                {assignmentOptions.map((assign) => (
                  <MenuItem key={assign.assignmentCode} value={assign.assignmentCode}>
                    {assign.assignmentCode} - {assign.assignmentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Row 2: Student Grades List */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Students</Typography>
            {loading.students ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
            ) : !selectedCourseCode ? (
                 <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', ml: 1 }}>Select a course to see students.</Typography>
            ) : studentsToGrade.length === 0 ? (
                 <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', ml: 1 }}>No students found enrolled in this course.</Typography>
            ) : !selectedAssignmentCode ? (
                 <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', ml: 1 }}>Select an assignment to enter grades.</Typography>
            ) : (
              <Box sx={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                {studentsToGrade.map((student) => {
                   if (!student || !student.studentId) return null; // Safety check
                   return (
                      <Grid container spacing={2} key={student.studentId} alignItems="center" sx={{ borderBottom: '1px solid #eee', py: 1, '&:last-child': { borderBottom: 0 } }}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body1">{student.studentName || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                           <Typography variant="body2" color="textSecondary">ID: {student.studentId}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Grade"
                            name={`grade_${student.studentId}`}
                            type="number"
                            value={grades[student.studentId] || ''}
                            onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, max: 100, step: "any" }}
                            error={!!errors[student.studentId]}
                            helperText={errors[student.studentId]}
                          />
                        </Grid>
                      </Grid>
                   );
                })}
              </Box>
            )}
          </Grid>

          {/* Row 3: Submit Button */}
          <Grid item xs={12} textAlign="center" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              type="submit"
              size="large"
              disabled={!selectedCourseCode || !selectedAssignmentCode || studentsToGrade.length === 0 || loading.students || loading.assignments}
              sx={{
                backgroundColor: colors.green, color: colors.text, fontWeight: 500, px: 5, borderRadius: '6px', textTransform: 'none', boxShadow: 'none',
                '&:hover': { backgroundColor: colors.greenDark, boxShadow: 'none' },
                '&.Mui-disabled': { backgroundColor: '#d3d3d3', color: '#a1a1a1' }
              }}
            >
              Submit Grades
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
