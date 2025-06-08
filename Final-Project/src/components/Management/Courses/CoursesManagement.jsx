// src/components/CoursesManagement.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TablePagination,
  Paper, IconButton, Tooltip, Stack, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Snackbar, Alert,
  Checkbox, Toolbar, Grid, TextField, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { listCourses, deleteCourses, addCourse } from '../../../firebase/courses';
import { isPast, parseISO as dateFnsParseISO, isFuture, isEqual, isToday, isValid as isValidDate } from 'date-fns';
import { listStudents, updateStudent } from '../../../firebase/students';
import CoursesTableHead from './CoursesTableHead';
import CoursesTableBody from './CoursesTableBody';
import CoursesFilterBar from './CoursesFilterBar';
import CourseDeleteDialog from './CourseDeleteDialog';
import CourseViewDialog from './CourseViewDialog';
import CourseEnrollmentDialog from './CourseEnrollmentDialog';
import { formatDateForDisplay, getCourseStatus, parseDateSafe } from './courseUtils';

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
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

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
          // Ensure students have 'id' (Firestore doc ID) and 'enrolledCourses' array
          const processedStudents = studentsData.map(student => ({
            ...student,
            id: student.id, // Ensure Firestore document ID is explicitly carried over
            enrolledCourses: Array.isArray(student.enrolledCourses) ? student.enrolledCourses : []
          }));
          setStudents(processedStudents);
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
      
      // Update students locally and prepare for Firebase update
      const studentsToUpdateInFirebase = [];
      const updatedLocalStudents = students.map(student => {
        const originalEnrolledCount = student.enrolledCourses?.length || 0;
        const newEnrolledCourses = student.enrolledCourses?.filter(id => !idsToDelete.includes(id));
        if (newEnrolledCourses.length < originalEnrolledCount) {
          const updatedStudent = { ...student, enrolledCourses: newEnrolledCourses };
          studentsToUpdateInFirebase.push(updatedStudent); // Add to list for Firebase update
          return updatedStudent;
        }
        return student;
      });
      setStudents(updatedLocalStudents);

      // Persist student changes to Firebase
      // This should ideally be a batch update if many students are affected.
      // For simplicity, we'll update one by one here.
      // Consider a Cloud Function for large-scale unenrollments.
      for (const studentToUpdate of studentsToUpdateInFirebase) {
        if (studentToUpdate.id) { // Ensure Firestore document ID is present
          await updateStudent(studentToUpdate);
        } else {
          console.warn("Skipping Firebase update for student due to missing ID:", studentToUpdate);
        }
      }

      setSelected([]);
      setSnackbar({ open: true, message: `${idsToDelete.length} course(s) deleted successfully. Student enrollments updated.`, severity: 'success' });
    } catch (error) {
      console.error("CourseManagement: Error deleting course(s):", error);
      setSnackbar({ open: true, message: 'Error deleting course(s).', severity: 'error' });
    } finally {
      handleDeleteCancel();
    }
  }, [deleteConfirm, selected, students]);

  const handleUnenroll = async (studentIdToUnenroll) => {
    if (!enrollmentCourse || !studentIdToUnenroll) return;
    const courseId = enrollmentCourse.courseId;

    try {
      const studentToUpdate = students.find(s => s.studentId === studentIdToUnenroll);
      if (studentToUpdate && studentToUpdate.id) { // Ensure student and its Firestore ID exist
        const currentEnrolledCourses = Array.isArray(studentToUpdate.enrolledCourses) ? studentToUpdate.enrolledCourses : [];
        const updatedEnrolledCourses = currentEnrolledCourses.filter(id => id !== courseId);
        
        await updateStudent({ ...studentToUpdate, enrolledCourses: updatedEnrolledCourses });
        
        const updatedStudents = students.map(s =>
          s.studentId === studentIdToUnenroll ? { ...s, enrolledCourses: updatedEnrolledCourses } : s
        );
        setStudents(updatedStudents);
        setEnrollmentStudentsList(prev => prev.filter(s => s.studentId !== studentIdToUnenroll));
        setSnackbar({ open: true, message: `Student unenrolled from ${enrollmentCourse.courseName}.`, severity: 'success' });
      } else {
         throw new Error("Student not found or missing Firestore ID for unenrollment.");
      }
    } catch (error) {
      console.error("Error unenrolling student:", error);
      setSnackbar({ open: true, message: 'Error unenrolling student.', severity: 'error' });
    }
  };

  const handleEnroll = async () => {
    if (!enrollmentCourse || !selectedStudentToEnroll) return;
    const courseId = enrollmentCourse.courseId;
    const studentIdToEnroll = selectedStudentToEnroll.studentId;

    try {
      const studentToUpdate = students.find(s => s.studentId === studentIdToEnroll);
      if (studentToUpdate && studentToUpdate.id) { // Ensure student and its Firestore ID exist
        const currentEnrolledCourses = Array.isArray(studentToUpdate.enrolledCourses) ? studentToUpdate.enrolledCourses : [];
        const updatedEnrolledCourses = [...new Set([...currentEnrolledCourses, courseId])];

        await updateStudent({ ...studentToUpdate, enrolledCourses: updatedEnrolledCourses });

        const updatedStudents = students.map(s =>
          s.studentId === studentIdToEnroll ? { ...s, enrolledCourses: updatedEnrolledCourses } : s
        );
        setStudents(updatedStudents);
        setEnrollmentStudentsList(prev => [...prev, selectedStudentToEnroll].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)));
        setSelectedStudentToEnroll(null);
        setSnackbar({ open: true, message: `Student enrolled in ${enrollmentCourse.courseName}.`, severity: 'success' });
      } else {
        throw new Error("Student not found or missing Firestore ID for enrollment.");
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
    return students
      .filter(s => !enrolledIds.has(s.studentId))
      .sort((a,b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
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
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, backgroundColor: colors.white, width: '100%', mb: 2 }}>
        <Toolbar
          sx={{
            p: { xs: 1, sm: 2 }, mb: 2,
            background: 'none',
            boxShadow: 'none',
            minHeight: 'unset',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 2
          }}
        >
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm="auto">
              {numSelected > 0 ? (
                <Typography color="inherit" variant="subtitle1" component="div"> {numSelected} selected </Typography>
              ) : (
                <Typography variant="h6" id="tableTitle" component="div" sx={{ fontWeight: 'bold', mb: 1 }}> Courses </Typography>
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
                    sx={{ background: '#fff', borderRadius: 1, boxShadow: '0 1px 4px #0001' }}
                  />
                </Grid>
                <Grid item xs="auto">
                  <Button
                    variant="contained"
                    startIcon={<FilterListIcon />}
                    onClick={handleFilterIconClick}
                    sx={{
                      backgroundColor: colors.green,
                      color: colors.text,
                      boxShadow: '0 2px 6px #0002',
                      fontWeight: 'bold',
                      borderRadius: 1,
                      px: 3,
                      '&:hover': { backgroundColor: colors.greenDark }
                    }}
                  >
                    FILTERS
                  </Button>
                </Grid>
                <Grid item xs="auto" sx={{ ml: { sm: 'auto' } }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddCourse}
                    size="medium"
                    sx={{
                      backgroundColor: colors.green,
                      color: colors.text,
                      boxShadow: '0 2px 6px #0002',
                      fontWeight: 'bold',
                      borderRadius: 1,
                      px: 3,
                      minWidth: 180,
                      '&:hover': { backgroundColor: colors.greenDark },
                      float: 'right',
                      alignSelf: 'flex-end'
                    }}
                  >
                    ADD COURSE
                  </Button>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Toolbar>

        <TableContainer component={Box}>
          <Table sx={{ minWidth: 900 }} aria-label="courses table" size="small">
            <TableHead sx={{ backgroundColor: 'grey.100' }}>
              <CoursesTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleSortRequest}
                rowCount={rowCount}
                numSelected={numSelected}
                onSelectAllClick={handleSelectAllClick}
              />
            </TableHead>
            <TableBody>
              <CoursesTableBody
                loading={loading}
                rowsPerPage={rowsPerPage}
                sortedAndPaginatedCourses={sortedAndPaginatedCourses}
                isSelected={isSelected}
                handleCheckboxClick={handleCheckboxClick}
                enrollmentCounts={enrollmentCounts}
                getCourseStatus={getCourseStatus}
                handleDuplicateCourse={handleDuplicateCourse}
                handleViewClick={handleViewClick}
                handleEditCourse={handleEditCourse}
                handleDeleteClick={handleDeleteClick}
                handleOpenEnrollmentModal={handleOpenEnrollmentModal}
                colors={colors}
                emptyRows={emptyRows}
                filteredCourses={filteredCourses}
                generateNoCoursesMessage={generateNoCoursesMessage}
              />
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination rowsPerPageOptions={[5, 10, 25, 50]} component="div" count={filteredCourses.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} sx={{ mt: 2 }} />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <CourseDeleteDialog
        open={deleteConfirm.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        courseName={deleteConfirm.courseName}
        courseId={deleteConfirm.courseId}
        isBulk={deleteConfirm.isBulk}
        selectedCount={selected.length}
        warning={deleteConfirm.warning}
      />

      {/* View Details Dialog */}
      <CourseViewDialog
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        course={viewCourse}
      />

      {/* Enrollment Management Dialog */}
      <CourseEnrollmentDialog
        open={enrollmentModalOpen}
        onClose={handleCloseEnrollmentModal}
        enrollmentCourse={enrollmentCourse}
        sortedEnrollmentStudents={sortedEnrollmentStudents}
        enrollableStudents={enrollableStudents}
        selectedStudentToEnroll={selectedStudentToEnroll}
        setSelectedStudentToEnroll={setSelectedStudentToEnroll}
        handleUnenroll={handleUnenroll}
        handleEnroll={handleEnroll}
        colors={colors}
      />

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}