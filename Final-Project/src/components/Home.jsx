import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Typography, CircularProgress, Alert, Box, Paper,
  Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText,
  Chip, Card, CardContent, CardHeader, Button, IconButton as MuiIconButton,
  Switch, FormControlLabel
} from '@mui/material';

import { listStudents } from '../firebase/students';
import { listCourses } from '../firebase/courses';
import { listAssignments } from '../firebase/assignments';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { firestore } from '../firebase/firebase-settings';

import EventIcon from '@mui/icons-material/Event';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GradeIcon from '@mui/icons-material/Grade';
import BarChartIcon from '@mui/icons-material/BarChart';
import ClassIcon from '@mui/icons-material/Class';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  format as formatDateFns,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isSameDay,
  parseISO as dateFnsParseISO,
  isPast,
  isWithinInterval
} from 'date-fns';

// Helper function to parse various date inputs safely
const parseDateSafe = (dateInput) => {
  if (!dateInput) return null;
  try {
    let date;
    if (typeof dateInput === 'string' && (dateInput.includes('T') || dateInput.match(/^\d{4}-\d{2}-\d{2}$/))) {
      date = dateFnsParseISO(dateInput);
    } else if (dateInput && typeof dateInput.seconds === 'number' && typeof dateInput.nanoseconds === 'number') {
      // Firebase Timestamp
      date = new Date(dateInput.seconds * 1000 + dateInput.nanoseconds / 1000000);
    } else {
      date = new Date(dateInput); // Fallback for other types or already Date objects
    }
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.error("Error parsing date:", dateInput, e);
    return null;
  }
};

const formatDateHelper = (dateInput) => {
  const date = parseDateSafe(dateInput);
  if (!date) return dateInput === undefined || dateInput === null ? 'N/A' : 'Invalid Date';
  try {
    return formatDateFns(date, 'MMM dd, yyyy');
  } catch (e) {
    console.error("Error formatting date in formatDateHelper:", dateInput, e);
    return 'Invalid Date';
  }
};

const isDatePastDue = (dueDateInput) => {
  const dueDate = parseDateSafe(dueDateInput);
  if (!dueDate) return false; // If date is invalid or null, it's not past due
  return isPast(dueDate);
};

const themeColors = {
  primary: '#bed630',
  primaryDark: '#a7bc2a',
  secondary: '#e0e0e0',
  background: '#f5f5f5',
  paper: '#ffffff',
  textPrimary: 'rgba(0, 0, 0, 0.87)',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
};

const StudentSelector = ({ students, selectedStudentId, onSelectStudent, loading }) => (
  <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: themeColors.paper, borderRadius: 2 }}>
    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: themeColors.textPrimary }}>
      Student Dashboard
    </Typography>
    <FormControl fullWidth size="small" disabled={loading || !students.length}>
      <InputLabel id="student-select-label">Select Student</InputLabel>
      <Select
        labelId="student-select-label"
        value={selectedStudentId}
        label="Select Student"
        onChange={(e) => onSelectStudent(e.target.value)}
      >
        <MenuItem value="">
          <em>{loading ? 'Loading students...' : students.length === 0 ? 'No students found' : '-- Select a Student --'}</em>
        </MenuItem>
        {students.map((student) => (
          <MenuItem key={student.studentId || student.id} value={student.studentId}>
            {student.firstName} {student.lastName} ({student.studentId})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Paper>
);

const UpcomingEventsMiniCalendar = ({ openAssignments, enrolledCourses, loading }) => {
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [detailedEventsForDate, setDetailedEventsForDate] = useState([]);

  const eventsByDateStr = useMemo(() => {
    const map = new Map();
    if (Array.isArray(openAssignments)) {
      openAssignments.forEach(event => {
        if (!event || !event.dueDate) return;
        try {
          const eventDate = parseDateSafe(event.dueDate);
          if (!eventDate) {
            console.warn("Calendar: Skipping assignment due to invalid dueDate:", event);
            return;
          }
          const eventDateOnly = formatDateFns(eventDate, 'yyyy-MM-dd');
          if (!map.has(eventDateOnly)) map.set(eventDateOnly, []);
          map.get(eventDateOnly).push({ ...event, type: 'Assignment', title: event.assignmentName, date: eventDate });
        } catch (e) { console.error("Error processing assignment event for calendar:", event, e); }
      });
    }

    if (Array.isArray(enrolledCourses)) {
      const monthStart = startOfMonth(currentDisplayMonth);
      const monthEnd = endOfMonth(currentDisplayMonth);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

      enrolledCourses.forEach(course => {
        if (!course || !course.dayOfWeek || !course.startingDate || !course.endDate) {
          console.warn("Calendar: Skipping course due to missing fields:", course);
          return;
        }

        try {
          const courseStartDate = parseDateSafe(course.startingDate);
          const courseEndDate = parseDateSafe(course.endDate);

          if (!courseStartDate || !courseEndDate) {
            console.warn("Calendar: Invalid start/end date for course:", course);
            return;
          }

          daysInMonth.forEach(dayInMonth => {
            if (isWithinInterval(dayInMonth, { start: courseStartDate, end: courseEndDate }) &&
              formatDateFns(dayInMonth, 'EEEE') === course.dayOfWeek) {
              const eventDateOnly = formatDateFns(dayInMonth, 'yyyy-MM-dd');
              if (!map.has(eventDateOnly)) map.set(eventDateOnly, []);
              map.get(eventDateOnly).push({
                id: course.courseId ? `class-${course.courseId}-${eventDateOnly}` : `class-unknown-${eventDateOnly}`,
                title: course.courseName,
                date: dayInMonth,
                time: `${course.startTime || ''} - ${course.endTime || ''}`,
                type: 'Class',
                description: `Lecturer: ${course.professorsName || 'N/A'}`
              });
            }
          });
        } catch (e) { console.error("Error processing enrolled course for calendar:", course, e); }
      });
    }
    return map;
  }, [openAssignments, enrolledCourses, currentDisplayMonth]);

  const monthGridDays = useMemo(() => {
    const monthStart = startOfMonth(currentDisplayMonth);
    const monthEnd = endOfMonth(currentDisplayMonth);
    const daysArray = [];
    for (let i = 0; i < getDay(monthStart); i++) {
      daysArray.push(null);
    }
    eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(day => {
      daysArray.push(day);
    });
    return daysArray;
  }, [currentDisplayMonth]);

  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDay(day);
    const dayOnlyStr = formatDateFns(day, 'yyyy-MM-dd');
    setDetailedEventsForDate(eventsByDateStr.get(dayOnlyStr) || []);
  };

  const changeMonth = (amount) => {
    setCurrentDisplayMonth(prev => amount > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
    setSelectedDay(null);
    setDetailedEventsForDate([]);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <DashboardCard title="Upcoming Events & Classes" icon={<EventIcon />} loading={loading}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
        <MuiIconButton onClick={() => changeMonth(-1)} size="small" aria-label="Previous month"><ChevronLeftIcon /></MuiIconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>{formatDateFns(currentDisplayMonth, 'MMMM yyyy')}</Typography>
        <MuiIconButton onClick={() => changeMonth(1)} size="small" aria-label="Next month"><ChevronRightIcon /></MuiIconButton>
      </Box>
      <Grid container columns={7} sx={{ textAlign: 'center', p: 0.5 }}>
        {weekDays.map(wd => <Grid item xs={1} key={wd}><Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{wd}</Typography></Grid>)}
      </Grid>
      <Grid container columns={7} spacing={0.1} sx={{ p: 0.1, overflowX: 'hidden', minWidth: 0 }}>
        {monthGridDays.map((day, index) => {
          const dayOnlyStr = day ? formatDateFns(day, 'yyyy-MM-dd') : null;
          const hasEvent = day ? eventsByDateStr.has(dayOnlyStr) : false;
          const isSelected = day && selectedDay && isSameDay(day, selectedDay);
          const isToday = day && isSameDay(day, new Date());

          return (
            <Grid item xs={1} key={day ? formatDateFns(day, 'yyyy-MM-dd') : `empty-${index}`} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {day ? (
                <Button
                  variant={hasEvent ? "contained" : "outlined"}
                  size="small"
                  onClick={() => handleDayClick(day)}
                  sx={{
                    width: '28px', height: '28px', minWidth: '28px', p: 0,
                    borderRadius: '50%',
                    backgroundColor: hasEvent ? (isSelected ? themeColors.primaryDark : themeColors.primary) : (isToday ? themeColors.secondary : themeColors.paper),
                    color: hasEvent ? themeColors.paper : (isToday ? themeColors.primaryDark : themeColors.textPrimary),
                    border: isToday && !hasEvent ? `1px solid ${themeColors.primary}` : (hasEvent ? 'none' : `1px solid ${themeColors.secondary}`),
                    fontWeight: isToday || hasEvent ? 'bold' : 'normal',
                    '&:hover': { backgroundColor: hasEvent ? themeColors.primaryDark : themeColors.background },
                    boxShadow: isSelected ? `0 0 0 2px ${themeColors.primaryDark}` : 'none',
                    fontSize: '0.8rem'
                  }}
                >
                  {formatDateFns(day, 'd')}
                </Button>
              ) : <Box sx={{ width: '28px', height: '28px' }} />}
            </Grid>
          );
        })}
      </Grid>
      {selectedDay && (
        <Box sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          px: 1.5,
          pt: 0.75,
          mt: 0.75,
          borderTop: 1,
          borderColor: 'divider',
        }}>
          <Typography variant="caption" display="block" sx={{ fontWeight: 'medium', color: themeColors.textSecondary, mb: 0.5, fontSize: '0.8rem' }}>
            Events for: {formatDateHelper(selectedDay)}
          </Typography>
          {detailedEventsForDate.length > 0 ? (
            <List dense disablePadding>
              {detailedEventsForDate.map(event => (
                <ListItem key={event.id || (event.title + event.date)} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemText
                    primary={event.title}
                    secondary={`${event.type}${event.time ? ` at ${event.time}` : ''}`}
                    primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.85rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>No events for this date.</Typography>
          )}
        </Box>
      )}
      {!selectedDay && (eventsByDateStr.size > 0 || (openAssignments && openAssignments.length > 0) || (enrolledCourses && enrolledCourses.length > 0)) && (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', width: '100%', display: 'block', mt: 0.75, p: 0.75, fontSize: '0.75rem', /* Trailing comma for potential parser aid */ }}>
          Click on a highlighted date to see event details.
        </Typography>
      )}
    </DashboardCard>
  );
};


const CompactListItem = ({ primary, secondaryLines = [], isCompleted = false }) => (
  <ListItem
    disablePadding
    sx={{
      mb: 0.5, py: 0.25,
      opacity: isCompleted ? 0.7 : 1,
      backgroundColor: isCompleted ? themeColors.secondary : 'transparent',
      borderRadius: 1,
    }}>
    <ListItemText
      primary={primary}
      secondary={
        <>
          {secondaryLines.map((line, index) => (
            <Typography key={index} variant="caption" display="block" color={isCompleted ? themeColors.textSecondary : themeColors.textSecondary} sx={{ fontSize: '0.8rem' }}>
              {line}
            </Typography>
          ))}
        </>
      }
      primaryTypographyProps={{ fontWeight: 'medium', color: themeColors.textPrimary, fontSize: '0.95rem' }}
    />
    {/* No, let's keep the strikethrough on the primary text itself for better visual hierarchy */}
    {/* primaryTypographyProps={{
        fontWeight: 'medium',
        color: themeColors.textPrimary,
        fontSize: '0.95rem',
        textDecoration: isCompleted ? 'line-through' : 'none' // קו חוצה לשם הקורס
      }} /> */}
  </ListItem> 
);

const OpenAssignmentsList = ({ assignments, coursesMap, loading, navigateTo }) => (
  <DashboardCard title="Open Assignments" icon={<AssignmentTurnedInIcon />} loading={loading} navigateTo={navigateTo}>
    {assignments && assignments.length > 0 ? (
      <List dense>
        {assignments.map(assignment => {
          const course = coursesMap.get(assignment.courseId);
          return (
            <CompactListItem
              key={assignment.assignmentId || assignment.id}
              primary={assignment.assignmentName}
              secondaryLines={[
                `Course: ${course?.courseName || assignment.courseId}`,
                `Due: ${formatDateHelper(assignment.dueDate)}`,
                `Lecturer: ${course?.professorsName || 'N/A'}`
              ]}
            />
          );
        })}
      </List>
    ) : (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 2 }}>No open assignments.</Typography>
    )}
  </DashboardCard>
);

const RecentGradesSummary = ({ submissions, assignmentsMap, coursesMap, loading }) => (
  <DashboardCard title="Recent Grades" icon={<GradeIcon />} loading={loading} navigateTo="/grades">
    {submissions && submissions.length > 0 ? (
      <List dense>
        {submissions.slice(0, 3).map(sub => {
          const assignment = assignmentsMap.get(sub.assignmentId);
          const course = assignment ? coursesMap.get(assignment.courseId) : null;
          return (
            <ListItem key={sub.id || sub.submissionId} disablePadding sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <ListItemText
                primaryTypographyProps={{ fontWeight: 'medium', color: themeColors.textPrimary, fontSize: '0.95rem' }}
                secondaryTypographyProps={{ color: themeColors.textSecondary, fontSize: '0.8rem' }}
                primary={assignment?.assignmentName || sub.assignmentId}
                secondary={`Course: ${course?.courseName || 'N/A'}`}
              />
              <Chip
                label={sub.grade !== null && sub.grade !== undefined ? sub.grade : 'Pending'}
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: sub.grade !== null && sub.grade !== undefined ? (sub.grade >= 55 ? themeColors.primary : 'error.main') : themeColors.secondary,
                  color: sub.grade !== null && sub.grade !== undefined && sub.grade < 55 ? themeColors.paper : (sub.grade === null || sub.grade === undefined ? themeColors.textPrimary : themeColors.paper),
                  height: '22px', fontSize: '0.75rem'
                }}
                size="small"
              />
            </ListItem>
          );
        })}
      </List>
    ) : (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 2 }}>No recent grades.</Typography>
    )}
  </DashboardCard>
);

const StudentStatistics = ({ stats, loading }) => (
  <Card elevation={3} sx={{ mt: 2.5, borderRadius: 2 }}>
    <CardHeader
      avatar={<BarChartIcon sx={{ color: themeColors.primary }} />}
      title="My Statistics"
      titleTypographyProps={{ variant: 'h6', fontWeight: 'medium', color: themeColors.textPrimary, fontSize: '1.1rem' }}
      sx={{ borderBottom: 1, borderColor: 'divider', py: 1.25, px: 1.75 }}
    />
    <CardContent sx={{ p: 1.5 }}>
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={26} sx={{ color: themeColors.primary }} /></Box> : (
        <Grid container spacing={1.5} textAlign="center">
          <Grid item xs={6} sm={6}>
            <Typography variant="body1" color="text.secondary">Average Grade</Typography>
            <Typography variant="h5" sx={{ color: themeColors.primary }} fontWeight="bold">{stats.averageGrade.toFixed(1)}</Typography>
          </Grid>
          <Grid item xs={6} sm={6}>
            <Typography variant="body1" color="text.secondary">Assignments Submitted</Typography>
            <Typography variant="h5" sx={{ color: themeColors.primary }} fontWeight="bold">{stats.submittedAssignmentsCount}</Typography>
          </Grid>
        </Grid>
      )}
    </CardContent>
  </Card>
);

const EnrolledCoursesList = ({ courses, loading, navigateTo }) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const handleShowCompletedChange = (event) => {
    setShowCompleted(event.target.checked);
  };

  const coursesToDisplay = useMemo(() => {
    if (!courses) return [];
    if (showCompleted) {
      return courses; // Already sorted with completed at the bottom
    }
    return courses.filter(course => !(course.endDate ? isDatePastDue(course.endDate) : false));
  }, [courses, showCompleted]);

  return (
    <DashboardCard
      title="My Courses" // Changed title here
      icon={<ClassIcon />}
      loading={loading}
      navigateTo={navigateTo} // Navigate only if not showing completed, or adjust as needed
      headerAction={ // Pass the switch as an action to the CardHeader
        <FormControlLabel
          control={<Switch checked={showCompleted} onChange={handleShowCompletedChange} size="small" sx={{'.MuiSwitch-track': {backgroundColor: showCompleted ? themeColors.primaryDark : ''}}} />}
          label={<Typography variant="caption" sx={{ fontSize: '0.8rem' }}>Show Completed</Typography>}
          labelPlacement="start"
          sx={{ mr: 0.5 }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card navigation when clicking the switch/label
            // The onChange of the Switch will still fire for toggling state
          }}
        />
      }
    >
      {coursesToDisplay.length > 0 ? (
      <List dense>
        {coursesToDisplay.map(course => {
          const isCourseCompleted = course.endDate ? isDatePastDue(course.endDate) : false;
          const secondaryInfo = [
          ];
          if (isCourseCompleted) {
            secondaryInfo.push(`Lecturer: ${course.professorsName || 'N/A'}`);
            secondaryInfo.push(`Completed: ${formatDateHelper(course.endDate)}`);
          } else {
            secondaryInfo.push(`Lecturer: ${course.professorsName || 'N/A'}`);
            const day = course.dayOfWeek;
            const startDate = course.startingDate ? formatDateHelper(course.startingDate) : null;
            let scheduleText = '';

            if (day && startDate) {
              scheduleText = `Schedule: ${day}, Starts: ${startDate}`;
            } else if (day) {
              scheduleText = `Schedule: ${day}`;
            } else if (startDate) {
              scheduleText = `Starts: ${startDate}`;
            }
            if (scheduleText) {
              secondaryInfo.push(scheduleText);
            }
          }

          return (
            <CompactListItem
              key={course.courseId || course.id}
              primary={course.courseName || 'Unnamed Course'}
              secondaryLines={secondaryInfo} // Strikethrough will be handled by primaryTypographyProps if we add it
              primaryTypographyProps={{
                fontWeight: 'medium', color: themeColors.textPrimary, fontSize: '0.95rem', // Merged from CompactListItem's defaults
                textDecoration: isCourseCompleted ? 'line-through' : 'none',
              }}
              isCompleted={isCourseCompleted}
            />
          );
        })}
      </List>
    ) : (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 2 }}>
        Not enrolled in any courses.
      </Typography>
    )}
  </DashboardCard>
  );
};

// Modified DashboardCard to accept a headerAction prop
const DashboardCard = ({ title, icon, children, loading, navigateTo, headerAction }) => {
  const navigate = useNavigate();
  const handleCardClick = () => navigateTo && navigate(navigateTo);

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        cursor: navigateTo ? 'pointer' : 'default',
        '&:hover': { boxShadow: navigateTo ? 6 : 3 }
      }}
      onClick={handleCardClick}
    >
      <CardHeader
        avatar={React.cloneElement(icon, { sx: { color: themeColors.primary } })}
        title={title}
        action={headerAction} // Added action prop here
        titleTypographyProps={{ variant: 'h6', fontWeight: 'medium', color: themeColors.textPrimary, fontSize: '1.1rem' }}
        sx={{ borderBottom: 1, borderColor: 'divider', py: 1.25, px: 1.75 }}
      />
      <CardContent sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', p: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '75px' }}>
            <CircularProgress size={26} sx={{ color: themeColors.primary }} />
          </Box>
        ) : children}
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const [allStudents, setAllStudents] = useState([]);
  const [allCoursesMaster, setAllCoursesMaster] = useState([]);
  const [allAssignmentsMaster, setAllAssignmentsMaster] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentOpenAssignments, setStudentOpenAssignments] = useState([]);
  const [studentRecentSubmissions, setStudentRecentSubmissions] = useState([]);
  const [studentStats, setStudentStats] = useState({ averageGrade: 0, submittedAssignmentsCount: 0 });

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingStudentData, setLoadingStudentData] = useState(false);
  const [error, setError] = useState(null);
  const [studentEnrolledCoursesDetails, setStudentEnrolledCoursesDetails] = useState([]);

  const coursesMap = useMemo(() => new Map(allCoursesMaster.map(course => [course.courseId, course])), [allCoursesMaster]);
  const assignmentsMap = useMemo(() => new Map(allAssignmentsMaster.map(asm => [asm.assignmentId, asm])), [allAssignmentsMaster]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      setError(null);
      try {
        const [studentsList, coursesList, assignmentsList] = await Promise.all([
          listStudents(),
          listCourses(),
          listAssignments(),
        ]);
        setAllStudents(studentsList.sort((a, b) => (a.lastName || "").localeCompare(b.lastName || "") || (a.firstName || "").localeCompare(b.firstName || "")));
        setAllCoursesMaster(coursesList);
        setAllAssignmentsMaster(assignmentsList);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load initial data. Please try refreshing.");
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);


  useEffect(() => {
    if (!selectedStudentId) {
      setStudentOpenAssignments([]);
      setStudentRecentSubmissions([]);
      setStudentEnrolledCoursesDetails([]);
      setStudentStats({ averageGrade: 0, submittedAssignmentsCount: 0 });
      return;
    }

    if (allCoursesMaster.length === 0 || allAssignmentsMaster.length === 0 || allStudents.length === 0) {
      return; // Wait for master data to load
    }

    const fetchDataForStudent = async () => {
      setLoadingStudentData(true);
      setError(null);
      try {
        const studentDetails = allStudents.find(s => s.studentId === selectedStudentId);
        if (!studentDetails) {
          console.error("Selected student not found in allStudents list:", selectedStudentId);
          throw new Error("Student details not found.");
        }

        const enrolledCourseIds = new Set(studentDetails.enrolledCourses || []);
        let enrolledCoursesDetails = allCoursesMaster
          .filter(c => c.courseId && enrolledCourseIds.has(c.courseId))
          .map(c => ({
            ...c,
            startingDate: c.startingDate,
            endDate: c.endDate,
            dayOfWeek: c.dayOfWeek
          }))
          .sort((a, b) => {
            const isACompleted = a.endDate ? isDatePastDue(a.endDate) : false;
            const isBCompleted = b.endDate ? isDatePastDue(b.endDate) : false;

            if (isACompleted && !isBCompleted) return 1;
            if (!isACompleted && isBCompleted) return -1;

            try {
              const dateA = parseDateSafe(a.startingDate) || new Date(0);
              const dateB = parseDateSafe(b.startingDate) || new Date(0);
              if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
              return dateA - dateB;
            } catch (e) { return 0; }
          });

        setStudentEnrolledCoursesDetails(enrolledCoursesDetails);

        const submissionSnap = await getDocs(
          query(collection(firestore, 'submissions'), where('studentId', '==', selectedStudentId))
        );
        const submissions = submissionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const openAssignments = allAssignmentsMaster.filter(asm =>
          asm.courseId && enrolledCourseIds.has(asm.courseId) && asm.dueDate && !isDatePastDue(asm.dueDate)
        ).sort((a, b) => {
          try {
            const dateA = parseDateSafe(a.dueDate) || new Date(0);
            const dateB = parseDateSafe(b.dueDate) || new Date(0);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateA - dateB;
          } catch (e) { return 0; }
        });
        setStudentOpenAssignments(openAssignments);

        const recentSubmissions = submissions
          .filter(sub => sub.grade !== null || sub.submitted)
          .sort((a, b) => {
            const dateA = parseDateSafe(a.submissionDate || a.lastUpdated) || new Date(0);
            const dateB = parseDateSafe(b.submissionDate || b.lastUpdated) || new Date(0);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateB - dateA;
          })
          .slice(0, 3);
        setStudentRecentSubmissions(recentSubmissions);

        const gradedSubmissions = submissions.filter(sub => sub.grade !== null && typeof sub.grade === 'number');
        const averageGrade = gradedSubmissions.length > 0
          ? gradedSubmissions.reduce((sum, sub) => sum + sub.grade, 0) / gradedSubmissions.length
          : 0;
        const submittedCount = submissions.filter(sub => sub.submitted || (sub.grade !== null && sub.grade !== undefined)).length;
        setStudentStats({ averageGrade, submittedAssignmentsCount: submittedCount });

      } catch (err) {
        console.error(`Error fetching data for student ${selectedStudentId}:`, err);
        setError(`Failed to load dashboard for the selected student.`);
      } finally {
        setLoadingStudentData(false);
      }
    };

    fetchDataForStudent();
  }, [selectedStudentId, allStudents, allCoursesMaster, allAssignmentsMaster]);

  const currentStudent = allStudents.find(s => s.studentId === selectedStudentId);

  return (
    <>
      <Box
        sx={{
          backgroundColor: themeColors.background,
          minHeight: 'calc(100vh - 64px)',
          py: 4,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: '1350px',
            mx: 'auto',
            px: { xs: 1.5, sm: 3, md: 4 },
          }}>
          <StudentSelector
            students={allStudents}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            loading={loadingInitial && allStudents.length === 0}
          />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {selectedStudentId && currentStudent && (
            <Typography variant="h5" gutterBottom sx={{ mb: 2.5, textAlign: 'center', fontWeight: 'medium', color: themeColors.textPrimary }}>
              Welcome, {currentStudent.firstName} {currentStudent.lastName}!
            </Typography>
          )}

          {selectedStudentId && loadingStudentData && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <CircularProgress sx={{ color: themeColors.primary }} />
              <Typography sx={{ ml: 2, color: themeColors.textSecondary }}>Loading student dashboard...</Typography>
            </Box>
          )}

          {!selectedStudentId && !loadingInitial && (
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 2, backgroundColor: themeColors.paper }}>
              <Typography variant="h6" sx={{ color: themeColors.textSecondary }}>Please select a student to view their dashboard.</Typography>
            </Paper>
          )}

          {selectedStudentId && !loadingStudentData && !error && (
            <>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <UpcomingEventsMiniCalendar
                    openAssignments={studentOpenAssignments}
                    enrolledCourses={studentEnrolledCoursesDetails}
                    loading={loadingStudentData || loadingInitial}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EnrolledCoursesList
                    courses={studentEnrolledCoursesDetails}
                    loading={loadingStudentData || loadingInitial}
                    navigateTo={selectedStudentId ? `/courses?studentId=${selectedStudentId}` : '/courses'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <OpenAssignmentsList
                    assignments={studentOpenAssignments}
                    coursesMap={coursesMap}
                    loading={loadingStudentData || loadingInitial}
                    navigateTo={selectedStudentId ? `/assignments?studentId=${selectedStudentId}` : '/assignments'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <RecentGradesSummary
                    submissions={studentRecentSubmissions}
                    assignmentsMap={assignmentsMap}
                    coursesMap={coursesMap}
                    loading={loadingStudentData || loadingInitial}
                  />
                </Grid>
              </Grid>
              <StudentStatistics stats={studentStats} loading={loadingStudentData || loadingInitial} />
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
