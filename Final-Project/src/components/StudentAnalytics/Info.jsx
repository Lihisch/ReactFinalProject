import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, Grid, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem,
  Select, FormControl, InputLabel, Container, CircularProgress, Chip, Breadcrumbs, Link
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { BarChart, Bar, Cell } from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase-settings';
import StudentAnalytics from './StudentAnalytics';
import StatCard from './StatCard';
import ChartContainer from './ChartContainer';
import EmptyState from './EmptyState';
import CourseAnalytics from '../CourseAnalytics/CourseAnalytics';

const themeColors = {
  primary: '#bed630',
  primaryDark: '#a7bc2a',
  secondary: '#ffffff',
  background: '#ffffff',
  paper: '#ffffff',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  cardBackground: '#ffffff',
  border: '#e0e0e0',
  hover: '#f8f9fa',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
  chartBar: '#bdc3c7',
  chartHighlight: '#a7bc2a',
};

const Info = () => {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);

  const MAX_X_AXIS_LABEL_LINE_LENGTH = 18;

  useEffect(() => {
    setSelectedStudentId('');
    setSelectedCourseId('');
  }, []);

  useEffect(() => {
    const handleReset = () => {
      setSelectedStudentId('');
      setSelectedCourseId('');
    };
    window.addEventListener('popstate', handleReset);
    return () => window.removeEventListener('popstate', handleReset);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsSnap, assignmentsSnap, coursesSnap, submissionsSnap] = await Promise.all([
          getDocs(collection(firestore, 'students')),
          getDocs(collection(firestore, 'assignments')),
          getDocs(collection(firestore, 'courses')),
          getDocs(collection(firestore, 'submissions'))
        ]);
        const studentsData = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedStudents = studentsData.sort((a, b) => {
          const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '');
          return lastNameComparison || (a.firstName || '').localeCompare(b.firstName || '');
        });
        setStudents(sortedStudents);
        setAssignments(assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSubmissions(submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGradeStats = (submissionList) => {
    const validGrades = submissionList.map(s => s.grade).filter(g => typeof g === 'number');
    if (!validGrades.length) return { average: null, max: null, count: 0 };
    return {
      average: validGrades.reduce((a, b) => a + b, 0) / validGrades.length,
      max: Math.max(...validGrades),
      count: validGrades.length
    };
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setSelectedStudentId('');
    setSelectedCourseId('');
    window.location.href = '/';
  };

  const studentData = useMemo(() => {
    const student = students.find(s => s.studentId === selectedStudentId);
    if (!student) return null;
    const studentCourses = courses.filter(c => student.enrolledCourses?.includes(c.courseId));
    const studentAssignments = assignments.filter(a => student.enrolledCourses?.includes(a.courseId));
    const studentSubmissions = submissions.filter(s => s.studentId === selectedStudentId);
    return { student, studentCourses, studentAssignments, studentSubmissions };
  }, [students, courses, assignments, submissions, selectedStudentId]);

  const overallStats = useMemo(() => {
    if (!studentData) return null;
    const { studentAssignments, studentSubmissions } = studentData;
    const gradeStats = getGradeStats(studentSubmissions);
    return {
      avgGrade: gradeStats.average ? gradeStats.average.toFixed(1) : 'N/A',
      topGrade: gradeStats.max || 'N/A',
      submissionRate: studentAssignments.length ?
        Math.round((studentAssignments.filter(a => studentSubmissions.some(s => s.assignmentId === a.assignmentId)).length / studentAssignments.length) * 100) : 0,
      activeCourses: studentData.studentCourses.length
    };
  }, [studentData]);

  const courseData = useMemo(() => {
    if (!selectedCourseId || !studentData) return null;
    const courseAssignments = assignments.filter(a => a.courseId === selectedCourseId && studentData.student.enrolledCourses?.includes(a.courseId));
    const courseSubmissions = submissions.filter(s => s.courseId === selectedCourseId && s.studentId === selectedStudentId);
    const classSubmissions = submissions.filter(s => s.courseId === selectedCourseId);
    const studentGradeStats = getGradeStats(courseSubmissions);
    const classGradeStats = getGradeStats(classSubmissions);
    return {
      assignments: courseAssignments,
      submissions: courseSubmissions,
      classSubmissions,
      studentAvg: studentGradeStats.average ? studentGradeStats.average.toFixed(1) : 'N/A',
      classAvg: classGradeStats.average ? classGradeStats.average.toFixed(1) : 'N/A',
      topGrade: studentGradeStats.max || 'N/A',
      submissionRate: courseAssignments.length ?
        Math.round((courseAssignments.filter(a => courseSubmissions.some(s => s.assignmentId === a.assignmentId)).length / courseAssignments.length) * 100) : 0,
      hasData: classGradeStats.count > 0
    };
  }, [assignments, submissions, selectedCourseId, selectedStudentId, studentData]);

  const gradeDistribution = useMemo(() => {
    if (!courseData?.hasData) return [];
    const gradeBins = [60, 70, 80, 90, 101];
    const binLabels = ["60-69", "70-79", "80-89", "90-100"];
    const allGrades = courseData.classSubmissions.map(s => s.grade).filter(g => typeof g === 'number');
    const studentGrade = courseData.submissions.map(s => s.grade).find(g => typeof g === 'number');
    return binLabels.map((label, i) => {
      const min = gradeBins[i];
      const max = gradeBins[i + 1] - 1;
      const count = allGrades.filter(g => g >= min && g <= max).length;
      const isStudentBin = studentGrade !== undefined && studentGrade >= min && studentGrade <= max;
      return { label, count, isStudentBin };
    });
  }, [courseData]);

  const overallTrendData = useMemo(() => {
    if (!studentData) return [];
    const allAssignments = assignments
      .filter(a => studentData.student.enrolledCourses?.includes(a.courseId))
      .sort((a, b) => {
        const courseComparison = courses.findIndex(c => c.courseId === a.courseId) - courses.findIndex(c => c.courseId === b.courseId);
        return courseComparison || new Date(a.dueDate) - new Date(b.dueDate);
      });
    return allAssignments
      .map(a => {
        const submission = submissions.find(s => s.assignmentId === a.assignmentId && s.studentId === studentData.student.studentId && typeof s.grade === 'number');
        const courseName = courses.find(c => c.courseId === a.courseId)?.courseName || '';
        return {
          assignment: a.assignmentName,
          label: `${a.assignmentName} (${courseName})`,
          grade: submission?.grade || null
        };
      })
      .filter(d => d.grade !== null);
  }, [studentData, assignments, submissions, courses]);

  const StatCard = ({ title, value }) => (
    <Card sx={{
      p: 3,
      height: '100%',
      border: `1px solid ${themeColors.border}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      borderRadius: 2,
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
        borderColor: themeColors.primary,
        transform: 'translateY(-2px)'
      }
    }}>
      <Typography variant="body2" sx={{
        color: themeColors.textSecondary,
        fontWeight: 500,
        mb: 2,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontSize: '0.75rem'
      }}>
        {title}
      </Typography>
      <Typography variant="h3" sx={{
        fontWeight: 700,
        color: themeColors.textPrimary,
        lineHeight: 1
      }}>
        {value}
      </Typography>
    </Card>
  );

  const ChartContainer = ({ children, title, height = 300 }) => (
    <Paper sx={{
      p: 4,
      mb: 4,
      border: `1px solid ${themeColors.border}`,
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.3s ease',
      '&:hover': {
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }
    }}>
      {title && (
        <Typography variant="h6" sx={{
          fontWeight: 600,
          color: themeColors.textPrimary,
          mb: 3,
          pb: 2,
          borderBottom: `1px solid ${themeColors.border}`
        }}>
          {title}
        </Typography>
      )}
      <Box sx={{ height, width: '100%' }}>
        {children}
      </Box>
    </Paper>
  );

  const renderXAxisTick = ({ x, y, payload }) => {
    const label = payload.value;
    const words = label.split(' ');
    let lines = [];
    let current = '';
    words.forEach(word => {
      if ((current + ' ' + word).length > MAX_X_AXIS_LABEL_LINE_LENGTH) {
        lines.push(current);
        current = word;
      } else {
        current += (current ? ' ' : '') + word;
      }
    });
    if (current) lines.push(current);
    return (
      <g transform={`translate(${x}, ${y})`}>
        {lines.map((line, i) => (
          <text
            key={i}
            x={0}
            y={16 + i * 16}
            textAnchor="middle"
            fill={themeColors.textSecondary}
            fontSize={11}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  if (loading) {
    return (
      <Box sx={{
        backgroundColor: themeColors.background,
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: themeColors.primary, mb: 2 }} />
          <Typography variant="body1" sx={{ color: themeColors.textSecondary }}>
            Loading student data...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      key={Date.now()} // Force component remount when navigating back to INFO
      sx={{ 
        backgroundColor: themeColors.background, 
        minHeight: 'calc(100vh - 64px)', 
        py: 4
      }}
    >
      <Container maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1300, mb: 3, mt: 2 }}>
          <Breadcrumbs sx={{ mb: 1, color: themeColors.textSecondary, fontSize: '1rem' }}>
            <Link 
              underline="hover" 
              color="inherit" 
              onClick={handleHomeClick}
              sx={{ display: 'flex', alignItems: 'center', color: themeColors.textSecondary, cursor: 'pointer', '&:hover': { color: themeColors.primary } }}
            >
              <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Home
            </Link>
            <Typography color={themeColors.textPrimary} sx={{ display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
              Student Analytics
            </Typography>
          </Breadcrumbs>
          <Typography variant="h3" component="h1" sx={{
            fontWeight: 700,
            color: themeColors.primaryDark,
            letterSpacing: '.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 1,
            mb: 0.5
          }}>
            <AssessmentIcon fontSize="large" sx={{ color: themeColors.primary, mb: '-6px' }} />
            Student Analytics
          </Typography>
          <Typography variant="subtitle1" sx={{ color: themeColors.textSecondary, fontWeight: 400, fontSize: '1.08rem', mb: 1 }}>
            View and analyze student performance across all courses
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
          {/* Student Selection */}
          <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: themeColors.paper, borderRadius: 2, boxShadow: 'none' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: themeColors.textPrimary }}>
              Student Analytics
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Select Student</InputLabel>
              <Select
                value={selectedStudentId}
                label="Select Student"
                onChange={e => { setSelectedStudentId(e.target.value); setSelectedCourseId(''); }}
                sx={{ bgcolor: themeColors.paper }}
              >
                <MenuItem value="">
                  <em>Choose a student...</em>
                </MenuItem>
                {students.map(s => (
                  <MenuItem key={s.studentId} value={s.studentId}>
                    {s.lastName} - {s.firstName} ({s.studentId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {studentData && (
              <Box sx={{ mt: 4, pt: 4, borderTop: `1px solid ${themeColors.border}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {studentData.studentCourses.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: themeColors.textSecondary, fontWeight: 500 }}>
                        Enrolled in:
                      </Typography>
                      {studentData.studentCourses.map(course => (
                        <Chip 
                          key={course.courseId} 
                          label={course.courseName} 
                          sx={{ 
                            backgroundColor: themeColors.primary,
                            color: 'white',
                            fontWeight: 500,
                            '&:hover': {
                              backgroundColor: themeColors.primaryDark
                            }
                          }} 
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Paper>

          {!selectedStudentId ? (
            <EmptyState />
          ) : (
            <>
              {/* Overall Performance Stats */}
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: themeColors.textPrimary, 
                mb: 4
              }}>
                Overall Performance
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard title="Average Grade" value={overallStats?.avgGrade} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard title="Submission Rate" value={`${overallStats?.submissionRate}%`} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard title="Highest Grade" value={overallStats?.topGrade} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard title="Active Courses" value={overallStats?.activeCourses} />
                </Grid>
              </Grid>

              {/* Grade Progression Chart */}
              {overallTrendData.length > 0 ? (
                <ChartContainer title="Grade Progression" height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overallTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border} />
                      <XAxis 
                        dataKey="label" 
                        interval={0} 
                        height={100}
                        tick={renderXAxisTick}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: themeColors.textSecondary }} />
                      <RechartsTooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: `1px solid ${themeColors.border}`, 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="grade" 
                        stroke={themeColors.primary} 
                        strokeWidth={3} 
                        dot={{ r: 5, fill: themeColors.primary }} 
                        activeDot={{ r: 7, stroke: themeColors.primary, strokeWidth: 2, fill: 'white' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <Paper sx={{ 
                  textAlign: 'center', 
                  py: 6, 
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 2,
                  backgroundColor: themeColors.secondary,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <Typography variant="h6" sx={{ color: themeColors.textSecondary }}>
                    No grade data available for trend analysis
                  </Typography>
                </Paper>
              )}

              {/* Course Analysis Section */}
              {studentData?.studentCourses.length > 0 && (
                <>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    color: themeColors.textPrimary, 
                    mb: 4, 
                    mt: 8
                  }}>
                    Course Analysis
                  </Typography>
                  
                  <Paper elevation={0} sx={{ p: 2, mb: 5, backgroundColor: themeColors.paper, borderRadius: 2, boxShadow: 'none' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: themeColors.textPrimary }}>
                      Course Selection
                    </Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Course for Detailed Analysis</InputLabel>
                      <Select
                        value={selectedCourseId}
                        label="Select Course for Detailed Analysis"
                        onChange={e => setSelectedCourseId(e.target.value)}
                        sx={{ bgcolor: themeColors.paper }}
                      >
                        <MenuItem value="">
                          <em>Choose a course...</em>
                        </MenuItem>
                        {studentData.studentCourses.map(course => (
                          <MenuItem key={course.courseId} value={course.courseId}>
                            {course.courseName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>

                  {!selectedCourseId ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                      <Typography variant="h6" sx={{ color: themeColors.textSecondary }}>
                        Select a course above to view detailed performance metrics
                      </Typography>
                    </Box>
                  ) : !courseData?.hasData ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                      <Typography variant="h6" sx={{ color: themeColors.textSecondary }}>
                        No performance data available for this course
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {/* Course Stats */}
                      <Grid container spacing={3} sx={{ mb: 6 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <StatCard title="Your Average" value={courseData.studentAvg} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <StatCard title="Class Average" value={courseData.classAvg} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <StatCard title="Submission Rate" value={`${courseData.submissionRate}%`} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <StatCard title="Highest Grade" value={courseData.topGrade} />
                        </Grid>
                      </Grid>

                      {/* Grade Distribution Chart */}
                      <ChartContainer title="Grade Distribution" height={320}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={gradeDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border} />
                            <XAxis dataKey="label" tick={{ fontSize: 12, fill: themeColors.textSecondary }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: themeColors.textSecondary }} />
                            <RechartsTooltip
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: `1px solid ${themeColors.border}`, 
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                              }}
                            />
                            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                              {gradeDistribution.map((entry, idx) => (
                                <Cell
                                  key={`cell-${idx}`}
                                  fill={entry.isStudentBin ? themeColors.chartHighlight : themeColors.chartBar}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      {/* Assignment Details Table */}
                      <Paper sx={{ 
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}>
                        <Box sx={{ p: 4, borderBottom: `1px solid ${themeColors.border}` }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.textPrimary }}>
                            Assignment Details
                          </Typography>
                        </Box>
                        <TableContainer>
                          <Table>
                            <TableHead sx={{ backgroundColor: themeColors.secondary }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: themeColors.textPrimary }}>Assignment</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: themeColors.textPrimary }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: themeColors.textPrimary }}>Your Grade</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: themeColors.textPrimary }}>Class Average</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: themeColors.textPrimary }}>Due Date</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {courseData.assignments.map((assignment, idx) => {
                                const submission = courseData.submissions.find(s => s.assignmentId === assignment.assignmentId);
                                const classAvg = getGradeStats(
                                  courseData.classSubmissions.filter(s => s.assignmentId === assignment.assignmentId)
                                ).average;
                                
                                return (
                                  <TableRow
                                    key={idx}
                                    sx={{ 
                                      '&:hover': { backgroundColor: themeColors.hover },
                                      '&:nth-of-type(even)': { backgroundColor: `${themeColors.secondary}50` }
                                    }}
                                  >
                                    <TableCell sx={{ fontWeight: 500 }}>{assignment.assignmentName}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={submission ? "Submitted" : "Not Submitted"}
                                        size="small"
                                        sx={{
                                          backgroundColor: submission ? themeColors.success : themeColors.error,
                                          color: 'white',
                                          fontWeight: 500
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ 
                                      fontWeight: 600,
                                      color: submission?.grade ? themeColors.textPrimary : themeColors.textSecondary
                                    }}>
                                      {submission?.grade !== undefined ? submission.grade : '—'}
                                    </TableCell>
                                    <TableCell>{classAvg ? classAvg.toFixed(1) : '—'}</TableCell>
                                    <TableCell sx={{ color: themeColors.textSecondary }}>
                                      {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Info;



