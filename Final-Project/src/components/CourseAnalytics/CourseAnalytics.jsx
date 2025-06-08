import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, Grid, Table, // Removed CardContent as it's not directly used, TextField removed as it's replaced by Select for filters
  Dialog, DialogTitle, DialogContent, DialogActions, Button, // For displaying students from graph click
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem,
  Select, FormControl, InputLabel, Container, Breadcrumbs, Link as MuiLink, CircularProgress, Divider, Tooltip, IconButton
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart'; // Icon for the page
import AssessmentIcon from '@mui/icons-material/Assessment'; // Icon for cards
import GroupIcon from '@mui/icons-material/Group'; // Icon for cards
import FactCheckIcon from '@mui/icons-material/FactCheck'; // Icon for Total Submissions
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase-settings';
import StatCards from "./StatCards";
import GradeDistribution from "./GradeDistribution";
import AssignmentBreakdown from "./AssignmentBreakdown";
import StudentGradeTable from "./StudentGradeTable";
import StudentsDialog from "./StudentsDialog";

const themeColors = {
  primary: '#bed630',
  primaryDark: '#a7bc2a',
  secondary: '#e0e0e0',
  background: '#f5f5f5',
  paper: '#ffffff',
  textPrimary: 'rgba(0, 0, 0, 0.87)',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
};

const CourseAnalytics = () => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const [courseStats, setCourseStats] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  // State for filters
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [assignmentNameFilterTable, setAssignmentNameFilterTable] = useState('');
  const [assignmentNameFilterBreakdown, setAssignmentNameFilterBreakdown] = useState('');
  // State for displaying students from graph click
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [studentsForDialog, setStudentsForDialog] = useState([]);

  // New state for insights
  const [insights, setInsights] = useState({
    topPerformingCourse: null,
    topPerformingStudent: null,
    mostFailedCourse: null,
    mostLateSubmissions: null
  });

  // New state for additional stats
  const [additionalStats, setAdditionalStats] = useState({
    passRate: 0,
    averageAttendance: 0,
    topGrade: 0,
    improvementRate: 0
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Sort courses alphabetically by courseName
  const sortedCourses = React.useMemo(() => {
    return [...courses].sort((a, b) => (a.courseName || '').localeCompare(b.courseName || ''));
  }, [courses]);

  // Refresh state when navigating to this page again
  useEffect(() => {
    // Listen for navigation to this route
    if (location.pathname === '/course-analytics') {
      setSelectedCourseId('');
      setStudentNameFilter('');
      setAssignmentNameFilterTable('');
      setAssignmentNameFilterBreakdown('');
      setShowStudentsDialog(false);
      setDialogTitle('');
      setStudentsForDialog([]);
    }
    // Optionally, scroll to top
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const coursesSnap = await getDocs(collection(firestore, 'courses'));
        setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const assignmentsSnap = await getDocs(collection(firestore, 'assignments'));
        setAssignments(assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const studentsSnap = await getDocs(collection(firestore, 'students'));
        setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const submissionsSnap = await getDocs(collection(firestore, 'submissions'));
        setSubmissions(submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching data for InfoDashboard:", error);
        // Handle error state if needed
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setCourseStats({}); // Clear stats if no course is selected
      return;
    }

    const relevantAssignmentsForCourse = assignments.filter(a => a.courseId === selectedCourseId);
    const relevantAssignmentIds = relevantAssignmentsForCourse.map(a => a.assignmentId);
    const relevantSubmissionsForCourse = submissions.filter(s => s.courseId === selectedCourseId && relevantAssignmentIds.includes(s.assignmentId));

    // Overall course stats
    const overallGrades = relevantSubmissionsForCourse.map(s => s.grade).filter(g => typeof g === 'number');
    const overallAvg = overallGrades.length > 0 ? overallGrades.reduce((a, b) => a + b, 0) / overallGrades.length : 0;

    const enrolledStudentsCount = students.filter(student =>
      Array.isArray(student.enrolledCourses) && student.enrolledCourses.includes(selectedCourseId)
    ).length;

    const overallGradeBuckets = [
      { label: '85-100', min: 85, max: 100, count: 0 },
      { label: '75-84', min: 75, max: 84, count: 0 },
      { label: '65-74', min: 65, max: 74, count: 0 },
      { label: '55-64', min: 55, max: 64, count: 0 },
      { label: '0-54', min: 0, max: 54, count: 0 }
    ];
    overallGrades.forEach(g => {
      const bucket = overallGradeBuckets.find(b => g >= b.min && g <= b.max);
      if (bucket) bucket.count++;
    });

    // Per-assignment stats
    const assignmentDetails = relevantAssignmentsForCourse.map(assignment => {
        const assignmentSubmissions = relevantSubmissionsForCourse.filter(s => s.assignmentId === assignment.assignmentId);
        const assignmentGrades = assignmentSubmissions.map(s => s.grade).filter(g => typeof g === 'number');
        const assignmentAvg = assignmentGrades.length > 0 ? assignmentGrades.reduce((a,b) => a+b, 0) / assignmentGrades.length : 0;

        const assignmentGradeBuckets = [
            { label: '85-100', min: 85, max: 100, count: 0 },
            { label: '75-84', min: 75, max: 84, count: 0 },
            { label: '65-74', min: 65, max: 74, count: 0 },
            { label: '55-64', min: 55, max: 64, count: 0 },
            { label: '0-54', min: 0, max: 54, count: 0 }
        ];
        assignmentGrades.forEach(g => {
            const bucket = assignmentGradeBuckets.find(b => g >= b.min && g <= b.max);
            if (bucket) bucket.count++;
        });

        return {
            id: assignment.assignmentId,
            name: assignment.assignmentName,
            weight: assignment.weight,
            distribution: assignmentGradeBuckets,
            averageGrade: assignmentAvg.toFixed(1)
        };
    });

    setCourseStats({
      average: overallAvg.toFixed(1),
      distribution: overallGradeBuckets,
      submissions: relevantSubmissionsForCourse,
      enrolledStudentsCount: enrolledStudentsCount,
      assignmentDetails: assignmentDetails
    });
  }, [selectedCourseId, submissions, assignments, students, courses]);

  // New useEffect for calculating insights
  useEffect(() => {
    if (!courses.length || !students.length || !assignments.length || !submissions.length) return;

    // Calculate top performing course
    const courseAverages = courses.map(course => {
      const courseSubmissions = submissions.filter(s => s.courseId === course.courseId);
      const grades = courseSubmissions.map(s => s.grade).filter(g => typeof g === 'number');
      const average = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
      return { course, average };
    });
    const topCourse = courseAverages.sort((a, b) => b.average - a.average)[0];

    // Calculate top performing student
    const studentAverages = students.map(student => {
      const studentSubmissions = submissions.filter(s => s.studentId === student.studentId);
      const grades = studentSubmissions.map(s => s.grade).filter(g => typeof g === 'number');
      const average = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
      return { student, average };
    });
    const topStudent = studentAverages.sort((a, b) => b.average - a.average)[0];

    // Calculate most failed course
    const failedCourses = courses.map(course => {
      const courseSubmissions = submissions.filter(s => s.courseId === course.courseId);
      const failedCount = courseSubmissions.filter(s => s.grade < 55).length;
      return { course, failedCount };
    });
    const mostFailed = failedCourses.sort((a, b) => b.failedCount - a.failedCount)[0];

    // Calculate most late submissions
    const lateSubmissions = assignments.map(assignment => {
      const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.assignmentId);
      const lateCount = assignmentSubmissions.filter(s => {
        const submissionDate = s.submissionDate?.toDate?.() || new Date(s.submissionDate);
        const dueDate = new Date(assignment.dueDate);
        return submissionDate > dueDate;
      }).length;
      return { assignment, lateCount };
    });
    const mostLate = lateSubmissions.sort((a, b) => b.lateCount - a.lateCount)[0];

    setInsights({
      topPerformingCourse: topCourse,
      topPerformingStudent: topStudent,
      mostFailedCourse: mostFailed,
      mostLateSubmissions: mostLate
    });
  }, [courses, students, assignments, submissions]);

  // New useEffect for calculating additional stats
  useEffect(() => {
    if (!submissions.length) return;

    // Calculate pass rate
    const passedSubmissions = submissions.filter(s => s.grade >= 55).length;
    const passRate = (passedSubmissions / submissions.length) * 100;

    // Calculate top grade
    const topGrade = Math.max(...submissions.map(s => s.grade || 0));

    // Calculate improvement rate (comparing first and last submissions)
    const studentFirstLastGrades = {};
    submissions.forEach(s => {
      if (!studentFirstLastGrades[s.studentId]) {
        studentFirstLastGrades[s.studentId] = { first: s.grade, last: s.grade };
      } else {
        studentFirstLastGrades[s.studentId].last = s.grade;
      }
    });

    const improvements = Object.values(studentFirstLastGrades)
      .filter(grades => grades.first && grades.last)
      .map(grades => grades.last - grades.first);
    
    const improvementRate = improvements.length ? 
      (improvements.reduce((a, b) => a + b, 0) / improvements.length) : 0;

    setAdditionalStats({
      passRate,
      topGrade,
      improvementRate
    });
  }, [submissions]);

  const getStudentName = id => {
    const student = students.find(s => s.studentId === id); // Make sure studentId is the correct field name
    if (student) {
      return { fullName: `${student.firstName} ${student.lastName}`, id: student.studentId };
    }
    return { fullName: id, id: 'N/A' }; // Fallback if student not found
  };

  const getAssignmentName = id => {
    const a = assignments.find(a => a.assignmentId === id); // Make sure assignmentId is the correct field name
    return a ? a.assignmentName : id;
  };

  const formatSubmissionDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    if (dateValue.seconds && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString();
    }
    try {
      return new Date(dateValue).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const maxDistributionCount = useMemo(() => {
    if (!courseStats.distribution || courseStats.distribution.length === 0) return 1; // Avoid division by zero
    return Math.max(...courseStats.distribution.map(b => b.count), 0);
  }, [courseStats.distribution]);

  const filteredSubmissionsForTable = useMemo(() => {
    if (!courseStats.submissions) return [];
    return courseStats.submissions.filter(submission => {
      const studentDetails = getStudentName(submission.studentId);
      const studentName = studentDetails.fullName.toLowerCase();
      const assignmentName = getAssignmentName(submission.assignmentId).toLowerCase(); // Assuming getAssignmentName returns a string
      const matchesStudent = studentNameFilter ? studentName.includes(studentNameFilter.toLowerCase()) : true;
      const matchesAssignment = assignmentNameFilterTable ? assignmentName.includes(assignmentNameFilterTable.toLowerCase()) : true;
      return matchesStudent && matchesAssignment;
    });
  }, [courseStats.submissions, studentNameFilter, assignmentNameFilterTable, students, assignments]); // Added students and assignments due to getStudentName/getAssignmentName

  const filteredAssignmentDetailsForBreakdown = useMemo(() => {
    if (!courseStats.assignmentDetails) return [];
    return courseStats.assignmentDetails.filter(detail => {
      const assignmentName = detail.name.toLowerCase();
      return assignmentNameFilterBreakdown ? assignmentName.includes(assignmentNameFilterBreakdown.toLowerCase()) : true;
    });
  }, [courseStats.assignmentDetails, assignmentNameFilterBreakdown]);

  useEffect(() => { // Clear filters when course changes
    setStudentNameFilter('');
    setAssignmentNameFilterTable('');
    setAssignmentNameFilterBreakdown('');
  }, [selectedCourseId]);

  const handleGraphBarClick = (bucket, assignmentId = null) => {
    let relevantSubmissions;
    let title;

    if (assignmentId) {
      // Clicked on an assignment-specific graph bar
      const assignment = courseStats.assignmentDetails?.find(a => a.id === assignmentId);
      title = `Students in range ${bucket.label} for ${assignment?.name || 'Assignment'}`;
      relevantSubmissions = courseStats.submissions?.filter(
        s => s.assignmentId === assignmentId && s.grade >= bucket.min && s.grade <= bucket.max
      );
    } else {
      // Clicked on the overall course graph bar
      title = `Students in range ${bucket.label} (Overall)`;
      relevantSubmissions = courseStats.submissions?.filter(
        s => s.grade >= bucket.min && s.grade <= bucket.max
      );
    }

    const studentsData = relevantSubmissions?.map(s => ({
      student: getStudentName(s.studentId),
      assignmentName: getAssignmentName(s.assignmentId), // Always get assignment name
      grade: s.grade
    })) || [];

    setDialogTitle(title);
    setStudentsForDialog(studentsData);
    setShowStudentsDialog(true);
  };

  const uniqueStudentNamesForFilter = useMemo(() => {
    if (!courseStats.submissions) return [];
    const names = courseStats.submissions.map(s => {
      const studentDetails = getStudentName(s.studentId);
      return studentDetails.fullName;
    });
    return [...new Set(names)].sort(); // Unique sorted names
  }, [courseStats.submissions, students]);

  const uniqueAssignmentNamesForFilter = useMemo(() => {
    // Ensure that the filter options are based on all assignments available for the selected course,
    // not just those that might already have details calculated in courseStats.
    // This makes the filter options available immediately upon course selection.
    if (!selectedCourseId || !assignments.length) return [];
    const names = assignments.filter(a => a.courseId === selectedCourseId).map(a => a.assignmentName);
    return [...new Set(names)].sort();
  }, [assignments, selectedCourseId]);

  return (
    <Container>
      {loadingData && courses.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <CircularProgress sx={{ color: themeColors.primary, mb: 2 }} />
          <Typography color="textSecondary">Loading data...</Typography>
        </Box>
      ) : courses.length === 0 ? (
        <Typography>No data available yet</Typography>
      ) : (
        <Box sx={{ backgroundColor: themeColors.background, minHeight: 'calc(100vh - 64px)', py: 4 }} dir="ltr">
          <Container maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 1300, mb: 2, alignSelf: 'flex-start' }}>
              <Breadcrumbs aria-label="breadcrumb">
                <MuiLink component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/">
                  <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                  Home
                </MuiLink>
                <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                  Grade Analysis
                </Typography>
              </Breadcrumbs>
            </Box>

            <Box sx={{ width: '100%', maxWidth: 1300, mb: 1.5 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: themeColors.primaryDark, mb: 0.2, letterSpacing: '.02em', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChartIcon fontSize="medium" sx={{ color: themeColors.primaryDark, mb: '-4px' }} />
                Course Grade Analysis
              </Typography>
              <Typography variant="subtitle1" sx={{ color: themeColors.textSecondary, fontWeight: 400, fontSize: '0.98rem' }}>
                Select a course to view statistics and grade distribution
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
              <FormControl fullWidth size="small" sx={{ mb: 4 }}>
                <InputLabel id="course-select-label">Select Course</InputLabel>
                <Select
                  labelId="course-select-label"
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  label="Select Course"
                  disabled={loadingData}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {sortedCourses.map(c => (
                    <MenuItem key={c.id || c.courseId} value={c.courseId}>
                      {c.courseName} ({c.courseId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {loadingData && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
                  <CircularProgress sx={{color: themeColors.primary}} />
                  <Typography sx={{ml: 2, color: themeColors.textSecondary}}>Loading data...</Typography>
                </Box>
              )}

              {!loadingData && !selectedCourseId && (
                <Typography sx={{ textAlign: 'center', color: themeColors.textSecondary, py: 3 }}>
                  Please select a course to see the analysis.
                </Typography>
              )}

              {!loadingData && selectedCourseId && (
                (!courseStats.submissions || courseStats.submissions.length === 0 || !courseStats.distribution || courseStats.distribution.every(b => b.count === 0)) ? (
                  <Typography sx={{ textAlign: 'center', color: themeColors.textSecondary, py: 3 }}>
                    No grade data available for this course.
                  </Typography>
                ) : (
                  <>
                    <StatCards stats={courseStats} additionalStats={additionalStats} themeColors={themeColors} />
                    <GradeDistribution
                      distribution={courseStats.distribution}
                      maxDistributionCount={maxDistributionCount}
                      themeColors={themeColors}
                      handleGraphBarClick={handleGraphBarClick}
                    />
                    <AssignmentBreakdown
                      assignmentDetails={courseStats.assignmentDetails}
                      assignmentNameFilterBreakdown={assignmentNameFilterBreakdown}
                      setAssignmentNameFilterBreakdown={setAssignmentNameFilterBreakdown}
                      uniqueAssignmentNamesForFilter={uniqueAssignmentNamesForFilter}
                      themeColors={themeColors}
                      handleGraphBarClick={handleGraphBarClick}
                    />
                    {courseStats.submissions && courseStats.submissions.length > 0 && (
                      <StudentGradeTable
                        filteredSubmissionsForTable={filteredSubmissionsForTable}
                        getStudentName={getStudentName}
                        getAssignmentName={getAssignmentName}
                        selectedCourseId={selectedCourseId}
                        studentNameFilter={studentNameFilter}
                        setStudentNameFilter={setStudentNameFilter}
                        assignmentNameFilterTable={assignmentNameFilterTable}
                        setAssignmentNameFilterTable={setAssignmentNameFilterTable}
                        uniqueStudentNamesForFilter={uniqueStudentNamesForFilter}
                        uniqueAssignmentNamesForFilter={uniqueAssignmentNamesForFilter}
                        themeColors={themeColors}
                        formatSubmissionDate={formatSubmissionDate}
                      />
                    )}
                    <StudentsDialog
                      open={showStudentsDialog}
                      onClose={() => setShowStudentsDialog(false)}
                      dialogTitle={dialogTitle}
                      studentsForDialog={studentsForDialog}
                      selectedCourseId={selectedCourseId}
                      themeColors={themeColors}
                    />
                  </>
                )
              )}
            </Paper>
          </Container>
        </Box>
      )}
    </Container>
  );
};

export default CourseAnalytics;
