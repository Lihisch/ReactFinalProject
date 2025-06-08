import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  Paper,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { listStudents, updateStudent } from '../firebase/students';
import { listCourses } from '../firebase/courses';
import { listAssignments } from '../firebase/assignments';
import { isPast, parseISO, isValid as isValidDate, isAfter } from 'date-fns';
import { getSubmissionsByStudent } from '../firebase/submissions';

const themeColors = {
  primary: '#bed630',
  primaryDark: '#a7bc2a',
  secondary: '#e0e0e0',
  background: '#f5f5f5',
  paper: '#ffffff',
  textPrimary: 'rgba(0, 0, 0, 0.87)',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
};

const getAssignmentStatus = (dueDateStr) => {
  if (!dueDateStr) return 'Unknown';
  try {
    const deadline = parseISO(dueDateStr);
    if (!isValidDate(deadline)) return 'Invalid Date';
    return isPast(deadline) ? 'Past Due' : 'Active';
  } catch {
    return 'Invalid Date';
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = parseISO(dateStr);
    if (!isValidDate(date)) return 'Invalid Date';
    return date.toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

// Helper for semester order (English only)
const semesterOrder = ['A', 'B', 'Summer'];
const getSemesterIndex = (semester) => {
  const s = String(semester).toLowerCase();
  if (s === 'a' || s === 'semester a') return 0;
  if (s === 'b' || s === 'semester b') return 1;
  if (s === 'summer' || s === 'semester summer') return 2;
  return 99;
};

const Courses = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchParams] = useSearchParams();
  const [courseDetailsDialog, setCourseDetailsDialog] = useState({ open: false, course: null });
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
  const [registerSemester, setRegisterSemester] = useState('');
  const [registerCourseId, setRegisterCourseId] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // Set studentId from URL on mount
  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    if (urlStudentId) {
      setSelectedStudent(urlStudentId);
    } else {
      setSelectedStudent('');
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsData, coursesData, assignmentsData] = await Promise.all([
        listStudents(),
        listCourses(),
        listAssignments()
      ]);
      setStudents(studentsData);
      setCourses(coursesData);
      setAssignments(assignmentsData);
    } catch (err) {
      setStudents([]);
      setCourses([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      // Find the selected student
      const student = students.find(s => s.studentId === selectedStudent);
      if (student) {
        // Filter courses based on student's enrolled courses
        let studentCourses = courses.filter(course =>
          student.enrolledCourses.includes(course.courseId)
        );
        setFilteredCourses(studentCourses);
      }
      // Fetch submissions for the selected student
      getSubmissionsByStudent(selectedStudent).then(setSubmissions).catch(() => setSubmissions([]));
    } else {
      setFilteredCourses([]);
      setSubmissions([]);
    }
  }, [selectedStudent, students, courses]);

  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  // Group courses by semester
  const coursesBySemester = filteredCourses.reduce((acc, course) => {
    if (!acc[course.semester]) {
      acc[course.semester] = [];
    }
    acc[course.semester].push(course);
    return acc;
  }, {});

  const handleOpenCourseDialog = (course) => {
    setCourseDetailsDialog({ open: true, course });
  };

  const handleCloseCourseDialog = () => {
    setCourseDetailsDialog({ open: false, course: null });
  };

  // Get assignments for a specific course
  const getCourseAssignments = (courseId) => {
    return assignments.filter(a => a.courseId === courseId);
  };

  // Filter courses by semester for registration (only future courses)
  const now = new Date();
  const availableCoursesBySemester = (registerSemester && courses.length)
    ? courses.filter(c => c.semester === registerSemester && c.startingDate && isAfter(parseISO(c.startingDate), now))
    : [];

  const handleOpenRegisterDialog = () => {
    setRegisterSemester('');
    setRegisterCourseId('');
    setRegisterError('');
    setOpenRegisterDialog(true);
  };
  const handleCloseRegisterDialog = () => {
    setOpenRegisterDialog(false);
    setRegisterSemester('');
    setRegisterCourseId('');
    setRegisterError('');
  };
  const handleRegister = async () => {
    setRegisterError('');
    setRegisterLoading(true);
    try {
      if (!selectedStudent || !registerCourseId) {
        setRegisterError('Please select a semester and course.');
        setRegisterLoading(false);
        return;
      }
      // Find student object
      const student = students.find(s => s.studentId === selectedStudent);
      if (!student) {
        setRegisterError('Student not found.');
        setRegisterLoading(false);
        return;
      }
      // Prevent duplicate registration
      if (Array.isArray(student.enrolledCourses) && student.enrolledCourses.includes(registerCourseId)) {
        setRegisterError('You are already enrolled in this course.');
        setRegisterLoading(false);
        return;
      }
      // Update student in Firebase
      const updatedStudent = {
        ...student,
        enrolledCourses: Array.isArray(student.enrolledCourses)
          ? [...student.enrolledCourses, registerCourseId]
          : [registerCourseId],
      };
      await updateStudent(updatedStudent);
      setRegisterSuccess(true);
      setTimeout(async () => {
        setOpenRegisterDialog(false);
        setRegisterSuccess(false);
        await fetchData();
      }, 1200);
    } catch (err) {
      setRegisterError('Registration failed.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: themeColors.background, minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', px: { xs: 1, sm: 3, md: 4 } }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <MuiLink
              component={RouterLink}
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center' }}
              color="inherit"
              to={selectedStudent ? `/?studentId=${selectedStudent}` : "/"}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Home
            </MuiLink>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              Courses
            </Typography>
          </Breadcrumbs>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, sm: 5, md: 6 },
              borderRadius: 3,
              backgroundColor: themeColors.paper,
              boxShadow: '0 2px 16px #e0e0e0',
              minHeight: 400,
              width: '100%',
            }}
          >
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: themeColors.primaryDark, mb: 0.2, letterSpacing: '.02em', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon fontSize="medium" sx={{ color: themeColors.primaryDark, mb: '-4px' }} />
              My Courses
            </Typography>
            <Typography variant="subtitle1" sx={{ color: themeColors.textSecondary, fontWeight: 400, fontSize: '0.98rem' }}>
              View your enrolled courses by semester
            </Typography>
            <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: themeColors.paper, borderRadius: 2, boxShadow: 'none' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: themeColors.textPrimary }}>
                Student Courses
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="student-select-label">Select Student</InputLabel>
                <Select
                  labelId="student-select-label"
                  id="student-select"
                  value={selectedStudent}
                  label="Select Student"
                  onChange={handleStudentChange}
                  sx={{ bgcolor: themeColors.paper }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student.studentId} value={student.studentId}>
                      {student.lastName} - {student.firstName} ({student.studentId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedStudent && (
                <Button
                  variant="contained"
                  sx={{ mt: 2, backgroundColor: themeColors.primaryDark, color: '#fff', fontWeight: 600, borderRadius: 2, textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: themeColors.primary } }}
                  onClick={handleOpenRegisterDialog}
                >
                  Register to a Course
                </Button>
              )}
            </Paper>

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="textSecondary">Loading courses...</Typography>
              </Box>
            ) : Object.keys(coursesBySemester).length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h6" color="textSecondary">
                  No courses found for the selected student.
                </Typography>
              </Box>
            ) : (
              Object.entries(coursesBySemester)
                .sort(([a], [b]) => getSemesterIndex(a) - getSemesterIndex(b))
                .map(([semester, semesterCourses], idx) => (
                  <Accordion key={semester} defaultExpanded={idx === 0} sx={{ mb: 2, backgroundColor: themeColors.paper, borderRadius: 2, boxShadow: 'none', border: `1px solid ${themeColors.secondary}` }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography variant="h5" component="h2" sx={{
                          color: themeColors.primaryDark,
                          fontWeight: 'bold',
                          letterSpacing: '.03em',
                          fontSize: '1.05rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          <span style={{ fontWeight: 700, textTransform: 'capitalize', marginRight: 4 }}>{semester}</span>
                          <span style={{ fontWeight: 400 }}>Semester</span>
                        </Typography>
                        <Chip
                          label={`${semesterCourses.length} Courses`}
                          sx={{ ml: 2, backgroundColor: themeColors.primary, color: '#222', fontWeight: 600, letterSpacing: '.01em', boxShadow: '0 1px 4px #e0e0e0' }}
                          size="small"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        {semesterCourses.map((course) => {
                          const courseAssignments = getCourseAssignments(course.courseId);
                          return (
                            <Grid item xs={12} sm={6} md={4} key={course.courseId}>
                              <Card
                                elevation={3}
                                sx={{
                                  height: '100%',
                                  borderRadius: 2,
                                  backgroundColor: themeColors.paper,
                                  boxShadow: '0 2px 12px rgba(34, 34, 34, 0.07)',
                                  border: `1.5px solid ${themeColors.secondary}`,
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  m: 0.5,
                                  '&:hover': {
                                    transform: 'translateY(-4px) scale(1.02)',
                                    boxShadow: '0 6px 24px rgba(34, 34, 34, 0.13)',
                                    borderColor: themeColors.primaryDark,
                                  },
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleOpenCourseDialog(course)}
                              >
                                <CardContent>
                                  <Typography variant="h6" component="h3" gutterBottom sx={{
                                    color: themeColors.primaryDark,
                                    fontWeight: 600,
                                    fontSize: '1.05rem',
                                    mb: 1.2,
                                    letterSpacing: '.01em',
                                    textShadow: '0 1px 0 #e0e0e0',
                                  }}>
                                    <SchoolIcon sx={{ mr: 1, color: themeColors.primaryDark, verticalAlign: 'middle' }} fontSize="small" />
                                    {course.courseName}
                                  </Typography>
                                  <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <PersonIcon sx={{ mr: 1, color: themeColors.primary }} />
                                      <Typography variant="body2" sx={{ color: '#222', fontWeight: 500 }}>
                                        {course.professorsName}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <AccessTimeIcon sx={{ mr: 1, color: themeColors.primary }} />
                                      <Typography variant="body2" sx={{ color: '#444' }}>
                                        {course.dayOfWeek}, {course.courseHours}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <StarIcon sx={{ mr: 1, color: themeColors.primary }} />
                                      <Typography variant="body2" sx={{ color: '#444' }}>
                                        {course.creditPoints} Credit Points
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <CalendarTodayIcon sx={{ mr: 1, color: themeColors.primary }} />
                                      <Typography variant="body2" sx={{ color: '#444' }}>
                                        Starting: {course.startingDate}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))
            )}
          </Paper>
        </Box>
      </Container>

      <Dialog
        open={courseDetailsDialog.open}
        onClose={handleCloseCourseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        {courseDetailsDialog.course && (
          <>
            <DialogTitle sx={{ 
              backgroundColor: themeColors.primaryDark,
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.25rem',
              py: 2,
            }}>
              {courseDetailsDialog.course.courseName}
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8faf5', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: themeColors.primaryDark, fontWeight: 600 }}>
                      Course Information
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: themeColors.textSecondary, mb: 0.5 }}>
                        Professor
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {courseDetailsDialog.course.professorsName || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: themeColors.textSecondary, mb: 0.5 }}>
                        Schedule
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {courseDetailsDialog.course.dayOfWeek}, {courseDetailsDialog.course.courseHours}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: themeColors.textSecondary, mb: 0.5 }}>
                        Credit Points
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {courseDetailsDialog.course.creditPoints}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: themeColors.textSecondary, mb: 0.5 }}>
                        Starting Date
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {courseDetailsDialog.course.startingDate}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: themeColors.textSecondary, mb: 0.5 }}>
                        Description
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {courseDetailsDialog.course.description}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8faf5', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: themeColors.primaryDark, fontWeight: 600 }}>
                      Assignments
                    </Typography>
                    <List>
                      {getCourseAssignments(courseDetailsDialog.course.courseId).map((assignment) => {
                        // Find the submission for this assignment and student
                        const submission = submissions.find(
                          s => String(s.assignmentId) === String(assignment.assignmentId) && String(s.courseId) === String(courseDetailsDialog.course.courseId)
                        );
                        const grade = submission && (submission.grade !== undefined && submission.grade !== null) ? submission.grade : null;
                        return (
                          <ListItem
                            key={assignment.assignmentId}
                            sx={{
                              mb: 1,
                              backgroundColor: '#fff',
                              borderRadius: 1,
                              border: `1px solid ${themeColors.secondary}`,
                            }}
                          >
                            <ListItemIcon>
                              <AssignmentTurnedInIcon sx={{ color: themeColors.primary }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: themeColors.textPrimary }}>
                                  {assignment.assignmentName}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                                    Due: {formatDate(assignment.dueDate)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                                    Weight: {assignment.weight}%
                                  </Typography>
                                  {grade !== null && (
                                    <Typography variant="body2" sx={{ color: themeColors.primaryDark, fontWeight: 600 }}>
                                      Grade: {grade}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Chip
                                label={getAssignmentStatus(assignment.dueDate)}
                                color={getAssignmentStatus(assignment.dueDate) === 'Active' ? 'success' : 'error'}
                                size="small"
                                sx={{
                                  backgroundColor: getAssignmentStatus(assignment.dueDate) === 'Active' ? '#eaf5d3' : '#fbeaea',
                                  color: getAssignmentStatus(assignment.dueDate) === 'Active' ? themeColors.primaryDark : '#b71c1c',
                                  fontWeight: 500,
                                }}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, backgroundColor: '#f8faf5' }}>
              <Button
                onClick={handleCloseCourseDialog}
                sx={{
                  color: themeColors.primaryDark,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(190, 214, 48, 0.1)',
                  },
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                component={RouterLink}
                to={`/assignments?studentId=${selectedStudent}`}
                sx={{
                  backgroundColor: themeColors.primaryDark,
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: themeColors.primary,
                  },
                }}
              >
                View All Assignments
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={openRegisterDialog} onClose={handleCloseRegisterDialog} maxWidth="sm" fullWidth
        PaperProps={{
          sx: { overflow: 'visible', maxHeight: 'none' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: themeColors.primaryDark, fontSize: '1.5rem', pb: 0, borderBottom: '1.5px solid #e0e0e0', background: '#f7fafc', textAlign: 'center', letterSpacing: '.01em' }}>Course Registration</DialogTitle>
        <DialogContent sx={{ p: 0, background: '#f7fafc', maxHeight: 'none', overflow: 'visible' }}>
          <Box sx={{ mx: 'auto', maxWidth: 520, minWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', p: { xs: 2.5, sm: 4 } }}>
            {registerSuccess ? (
              <Typography color="success.main" sx={{ fontWeight: 500, textAlign: 'center', mb: 2, fontSize: '1.08rem' }}>Registration successful!</Typography>
            ) : (
              <>
                <TextField
                  select
                  label="Semester"
                  value={registerSemester}
                  onChange={e => { setRegisterSemester(e.target.value); setRegisterCourseId(''); }}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  sx={{ mb: 3, mt: 2, background: '#fff', borderRadius: 2.5 }}
                  InputLabelProps={{
                    style: { color: themeColors.primaryDark, fontWeight: 500 }
                  }}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {semesterOrder.map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Course"
                  value={registerCourseId}
                  onChange={e => setRegisterCourseId(e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  sx={{ mb: 3, background: '#fff', borderRadius: 2.5 }}
                  InputLabelProps={{
                    style: { color: themeColors.primaryDark, fontWeight: 500 }
                  }}
                  disabled={!registerSemester}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {availableCoursesBySemester.length === 0 && registerSemester && (
                    <MenuItem value="" disabled>No future courses available for this semester</MenuItem>
                  )}
                  {availableCoursesBySemester.map(c => (
                    <MenuItem key={c.courseId} value={c.courseId}>{c.courseName}</MenuItem>
                  ))}
                </TextField>
                {/* Show course details if a course is selected */}
                {registerCourseId && (() => {
                  const course = courses.find(c => c.courseId === registerCourseId);
                  if (!course) return null;
                  return (
                    <Box sx={{ mt: 2.2, mb: 1.2, p: 2.5, background: '#fff', borderRadius: 2.5, boxShadow: '0 2px 8px #e0e0e0', border: '1.5px solid #e0e0e0', minWidth: 260, maxWidth: 420 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.2 }}>
                        <SchoolIcon sx={{ color: themeColors.primaryDark, fontSize: '1.5rem', mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#222', fontSize: '1.1rem', letterSpacing: 0 }}>{course.courseName}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#444', mb: 0.7, fontWeight: 400, fontSize: '1rem' }}><b>Professor:</b> <span style={{ fontWeight: 400 }}>{course.professorsName}</span></Typography>
                      <Typography variant="body2" sx={{ color: '#444', mb: 0.7, fontWeight: 400, fontSize: '1rem' }}><b>Schedule:</b> <span style={{ fontWeight: 400 }}>{course.dayOfWeek}, {course.courseHours}</span></Typography>
                      <Typography variant="body2" sx={{ color: '#444', mb: 0.7, fontWeight: 400, fontSize: '1rem' }}><b>Start Date:</b> <span style={{ fontWeight: 400 }}>{course.startingDate}</span></Typography>
                      <Typography variant="body2" sx={{ color: '#444', mb: 0.7, fontWeight: 400, fontSize: '1rem' }}><b>Credit Points:</b> <span style={{ fontWeight: 400 }}>{course.creditPoints}</span></Typography>
                      <Typography variant="body2" sx={{ color: '#444', mb: 0.5, fontWeight: 400, fontSize: '1rem' }}><b>Description:</b> <span style={{ fontWeight: 400 }}>{course.description}</span></Typography>
                    </Box>
                  );
                })()}
                {registerError && <Typography color="error" sx={{ mb: 1, fontWeight: 400 }}>{registerError}</Typography>}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3, background: '#f7fafc', justifyContent: 'center' }}>
          {!registerSuccess && (
            <>
              <Button onClick={handleCloseRegisterDialog} variant="outlined" sx={{ color: '#666', borderColor: '#e0e0e0', fontWeight: 400, fontSize: '1rem', minWidth: 100, height: 44, borderRadius: 2, mr: 2, background: '#fff', '&:hover': { borderColor: themeColors.primaryDark, background: '#f5f5f5' } }} disabled={registerLoading}>Cancel</Button>
              <Button variant="contained" sx={{ backgroundColor: themeColors.primaryDark, color: '#fff', fontWeight: 500, borderRadius: 2, textTransform: 'none', fontSize: '1rem', minWidth: 120, height: 44, boxShadow: 'none', '&:hover': { backgroundColor: themeColors.primary } }} onClick={() => setRegisterError('') || setOpenConfirmDialog(true)} disabled={registerLoading || !registerSemester || !registerCourseId || registerSuccess || availableCoursesBySemester.length === 0}>
                Register
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      <Dialog open={!!openConfirmDialog} onClose={() => setOpenConfirmDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: themeColors.primaryDark, fontSize: '1.1rem', pb: 0, background: '#f7fafc' }}>Confirm Registration</DialogTitle>
        <DialogContent sx={{ p: 3, background: '#f7fafc' }}>
          {registerCourseId && (() => {
            const course = courses.find(c => c.courseId === registerCourseId);
            if (!course) return null;
            return (
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to register for <b>{course.courseName}</b> ({course.courseId})?
              </Typography>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, background: '#f7fafc' }}>
          <Button onClick={() => { setOpenConfirmDialog(false); handleCloseRegisterDialog(); }} sx={{ color: themeColors.primaryDark, fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" sx={{ backgroundColor: themeColors.primaryDark, color: '#fff', fontWeight: 600, borderRadius: 2, textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: themeColors.primary } }} onClick={() => { setOpenConfirmDialog(false); handleRegister(); }}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Courses;