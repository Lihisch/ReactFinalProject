// src/components/EnrollmentForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  FormHelperText,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormLabel
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';

// Define constants for local storage keys
const STUDENTS_STORAGE_KEY = 'students';
const COURSES_STORAGE_KEY = 'courses';

const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff'
};

export default function EnrollmentForm() {
  const navigate = useNavigate();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch data from localStorage on component mount
  useEffect(() => {
    console.log("EnrollmentForm: Fetching data..."); // Added log
    try {
      // Load Students
      const studentsString = localStorage.getItem(STUDENTS_STORAGE_KEY);
      const parsedStudents = studentsString ? JSON.parse(studentsString) : [];
      // Ensure parsed data is an array before setting state
      if (Array.isArray(parsedStudents)) {
        setStudents(parsedStudents);
        console.log("EnrollmentForm: Students loaded:", parsedStudents.length); // Log count
      } else {
        console.warn("EnrollmentForm: Parsed student data is not an array.", parsedStudents);
        setStudents([]); // Default to empty array if not valid
      }

      // Load Courses
      const coursesString = localStorage.getItem(COURSES_STORAGE_KEY);
      const parsedCourses = coursesString ? JSON.parse(coursesString) : [];
      // Ensure parsed data is an array before setting state
      if (Array.isArray(parsedCourses)) {
        setCourses(parsedCourses);
        console.log("EnrollmentForm: Courses loaded:", parsedCourses.length); // Log count
      } else {
        console.warn("EnrollmentForm: Parsed course data is not an array.", parsedCourses);
        setCourses([]); // Default to empty array if not valid
      }

    } catch (error) {
      console.error("EnrollmentForm: Error fetching/parsing data from localStorage:", error);
      setSnackbar({ open: true, message: 'Error loading initial data. Check console.', severity: 'error' });
      // Ensure state is reset on error
      setStudents([]);
      setCourses([]);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Validate form selections
  const validate = () => {
    const temp = {};
    if (!selectedStudentId) {
      temp.studentId = 'Please select a student.';
    }
    // Only require course selection if courses are available
    if (Array.isArray(courses) && courses.length > 0 && selectedCourseIds.length === 0) {
      temp.courseIds = 'Please select at least one course.';
    }
    setErrors(temp);
    return Object.keys(temp).length === 0; // True if no errors
  };

  // Handle student selection change
  const handleStudentChange = (event) => {
    const studentId = event.target.value;
    setSelectedStudentId(studentId);
    // Clear student error when selection changes
    if (errors.studentId) {
      setErrors(prev => ({ ...prev, studentId: undefined }));
    }
  };

  // Handle course checkbox change
  const handleCourseCheckboxChange = (event) => {
    const { value: courseId, checked } = event.target;
    // Use functional update for state based on previous state
    setSelectedCourseIds(prevSelected => {
      let updatedSelected = [...prevSelected];
      if (checked) {
        // Add only if not already present
        if (!updatedSelected.includes(courseId)) {
          updatedSelected.push(courseId);
        }
      } else {
        // Remove the id
        updatedSelected = updatedSelected.filter(id => id !== courseId);
      }
      return updatedSelected;
    });
    // Clear course error when selection changes
    if (errors.courseIds) {
      setErrors(prev => ({ ...prev, courseIds: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setSnackbar({ open: true, message: 'Please make valid selections.', severity: 'warning' });
      return;
    }

    try {
      // Fetch fresh student data on submit to avoid stale data issues
      const allStudents = JSON.parse(localStorage.getItem(STUDENTS_STORAGE_KEY)) || [];
      const studentIndex = allStudents.findIndex(s => s?.studentId === selectedStudentId); // Use optional chaining

      if (studentIndex === -1) {
        setSnackbar({ open: true, message: 'Selected student not found. Please refresh.', severity: 'error' });
        return;
      }

      // Create a mutable copy of the student object
      const studentToUpdate = { ...allStudents[studentIndex] };

      // Ensure enrolledCourses is an array, initialize if not
      const currentEnrolled = Array.isArray(studentToUpdate.enrolledCourses) ? studentToUpdate.enrolledCourses : [];
      let updatedEnrolledCourses = [...currentEnrolled]; // Work with a copy

      let coursesAddedCount = 0;
      let alreadyEnrolledCount = 0;

      // Process selected courses
      selectedCourseIds.forEach(courseId => {
        if (!updatedEnrolledCourses.includes(courseId)) {
          updatedEnrolledCourses.push(courseId);
          coursesAddedCount++;
        } else {
          alreadyEnrolledCount++;
        }
      });

      // Update localStorage only if changes were made
      if (coursesAddedCount > 0) {
        studentToUpdate.enrolledCourses = updatedEnrolledCourses; // Assign the updated array
        allStudents[studentIndex] = studentToUpdate;
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(allStudents));
        console.log("EnrollmentForm: Student enrollment updated in localStorage.", studentToUpdate);
      }

      // Determine feedback message
      let feedbackMessage = '';
      let feedbackSeverity = 'success';
      if (coursesAddedCount > 0 && alreadyEnrolledCount > 0) {
        feedbackMessage = `Enrolled in ${coursesAddedCount} new course(s). ${alreadyEnrolledCount} already enrolled.`;
        feedbackSeverity = 'info';
      } else if (coursesAddedCount > 0) {
        feedbackMessage = `Successfully enrolled in ${coursesAddedCount} course(s).`;
      } else if (alreadyEnrolledCount > 0) {
        feedbackMessage = `Student already enrolled in the selected course(s).`;
        feedbackSeverity = 'info';
      } else {
        // This case should ideally not happen if validation works, but good fallback
        feedbackMessage = 'No new enrollments were made.';
        feedbackSeverity = 'warning';
      }

      setSnackbar({ open: true, message: feedbackMessage, severity: feedbackSeverity });

      // Reset form state after successful submission (or attempt)
      setTimeout(() => {
        setSelectedStudentId('');
        setSelectedCourseIds([]);
        setErrors({}); // Explicitly clear errors
      }, 1500); // Reduced delay slightly

    } catch (err) {
      console.error("EnrollmentForm: Error during enrollment submission:", err);
      setSnackbar({ open: true, message: 'Error saving enrollment. Please check console.', severity: 'error' });
    }
  };

  // Handle closing the snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Generate unique IDs for aria-describedby
  const studentHelperTextId = errors.studentId ? "student-helper-text" : undefined;
  const courseHelperTextId = errors.courseIds ? "course-helper-text" : undefined;

  console.log("EnrollmentForm: Rendering component. Courses count:", courses.length); // Log before render

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Enroll Student
        </Typography>
      </Breadcrumbs>

      {/* Form Container */}
      <Box component="form" onSubmit={handleSubmit} sx={{ backgroundColor: colors.white, p: { xs: 2, sm: 4 }, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" align="center" fontWeight="600" gutterBottom>
          Enroll Student in Courses
        </Typography>

        <Grid container spacing={3}>
          {/* Student Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.studentId} required>
              <InputLabel id="student-select-label">Select Student</InputLabel>
              <Select
                labelId="student-select-label"
                id="student-select" // Added id for label association
                value={selectedStudentId}
                label="Select Student"
                onChange={handleStudentChange}
                sx={{ borderRadius: '6px' }}
                aria-describedby={studentHelperTextId} // Accessibility link
              >
                <MenuItem value="" disabled><em>Select a student...</em></MenuItem>
                {/* Check if students is an array before mapping */}
                {Array.isArray(students) && students.map((student, index) => (
                  // Use optional chaining for safety, provide fallback key
                  <MenuItem key={student?.studentId || `student-${index}`} value={student?.studentId}>
                    {`${student?.studentId || 'N/A'} - ${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'N/A'}
                  </MenuItem>
                ))}
              </Select>
              {/* Render helper text only if error exists */}
              {errors.studentId && <FormHelperText id={studentHelperTextId}>{errors.studentId}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Course Selection */}
          <Grid item xs={12}>
            {/* Use component="fieldset" for grouping checkboxes */}
            <FormControl
              required
              error={!!errors.courseIds}
              component="fieldset"
              sx={{ width: '100%' }}
              variant="standard" // Use standard variant for fieldset structure
              aria-describedby={courseHelperTextId} // Accessibility link
            >
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: '500' }}>Available Courses</FormLabel>
              {/* Scrollable Box for Checkboxes */}
              <Box sx={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid',
                  borderColor: errors.courseIds ? 'error.main' : 'rgba(0, 0, 0, 0.23)', // Indicate error on border
                  borderRadius: '4px',
                  p: 2,
                  mb: 1
              }}>
                <FormGroup>
                  {/* Check if courses is an array and has items */}
                  {Array.isArray(courses) && courses.length > 0 ? (
                    courses.map((course, index) => {
                      // Use optional chaining for safety, provide fallback key
                      const courseId = course?.courseId;
                      // Skip rendering if course object or id is invalid
                      if (!courseId || typeof course !== 'object' || course === null) {
                        console.warn(`EnrollmentForm: Skipping invalid course item at index ${index}:`, course);
                        return null;
                      }
                      return (
                        <FormControlLabel
                          key={courseId}
                          control={
                            <Checkbox
                              checked={selectedCourseIds.includes(courseId)}
                              onChange={handleCourseCheckboxChange}
                              value={courseId} // Use the actual courseId as value
                              sx={{ color: colors.greenDark, '&.Mui-checked': { color: colors.green } }}
                            />
                          }
                          // Use optional chaining and fallbacks for all parts of the label
                          label={`${course?.courseId || 'N/A'} - ${course?.courseName || 'N/A'} - ${course?.dayOfWeek || 'N/A'} ${course?.startTime || 'N/A'}-${course?.endTime || 'N/A'}`}
                        />
                      );
                    })
                  ) : (
                    // Message shown if no courses are loaded or available
                    <Typography variant="body2" color="textSecondary" sx={{ px: 1 }}>
                      No courses available to display.
                    </Typography>
                  )}
                </FormGroup>
              </Box>
              {/* Render helper text only if error exists */}
              {errors.courseIds && <FormHelperText error id={courseHelperTextId}>{errors.courseIds}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12} textAlign="center" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              type="submit"
              size="large"
              startIcon={<SchoolIcon />}
              sx={{
                backgroundColor: colors.green,
                color: colors.text,
                fontWeight: 500,
                px: 5,
                borderRadius: '6px',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: colors.greenDark,
                  boxShadow: 'none'
                },
              }}
              // Disable button briefly after click? Maybe not necessary here.
            >
              Enroll Student
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
