// src/components/EnrollmentForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Grid, Snackbar, Alert, Breadcrumbs, Link as MuiLink,
  FormHelperText, FormGroup, FormControlLabel, Checkbox, FormLabel, FormControl,
  List, ListItem, CircularProgress, Paper, alpha, Select, MenuItem, InputLabel // Added Select, MenuItem, InputLabel
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import SaveIcon from '@mui/icons-material/Save';

const STUDENTS_STORAGE_KEY = 'students';
const COURSES_STORAGE_KEY = 'courses';

const colors = {
  primaryGreenBase: '#bed630',
  primaryGreen: '#7da321',
  greenDark: '#5a7d00',
  backgroundGrey: '#f5f5f5',
  textDark: '#333333',
  white: '#ffffff',
  secondaryGrey: '#757575',
  errorRed: '#d32f2f',
  iconContrastLight: '#ffffff',
  iconContrastDark: '#555555',
};

// Helper to check for valid ID
const isValidId = (id) => id != null && id !== '';

export default function EnrollmentForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentIdFromUrl = searchParams.get('studentId'); // ID from URL if present

  const [allStudents, setAllStudents] = useState([]); // For general mode dropdown
  const [allCourses, setAllCourses] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(''); // Holds the ID of the student being managed (from URL or dropdown)
  const [student, setStudent] = useState(null); // The actual student object being managed
  const [selectedCourseIds, setSelectedCourseIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false); // Initially false, true only during data loading
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const safeJsonParse = (key, defaultValue = []) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      const parsed = JSON.parse(item);
      // Basic validation: ensure it's an array and filter invalid students if needed
      if (Array.isArray(parsed)) {
          if (key === STUDENTS_STORAGE_KEY) {
              return parsed.filter(s => isValidId(s?.studentId)); // Ensure students have valid IDs
          }
          return parsed;
      }
      return defaultValue;
    } catch (e) {
      console.error(`Error parsing ${key} from localStorage`, e);
      setError(`Failed to parse data for ${key}. Check console.`); // Set error state on parse failure
      return defaultValue;
    }
  };

  // Effect 1: Load initial data (all students and courses) and set initial selected student if ID comes from URL
  useEffect(() => {
    setIsLoading(true);
    setError(null); // Reset error
    try {
        const students = safeJsonParse(STUDENTS_STORAGE_KEY);
        const courses = safeJsonParse(COURSES_STORAGE_KEY);
        setAllStudents(students);
        setAllCourses(courses);

        // If an ID came from the URL, set it as the selected student
        if (isValidId(studentIdFromUrl)) {
            console.log("EnrollmentForm: Initializing with studentId from URL:", studentIdFromUrl);
            setSelectedStudentId(studentIdFromUrl);
        } else {
            console.log("EnrollmentForm: Initializing in general mode (no studentId from URL).");
            setSelectedStudentId(''); // Ensure it's reset if URL ID is invalid/missing
            setStudent(null); // Clear student object if no valid ID from URL
            setSelectedCourseIds(new Set()); // Clear course selections
        }
    } catch (err) {
        console.error("EnrollmentForm Error: Failed during initial data load:", err);
        setError('Failed to load initial student or course data.');
    } finally {
        setIsLoading(false);
    }
  }, [studentIdFromUrl]); // Rerun if the ID from the URL changes

  // Effect 2: Load specific student data and their courses *whenever* selectedStudentId changes (either from URL or dropdown)
  useEffect(() => {
    // Only run if a valid student ID is selected
    if (isValidId(selectedStudentId)) {
        setIsLoading(true); // Indicate loading specific student data
        setError(null); // Reset previous errors
        setStudent(null); // Reset student object before finding new one
        setSelectedCourseIds(new Set()); // Reset course selections

        console.log("EnrollmentForm: Loading data for selectedStudentId:", selectedStudentId);

        const foundStudent = allStudents.find(s => String(s.studentId) === String(selectedStudentId));

        if (foundStudent) {
            setStudent(foundStudent);
            // Initialize selected courses based on the found student's data
            setSelectedCourseIds(new Set((foundStudent.enrolledCourses || []).map(String)));
            console.log("EnrollmentForm: Student found and data set:", foundStudent);
        } else {
            // This case might happen if the ID from URL is invalid after initial load, or dropdown selection fails
            console.error(`EnrollmentForm Error: Student with selected ID ${selectedStudentId} not found in loaded students.`);
            setError(`Student with ID ${selectedStudentId} not found.`);
            setSelectedStudentId(''); // Reset selection if student not found
        }
        setIsLoading(false); // Finish loading specific student data
    } else {
        // If no valid student is selected (e.g., in general mode before selection)
        setStudent(null); // Ensure student object is null
        setSelectedCourseIds(new Set()); // Ensure selections are cleared
    }
  }, [selectedStudentId, allStudents]); // Rerun when the selected ID or the list of all students changes

  // Handler for the student selection dropdown (General Mode)
  const handleStudentSelectChange = (event) => {
    const newStudentId = event.target.value;
    console.log("EnrollmentForm: Student selected from dropdown:", newStudentId);
    setSelectedStudentId(newStudentId); // This will trigger Effect 2
  };

  const handleCourseCheckboxChange = (event) => {
    const courseId = event.target.value;
    const isChecked = event.target.checked;
    setSelectedCourseIds(prev => {
      const updated = new Set(prev);
      isChecked ? updated.add(courseId) : updated.delete(courseId);
      return updated;
    });
    if (formError) setFormError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Check if a student is actually selected and loaded
    if (!student || !isValidId(selectedStudentId)) {
      setSnackbar({ open: true, message: 'Please select a student first.', severity: 'warning' });
      return;
    }

    try {
      // Use the currently selected student ID for saving
      const currentStudentId = selectedStudentId;
      const allStudentsData = safeJsonParse(STUDENTS_STORAGE_KEY); // Re-read fresh data for saving
      const studentIndex = allStudentsData.findIndex(s => String(s?.studentId) === String(currentStudentId));

      if (studentIndex === -1) {
        setSnackbar({ open: true, message: 'Error finding student to update. Please refresh.', severity: 'error' });
        return;
      }

      const currentEnrolledSet = new Set(allStudentsData[studentIndex]?.enrolledCourses?.map(String) || []);
      const newSelectedArray = Array.from(selectedCourseIds);

      const hasChanged = newSelectedArray.length !== currentEnrolledSet.size ||
                         newSelectedArray.some(id => !currentEnrolledSet.has(id));

      if (!hasChanged) {
          setSnackbar({ open: true, message: 'No changes detected in enrollment.', severity: 'info' });
          return;
      }

      const updatedStudents = allStudentsData.map((s, index) => {
          if (index === studentIndex) {
              return { ...s, enrolledCourses: newSelectedArray };
          }
          return s;
      });

      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
      setSnackbar({ open: true, message: 'Enrollments updated successfully!', severity: 'success' });
      // Update local state to reflect save
      setStudent(prev => ({...prev, enrolledCourses: newSelectedArray}));
      // Update the main students list state if needed (might cause re-renders)
      // setAllStudents(updatedStudents);

    } catch (err) {
      console.error("Error saving enrollments:", err);
      setSnackbar({ open: true, message: 'Error saving enrollment. Please check console.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // --- Render Logic ---

  // Display general error first if it exists
  if (error) {
    return (
        <Container sx={{ py: 3 }}>
            <Alert severity="error">{error}</Alert>
            <Button onClick={() => navigate('/studentsmanagement')} sx={{ mt: 2 }}>Back to List</Button>
        </Container>
    );
  }

  // Display loading indicator if any loading is happening
  if (isLoading) {
    return <Container sx={{ py: 3, textAlign: 'center' }}><CircularProgress sx={{ color: colors.primaryGreen }} /></Container>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <MuiLink component={RouterLink} to="/" underline="hover" sx={{ display: 'flex', alignItems: 'center', color: colors.secondaryGrey }}>
          <HomeIcon sx={{ mr: 0.5, color: colors.iconContrastDark }} fontSize="inherit" /> Home
        </MuiLink>
        {/* Conditionally link back to students management */}
        {studentIdFromUrl && (
            <MuiLink component={RouterLink} to="/studentsmanagement" underline="hover" sx={{ color: colors.secondaryGrey }}>Students Management</MuiLink>
        )}
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', color: colors.textDark }}>
          Manage Enrollments
        </Typography>
      </Breadcrumbs>

      {/* Title: Show student name if selected, otherwise generic title */}
      <Typography variant="h4" gutterBottom sx={{ color: colors.textDark, fontWeight: 600 }}>
        Manage Enrollments
        {student && `: ${student.firstName} ${student.lastName}`}
      </Typography>
      {student && (
        <Typography variant="body1" sx={{ color: colors.secondaryGrey, mb: 2 }}>(ID: {student.studentId})</Typography>
      )}

      {/* Student Selector: Show ONLY if no studentId came from URL */}
      {!studentIdFromUrl && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="student-select-label">Select Student</InputLabel>
          <Select
            labelId="student-select-label"
            id="student-select"
            value={selectedStudentId}
            label="Select Student"
            onChange={handleStudentSelectChange}
          >
            <MenuItem value=""><em>-- Select a Student --</em></MenuItem>
            {allStudents
                .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || ''))
                .map((s) => (
                    <MenuItem key={s.studentId} value={s.studentId}>
                        {s.lastName}, {s.firstName} ({s.studentId})
                    </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Course Selection Form: Show ONLY if a student is selected (either from URL or dropdown) */}
      {isValidId(selectedStudentId) && student ? (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, backgroundColor: colors.white }}>
          <Box component="form" onSubmit={handleSubmit}>
            <FormControl error={!!formError} component="fieldset" sx={{ width: '100%' }} variant="standard">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: '500', color: colors.textDark }}>Available Courses</FormLabel>
              <Box sx={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid', borderColor: formError ? colors.errorRed : alpha(colors.secondaryGrey, 0.3), borderRadius: '4px', p: 1, mb: 1 }}>
                <FormGroup>
                  {allCourses.length > 0 ? (
                    <List dense disablePadding>
                      {allCourses
                        .sort((a, b) => (a?.courseName || '').localeCompare(b?.courseName || ''))
                        .map((course) => {
                          if (!course || typeof course !== 'object' || !course.courseId) {
                            console.warn("Skipping invalid course object:", course);
                            return null;
                          }
                          const courseIdStr = String(course.courseId);
                          return (
                            <ListItem key={courseIdStr} disablePadding sx={{ py: 0.5 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedCourseIds.has(courseIdStr)}
                                    onChange={handleCourseCheckboxChange}
                                    value={courseIdStr}
                                    sx={{ color: colors.secondaryGrey, '&.Mui-checked': { color: colors.primaryGreen } }}
                                  />
                                }
                                label={`${course.courseName || 'N/A'} (${courseIdStr}) - ${course.dayOfWeek || ''} ${course.startTime || ''}-${course.endTime || ''}`}
                                sx={{ width: '100%', color: colors.textDark, '.MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
                              />
                            </ListItem>
                          );
                        })
                      }
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ p: 2, color: colors.secondaryGrey }}>No courses available to display.</Typography>
                  )}
                </FormGroup>
              </Box>
              {formError && <FormHelperText error>{formError}</FormHelperText>}
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                // Navigate back to list only if accessed specifically, otherwise just stay
                onClick={() => { if (studentIdFromUrl) navigate('/studentsmanagement'); else setSelectedStudentId(''); /* Clear selection in general mode */}}
                sx={{ color: colors.secondaryGrey, borderColor: alpha(colors.secondaryGrey, 0.5) }}
              >
                {studentIdFromUrl ? 'Back to List' : 'Cancel Selection'}
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon sx={{ color: colors.iconContrastLight }} />}
                sx={{ backgroundColor: colors.primaryGreen, color: colors.iconContrastLight, '&:hover': { backgroundColor: colors.greenDark } }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Paper>
      ) : (
        // Show message if in general mode and no student is selected yet
        !studentIdFromUrl && !selectedStudentId && (
            <Alert severity="info">Please select a student from the dropdown above to manage their enrollments.</Alert>
        )
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
