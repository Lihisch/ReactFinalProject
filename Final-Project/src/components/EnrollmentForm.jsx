// src/components/EnrollmentForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Grid, Snackbar, Alert, Breadcrumbs, Link as MuiLink,
  FormHelperText, FormGroup, FormControlLabel, Checkbox, FormLabel, FormControl,
  List, ListItem, CircularProgress, Paper, alpha, Select, MenuItem, InputLabel, Chip
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

const SEMESTER_OPTIONS = [
  { value: '', label: 'All Semesters' },
  { value: 'A', label: ' A' },
  { value: 'B', label: ' B' },
  { value: 'Summer', label: 'Summer ' },
];

export default function EnrollmentForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentIdFromUrl = searchParams.get('studentId');

  const [allStudents, setAllStudents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(studentIdFromUrl || '');
  const [student, setStudent] = useState(null);
  const [initialEnrollmentIds, setInitialEnrollmentIds] = useState(new Set());
  const [selectedCourseIds, setSelectedCourseIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [studentsDataFromFirebase, coursesDataFromFirebase] = await Promise.all([
          listStudents(),
          listCourses()
        ]);

        const processedStudents = studentsDataFromFirebase.map(s => ({
          ...s,
          id: s.id,
          enrolledCourses: Array.isArray(s.enrolledCourses) ? s.enrolledCourses : []
        }));
        setAllStudents(processedStudents);
        setAllCourses(coursesDataFromFirebase);
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
      // If allStudents is not yet populated and initial data is still loading,
      // we return early. The effect will re-run when allStudents or isLoading changes.
      if (isLoading && allStudents.length === 0) {
        return;
      }

      const foundStudent = allStudents.find(s => String(s.studentId) === String(selectedStudentId));

      if (foundStudent) {
        setStudent(foundStudent);
        const initiallyEnrolled = new Set((foundStudent.enrolledCourses || []).map(String));
        setInitialEnrollmentIds(initiallyEnrolled);
        setSelectedCourseIds(new Set(initiallyEnrolled));
        setError(null); // Clear any previous "not found" error for this ID
      } else {
        // Only set error if not in the initial loading phase of allStudents
        // or if allStudents is populated but the student is genuinely not found.
        if (!isLoading || allStudents.length > 0) {
          console.error(`EnrollmentForm Error: Student with selected ID ${selectedStudentId} not found in loaded students.`);
          setError(`Student with ID ${selectedStudentId} not found.`);
        }
        setStudent(null); // Ensure student state is cleared if not found
        setInitialEnrollmentIds(new Set());
        setSelectedCourseIds(new Set());
      }
    } else {
      setStudent(null);
      setInitialEnrollmentIds(new Set());
      setSelectedCourseIds(new Set());
      setError(null); // Clear error if ID becomes invalid (e.g., empty)
    }
  }, [selectedStudentId, allStudents, isLoading]); // Added isLoading to dependency array

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

    // Log the student object and selected course IDs before attempting to save
    console.log("EnrollmentForm handleSubmit: Student object being processed:", JSON.parse(JSON.stringify(student)));
    console.log("EnrollmentForm handleSubmit: Student Firestore ID (student.id):", student?.id);
    console.log("EnrollmentForm handleSubmit: Student Business ID (student.studentId):", student?.studentId);
    const coursesToEnroll = Array.from(selectedCourseIds);
    console.log("EnrollmentForm handleSubmit: Course IDs to enroll:", coursesToEnroll);

    try {
      if (!student || !student.id) {
        console.error("EnrollmentForm Error: Student data or Firestore ID is missing just before calling updateStudent. Student object:", student);
        throw new Error("Student data or Firestore ID is missing.");
      }

      const studentPayload = { ...student, enrolledCourses: coursesToEnroll };
      console.log("EnrollmentForm: Payload being sent to updateStudent:", JSON.parse(JSON.stringify(studentPayload)));

      await updateStudent(studentPayload);

      setSnackbar({ open: true, message: 'Enrollment updated successfully!', severity: 'success' });
      // Optionally, update local 'allStudents' state for immediate UI reflection if not navigating away instantly
      setAllStudents(prevAllStudents => prevAllStudents.map(s =>
        s.id === student.id ? { ...s, enrolledCourses: coursesToEnroll } : s
      ));

      setTimeout(() => navigate('/studentsmanagement'), 1500);
    } catch (err) {
      console.error("Error updating enrollment:", err);
      let errorMessage = 'Error updating enrollment.';
      if (err.message) {
        errorMessage += ` Details: ${err.message}`;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const filteredAndSortedCourses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allCourses
      .filter(course => {
        if (course.endDate) {
          try {
            const courseEndDate = new Date(course.endDate);
            if (courseEndDate < today) {
              return false;
            }
          } catch (e) {
            console.warn(`Invalid date format for course.endDate: ${course.endDate} for courseId: ${course.courseId}`, e);
            return true;
          }
        }
        return true;
      })
      .filter(course => {
        if (!selectedSemesterFilter) return true;
        return course.semester === selectedSemesterFilter;
      })
      .sort((a, b) => {
        const parseDate = (dateStr) => {
          if (!dateStr) return null;
          if (dateStr.seconds !== undefined && dateStr.nanoseconds !== undefined) {
            return new Date(dateStr.seconds * 1000 + dateStr.nanoseconds / 1000000);
          }
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? null : d;
        };

        const dateA = parseDate(a.startingDate); // Corrected field name
        const dateB = parseDate(b.startingDate); // Corrected field name

        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return 1;
        if (dateB === null) return -1;

        return dateA.getTime() - dateB.getTime();
      });
  }, [allCourses, selectedSemesterFilter]);


  // --- Render Logic ---

  if (error) {
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/studentsmanagement')} sx={{ mt: 2 }}>Back to List</Button>
      </Container>
    );
  }

  if (isLoading) {
    return <Container sx={{ py: 3, textAlign: 'center' }}><CircularProgress sx={{ color: colors.primaryGreen }} /></Container>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <MuiLink component={RouterLink} to="/" underline="hover" sx={{ display: 'flex', alignItems: 'center', color: colors.secondaryGrey }}>
          <HomeIcon sx={{ mr: 0.5, color: colors.iconContrastDark }} fontSize="inherit" /> Home
        </MuiLink>
        {studentIdFromUrl && (
          <MuiLink component={RouterLink} to="/studentsmanagement" underline="hover" sx={{ color: colors.secondaryGrey }}>Students Management</MuiLink>
        )}
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', color: colors.textDark }}>
          Manage Enrollments
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom sx={{ color: colors.textDark, fontWeight: 600 }}>
        Manage Enrollments
        {student && `: ${student.firstName} ${student.lastName}`}
      </Typography>
      {student && (
        <Typography variant="body1" sx={{ color: colors.secondaryGrey, mb: 2 }}>(ID: {student.studentId})</Typography>
      )}

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

      {isValidId(selectedStudentId) && student ? (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, backgroundColor: colors.white }}>
          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="semester-filter-label">Filter by Semester</InputLabel>
              <Select
                labelId="semester-filter-label"
                value={selectedSemesterFilter}
                label="Filter by Semester"
                onChange={(e) => setSelectedSemesterFilter(e.target.value)}
              >
                {SEMESTER_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl error={!!formError} component="fieldset" sx={{ width: '100%' }} variant="standard">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: '500', color: colors.textDark }}>Available Courses</FormLabel>
              <Box sx={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid', borderColor: formError ? colors.errorRed : alpha(colors.secondaryGrey, 0.3), borderRadius: '4px', p: 1, mb: 1 }}>
                <FormGroup>
                  {filteredAndSortedCourses.length > 0 ? (
                    <List dense disablePadding>
                      {filteredAndSortedCourses
                        .map((course) => {
                          if (!course || typeof course !== 'object' || !course.courseId) {
                            console.warn("Skipping invalid course object:", course);
                            return null;
                          }
                          const courseIdStr = String(course.courseId);
                          const isInitiallyEnrolled = initialEnrollmentIds.has(courseIdStr);
                          const checkboxDisabled = false;
                          return (
                            <ListItem key={courseIdStr} disablePadding sx={{ py: 0.5 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedCourseIds.has(courseIdStr)}
                                    onChange={handleCourseCheckboxChange}
                                    value={courseIdStr}
                                    sx={{ color: colors.secondaryGrey, '&.Mui-checked': { color: colors.primaryGreen } }}
                                    disabled={checkboxDisabled}
                                  />
                                }
                                label={
                                  <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                    {`${course.courseName || 'N/A'} (${courseIdStr}) -   ${course.dayOfWeek || ''} ${course.startTime || ''}-${course.endTime || ''} - ${course.semester || 'N/A'} `}
                                    {isInitiallyEnrolled && <Chip label="Enrolled" size="small" sx={{ ml: 1, backgroundColor: alpha(colors.primaryGreen, 0.7), color: colors.white, height: '20px', '.MuiChip-label': { fontSize: '0.7rem', lineHeight: '1.5', px: '6px' } }} />}
                                  </Box>
                                }
                                sx={{ width: '100%', color: colors.textDark, '.MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
                              />
                            </ListItem>
                          );
                        })
                      }
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ p: 2, color: colors.secondaryGrey, textAlign: 'center' }}>
                      {selectedSemesterFilter
                        ? `No courses found for the selected semester.`
                        : `No courses available to display.`}
                    </Typography>
                  )}
                </FormGroup>
              </Box>
              {formError && <FormHelperText error>{formError}</FormHelperText>}
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => { if (studentIdFromUrl) navigate('/studentsmanagement'); else setSelectedStudentId(''); }}
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
