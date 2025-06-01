import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, Box, Divider, Paper, Chip, Breadcrumbs, Link as MuiLink, Button, Switch, FormControlLabel, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { listStudents } from '../firebase/students';
import { listCourses } from '../firebase/courses';
import { listAssignments } from '../firebase/assignments';
import { isPast, parseISO, isValid as isValidDate } from 'date-fns';
import { createSubmission, getSubmissionsByStudent } from '../firebase/submissions';

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

export default function Assignments() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [partnerIds, setPartnerIds] = useState([]);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    if (urlStudentId) {
      setSelectedStudent(urlStudentId);
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

  // 1. Define fetchSubmissions as a function
  const fetchSubmissions = async (studentId = selectedStudent) => {
    if (!studentId) {
      setSubmissions([]);
      return;
    }
    try {
      const subs = await getSubmissionsByStudent(studentId);
      setSubmissions(subs);
    } catch {
      setSubmissions([]);
    }
  };

  // 2. useEffect uses the function
  useEffect(() => {
    fetchSubmissions();
  }, [selectedStudent]);

  // Filter assignments for selected student
  const filteredAssignments = useMemo(() => {
    if (!selectedStudent) return [];
    const student = students.find(s => s.studentId === selectedStudent);
    if (!student) return [];
    const enrolledCourseIds = student.enrolledCourses || [];
    return assignments.filter(a => enrolledCourseIds.includes(a.courseId));
  }, [selectedStudent, students, assignments]);

  // Optionally filter out completed/past due
  const visibleAssignments = useMemo(() => {
    if (!showCompleted) {
      return filteredAssignments.filter(a => getAssignmentStatus(a.dueDate) === 'Active');
    }
    return filteredAssignments;
  }, [filteredAssignments, showCompleted]);

  // Group by semester > course > status
  const grouped = useMemo(() => {
    const bySemester = {};
    visibleAssignments.forEach(a => {
      const course = courses.find(c => c.courseId === a.courseId);
      const semester = course?.semester || 'Unknown';
      const courseName = course?.courseName || a.courseId;
      const status = getAssignmentStatus(a.dueDate);
      if (!bySemester[semester]) bySemester[semester] = {};
      if (!bySemester[semester][courseName]) bySemester[semester][courseName] = { course, assignments: { Active: [], 'Past Due': [], 'Unknown': [], 'Invalid Date': [] } };
      bySemester[semester][courseName].assignments[status] = bySemester[semester][courseName].assignments[status] || [];
      bySemester[semester][courseName].assignments[status].push(a);
    });
    return bySemester;
  }, [visibleAssignments, courses]);

  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  const handleOpenSubmitDialog = (assignment) => {
    if (checkIsSubmitted(assignment)) return;
    setSelectedAssignment(assignment);
    setPartnerIds([]);
    setSubmissionText('');
    setSubmissionFile(null);
    setSubmitError('');
    setOpenSubmitDialog(true);
  };
  const handleCloseSubmitDialog = () => {
    setOpenSubmitDialog(false);
    setSelectedAssignment(null);
    setPartnerIds([]);
    setSubmissionText('');
    setSubmissionFile(null);
    setSubmitError('');
  };
  const handlePartnerIdChange = (idx, value) => {
    setPartnerIds(prev => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
  };
  const handleFileChange = (e) => {
    setSubmissionFile(e.target.files[0] || null);
  };
  const handleSubmitAssignment = async () => {
    setSubmitError('');
    setSubmitLoading(true);
    try {
      // 1. Gather all students for validation
      const allStudents = await listStudents();
      const courseId = selectedAssignment.courseId;
      const minP = selectedAssignment.minParticipants || 1;
      const maxP = selectedAssignment.maxParticipants || 1;
      const isGroup = selectedAssignment.assignmentType === 'Group';
      // 2. Build participants list
      let participants = [selectedStudent, ...partnerIds.map(id => id && id.trim()).filter(Boolean)];
      // Remove duplicates
      participants = [...new Set(participants)];
      // 3. Validation
      // a. No empty IDs
      if (participants.some(id => !id)) {
        setSubmitError('All participant IDs must be filled.');
        setSubmitLoading(false);
        return;
      }
      // b. No self as partner
      if (partnerIds.includes(selectedStudent)) {
        setSubmitError('You cannot add yourself as a partner.');
        setSubmitLoading(false);
        return;
      }
      // c. No duplicate partners
      if (partnerIds.length !== new Set(partnerIds.filter(Boolean)).size) {
        setSubmitError('Duplicate partner IDs are not allowed.');
        setSubmitLoading(false);
        return;
      }
      // d. All partners must be enrolled in the course
      const enrolledStudents = allStudents.filter(s => Array.isArray(s.enrolledCourses) && s.enrolledCourses.includes(courseId));
      const enrolledIds = new Set(enrolledStudents.map(s => s.studentId));
      for (let id of participants) {
        if (!enrolledIds.has(id)) {
          setSubmitError(`ID ${id} is not enrolled in this course.`);
          setSubmitLoading(false);
          return;
        }
      }
      // e. Check min/max
      if (isGroup) {
        if (participants.length < minP) {
          setSubmitError(`At least ${minP} participants required (including you).`);
          setSubmitLoading(false);
          return;
        }
        if (participants.length > maxP) {
          setSubmitError(`No more than ${maxP} participants allowed.`);
          setSubmitLoading(false);
          return;
        }
      }
      // 4. Create submission for each participant
      const submissionData = {
        assignmentId: selectedAssignment.assignmentId,
        courseId: selectedAssignment.courseId,
        submissionText,
        fileName: submissionFile ? submissionFile.name : '',
        status: 'Pending',
        submitted: true,
        submissionDate: new Date(),
        group: isGroup,
        partnerIds: isGroup ? partnerIds.filter(Boolean) : [],
      };
      // 5. Check for duplicates
      for (let id of participants) {
        const alreadySubmitted = submissions.some(
          s =>
            String(s.assignmentId).trim() === String(selectedAssignment.assignmentId).trim() &&
            String(s.courseId).trim() === String(selectedAssignment.courseId).trim() &&
            (String(s.studentId).trim() === String(id).trim() ||
              (Array.isArray(s.partnerIds) && s.partnerIds.includes(id)))
        );
        if (alreadySubmitted) {
          setSubmitError(`Student ID ${id} has already submitted this assignment.`);
          setSubmitLoading(false);
          return;
        }
      }
      // 6. Create submission for each participant
      for (let id of participants) {
        await createSubmission({ ...submissionData, studentId: id });
      }
      setSubmitSuccess(true);
      setSuccessMessage('Submission successful!');
      setOpenSubmitDialog(false);
      await fetchSubmissions();
    } catch (err) {
      setSubmitError('Submission failed: ' + (err.message || err));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Replace the checkIsSubmitted function with a more robust version
  const checkIsSubmitted = (assignment) => {
    return submissions.some(
      s =>
        String(s.assignmentId).trim() === String(assignment.assignmentId).trim() &&
        String(s.courseId).trim() === String(assignment.courseId).trim() &&
        (String(s.studentId).trim() === String(selectedStudent).trim() ||
          (Array.isArray(s.partnerIds) && s.partnerIds.includes(selectedStudent)))
    );
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
              Assignments
            </Typography>
          </Breadcrumbs>
        </Box>
        <Box sx={{ width: '100%', maxWidth: 1300, display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: themeColors.primaryDark, mb: 0.2, letterSpacing: '.02em', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentTurnedInIcon fontSize="medium" sx={{ color: themeColors.primaryDark, mb: '-4px' }} />
              My Assignments
            </Typography>
            <Typography variant="subtitle1" sx={{ color: themeColors.textSecondary, fontWeight: 400, fontSize: '0.98rem' }}>
              View and track your assignments by course and semester
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={showCompleted} onChange={() => setShowCompleted(v => !v)} color="primary" />}
            label="Show completed/past due"
            sx={{ ml: 2, mr: 1, mt: 1 }}
          />
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
              Student Assignments
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
              <Typography variant="h6" color="textSecondary">Loading assignments...</Typography>
            </Box>
          ) : !selectedStudent ? (
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 2, backgroundColor: themeColors.paper }}>
              <Typography variant="h6" sx={{ color: themeColors.textSecondary }}>
                Please select a student to view their assignments.
              </Typography>
            </Paper>
          ) : Object.keys(grouped).length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No assignments found for the selected student.
              </Typography>
            </Box>
          ) : (
            Object.entries(grouped).map(([semester, coursesObj], idx) => (
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
                  {Object.entries(coursesObj).map(([courseName, { course, assignments }]) => (
                    <Box key={courseName} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: themeColors.primaryDark, fontWeight: 600, mb: 0.5, fontSize: '0.98rem', letterSpacing: '.01em' }}>
                        {courseName}
                      </Typography>
                      <Grid container spacing={1.5} alignItems="stretch">
                        {['Active', 'Past Due', 'Unknown', 'Invalid Date'].flatMap(status =>
                          assignments[status].map(assignment => {
                            const isActive = getAssignmentStatus(assignment.dueDate) === 'Active';
                            const isSubmitted = checkIsSubmitted(assignment);
                            const isGroup = assignment.assignmentType === 'Group';
                            // Card visual style for non-active
                            const faded = !isActive && !isSubmitted;
                            return (
                              <Grid item xs={12} sm={6} md={4} lg={3} sx={{ display: 'flex', flex: '1 1 0' }} key={assignment.assignmentId}>
                                <Card
                                  elevation={2}
                                  sx={{
                                    borderRadius: 1.5,
                                    backgroundColor: faded ? '#f7f7f7' : themeColors.paper,
                                    boxShadow: faded ? '0 1px 3px rgba(34,34,34,0.04)' : '0 1px 6px rgba(34, 34, 34, 0.06)',
                                    border: faded ? `1.5px dashed #ccc` : `1px solid ${themeColors.secondary}`,
                                    opacity: faded ? 0.7 : 1,
                                    transition: 'transform 0.18s, box-shadow 0.18s',
                                    m: 0,
                                    p: 0.5,
                                    '&:hover': faded ? {} : {
                                      transform: 'translateY(-2px) scale(1.01)',
                                      boxShadow: '0 3px 12px rgba(34, 34, 34, 0.11)',
                                      borderColor: themeColors.primaryDark,
                                    },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                  }}
                                >
                                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, flex: 1, minHeight: 220, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Chip
                                        label={getAssignmentStatus(assignment.dueDate)}
                                        color={
                                          getAssignmentStatus(assignment.dueDate) === 'Active'
                                            ? 'success'
                                            : getAssignmentStatus(assignment.dueDate) === 'Past Due'
                                            ? 'error'
                                            : 'default'
                                        }
                                        size="small"
                                        sx={{
                                          fontWeight: 500,
                                          fontSize: '0.87rem',
                                          backgroundColor:
                                            getAssignmentStatus(assignment.dueDate) === 'Active'
                                              ? '#eaf5d3'
                                              : getAssignmentStatus(assignment.dueDate) === 'Past Due'
                                              ? '#fbeaea'
                                              : '#f3f3f3',
                                          color:
                                            getAssignmentStatus(assignment.dueDate) === 'Active'
                                              ? themeColors.primaryDark
                                              : getAssignmentStatus(assignment.dueDate) === 'Past Due'
                                              ? '#b71c1c'
                                              : '#888',
                                          px: 1,
                                          py: 0.1,
                                          borderRadius: 1.5,
                                          boxShadow: 'none',
                                          border: 'none',
                                        }}
                                      />
                                    </Box>
                                    <Typography variant="subtitle2" component="h3" gutterBottom sx={{
                                      color: themeColors.primaryDark,
                                      fontWeight: 600,
                                      fontSize: '0.98rem',
                                      mb: 0.7,
                                      letterSpacing: '.01em',
                                      textShadow: '0 1px 0 #e0e0e0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                    }}>
                                      <AssignmentTurnedInIcon sx={{ mr: 0.5, color: themeColors.primaryDark, verticalAlign: 'middle', fontSize: '1.1rem' }} fontSize="small" />
                                      {assignment.assignmentName}
                                    </Typography>
                                    <Box sx={{ mt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                        <PersonIcon sx={{ mr: 0.5, color: themeColors.primary, fontSize: '1.1rem' }} />
                                        <Typography variant="body2" sx={{ color: '#222', fontWeight: 500, fontSize: '0.92rem' }}>
                                          {course?.professorsName || 'N/A'}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                        <AccessTimeIcon sx={{ mr: 0.5, color: themeColors.primary, fontSize: '1.1rem' }} />
                                        <Typography variant="body2" sx={{ color: '#444', fontSize: '0.92rem' }}>
                                          Due: {formatDate(assignment.dueDate)}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                        <StarIcon sx={{ mr: 0.5, color: themeColors.primary, fontSize: '1.1rem' }} />
                                        <Typography variant="body2" sx={{ color: '#444', fontSize: '0.92rem' }}>
                                          Weight: {assignment.weight}%
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" paragraph sx={{ mt: 0.5, color: '#333', fontWeight: 400, lineHeight: 1.4, fontSize: '0.93rem', mb: 0, flex: 1 }}>
                                        {assignment.description}
                                      </Typography>
                                    </Box>
                                    {isActive && !isSubmitted ? (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        sx={{
                                          mt: 1,
                                          alignSelf: 'flex-end',
                                          fontWeight: 600,
                                          borderRadius: 2,
                                          textTransform: 'none',
                                          backgroundColor: themeColors.primaryDark,
                                          color: '#fff',
                                          minWidth: 100,
                                          fontSize: '0.91rem',
                                          py: 0.3,
                                          boxShadow: 'none',
                                          '&:hover': { backgroundColor: themeColors.primary },
                                        }}
                                        onClick={() => handleOpenSubmitDialog(assignment)}
                                      >
                                        Submit Assignment
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        disabled
                                        sx={{
                                          mt: 1,
                                          alignSelf: 'flex-end',
                                          fontWeight: 600,
                                          borderRadius: 2,
                                          textTransform: 'none',
                                          backgroundColor: '#e0e0e0',
                                          color: '#888',
                                          minWidth: 100,
                                          fontSize: '0.91rem',
                                          py: 0.3,
                                          boxShadow: 'none',
                                        }}
                                      >
                                        {isSubmitted ? 'Already Submitted' : 'Not Available'}
                                      </Button>
                                    )}
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          })
                        )}
                      </Grid>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Paper>
      </Container>
      <Dialog open={openSubmitDialog} onClose={handleCloseSubmitDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', color: themeColors.primaryDark, pb: 0 }}>
          Submit Assignment
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, background: '#f8faf5', borderRadius: 2, boxShadow: '0 2px 12px #e0e0e0', mt: 1 }}>
            <Typography variant="h6" sx={{ mb: 1.5, color: themeColors.primaryDark, fontWeight: 600, fontSize: '1.08rem' }}>
              {selectedAssignment?.assignmentName}
            </Typography>
            {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
            {selectedAssignment?.assignmentType === 'Group' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: themeColors.primaryDark }}>
                  Group Submission
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: themeColors.textSecondary }}>
                  Enter your partners' IDs (required: {selectedAssignment?.minParticipants || 2}, max: {selectedAssignment?.maxParticipants || 2})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[...Array((selectedAssignment?.maxParticipants || 2) - 1)].map((_, idx) => (
                    <TextField
                      key={idx}
                      label={`Partner ID ${idx + 1}`}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 1, minWidth: 140 }}
                      value={partnerIds[idx] || ''}
                      onChange={e => handlePartnerIdChange(idx, e.target.value)}
                      required={idx < ((selectedAssignment?.minParticipants || 2) - 1)}
                      disabled={submitLoading}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: themeColors.primaryDark }}>
              Submission Text
            </Typography>
            <TextField
              label="Write your answer or comments here"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              sx={{ mb: 2, background: '#fff' }}
              value={submissionText}
              onChange={e => setSubmissionText(e.target.value)}
              disabled={submitLoading}
            />
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                sx={{
                  backgroundColor: '#fff',
                  color: themeColors.primaryDark,
                  borderColor: themeColors.primaryDark,
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: themeColors.primary, color: '#fff', borderColor: themeColors.primaryDark },
                }}
                disabled={submitLoading}
              >
                Upload File
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
              {submissionFile && (
                <Typography variant="body2" sx={{ ml: 2, display: 'inline', color: themeColors.primaryDark }}>
                  {submissionFile.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseSubmitDialog} sx={{ color: themeColors.primaryDark, fontWeight: 600 }} disabled={submitLoading}>Cancel</Button>
          <Button variant="contained" sx={{ backgroundColor: themeColors.primaryDark, color: '#fff', fontWeight: 600, borderRadius: 2, textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: themeColors.primary } }} onClick={handleSubmitAssignment} disabled={submitLoading}>
            {submitLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={submitSuccess} autoHideDuration={2000} onClose={() => setSubmitSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSubmitSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {successMessage || 'Submission successful!'}
        </Alert>
      </Snackbar>
    </Box>
  );
}
