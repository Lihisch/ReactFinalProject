// src/components/EnrollmentForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Grid, Snackbar, Alert, Breadcrumbs, Link as MuiLink,
  FormHelperText, FormGroup, FormControlLabel, Checkbox, FormLabel, FormControl,
  List, ListItem, CircularProgress, Paper, alpha, Select, MenuItem, InputLabel
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import SaveIcon from '@mui/icons-material/Save';
import { listStudents, updateStudent } from '../firebase/students';
import { listCourses } from '../firebase/courses';

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
  const studentIdFromUrl = searchParams.get('studentId');

  const [allStudents, setAllStudents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(studentIdFromUrl || '');
  const [student, setStudent] = useState(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [studentsData, coursesData] = await Promise.all([
          listStudents(),
          listCourses()
        ]);
        setAllStudents(studentsData);
        setAllCourses(coursesData);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data from Firebase.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update selected student data when ID changes
  useEffect(() => {
    if (isValidId(selectedStudentId)) {
      setIsLoading(true);
      const foundStudent = allStudents.find(s => String(s.studentId) === String(selectedStudentId));
      
      if (foundStudent) {
        setStudent(foundStudent);
        setSelectedCourseIds(new Set((foundStudent.enrolledCourses || []).map(String)));
      } else {
        console.error(`EnrollmentForm Error: Student with selected ID ${selectedStudentId} not found in loaded students.`);
        setError(`Student with ID ${selectedStudentId} not found.`);
        setSelectedStudentId('');
      }
      setIsLoading(false);
    } else {
      setStudent(null);
      setSelectedCourseIds(new Set());
    }
  }, [selectedStudentId, allStudents]);

  const handleStudentSelectChange = (event) => {
    setSelectedStudentId(event.target.value);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValidId(selectedStudentId) || !student) {
      setFormError('Please select a student first.');
      return;
    }

    try {
      const updatedEnrolledCourses = Array.from(selectedCourseIds);
      await updateStudent(student.id, { enrolledCourses: updatedEnrolledCourses });
      
      setSnackbar({ open: true, message: 'Enrollment updated successfully!', severity: 'success' });
      setTimeout(() => {
        navigate('/studentsmanagement');
      }, 1500);
    } catch (err) {
      console.error("Error updating enrollment:", err);
      setSnackbar({ open: true, message: 'Error updating enrollment.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
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
