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
  Link as MuiLink
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { listStudents } from '../firebase/students';
import { listCourses } from '../firebase/courses';

const themeColors = {
  primary: '#bed630',
  primaryDark: '#a7bc2a',
  secondary: '#e0e0e0',
  background: '#f5f5f5',
  paper: '#ffffff',
  textPrimary: 'rgba(0, 0, 0, 0.87)',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
};

const Courses = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchParams] = useSearchParams();

  // Set studentId from URL on mount
  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    if (urlStudentId) {
      setSelectedStudent(urlStudentId);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, coursesData] = await Promise.all([
          listStudents(),
          listCourses()
        ]);
        setStudents(studentsData);
        setCourses(coursesData);
      } catch (err) {
        // אפשר להוסיף טיפול בשגיאות
        setStudents([]);
        setCourses([]);
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
    } else {
      setFilteredCourses([]);
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
              Courses
            </Typography>
          </Breadcrumbs>
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
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: themeColors.primaryDark, mb: 0.5, letterSpacing: '.02em', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon fontSize="large" sx={{ color: themeColors.primaryDark, mb: '-4px' }} />
            My Courses
          </Typography>
          <Typography variant="subtitle1" sx={{ color: themeColors.textSecondary, mb: 3, fontWeight: 400, fontSize: '1.05rem' }}>
            View and manage the courses you are enrolled in
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
                    {student.firstName} {student.lastName} ({student.studentId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {Object.entries(coursesBySemester).map(([semester, semesterCourses]) => (
            <Box key={semester} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2" sx={{
                  color: themeColors.primaryDark,
                  fontWeight: 'bold',
                  letterSpacing: '.03em',
                  fontSize: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize', marginRight: 0 }}>{semester}</span>
                  <span style={{ fontWeight: 400 }}>Semester</span>
                </Typography>
                <Chip
                  label={`${semesterCourses.length} Courses`}
                  sx={{ ml: 2, backgroundColor: themeColors.primary, color: '#222', fontWeight: 600, letterSpacing: '.01em', boxShadow: '0 1px 4px #e0e0e0' }}
                  size="small"
                />
              </Box>
              <Divider sx={{ mb: 3, backgroundColor: themeColors.secondary }} />
              <Grid container spacing={3}>
                {semesterCourses.map((course) => (
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
                      }}
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
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon sx={{ mr: 1, color: themeColors.primary }} />
                            <Typography variant="body2" sx={{ color: '#444' }}>
                              Starting: {course.startingDate}
                            </Typography>
                          </Box>
                          <Typography variant="body2" paragraph sx={{ mt: 2, color: '#333', fontWeight: 400, lineHeight: 1.6 }}>
                            {course.description}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}

          {selectedStudent && filteredCourses.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No courses found for the selected student.
              </Typography>
            </Box>
          )}

          {!selectedStudent && (
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 2, backgroundColor: themeColors.paper }}>
              <Typography variant="h6" sx={{ color: themeColors.textSecondary }}>
                Please select a student to view their courses.
              </Typography>
            </Paper>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Courses;

