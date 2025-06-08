// src/components/GradesForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Grid, FormControl, InputLabel,
  Select, MenuItem, Snackbar, Alert, Breadcrumbs, Link, CircularProgress,
  Paper, List, ListItem, ListItemText, FormHelperText
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SaveIcon from '@mui/icons-material/Save';
// import { saveSubmission, getSubmissionsByCourseAndAssignment } from '../firebase/grades';
import { getSubmissionsByCourseAndAssignment, saveSubmission } from '../../../firebase/grades';
import { listCourses } from '../../../firebase/courses';
import { listAssignments } from '../../../firebase/assignments';
import { listStudents } from '../../../firebase/students';

const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff',
  lightGrey: '#f5f5f5',
};

const COURSES_STORAGE_KEY = 'courses';
const ASSIGNMENTS_STORAGE_KEY = 'assignments';
const STUDENTS_STORAGE_KEY = 'students';
const SUBMISSIONS_STORAGE_KEY = 'submissions';

const STATUS_GRADED = 'Graded';
const STATUS_PENDING = 'Pending Grade';
const STATUS_NO_SUBMISSION = 'No Submission';


export default function GradesForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialStateFromNav = location.state || {};

  const [selectedCourseCode, setSelectedCourseCode] = useState(initialStateFromNav.courseId || '');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(initialStateFromNav.assignmentId || '');

  const [courseOptions, setCourseOptions] = useState([]);
  const [assignmentOptions, setAssignmentOptions] = useState([]);
  const [studentsToGrade, setStudentsToGrade] = useState([]);
  const [grades, setGrades] = useState({});

  const [loading, setLoading] = useState({ courses: true, assignments: false, students: false });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const safeJsonParse = (key, defaultValue = []) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === '') return defaultValue;
      const parsed = JSON.parse(item);
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
      return parsed;
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(prev => ({ ...prev, courses: true }));
      try {
        const coursesData = await listCourses();
        setCourseOptions(coursesData);
      } catch (error) {
        console.error("Error loading courses:", error);
        setSnackbar({ open: true, message: 'Error loading courses.', severity: 'error' });
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchAssignmentsAndStudents = async () => {
      if (!selectedCourseCode) {
        setAssignmentOptions([]);
        setStudentsToGrade([]);
        setGrades({});
        setErrors({});
        return;
      }

      setLoading(prev => ({ ...prev, assignments: true, students: true }));
      setAssignmentOptions([]);
      setStudentsToGrade([]);
      setGrades({});
      setErrors({});

      try {
        const [assignmentsData, studentsData] = await Promise.all([
          listAssignments(),
          listStudents()
        ]);

        const filteredAssignments = assignmentsData.filter(
          assign => assign && String(assign.courseId) === String(selectedCourseCode)
        );

        const filteredStudents = studentsData.filter(student =>
          student && student.studentId &&
          Array.isArray(student.enrolledCourses) &&
          student.enrolledCourses.some(id => String(id) === String(selectedCourseCode))
        );

        setAssignmentOptions(filteredAssignments);
        setStudentsToGrade(filteredStudents);
      } catch (error) {
        console.error("Error loading assignments or students:", error);
        setSnackbar({ open: true, message: 'Error loading assignments or students.', severity: 'error' });
      } finally {
        setLoading(prev => ({ ...prev, assignments: false, students: false }));
      }
    };

    fetchAssignmentsAndStudents();
  }, [selectedCourseCode]);

  const fetchExistingGrades = useCallback(async () => {
    if (!selectedCourseCode || !selectedAssignmentId) {
      setGrades({});
      return;
    }
    try {
      const relevantSubmissions = await getSubmissionsByCourseAndAssignment(selectedCourseCode, selectedAssignmentId);
      const initialGradesState = relevantSubmissions.reduce((acc, submissionRecord) => {
        if (submissionRecord && submissionRecord.studentId) {
          acc[String(submissionRecord.studentId)] = submissionRecord.grade ?? '';
        }
        return acc;
      }, {});
      setGrades(initialGradesState);
      setErrors({});
    } catch (error) {
      console.error("Error loading existing grades from submissions:", error);
      setSnackbar({ open: true, message: 'Error loading existing grades.', severity: 'error' });
    }
  }, [selectedCourseCode, selectedAssignmentId]);

  useEffect(() => { fetchExistingGrades(); }, [fetchExistingGrades]);

  const handleCourseChange = (event) => {
    const newCourseCode = event.target.value;
    setSelectedCourseCode(newCourseCode);
    if (newCourseCode !== selectedCourseCode) {
        setSelectedAssignmentId('');
    }
    setErrors({});
  };

  const handleAssignmentChange = (event) => {
    setSelectedAssignmentId(event.target.value);
    setErrors({});
  };

  const handleGradeChange = (studentId, value) => {
    const studentIdStr = String(studentId);
    setGrades(prev => ({ ...prev, [studentIdStr]: value }));
    const numericValue = Number(value);
    if (value !== '' && (isNaN(numericValue) || numericValue < 0 || numericValue > 100)) {
      setErrors(prev => ({ ...prev, [studentIdStr]: 'Grade must be between 0 and 100' }));
    } else {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[studentIdStr]; return newErrors; });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    if (!selectedCourseCode || !selectedAssignmentId) {
      setErrors({ form: 'Please select both a course and an assignment.' });
      setSnackbar({ open: true, message: 'Course and Assignment selection required.', severity: 'warning' });
      return;
    }

    const hasGradeErrors = Object.values(errors).some(errorMsg => typeof errorMsg === 'string' && errorMsg);
    if (hasGradeErrors) {
      setSnackbar({ open: true, message: 'Please correct the invalid grades before saving.', severity: 'error' });
      return;
    }

    try {
      const savePromises = studentsToGrade.map(async student => {
        const studentIdStr = String(student.studentId);
        const gradeValue = grades[studentIdStr];
        const gradeToSave = (gradeValue === null || gradeValue === undefined || gradeValue === '') ? null : Number(gradeValue);

        const statusToSave = gradeToSave !== null ? STATUS_GRADED : STATUS_PENDING;
        const submittedStatus = gradeToSave !== null;

        const submissionData = {
          courseId: selectedCourseCode,
          assignmentId: selectedAssignmentId,
          studentId: studentIdStr,
          grade: gradeToSave,
          comments: '',
          submitted: submittedStatus,
          status: statusToSave,
          submissionDate: new Date().toISOString().split('T')[0]
        };
        await saveSubmission(submissionData);
      });

      await Promise.all(savePromises);
      setSnackbar({ open: true, message: 'Grades saved successfully!', severity: 'success' });
      setTimeout(() => { navigate('/AssignmentsManagement'); }, 1200);
    } catch (error) {
      console.error("Error saving grades:", error);
      setSnackbar({ open: true, message: 'An error occurred while saving grades.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/"> <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/GradesManagement"> Grades Management </Link>
        <Typography color="text.primary">Grades Entry</Typography>
      </Breadcrumbs>
      <Box component="form" onSubmit={handleSubmit} sx={{ backgroundColor: colors.white, p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" align="center" fontWeight="600" gutterBottom> Grades Entry </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
        Enter grades for submitted assignments in the selected course
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!selectedCourseCode && !!errors.form}>
              <InputLabel>Select Course</InputLabel>
              <Select name="courseCode" value={selectedCourseCode} label="Select Course" onChange={handleCourseChange} disabled={loading.courses || courseOptions.length === 0} >
                <MenuItem value="" disabled><em>{loading.courses ? 'Loading...' : 'Select Course'}</em></MenuItem>
                {courseOptions.map((course) => ( <MenuItem key={course.courseId} value={course.courseId}> {course.courseId} - {course.courseName} </MenuItem> ))}
              </Select>
              {!selectedCourseCode && errors.form && <FormHelperText error>{errors.form}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={!selectedCourseCode || loading.assignments || assignmentOptions.length === 0} error={!selectedAssignmentId && !!errors.form}>
              <InputLabel>Select Assignment</InputLabel>
              <Select name="assignmentId" value={selectedAssignmentId} label="Select Assignment" onChange={handleAssignmentChange} >
                <MenuItem value="" disabled><em>{loading.assignments ? 'Loading...' : (assignmentOptions.length === 0 && selectedCourseCode ? 'No assignments' : 'Select Assignment')}</em></MenuItem>
                {assignmentOptions.map((assign) => ( <MenuItem key={assign.assignmentId} value={assign.assignmentId}> {assign.assignmentId} - {assign.assignmentName} </MenuItem> ))}
              </Select>
              {!selectedAssignmentId && errors.form && <FormHelperText error>{errors.form}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            {loading.students ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}> <CircularProgress sx={{ color: colors.green }} /> </Box>
            ) : studentsToGrade.length > 0 && selectedAssignmentId ? (
              <Paper variant="outlined" sx={{ mt: 2 }}>
                <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: colors.lightGrey }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item sx={{ flexBasis: '50%', flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">
                        Student Name (ID)
                      </Typography>
                    </Grid>
                    <Grid item sx={{ width: '150px', textAlign: 'left', paddingLeft: '16px !important' }}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">
                        Grade (0-100)
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <List dense>
                  {studentsToGrade.map((student, index) => {
                    const studentIdStr = String(student.studentId);
                    return (
                      <ListItem key={studentIdStr} divider={index < studentsToGrade.length - 1}>
                        <ListItemText
                          primary={`${(student.firstName || '').trim()} ${(student.lastName || '').trim() || 'Unknown Student'} (${studentIdStr})`}
                          sx={{ flexBasis: '50%' }}
                        />
                        <TextField
                          size="small"
                          variant="outlined"
                          placeholder="Grade"
                          type="number"
                          value={grades[studentIdStr] || ''}
                          onChange={(e) => handleGradeChange(studentIdStr, e.target.value)}
                          error={!!errors[studentIdStr]}
                          helperText={errors[studentIdStr]}
                          slotProps={{ min: 0, max: 100, step: "any" }}
                          sx={{ width: '150px' }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            ) : selectedCourseCode && selectedAssignmentId ? (
              <Typography sx={{ mt: 2, textAlign: 'center' }}>No students enrolled in this course to grade for this assignment.</Typography>
            ) : null }
          </Grid>

          <Grid item xs={12} textAlign="center" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              type="submit"
              size="large"
              startIcon={<SaveIcon />}
              disabled={loading.students || studentsToGrade.length === 0 || !selectedAssignmentId || Object.values(errors).some(e => typeof e === 'string' && e)}
              sx={{ backgroundColor: colors.green, color: colors.text, '&:hover': { backgroundColor: colors.greenDark } }}
            >
              Save Grades
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
         <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled"> {snackbar.message} </Alert>
      </Snackbar>
    </Container>
  );
}
