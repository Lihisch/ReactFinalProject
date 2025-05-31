// src/components/CoursesManagement.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TablePagination,
  Paper, IconButton, Tooltip, Stack, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Snackbar, Alert, FormControlLabel, Switch,
  Breadcrumbs, Link, CircularProgress, TextField, InputAdornment,
  Checkbox, Toolbar, alpha, Grid, Skeleton, List, ListItem, ListItemText,
  Autocomplete, Divider, ListItemSecondaryAction
} from '@mui/material';
import Popover from '@mui/material/Popover'; // Added for filters
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SchoolIcon from '@mui/icons-material/School';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FilterListIcon from '@mui/icons-material/FilterList'; // Added for filters
import ClearIcon from '@mui/icons-material/Clear'; // Added for clearing search/filters
import { listCourses, deleteCourses, addCourse } from '../firebase/courses';
import { isPast, parseISO as dateFnsParseISO, isFuture, isEqual, isToday } from 'date-fns';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // For status icon
import { listStudents } from '../firebase/students';

const STUDENTS_STORAGE_KEY = 'students';
// const COURSES_STORAGE_KEY = 'courses'; // Not used in current logic for courses, Firebase is primary
const SEARCH_DEBOUNCE_DELAY = 300;

const colors = {
  green: '#bed630', greenDark: '#a7bc2a', text: '#000000',
  white: '#ffffff', error: '#d32f2f',
};

// --- Helper Functions ---
function descendingComparator(a, b, orderBy) {
  let valA = a[orderBy];
  let valB = b[orderBy];

  // Handle cases where values might be undefined or null for robust sorting
  if (valA == null) valA = ''; // Treat null/undefined as empty string or smallest value
  if (valB == null) valB = '';

  // If comparing statusText, ensure consistent comparison
  if (orderBy === 'statusText') {
    // You might want to define a specific order for statuses if alphabetical isn't ideal
    // English status order
    const statusOrderValues = { 'Active': 1, 'Future': 2, 'Completed': 3, 'Unknown': 4 };
    valA = statusOrderValues[valA] || statusOrderValues['Unknown']; // Assign a numeric value for sorting
    valB = statusOrderValues[valB] || statusOrderValues['Unknown'];
  }


  if (typeof valA === 'string' && typeof valB === 'string') {
    return valB.localeCompare(valA); // Use localeCompare for strings
  }

  // Default numeric/boolean comparison
  if (valB < valA) return -1;
  if (valB > valA) return 1;
  return 0;
}
function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const orderVal = comparator(a[0], b[0]);
    if (orderVal !== 0) return orderVal;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = parseDateSafe(dateString); // Use parseDateSafe for robustness
    return date ? date.toLocaleDateString('en-CA') : 'Invalid Date'; // YYYY-MM-DD
  } catch (e) { return 'Invalid Date'; }
};

const parseDateSafe = (dateInput) => {
  if (!dateInput) return null;
  try {
    let date;
    if (typeof dateInput === 'string' && (dateInput.includes('T') || dateInput.match(/^\d{4}-\d{2}-\d{2}$/))) {
      date = dateFnsParseISO(dateInput);
    } else if (dateInput && typeof dateInput.seconds === 'number' && typeof dateInput.nanoseconds === 'number') {
      date = new Date(dateInput.seconds * 1000 + dateInput.nanoseconds / 1000000);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    }
     else {
      date = new Date(dateInput);
    }
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.error("Error parsing date:", dateInput, e);
    return null;
  }
};

const getCourseStatus = (startDateInput, endDateInput) => {
  const startDate = parseDateSafe(startDateInput);
  const endDate = parseDateSafe(endDateInput);
  const today = new Date();
  today.setHours(0,0,0,0); // Compare dates only

  if (endDate && isPast(endDate) && !isToday(endDate)) {
    return { text: 'Completed', chipColor: 'default', chipVariant: 'outlined', textColor: 'text.secondary', sortOrder: 3 };
  }
  // Check if start date is today or in the past
  if (startDate && (isPast(startDate) || isToday(startDate))) {
    // If it started or is starting today, and has no end date or end date is today or in future, it's active
    if (!endDate || isFuture(endDate) || isToday(endDate)) {
      return { text: 'Active', chipColor: 'success', chipVariant: 'outlined', textColor: 'success.main', sortOrder: 1 }; // Changed to outlined
    }
  }
  // If start date is in the future, it's a future course
  if (startDate && isFuture(startDate)) {
    return { text: 'Future', chipColor: 'info', chipVariant: 'outlined', textColor: 'info.main', sortOrder: 2 }; // Changed to outlined
  }
  return { text: 'Unknown', chipColor: 'default', chipVariant: 'outlined', textColor: 'text.disabled', sortOrder: 4 }; // Fallback
};


const formatDateForInput = (dateInput) => {
  const date = parseDateSafe(dateInput);
  if (!date) return '';
  if (date instanceof Date && !isNaN(date)) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  return '';
};
// --- End Helper Functions ---

const headCells = [
  { id: 'statusText', label: 'Status', sortable: true, padding: 'normal', align: 'center', width: '100px' }, // Added width
  { id: 'courseId', label: 'Course ID', sortable: true, padding: 'normal' },
  { id: 'courseName', label: 'Course Name', sortable: true, padding: 'normal' },
  { id: 'professorsName', label: 'Professor', sortable: true, padding: 'normal' },
  { id: 'semester', label: 'Semester', sortable: true, padding: 'normal', align: 'left' },
  { id: 'schedule', label: 'Schedule', sortable: false, padding: 'normal' },
  { id: 'enrolled', label: 'Enrolled', sortable: false, align: 'center', padding: 'normal' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'right', padding: 'normal', width: '180px' }, // Added width
];

export default function CoursesManagement() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, courseId: null, courseName: '', isBulk: false, warning: '' });

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewCourse, setViewCourse] = useState(null);

  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [enrollmentCourse, setEnrollmentCourse] = useState(null);
  const [enrollmentStudentsList, setEnrollmentStudentsList] = useState([]);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState(null);

  const [order, setOrder] = useState('asc'); // Default 'asc' for status (Active first)
  const [orderBy, setOrderBy] = useState('statusText'); // Default sort by status
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState([]);

  // Search and Filter States
  const [searchInput, setSearchInput] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [showCompletedCourses, setShowCompletedCourses] = useState(false); // Default to false (hide completed)
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [filterSemester, setFilterSemester] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null); // For Popover

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilterTerm(searchInput);
      setPage(0);
    }, SEARCH_DEBOUNCE_DELAY);
    return () => { clearTimeout(handler); };
  }, [searchInput]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [coursesData, studentsData] = await Promise.all([
          listCourses(),
          listStudents()
        ]);

        if (Array.isArray(coursesData)) {
          setCourses(coursesData);
        } else {
          console.error("Firebase: Invalid course data received", coursesData);
          setCourses([]);
          setSnackbar({ open: true, message: 'Error: Invalid course data format received.', severity: 'error' });
        }
        if (Array.isArray(studentsData)) {
          setStudents(studentsData);
        } else {
          console.warn("Firebase: Invalid student data received", studentsData);
          setStudents([]);
        }

      } catch (error) {
        console.error("CourseManagement: Error loading data:", error);
        setSnackbar({ open: true, message: 'Error loading data. Check console for details.', severity: 'error' });
        setStudents([]);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const enrollmentCounts = useMemo(() => {
    const counts = {};
    if (!Array.isArray(students) || !Array.isArray(courses)) return counts;
    courses.forEach(course => {
      if (course?.courseId) {
        counts[course.courseId] = students.filter(student =>
          student?.enrolledCourses?.includes(course.courseId)
        ).length;
      }
    });
    return counts;
  }, [courses, students]);

  const handleSearchInputChange = (event) => { setSearchInput(event.target.value); };
  const handleSortRequest = (property) => { const isAsc = orderBy === property && order === 'asc'; setOrder(isAsc ? 'desc' : 'asc'); setOrderBy(property); };
  const handleChangePage = (event, newPage) => { setPage(newPage); };
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

  const filteredCourses = useMemo(() => {
    let processedCourses = courses.map(course => ({
      ...course,
      statusText: getCourseStatus(course.startingDate, course.endDate).text,
      statusSortOrder: getCourseStatus(course.startingDate, course.endDate).sortOrder,
    }));
    
    // Filter by 'showCompletedCourses' state
    if (!showCompletedCourses) { // Default: hide completed
      processedCourses = processedCourses.filter(course => course.statusText !== 'Completed');
    }

    if (filterStartDate || filterEndDate) {
      processedCourses = processedCourses.filter(course => {
        const courseStart = parseDateSafe(course.startingDate);
        const courseEnd = parseDateSafe(course.endDate);
        // Adjust logic: if filterStartDate is set, course must start on or after it.
        // If filterEndDate is set, course must end on or before it.
        let passStartDate = true;
        let passEndDate = true;
        if (filterStartDate && (!courseStart || courseStart < filterStartDate)) {
            passStartDate = false;
        }
        if (filterEndDate && (!courseEnd || courseEnd > filterEndDate)) {
            passEndDate = false;
        }
        return passStartDate && passEndDate;
      });
    }

    if (filterSemester) {
      const lowerCaseSemesterFilter = filterSemester.toLowerCase();
      processedCourses = processedCourses.filter(course =>
        course.semester?.toLowerCase().includes(lowerCaseSemesterFilter)
      );
    }

    if (filterTerm) {
      const lowerCaseFilter = filterTerm.toLowerCase();
      processedCourses = processedCourses.filter(course =>
        course.courseId?.toLowerCase().includes(lowerCaseFilter) ||
        course.courseName?.toLowerCase().includes(lowerCaseFilter) ||
        course.professorsName?.toLowerCase().includes(lowerCaseFilter) ||
        course.statusText?.toLowerCase().includes(lowerCaseFilter) // Allow searching by status text
      );
    }
    return processedCourses;
  }, [courses, filterTerm, showCompletedCourses, filterStartDate, filterEndDate, filterSemester]);

  const sortedAndPaginatedCourses = useMemo(() => {
    // When sorting by status, use statusSortOrder if available, otherwise statusText
    const comparator = orderBy === 'statusText'
      ? (a, b) => {
          const statusOrderValues = { 'Active': 1, 'Future': 2, 'Completed': 3, 'Unknown': 4 };
          const orderVal = order === 'desc' ? -1 : 1;
          const statusA = a.statusSortOrder ?? (statusOrderValues[a.statusText] || statusOrderValues['Unknown']); // Use statusOrderValues
          const statusB = b.statusSortOrder ?? (statusOrderValues[b.statusText] || statusOrderValues['Unknown']); // Use statusOrderValues
          if (statusA < statusB) return -1 * orderVal; 
          if (statusA > statusB) return 1 * orderVal;
          return 0;
        }
      : getComparator(order, orderBy);

    const sorted = stableSort(filteredCourses, comparator);
    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredCourses, order, orderBy, page, rowsPerPage]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredCourses.map((c) => c.courseId).filter(id => id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleCheckboxClick = (event, courseId) => {
    const selectedIndex = selected.indexOf(courseId);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, courseId);
    } else {
      newSelected = selected.filter(id => id !== courseId);
    }
    setSelected(newSelected);
  };

  const isSelected = (courseId) => selected.indexOf(courseId) !== -1;

  const handleAddCourse = () => navigate('/courseform');
  const handleEditCourse = (courseId) => navigate(`/courseform/${courseId}`);
  const handleDuplicateCourse = (courseToDuplicate) => {
    if (!courseToDuplicate) return;
    const { courseId, statusText, statusSortOrder, ...dataToDuplicate } = courseToDuplicate; // Exclude dynamic fields
    navigate('/courseform', { state: { courseToDuplicate: dataToDuplicate } });
  };

  const handleViewClick = (course) => {
    if (!course) return;
    setViewCourse(course);
    setViewModalOpen(true);
  };
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewCourse(null);
  };

  const handleOpenEnrollmentModal = (course) => {
    if (!course) return;
    const currentlyEnrolled = students.filter(student =>
      student?.enrolledCourses?.includes(course.courseId)
    );
    setEnrollmentCourse(course);
    setEnrollmentStudentsList(currentlyEnrolled);
    setSelectedStudentToEnroll(null);
    setEnrollmentModalOpen(true);
  };
  const handleCloseEnrollmentModal = () => {
    setEnrollmentModalOpen(false);
    setEnrollmentCourse(null);
    setEnrollmentStudentsList([]);
    setSelectedStudentToEnroll(null);
  };

  const handleDeleteClick = (courseId, courseName) => {
    const count = enrollmentCounts[courseId] ?? 0;
    const warning = count > 0 ? ` This course has ${count} student(s) enrolled who will be unenrolled.` : '';
    setDeleteConfirm({ open: true, courseId, courseName, isBulk: false, warning });
  };
  const handleBulkDeleteClick = () => {
    let studentWarningCount = 0;
    selected.forEach(id => {
      studentWarningCount += (enrollmentCounts[id] ?? 0);
    });
    const warning = studentWarningCount > 0 ? ` The selected courses have a total of ${studentWarningCount} enrollment(s) which will be removed.` : '';
    setDeleteConfirm({ open: true, courseId: null, courseName: `${selected.length} courses`, isBulk: true, warning });
  };
  const handleDeleteCancel = () => setDeleteConfirm({ open: false, courseId: null, courseName: '', isBulk: false, warning: '' });

  const handleDeleteConfirm = useCallback(async () => {
    const { courseId, isBulk } = deleteConfirm;
    const idsToDelete = isBulk ? selected : (courseId ? [courseId] : []);
    if (idsToDelete.length === 0) return;

    try {
      await deleteCourses(idsToDelete); // Firebase call
      setCourses(prev => prev.filter(c => !idsToDelete.includes(c.courseId)));
      const updatedStudents = students.map(student => {
        const newEnrolledCourses = student.enrolledCourses?.filter(id => !idsToDelete.includes(id));
        return { ...student, enrolledCourses: newEnrolledCourses };
      });
      setStudents(updatedStudents);
      // TODO: Persist student changes to Firebase if necessary
      // For example, loop through updatedStudents and call updateStudent for each changed student.
      // This can be complex if many students are affected. A batch update or cloud function might be better.

      setSelected([]);
      setSnackbar({ open: true, message: `${idsToDelete.length} course(s) deleted successfully.`, severity: 'success' });
    } catch (error) {
      console.error("CourseManagement: Error deleting course(s):", error);
      setSnackbar({ open: true, message: 'Error deleting course(s).', severity: 'error' });
    } finally {
      handleDeleteCancel();
    }
  }, [deleteConfirm, selected, students]);

  const handleUnenroll = (studentIdToUnenroll) => {
    if (!enrollmentCourse || !studentIdToUnenroll) return;
    const courseId = enrollmentCourse.courseId;

    try {
      const studentToUpdate = students.find(s => s.studentId === studentIdToUnenroll);
      if (studentToUpdate) {
        const updatedEnrolledCourses = (studentToUpdate.enrolledCourses || []).filter(id => id !== courseId);
        // TODO: Update student in Firebase here
        // await updateStudent(studentToUpdate.id, { enrolledCourses: updatedEnrolledCourses });
        // For optimistic UI update:
        const updatedStudents = students.map(s =>
          s.studentId === studentIdToUnenroll ? { ...s, enrolledCourses: updatedEnrolledCourses } : s
        );
        setStudents(updatedStudents);
        setEnrollmentStudentsList(prev => prev.filter(s => s.studentId !== studentIdToUnenroll));
        setSnackbar({ open: true, message: `Student unenrolled from ${enrollmentCourse.courseName}.`, severity: 'success' });
      }
    } catch (error) {
      console.error("Error unenrolling student:", error);
      setSnackbar({ open: true, message: 'Error unenrolling student.', severity: 'error' });
    }
  };

  const handleEnroll = () => {
    if (!enrollmentCourse || !selectedStudentToEnroll) return;
    const courseId = enrollmentCourse.courseId;
    const studentIdToEnroll = selectedStudentToEnroll.studentId;

    try {
      const studentToUpdate = students.find(s => s.studentId === studentIdToEnroll);
      if (studentToUpdate) {
        const updatedEnrolledCourses = [...new Set([...(studentToUpdate.enrolledCourses || []), courseId])];
        // TODO: Update student in Firebase here
        // await updateStudent(studentToUpdate.id, { enrolledCourses: updatedEnrolledCourses });
        // For optimistic UI update:
        const updatedStudents = students.map(s =>
          s.studentId === studentIdToEnroll ? { ...s, enrolledCourses: updatedEnrolledCourses } : s
        );
        setStudents(updatedStudents);
        setEnrollmentStudentsList(prev => [...prev, selectedStudentToEnroll]);
        setSelectedStudentToEnroll(null);
        setSnackbar({ open: true, message: `Student enrolled in ${enrollmentCourse.courseName}.`, severity: 'success' });
      }
    } catch (error) {
      console.error("Error enrolling student:", error);
      setSnackbar({ open: true, message: 'Error enrolling student.', severity: 'error' });
    }
  };


  const handleCloseSnackbar = (event, reason) => { if (reason === 'clickaway') return; setSnackbar(prev => ({ ...prev, open: false })); };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredCourses.length) : 0;
  const numSelected = selected.length;
  const rowCount = filteredCourses.length;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (showCompletedCourses) count++; // Counts if "Show Completed" is ON (non-default state)
    if (filterStartDate) count++;
    if (filterEndDate) count++;
    if (filterSemester) count++;
    return count;
  }, [showCompletedCourses, filterStartDate, filterEndDate, filterSemester]);

  const generateNoCoursesMessage = () => {
    let conditions = [];
    if (filterTerm) conditions.push("match your search");
    if (filterSemester) conditions.push(`are in semester "${filterSemester}"`);
    if (filterStartDate || filterEndDate) {
      if (filterStartDate && filterEndDate) conditions.push("are between the selected dates");
      else if (filterStartDate) conditions.push("start on or after the selected date");
      else if (filterEndDate) conditions.push("end on or before the selected date");
    }

    let baseMessage;
    let suffix = "";

    if (showCompletedCourses) { // All statuses are potentially visible
        baseMessage = "No courses";
    } else { // Completed are hidden (default)
        baseMessage = "No Active or Future courses";
        suffix = " (Completed courses are hidden by default)";
    }

      if (conditions.length > 0) {
        return `${baseMessage} that ${conditions.join(" and ")}.${suffix}`;
    }
    return `${baseMessage} found.${suffix}`;
  };

  const enrollableStudents = useMemo(() => {
    if (!enrollmentCourse || !students || !enrollmentStudentsList) return [];
    const enrolledIds = new Set(enrollmentStudentsList.map(s => s.studentId));
    return students.filter(s => !enrolledIds.has(s.studentId));
  }, [students, enrollmentStudentsList, enrollmentCourse]);

  const sortedEnrollmentStudents = useMemo(() => {
    return [...enrollmentStudentsList].sort((a, b) => {
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [enrollmentStudentsList]);

  const handleFilterIconClick = (event) => setFilterAnchorEl(event.currentTarget);
  const handleFilterPopoverClose = () => setFilterAnchorEl(null);
  const openFilterPopover = Boolean(filterAnchorEl);


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/"> <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home </Link>
        <Typography color="text.primary">Manage Courses</Typography>
      </Breadcrumbs>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, backgroundColor: colors.white, width: '100%', mb: 2 }}>
        <Toolbar
          sx={{
            p: { xs: 1, sm: 2 }, mb: 2,
            ...(numSelected > 0 && { bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity) }),
          }}
        >
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm="auto">
              {numSelected > 0 ? (
                <Typography color="inherit" variant="subtitle1" component="div"> {numSelected} selected </Typography>
              ) : (
                <Typography variant="h6" id="tableTitle" component="div"> Courses </Typography>
              )}
            </Grid>

            {numSelected > 0 ? (
              <Grid item xs={12} sm="auto">
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Clear Selection">
                    <Button variant="outlined" color="inherit" startIcon={<ClearIcon />} onClick={() => setSelected([])} size="small"> Clear Selection </Button>
                  </Tooltip>
                  <Tooltip title="Delete Selected">
                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDeleteClick} size="small"> Delete Selected </Button>
                  </Tooltip>
                </Stack>
              </Grid>
            ) : (
              <Grid item xs={12} container spacing={1} alignItems="center" justifyContent="flex-end">
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    label="Search Courses..."
                    variant="outlined"
                    size="small"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                      endAdornment: searchInput ? (
                        <InputAdornment position="end">
                          <IconButton onClick={() => { setSearchInput(''); }} edge="end" size="small">
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs="auto">
                  <Tooltip title="Filters">
                    <Button
                      variant="contained" 
                      startIcon={<FilterListIcon />}
                      onClick={handleFilterIconClick}
                      size="medium"
                      sx={{ 
                        backgroundColor: colors.green, 
                        color: colors.text, 
                        '&:hover': { backgroundColor: colors.greenDark },
                      }}
                    >
                      Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                    </Button>
                  </Tooltip>
                  <Popover
                    open={openFilterPopover}
                    anchorEl={filterAnchorEl}
                    onClose={handleFilterPopoverClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <Box sx={{ p: 2, width: {xs: 260, sm: 280}, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{mb: -1}}>Filter Options</Typography>
                      <FormControlLabel // This is now the first filter
                        control={
                          <Switch
                            checked={showCompletedCourses}
                            onChange={(e) => { setShowCompletedCourses(e.target.checked); setPage(0); }}
                            size="small"
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colors.green }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.green } }}
                          />
                        }
                        label="Show Completed Courses"
                      />
                       <TextField
                        label="Filter by Semester" type="text" size="small" fullWidth
                        value={filterSemester}
                        onChange={(e) => { setFilterSemester(e.target.value); setPage(0); }}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            endAdornment: filterSemester ? (
                              <InputAdornment position="end">
                                <IconButton onClick={() => { setFilterSemester(''); setPage(0); }} edge="end" size="small">
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ) : null,
                          }}
                      />
                      <Divider/>
                      <Typography variant="caption" sx={{color: 'text.secondary', mt: -1}}>Filter by Date Range</Typography>
                      <TextField
                        label="Course Start Date (From)" type="date" size="small" fullWidth
                        value={formatDateForInput(filterStartDate)}
                        onChange={(e) => { const parsed = parseDateSafe(e.target.value); setFilterStartDate(parsed instanceof Date && !isNaN(parsed) ? parsed : null); setPage(0); }}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="Course End Date (To)" type="date" size="small" fullWidth
                        value={formatDateForInput(filterEndDate)}
                        onChange={(e) => { const parsed = parseDateSafe(e.target.value); setFilterEndDate(parsed instanceof Date && !isNaN(parsed) ? parsed : null); setPage(0); }}
                        InputLabelProps={{ shrink: true }}
                      />
                      <Button
                        size="small" variant="outlined" fullWidth
                        onClick={() => { setFilterStartDate(null); setFilterEndDate(null); setPage(0); }}
                        disabled={!filterStartDate && !filterEndDate}
                      >
                        Clear Date Filters
                      </Button>
                    </Box>
                  </Popover>
                </Grid>
                <Grid item xs="auto" sx={{ ml: { sm: 'auto' } }}>
                     <Button
                      variant="contained" startIcon={<AddIcon />} onClick={handleAddCourse}
                      size="medium"
                      sx={{ backgroundColor: colors.green, color: colors.text, '&:hover': { backgroundColor: colors.greenDark }, width: { xs: '100%', sm: 'auto' } }}
                    > Add Course </Button>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Toolbar>

        <TableContainer component={Box}>
          <Table sx={{ minWidth: 900 }} aria-label="courses table" size="small">
            <TableHead sx={{ backgroundColor: 'grey.100' }}>
              <TableRow>
                <TableCell padding="checkbox"> <Checkbox color="primary" indeterminate={numSelected > 0 && numSelected < rowCount} checked={rowCount > 0 && numSelected === rowCount} onChange={handleSelectAllClick} inputProps={{ 'aria-label': 'select all courses' }} /> </TableCell>
                {headCells.map((headCell) => (
                  <TableCell 
                    key={headCell.id} 
                    align={headCell.align || 'left'} 
                    padding={headCell.padding || 'normal'} 
                    sortDirection={orderBy === headCell.id ? order : false} 
                    sx={{ 
                        fontWeight: 'bold', 
                        ...(orderBy === headCell.id && { bgcolor: 'action.selected' }),
                        ...(headCell.width && { width: headCell.width, minWidth: headCell.width }) // Apply width from headCells
                    }}
                  >
                    {headCell.sortable ? (
                      <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : 'asc'} onClick={() => handleSortRequest(headCell.id)}> {headCell.label} </TableSortLabel>
                    ) : (headCell.label)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from(new Array(rowsPerPage)).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell padding="checkbox"><Skeleton variant="rectangular" width={18} height={18} /></TableCell>
                    {headCells.map(cell => (
                      <TableCell key={cell.id} align={cell.align || 'left'} sx={cell.width ? {width: cell.width, minWidth: cell.width} : {}}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedAndPaginatedCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 2} align="center" sx={{ py: 4 }}> {generateNoCoursesMessage()} </TableCell>
                </TableRow>
              ) : (
                sortedAndPaginatedCourses.map((course) => {
                  const isItemSelected = isSelected(course?.courseId);
                  const labelId = `enhanced-table-checkbox-${course?.courseId}`;
                  const currentEnrollmentCount = enrollmentCounts[course.courseId] ?? 0;
                  const status = getCourseStatus(course.startingDate, course.endDate);
                  return (
                    course && course.courseId ? ( // Ensure course and courseId exist
                      <TableRow 
                        hover 
                        onClick={(event) => { 
                          if (event.target.type !== 'checkbox' && !event.target.closest('button, a, .MuiChip-root')) { // Prevent row click when interacting with chip or buttons
                            handleCheckboxClick(event, course.courseId); 
                          } 
                        }} 
                        role="checkbox" 
                        aria-checked={isItemSelected} 
                        tabIndex={-1} 
                        key={course.courseId} 
                        selected={isItemSelected} 
                        sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity) } }}
                      >
                        <TableCell padding="checkbox"> <Checkbox color="primary" checked={isItemSelected} onChange={(event) => handleCheckboxClick(event, course.courseId)} inputProps={{ 'aria-labelledby': labelId }} /> </TableCell>
                        <TableCell align="center" sx={{width: headCells.find(hc => hc.id === 'statusText')?.width}}>
                          <Chip
                            label={status.text}
                            size="small"
                            variant={status.chipVariant}
                            color={status.chipColor} // MUI will handle text/border/background based on this and variant
                            sx={{
                              fontWeight: 500,
                              minWidth: '70px' 
                            }}
                          />
                        </TableCell>
                        <TableCell component="th" id={labelId} scope="row" sx={{width: headCells.find(hc => hc.id === 'courseId')?.width}}>{course.courseId}</TableCell>
                        <TableCell sx={{width: headCells.find(hc => hc.id === 'courseName')?.width}}>{course.courseName || 'N/A'}</TableCell>
                        <TableCell sx={{width: headCells.find(hc => hc.id === 'professorsName')?.width}}>{course.professorsName || 'N/A'}</TableCell>
                        <TableCell align="left" sx={{width: headCells.find(hc => hc.id === 'semester')?.width}}>{course.semester || 'N/A'}</TableCell>
                        <TableCell sx={{width: headCells.find(hc => hc.id === 'schedule')?.width}}>{`${course.dayOfWeek || 'N/A'} ${course.startTime || 'N/A'}-${course.endTime || 'N/A'}`}</TableCell>
                        <TableCell align="center" sx={{width: headCells.find(hc => hc.id === 'enrolled')?.width}}>
                          <Tooltip title="View/Manage Enrollment">
                            <Chip
                              icon={<PeopleAltIcon fontSize="small" />}
                              label={currentEnrollmentCount}
                              size="small"
                              variant="outlined"
                              onClick={(e) => { e.stopPropagation(); handleOpenEnrollmentModal(course); }}
                              className="enrollment-chip" 
                              sx={{ minWidth: '50px', cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: headCells.find(hc => hc.id === 'actions')?.width }}>
                          <Tooltip title="Duplicate Course">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDuplicateCourse(course); }} sx={{ mr: 0.5, color: 'action.active' }}>
                              <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewClick(course); }} sx={{ mr: 0.5, color: 'action.active' }}>
                              <VisibilityIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Course">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditCourse(course.courseId); }} sx={{ mr: 0.5, color: 'primary.main' }}>
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Course">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteClick(course.courseId, course.courseName); }} sx={{ color: colors.error }}>
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ) : null
                  );
                })
              )}
              {!loading && emptyRows > 0 && (<TableRow style={{ height: 33 * emptyRows }}> <TableCell colSpan={headCells.length + 2} /> </TableRow>)}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination rowsPerPageOptions={[5, 10, 25, 50]} component="div" count={filteredCourses.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} sx={{ mt: 2 }} />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent> <DialogContentText> Are you sure you want to delete {deleteConfirm.isBulk ? `the selected ${selected.length} course(s)` : `"${deleteConfirm.courseName || 'N/A'}" (ID: ${deleteConfirm.courseId || 'N/A'})`}? {deleteConfirm.warning} This action cannot be undone. </DialogContentText> </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}> <Button onClick={handleDeleteCancel} color="inherit">Cancel</Button> <Button onClick={handleDeleteConfirm} variant="contained" sx={{ backgroundColor: colors.error, '&:hover': { backgroundColor: 'darkred' } }} autoFocus>Delete</Button> </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewModalOpen} onClose={handleCloseViewModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>Course Details</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {viewCourse ? (
            <Stack spacing={1.5}>
              <Typography variant="h6" gutterBottom>{viewCourse.courseName || 'N/A'} ({viewCourse.courseId})</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoOutlinedIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} />
                <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Status:</Typography>
                {(() => {
                  const status = getCourseStatus(viewCourse.startingDate, viewCourse.endDate);
                  return <Typography variant="body1" sx={{ color: status.textColor, fontWeight: 'medium' }}>{status.text}</Typography>;
                })()}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}> <PersonIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} /><Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Professor:</Typography> <Typography variant="body1">{viewCourse.professorsName || 'N/A'}</Typography> </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}> <SchoolIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} /><Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Semester:</Typography> <Typography variant="body1">{viewCourse.semester || 'N/A'}</Typography> </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}> <ScheduleIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} /><Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Schedule:</Typography> <Typography variant="body1">{`${viewCourse.dayOfWeek || 'N/A'} ${viewCourse.startTime || 'N/A'}-${viewCourse.endTime || 'N/A'}`}</Typography> </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}> <CalendarMonthIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} /><Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Start Date:</Typography> <Typography variant="body1">{formatDateForDisplay(viewCourse.startingDate)}</Typography> </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}> <CalendarMonthIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} /><Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>End Date:</Typography> <Typography variant="body1">{formatDateForDisplay(viewCourse.endDate)}</Typography> </Box>
              <Box> <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Description:</Typography> <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', pl: 1 }}>{viewCourse.description || 'N/A'}</Typography> </Box>
            </Stack>
          ) : (
            <Typography>No course data available.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={handleCloseViewModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Enrollment Management Dialog */}
      <Dialog open={enrollmentModalOpen} onClose={handleCloseEnrollmentModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          Manage Enrollment{enrollmentCourse ? `: ${enrollmentCourse.courseName}` : ''}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {enrollmentCourse ? (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Currently Enrolled ({sortedEnrollmentStudents.length})
              </Typography>
              {sortedEnrollmentStudents.length > 0 ? (
                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                  <List dense>
                    {sortedEnrollmentStudents.map(student => (
                      <ListItem key={student.studentId}
                        secondaryAction={
                          <Tooltip title="Unenroll Student">
                            <IconButton edge="end" aria-label="unenroll" size="small" onClick={() => handleUnenroll(student.studentId)} sx={{ color: colors.error }}>
                              <PersonRemoveIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        }
                        sx={{ pr: 5 }} // Padding to prevent overlap with action
                      >
                        <ListItemText primary={`${student.firstName || ''} ${student.lastName || ''}`} secondary={`ID: ${student.studentId}`} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No students currently enrolled.</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Enroll New Student</Typography>
              <Autocomplete
                options={enrollableStudents}
                getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''} (ID: ${option.studentId})`}
                value={selectedStudentToEnroll}
                onChange={(event, newValue) => {
                  setSelectedStudentToEnroll(newValue);
                }}
                isOptionEqualToValue={(option, value) => option.studentId === value.studentId}
                renderInput={(params) => <TextField {...params} label="Select student to enroll" variant="outlined" size="small" />}
                size="small"
                sx={{ mb: 1 }}
                noOptionsText="All students are enrolled or no students exist"
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={handleEnroll}
                disabled={!selectedStudentToEnroll || enrollableStudents.length === 0}
                sx={{ backgroundColor: colors.green, color: colors.text, '&:hover': { backgroundColor: colors.greenDark } }}
              >
                Enroll Selected Student
              </Button>
            </>
          ) : (
            <Typography>No course selected for enrollment management.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={handleCloseEnrollmentModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
