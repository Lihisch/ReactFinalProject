// src/components/CoursesManagement.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TablePagination,
  Paper, IconButton, Tooltip, Stack, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Snackbar, Alert,
  Breadcrumbs, Link, CircularProgress, TextField, InputAdornment,
  Checkbox, Toolbar, alpha, Grid, Skeleton, List, ListItem, ListItemText,
  Autocomplete, Divider, ListItemSecondaryAction
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
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

const STUDENTS_STORAGE_KEY = 'students';
const COURSES_STORAGE_KEY = 'courses';
const SEARCH_DEBOUNCE_DELAY = 300;

const colors = {
  green: '#bed630', greenDark: '#a7bc2a', text: '#000000',
  white: '#ffffff', error: '#d32f2f',
};

const exampleCourses = [
    { courseId: 'R1001', courseName: 'React Development', creditPoints: 4, semester: 'A', professorsName: 'Dr. Tamar Cohen', dayOfWeek: 'Monday', startTime: '09:00', endTime: '12:00', description: 'Building modern web interfaces with React.', startingDate: '2024-10-28', courseHours: '09:00 - 12:00' },
    { courseId: 'N2001', courseName: 'Node.js Backend', creditPoints: 4, semester: 'A', professorsName: 'Prof. Avi Levi', dayOfWeek: 'Wednesday', startTime: '13:00', endTime: '16:00', description: 'Server-side development using Node.js and Express.', startingDate: '2024-10-30', courseHours: '13:00 - 16:00' },
    // ... other example courses
];

// --- Helper Functions ---
function descendingComparator(a, b, orderBy) {
  const valA = a[orderBy] ?? '';
  const valB = b[orderBy] ?? '';
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
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
// --- End Helper Functions ---

const headCells = [
  { id: 'courseId', label: 'Course ID', sortable: true, padding: 'normal' },
  { id: 'courseName', label: 'Course Name', sortable: true, padding: 'normal' },
  { id: 'professorsName', label: 'Professor', sortable: true, padding: 'normal' },
  { id: 'creditPoints', label: 'Credits', sortable: true, padding: 'normal', align: 'right' },
  { id: 'schedule', label: 'Schedule', sortable: false, padding: 'normal' },
  { id: 'enrolled', label: 'Enrolled', sortable: false, align: 'center', padding: 'normal' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'right', padding: 'normal' },
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

  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('courseId');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState([]);

  const [searchInput, setSearchInput] = useState('');
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilterTerm(searchInput);
      setPage(0);
    }, SEARCH_DEBOUNCE_DELAY);
    return () => { clearTimeout(handler); };
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    let currentCourses = [];
    try {
      const storedStudents = JSON.parse(localStorage.getItem(STUDENTS_STORAGE_KEY)) || [];
      if (Array.isArray(storedStudents)) setStudents(storedStudents); else setStudents([]);

      const storedCoursesString = localStorage.getItem(COURSES_STORAGE_KEY);
      if (storedCoursesString === null) {
        currentCourses = exampleCourses;
        localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(currentCourses));
      } else {
        const parsedCourses = JSON.parse(storedCoursesString);
        if (Array.isArray(parsedCourses)) currentCourses = parsedCourses; else currentCourses = [];
      }
      setCourses(currentCourses);
    } catch (error) {
      console.error("CourseManagement: Error loading data:", error);
      setSnackbar({ open: true, message: 'Error loading data.', severity: 'error' });
      setStudents([]); setCourses([]);
    } finally { setLoading(false); }
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
    if (!filterTerm) return courses;
    const lowerCaseFilter = filterTerm.toLowerCase();
    return courses.filter(course =>
      course.courseId?.toLowerCase().includes(lowerCaseFilter) ||
      course.courseName?.toLowerCase().includes(lowerCaseFilter) ||
      course.professorsName?.toLowerCase().includes(lowerCaseFilter)
    );
  }, [courses, filterTerm]);

  const sortedAndPaginatedCourses = useMemo(() => {
    const sorted = stableSort(filteredCourses, getComparator(order, orderBy));
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
    const { courseId, ...dataToDuplicate } = courseToDuplicate;
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

  const handleDeleteConfirm = useCallback(() => {
    const { courseId, isBulk } = deleteConfirm;
    const idsToDelete = isBulk ? selected : (courseId ? [courseId] : []);
    if (idsToDelete.length === 0) return;
    try {
      const currentCourses = JSON.parse(localStorage.getItem(COURSES_STORAGE_KEY)) || [];
      const currentStudents = JSON.parse(localStorage.getItem(STUDENTS_STORAGE_KEY)) || [];
      const updatedCourses = currentCourses.filter(c => !idsToDelete.includes(c.courseId));
      const updatedStudents = currentStudents.map(student => {
        if (student?.enrolledCourses?.some(id => idsToDelete.includes(id))) {
          return { ...student, enrolledCourses: student.enrolledCourses.filter(id => !idsToDelete.includes(id)) };
        }
        return student;
      });
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(updatedCourses));
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
      setCourses(updatedCourses);
      setStudents(updatedStudents);
      setSelected([]);
      setSnackbar({ open: true, message: `${idsToDelete.length} course(s) deleted successfully.`, severity: 'success' });
    } catch (error) {
      console.error("CourseManagement: Error deleting course(s):", error);
      setSnackbar({ open: true, message: 'Error deleting course(s).', severity: 'error' });
    } finally {
      handleDeleteCancel();
    }
  }, [deleteConfirm, selected]);

  const handleUnenroll = (studentIdToUnenroll) => {
    if (!enrollmentCourse || !studentIdToUnenroll) return;
    const courseId = enrollmentCourse.courseId;

    try {
        const updatedStudents = students.map(student => {
            if (student.studentId === studentIdToUnenroll) {
                const updatedEnrolledCourses = (student.enrolledCourses || []).filter(id => id !== courseId);
                return { ...student, enrolledCourses: updatedEnrolledCourses };
            }
            return student;
        });

        setStudents(updatedStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
        setEnrollmentStudentsList(prev => prev.filter(s => s.studentId !== studentIdToUnenroll));
        setSnackbar({ open: true, message: `Student unenrolled from ${enrollmentCourse.courseName}.`, severity: 'success' });

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
        const updatedStudents = students.map(student => {
            if (student.studentId === studentIdToEnroll) {
                const updatedEnrolledCourses = [...new Set([...(student.enrolledCourses || []), courseId])];
                return { ...student, enrolledCourses: updatedEnrolledCourses };
            }
            return student;
        });

        setStudents(updatedStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
        setEnrollmentStudentsList(prev => [...prev, selectedStudentToEnroll]);
        setSelectedStudentToEnroll(null);
        setSnackbar({ open: true, message: `Student enrolled in ${enrollmentCourse.courseName}.`, severity: 'success' });

    } catch (error) {
        console.error("Error enrolling student:", error);
        setSnackbar({ open: true, message: 'Error enrolling student.', severity: 'error' });
    }
  };


  const handleCloseSnackbar = (event, reason) => { if (reason === 'clickaway') return; setSnackbar(prev => ({ ...prev, open: false })); };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredCourses.length) : 0;
  const numSelected = selected.length;
  const rowCount = filteredCourses.length;

  const enrollableStudents = useMemo(() => {
    if (!enrollmentCourse || !students || !enrollmentStudentsList) return [];
    const enrolledIds = new Set(enrollmentStudentsList.map(s => s.studentId));
    return students.filter(s => !enrolledIds.has(s.studentId));
  }, [students, enrollmentStudentsList, enrollmentCourse]);

  // --- NEW: Memoized sorted list for the enrollment modal ---
  const sortedEnrollmentStudents = useMemo(() => {
    return [...enrollmentStudentsList].sort((a, b) => {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });
  }, [enrollmentStudentsList]);


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/"> <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home </Link>
        <Typography color="text.primary">Manage Courses</Typography>
      </Breadcrumbs>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, backgroundColor: colors.white, width: '100%', mb: 2 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, mb: 2,
            ...(numSelected > 0 && { bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity) }),
            display: 'flex', flexWrap: 'wrap', gap: 2,
          }}
        >
          {numSelected > 0 ? (
            <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div"> {numSelected} selected </Typography>
          ) : (
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div"> Courses </Typography>
          )}

          {numSelected > 0 ? (
            <Tooltip title="Delete Selected">
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDeleteClick} size="small"> Delete </Button>
            </Tooltip>
          ) : (
            <>
              <TextField label="Search..." variant="outlined" size="small" value={searchInput} onChange={handleSearchInputChange} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} sx={{ width: { xs: '100%', sm: 250 } }} />
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddCourse} sx={{ backgroundColor: colors.green, color: colors.text, '&:hover': { backgroundColor: colors.greenDark }, flexShrink: 0 }}> Add Course </Button>
            </>
          )}
        </Toolbar>

        <TableContainer component={Box}>
          <Table sx={{ minWidth: 900 }} aria-label="courses table" size="small">
            <TableHead sx={{ backgroundColor: 'grey.100' }}>
              <TableRow>
                <TableCell padding="checkbox"> <Checkbox color="primary" indeterminate={numSelected > 0 && numSelected < rowCount} checked={rowCount > 0 && numSelected === rowCount} onChange={handleSelectAllClick} inputProps={{ 'aria-label': 'select all courses' }} /> </TableCell>
                {headCells.map((headCell) => (
                  <TableCell key={headCell.id} align={headCell.align || 'left'} padding={headCell.padding || 'normal'} sortDirection={orderBy === headCell.id ? order : false} sx={{ fontWeight: 'bold', ...(orderBy === headCell.id && { bgcolor: 'action.selected' }) }}>
                    {headCell.sortable ? (
                      <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : 'asc'} onClick={() => handleSortRequest(headCell.id)}> {headCell.label} </TableSortLabel>
                    ) : ( headCell.label )}
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
                              <TableCell key={cell.id} align={cell.align || 'left'}><Skeleton variant="text" /></TableCell>
                          ))}
                      </TableRow>
                  ))
              ) : sortedAndPaginatedCourses.length === 0 ? (
                 <TableRow> <TableCell colSpan={headCells.length + 1} align="center" sx={{ py: 4 }}> {filterTerm ? "No courses match search." : "No courses found."} </TableCell> </TableRow>
              ) : (
                sortedAndPaginatedCourses.map((course) => {
                  const isItemSelected = isSelected(course?.courseId);
                  const labelId = `enhanced-table-checkbox-${course?.courseId}`;
                  const currentEnrollmentCount = enrollmentCounts[course.courseId] ?? 0;
                  return (
                    course && course.courseId ? (
                      <TableRow hover onClick={(event) => { if (event.target.type !== 'checkbox' && !event.target.closest('button, .enrollment-chip')) { handleCheckboxClick(event, course.courseId); } }} role="checkbox" aria-checked={isItemSelected} tabIndex={-1} key={course.courseId} selected={isItemSelected} sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity) } }}>
                        <TableCell padding="checkbox"> <Checkbox color="primary" checked={isItemSelected} onChange={(event) => handleCheckboxClick(event, course.courseId)} inputProps={{ 'aria-labelledby': labelId }} /> </TableCell>
                        <TableCell component="th" id={labelId} scope="row">{course.courseId}</TableCell>
                        <TableCell>{course.courseName || 'N/A'}</TableCell>
                        <TableCell>{course.professorsName || 'N/A'}</TableCell>
                        <TableCell align="right">{course.creditPoints ?? 'N/A'}</TableCell>
                        <TableCell>{`${course.dayOfWeek || 'N/A'} ${course.startTime || 'N/A'}-${course.endTime || 'N/A'}`}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="View/Manage Enrollment">
                            <Chip
                              icon={<PeopleAltIcon fontSize="small" />}
                              label={currentEnrollmentCount}
                              size="small"
                              variant="outlined"
                              onClick={(e) => { e.stopPropagation(); handleOpenEnrollmentModal(course); }}
                              className="enrollment-chip"
                              sx={{
                                minWidth: '50px',
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'action.hover' }
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Duplicate Course"> <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDuplicateCourse(course); }} sx={{ mr: 0.5, color: 'action.active' }}> <ContentCopyIcon fontSize="inherit" /> </IconButton> </Tooltip>
                          <Tooltip title="View Details"> <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewClick(course); }} sx={{ mr: 0.5, color: 'action.active' }}> <VisibilityIcon fontSize="inherit" /> </IconButton> </Tooltip>
                          <Tooltip title="Edit Course"> <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditCourse(course.courseId); }} sx={{ mr: 0.5, color: 'primary.main' }}> <EditIcon fontSize="inherit" /> </IconButton> </Tooltip>
                          <Tooltip title="Delete Course"> <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteClick(course.courseId, course.courseName); }} sx={{ color: colors.error }}> <DeleteIcon fontSize="inherit" /> </IconButton> </Tooltip>
                        </TableCell>
                      </TableRow>
                    ) : null
                  );
                })
              )}
              {!loading && emptyRows > 0 && ( <TableRow style={{ height: 33 * emptyRows }}> <TableCell colSpan={headCells.length + 1} /> </TableRow> )}
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

      {/* View Details Dialog (Course Info Only) */}
      <Dialog open={viewModalOpen} onClose={handleCloseViewModal} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>Course Details</DialogTitle>
          <DialogContent sx={{ pt: '20px !important' }}>
              {viewCourse ? (
                  <Stack spacing={1.5}>
                      <Typography variant="h6" gutterBottom>{viewCourse.courseName || 'N/A'} ({viewCourse.courseId})</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}> <PersonIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }}/> <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Professor:</Typography> <Typography variant="body1">{viewCourse.professorsName || 'N/A'}</Typography> </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}> <SchoolIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }}/> <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Credits:</Typography> <Typography variant="body1">{viewCourse.creditPoints ?? 'N/A'}</Typography> </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}> <ScheduleIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }}/> <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Schedule:</Typography> <Typography variant="body1">{`${viewCourse.dayOfWeek || 'N/A'} ${viewCourse.startTime || 'N/A'}-${viewCourse.endTime || 'N/A'}`}</Typography> </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}> <CalendarMonthIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }}/> <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Start Date:</Typography> <Typography variant="body1">{viewCourse.startingDate || 'N/A'}</Typography> </Box>
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
                          Currently Enrolled ({sortedEnrollmentStudents.length}) {/* Use sorted list length */}
                      </Typography>
                      {sortedEnrollmentStudents.length > 0 ? (
                          <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                              <List dense>
                                  {/* Use sorted list for rendering */}
                                  {sortedEnrollmentStudents.map(student => (
                                      <ListItem key={student.studentId}
                                        secondaryAction={
                                            <Tooltip title="Unenroll Student">
                                                <IconButton edge="end" aria-label="unenroll" size="small" onClick={() => handleUnenroll(student.studentId)} sx={{ color: colors.error }}>
                                                    <PersonRemoveIcon fontSize="inherit"/>
                                                </IconButton>
                                            </Tooltip>
                                        }
                                        sx={{ pr: 5 }}
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
                          options={enrollableStudents} // Keep using original for options
                          getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''} (${option.studentId})`}
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
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
