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
  AccordionDetails
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
import { listStudents } from '../firebase/students';
import { listCourses } from '../firebase/courses';
import { listAssignments } from '../firebase/assignments';
import { isPast, parseISO, isValid as isValidDate } from 'date-fns';
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

  // Set studentId from URL on mount
  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    if (urlStudentId) {
      setSelectedStudent(urlStudentId);
    } else {
      setSelectedStudent('');
    }
  }, [searchParams]);

  useEffect(() => {
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

  return (
    <Box sx={{ backgroundColor: themeColors.background, minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1300, mb: 2, alignSelf: 'flex-start' }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink
              component={RouterLink}
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center' }}
              color="inherit"
              to={selectedStudent ? `/?studentId=${selectedStudent}` : "/"} // Pass studentId if selected
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Home
            </MuiLink>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              Courses
            </Typography>
          </Breadcrumbs>
        </Box>
        <Box sx={{ width: '100%', maxWidth: 1300, mb: 1.5 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: themeColors.primaryDark, mb: 0.2, letterSpacing: '.02em', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon fontSize="medium" sx={{ color: themeColors.primaryDark, mb: '-4px' }} />
            My Courses
          </Typography>
          <Typography variant="subtitle1" sx={{ color: themeColors.textSecondary, fontWeight: 400, fontSize: '0.98rem' }}>
            View and manage the courses you are enrolled in
          </Typography>
        </Box>
        <Paper elevation={3} sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 3,
          backgroundColor: themeColors.paper,
          boxShadow: '0 2px 16px #e0e0e0',
          minHeight: 400,
          maxWidth: 1300,
          width: '100%',
          mx: 'auto',
        }}>
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
                    {student.firstName} {student.lastName} ({student.studentId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
    </Box>
  );
};

export default Courses;