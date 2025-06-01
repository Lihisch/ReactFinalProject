import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, Box, Paper, Chip, Breadcrumbs, Link as MuiLink, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import GradeIcon from '@mui/icons-material/Grade';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { listStudents } from '../firebase/students';
import { listCourses } from '../firebase/courses';
import { listAssignments } from '../firebase/assignments';
import { getSubmissionsByStudent } from '../firebase/submissions';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

const themeColors = {
  primary: '#bed630',
  primaryDark: '#a7bc2a',
  secondary: '#e0e0e0',
  background: '#f5f5f5',
  paper: '#ffffff',
  textPrimary: 'rgba(0, 0, 0, 0.87)',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
};

const semesterOrder = ['A', 'B', 'Summer'];
const getSemesterIndex = (semester) => {
  const s = String(semester).toLowerCase();
  if (s === 'a' || s === 'semester a') return 0;
  if (s === 'b' || s === 'semester b') return 1;
  if (s === 'summer' || s === 'semester summer') return 2;
  return 99;
};

export default function Grades() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [dialogAssignment, setDialogAssignment] = useState(null);

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
      getSubmissionsByStudent(selectedStudent).then(setSubmissions).catch(() => setSubmissions([]));
    } else {
      setSubmissions([]);
    }
  }, [selectedStudent]);

  // Group grades by semester > course
  const grouped = useMemo(() => {
    if (!selectedStudent) return {};
    const student = students.find(s => s.studentId === selectedStudent);
    if (!student) return {};
    const enrolledCourseIds = student.enrolledCourses || [];
    const bySemester = {};
    courses.forEach(course => {
      if (!enrolledCourseIds.includes(course.courseId)) return;
      const semester = course.semester || 'Unknown';
      if (!bySemester[semester]) bySemester[semester] = {};
      bySemester[semester][course.courseName] = {
        course,
        assignments: assignments.filter(a => a.courseId === course.courseId)
      };
    });
    return bySemester;
  }, [selectedStudent, students, courses, assignments]);

  // Helper to get grade for assignment
  const getGrade = (assignmentId, courseId) => {
    const sub = submissions.find(s => String(s.assignmentId) === String(assignmentId) && String(s.courseId) === String(courseId));
    return sub && (sub.grade !== undefined && sub.grade !== null) ? sub.grade : null;
  };

  // Helper to get average grade for a course
  const getCourseAverage = (assignments, courseId) => {
    const grades = assignments
      .map(a => getGrade(a.assignmentId, courseId))
      .filter(g => typeof g === 'number');
    if (!grades.length) return null;
    return Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
  };

  // Helper to get grade chip color
  const getGradeChipColor = (grade) => {
    if (typeof grade !== 'number') return 'default';
    if (grade >= 90) return 'success';
    if (grade >= 55) return 'warning';
    return 'error';
  };

  const getAssignmentStatus = (dueDateStr, grade) => {
    if (grade !== null) return 'Graded';
    if (!dueDateStr) return 'Unknown';
    try {
      const deadline = new Date(dueDateStr);
      if (isNaN(deadline)) return 'Invalid Date';
      return deadline < new Date() ? 'Past Due' : 'Active';
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper to calculate final weighted grade for a course
  const getFinalGrade = (assignments, courseId) => {
    let totalWeight = 0;
    let weightedSum = 0;
    assignments.forEach(a => {
      const grade = getGrade(a.assignmentId, courseId);
      if (typeof a.weight === 'number' && typeof grade === 'number') {
        totalWeight += a.weight;
        weightedSum += grade * a.weight;
      }
    });
    if (totalWeight === 100) {
      return Math.round(weightedSum / 100);
    }
    return null;
  };

  // Helper to get final grade chip color and background
  const getFinalGradeStyle = (grade) => {
    if (typeof grade !== 'number') return { bg: '#f3f3f3', color: '#888' };
    if (grade >= 90) return { bg: '#eaf5d3', color: themeColors.primaryDark };
    if (grade >= 55) return { bg: '#fff7d6', color: '#bfa100' };
    return { bg: '#fbeaea', color: '#b71c1c' };
  };

  return (
    <Box sx={{ backgroundColor: themeColors.background, minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1300, mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/">
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Home
            </MuiLink>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              Grades
            </Typography>
          </Breadcrumbs>
        </Box>
        <Box sx={{ width: '100%', maxWidth: 1300, mb: 1.5 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: themeColors.primaryDark, mb: 0.2, letterSpacing: '.02em', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            <GradeIcon fontSize="medium" sx={{ color: themeColors.primaryDark, mb: '-4px' }} />
            My Grades
          </Typography>
          <Typography variant="subtitle1" sx={{ color: themeColors.textSecondary, fontWeight: 400, fontSize: '0.98rem' }}>
            View your grades by course and semester
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
              Student Grades
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="student-select-label">Select Student</InputLabel>
              <Select
                labelId="student-select-label"
                id="student-select"
                value={selectedStudent}
                label="Select Student"
                onChange={e => setSelectedStudent(e.target.value)}
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
              <Typography variant="h6" color="textSecondary">Loading grades...</Typography>
            </Box>
          ) : !selectedStudent ? (
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 2, backgroundColor: themeColors.paper }}>
              <Typography variant="h6" sx={{ color: themeColors.textSecondary }}>
                Please select a student to view their grades.
              </Typography>
            </Paper>
          ) : Object.keys(grouped).length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No grades found for the selected student.
              </Typography>
            </Box>
          ) : (
            Object.entries(grouped)
              .sort(([a], [b]) => getSemesterIndex(a) - getSemesterIndex(b))
              .map(([semester, coursesObj], idx) => (
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
                        label={`${Object.keys(coursesObj).length} Courses`}
                        sx={{ ml: 2, backgroundColor: themeColors.primary, color: '#222', fontWeight: 600, letterSpacing: '.01em', boxShadow: '0 1px 4px #e0e0e0' }}
                        size="small"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {Object.entries(coursesObj)
                      .filter(([_, { assignments }]) => assignments.length > 0)
                      .map(([courseName, { course, assignments }], courseIdx, arr) => {
                        const avg = getCourseAverage(assignments, course.courseId);
                        const finalGrade = getFinalGrade(assignments, course.courseId);
                        const finalGradeStyle = getFinalGradeStyle(finalGrade);
                        return (
                          <Box key={courseName} sx={{ mb: 3, p: 2.5, background: '#f8faf5', borderRadius: 2, boxShadow: '0 1px 6px #e0e0e0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.2 }}>
                              <SchoolIcon sx={{ color: themeColors.primaryDark, mr: 1, fontSize: '1.5rem' }} />
                              <Typography variant="h6" sx={{ color: themeColors.primaryDark, fontWeight: 700, fontSize: '1.13rem', letterSpacing: '.01em', mr: 2 }}>
                                {courseName}
                              </Typography>
                              {typeof avg === 'number' && (
                                <Box sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  background: '#e3f0fa',
                                  color: '#1976d2',
                                  fontWeight: 400,
                                  fontSize: '0.93rem',
                                  borderRadius: 1.5,
                                  px: 1.1,
                                  py: 0.3,
                                  ml: 1,
                                  boxShadow: 'none',
                                  border: 'none',
                                  opacity: 0.85
                                }}>
                                  <BarChartIcon sx={{ fontSize: '1.05rem', mr: 0.5, color: '#1976d2', opacity: 0.7 }} />
                                  Avg: {avg}
                                </Box>
                              )}
                            </Box>
                            {finalGrade && (
                              <Tooltip title="Weighted average of all assignments (final grade)" arrow>
                                <Box sx={{
                                  mb: 2,
                                  px: 1.2,
                                  py: 0.6,
                                  borderRadius: 2,
                                  background: '#eaf5d3',
                                  color: '#a7bc2a',
                                  fontWeight: 500,
                                  fontSize: '1.07rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  boxShadow: 'none',
                                  letterSpacing: '.01em',
                                  border: '1px solid #a7bc2a55',
                                  opacity: 1
                                }}>
                                  <GradeIcon sx={{ mr: 1, fontSize: '1.08rem', color: '#a7bc2a', opacity: 0.7 }} />
                                  Final Grade: {finalGrade}
                                </Box>
                              </Tooltip>
                            )}
                            <Grid container spacing={2}>
                              {assignments.map(assignment => {
                                const grade = getGrade(assignment.assignmentId, assignment.courseId);
                                const status = getAssignmentStatus(assignment.dueDate, grade);
                                return (
                                  <Grid item xs={12} sm={6} md={4} lg={3} key={assignment.assignmentId}>
                                    <Card
                                      elevation={2}
                                      sx={{
                                        borderRadius: 2,
                                        backgroundColor: '#fff',
                                        boxShadow: '0 1px 6px rgba(34, 34, 34, 0.06)',
                                        border: `1px solid ${themeColors.secondary}`,
                                        cursor: 'pointer',
                                        transition: 'transform 0.18s, box-shadow 0.18s',
                                        '&:hover': {
                                          transform: 'translateY(-2px) scale(1.01)',
                                          boxShadow: '0 3px 12px rgba(34, 34, 34, 0.11)',
                                          borderColor: themeColors.primaryDark,
                                        },
                                        minHeight: 170,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                      }}
                                      onClick={() => { setDialogAssignment({ ...assignment, grade, status, courseName }); setOpenAssignmentDialog(true); }}
                                    >
                                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                          <AssignmentTurnedInIcon sx={{ color: themeColors.primary, mr: 1 }} />
                                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: themeColors.textPrimary }}>
                                            {assignment.assignmentName}
                                          </Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                          <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                                            Weight: {assignment.weight}%
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                                            Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}
                                          </Typography>
                                        </Box>
                                      </CardContent>
                                      <Box sx={{ p: 1.5, pt: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <Tooltip title="Click for details" arrow>
                                          <Chip
                                            label={grade !== null ? `Grade: ${grade}` : 'No Grade'}
                                            color={getGradeChipColor(grade)}
                                            size="small"
                                            sx={{ fontWeight: 600, fontSize: '0.97rem', backgroundColor:
                                              getGradeChipColor(grade) === 'success' ? '#eaf5d3' :
                                              getGradeChipColor(grade) === 'warning' ? '#fff7d6' :
                                              getGradeChipColor(grade) === 'error' ? '#fbeaea' : '#f3f3f3',
                                              color:
                                                getGradeChipColor(grade) === 'success' ? themeColors.primaryDark :
                                                getGradeChipColor(grade) === 'warning' ? '#bfa100' :
                                                getGradeChipColor(grade) === 'error' ? '#b71c1c' : '#888',
                                              cursor: 'pointer',
                                              '&:hover': { boxShadow: '0 2px 8px #e0e0e0', opacity: 0.95 },
                                            }}
                                          />
                                        </Tooltip>
                                      </Box>
                                    </Card>
                                  </Grid>
                                );
                              })}
                            </Grid>
                            {courseIdx < arr.length - 1 && <Box sx={{ mt: 2, mb: 1 }}><hr style={{ border: 'none', borderTop: '1px solid #e0e0e0' }} /></Box>}
                          </Box>
                        );
                      })}
                  </AccordionDetails>
                </Accordion>
              ))
          )}
        </Paper>
      </Container>
      <Dialog open={openAssignmentDialog} onClose={() => { setOpenAssignmentDialog(false); setDialogAssignment(null); }} maxWidth="sm" fullWidth>
        {dialogAssignment ? (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.18rem', color: themeColors.primaryDark, pb: 0, display: 'flex', alignItems: 'center', gap: 1, background: '#f5fafd', borderBottom: `1.5px solid ${themeColors.primaryDark}` }}>
              <AssignmentTurnedInIcon sx={{ color: themeColors.primaryDark, mr: 1 }} />
              {dialogAssignment.assignmentName}
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, background: '#f8faf5', borderRadius: 2, boxShadow: '0 2px 12px #e0e0e0', mt: 1 }}>
                <Typography variant="h6" sx={{ mb: 1.5, color: themeColors.primaryDark, fontWeight: 600, fontSize: '1.08rem' }}>
                  Assignment Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                    <b>Course:</b> {dialogAssignment.courseName}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                    <b>Description:</b> {dialogAssignment.description || 'No description'}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <Box sx={{ mb: 1.5, display: 'flex', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                    <b>Weight:</b> {dialogAssignment.weight}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                    <b>Due Date:</b> {dialogAssignment.dueDate ? new Date(dialogAssignment.dueDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <Box sx={{ mb: 1.5, display: 'flex', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                    <b>Status:</b> {dialogAssignment.status}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                    <b>Grade:</b> {dialogAssignment.grade !== null ? dialogAssignment.grade : 'No Grade'}
                  </Typography>
                  {dialogAssignment.comments && (
                    <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                      <b>Comments:</b> {dialogAssignment.comments}
                    </Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => { setOpenAssignmentDialog(false); setDialogAssignment(null); }} sx={{ color: themeColors.primaryDark, fontWeight: 600 }}>Close</Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}
