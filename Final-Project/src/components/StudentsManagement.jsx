// c:\Users\ASUS\OneDrive\SCHOOL\שנה ב\סמסטר ב\REACT FINAL PROJECT\ReactFinalProject\Final-Project\src\components\StudentsManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, Snackbar, Alert, Breadcrumbs, Link,
  CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, TextField,
  InputAdornment, TableSortLabel, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, List, ListItem, ListItemText, Card, CardContent, Checkbox, Toolbar,
  alpha
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import NoAccountsIcon from '@mui/icons-material/NoAccounts';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import TablePagination from '@mui/material/TablePagination';
import { listStudents } from '../firebase/students';


// Consistent color palette similar to GradesManagement and AssignmentsManagement
const colors = {
  headerBackground: '#e0e0e0', // Light grey for table header
  headerText: '#000000',       // Black text for table header
  filterBarBg: '#fafafa',       // Very light grey for filter area
  white: '#ffffff',
  text: '#000000',
  // Using standard MUI semantic colors (success, error, warning, primary, default)
};

const STUDENTS_STORAGE_KEY = 'students';
const COURSES_STORAGE_KEY = 'courses';
const SUBMISSIONS_STORAGE_KEY = 'submissions';

const isValidId = (id) => id != null && id !== '';

export default function StudentsManagement() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Initialize to true
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('lastName');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [viewCoursesDialogOpen, setViewCoursesDialogOpen] = useState(false);
  const [studentToView, setStudentToView] = useState(null);
  const [stats, setStats] = useState({ total: 0, enrolled: 0, notEnrolled: 0 });
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [selected, setSelected] = useState([]);

  const safeJsonParse = (key, defaultValue = []) => {
    let data = defaultValue;
    try {
      const item = localStorage.getItem(key);
      if (item !== null && item !== '') {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
          data = parsed;
          if (key === STUDENTS_STORAGE_KEY) {
            const invalidStudents = data.filter(s => !isValidId(s?.studentId));
            if (invalidStudents.length > 0) {
              console.warn(`Found ${invalidStudents.length} student entries with missing or invalid studentId in localStorage key "${key}". Filtering them out for processing.`, invalidStudents);
              data = data.filter(s => isValidId(s?.studentId));
            }
          }
        } else {
          console.warn(`Data for key "${key}" is not an array. Using default.`);
        }
      }
    } catch (e) {
      console.error(`Error parsing ${key} from localStorage`, e);
      setError(`Failed to load or parse data for ${key}. Check console and localStorage.`);
      data = defaultValue;
    }
    return data;
  };


  const fetchData = useCallback(() => {
    try {
      const coursesData = safeJsonParse(COURSES_STORAGE_KEY);
      setCourses(coursesData);
      // }
    } catch (err) {
      console.error("Error loading courses from localStorage:", err);
      setError("Failed to load course data from localStorage.");
      setCourses([]); 
    } finally {   
    }
  }, []);

  useEffect(() => {
    fetchData(); 
  }, [fetchData]);

  useEffect(() => {
    setIsLoading(true); 
    setError(null);     
    listStudents()
      .then((Students) => {
        setStudents(Students);
      })
      .catch((err) => {
        console.error("Error fetching students from Firebase:", err);
        setError("Failed to load students from Firebase.");
        setStudents([]); 
      })
      .finally(() => {
        setIsLoading(false); 
      });
  }, []); 

  useEffect(() => {
    if (Array.isArray(students)) {
        const total = students.length;
        const enrolled = students.filter(s => Array.isArray(s.enrolledCourses) && s.enrolledCourses.length > 0).length;
        const notEnrolled = total - enrolled;
        setStats({ total, enrolled, notEnrolled });
    } else {
        setStats({ total: 0, enrolled: 0, notEnrolled: 0 });
    }
  }, [students]);

  const processedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];

    let filtered = [...students];

    if (selectedCourseFilter) {
      filtered = filtered.filter(student =>
        Array.isArray(student.enrolledCourses) &&
        student.enrolledCourses.some(courseId => String(courseId) === String(selectedCourseFilter))
      );
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        (student.firstName || '').toLowerCase().includes(lowerSearchTerm) ||
        (student.lastName || '').toLowerCase().includes(lowerSearchTerm) ||
        String(student.studentId).toLowerCase().includes(lowerSearchTerm)
      );
    }
    filtered.sort((a, b) => {
        let valA = a[orderBy];
        let valB = b[orderBy];
        valA = String(valA ?? '').toLowerCase();
        valB = String(valB ?? '').toLowerCase();
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        if (orderBy === 'lastName') {
            const firstA = String(a.firstName ?? '').toLowerCase();
            const firstB = String(b.firstName ?? '').toLowerCase();
            if (firstA < firstB) return order === 'asc' ? -1 : 1;
            if (firstA > firstB) return order === 'asc' ? 1 : -1;
        } else if (orderBy === 'firstName') {
            const lastA = String(a.lastName ?? '').toLowerCase();
            const lastB = String(b.lastName ?? '').toLowerCase();
             if (lastA < lastB) return order === 'asc' ? -1 : 1;
             if (lastA > lastB) return order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    return filtered;
  }, [students, selectedCourseFilter, searchTerm, order, orderBy]);

  const handleCourseFilterChange = (event) => {
    setSelectedCourseFilter(event.target.value);
    setPage(0);
    setEditingStudentId(null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
    setEditingStudentId(null);
  };

  const handleClearFilters = () => {
    setSelectedCourseFilter('');
    setSearchTerm('');
    setPage(0);
    setEditingStudentId(null);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
    setEditingStudentId(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    setEditingStudentId(null);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setEditingStudentId(null);
  };


  const handleAddStudent = () => {
    navigate('/studentform');
  };


  const handleStartEdit = (student) => {
    setEditingStudentId(student.studentId);
    setEditFirstName(student.firstName || '');
    setEditLastName(student.lastName || '');
    setSelected([]);
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setEditFirstName('');
    setEditLastName('');
  };

  const handleSaveEdit = () => {
    if (!isValidId(editingStudentId)) return;
    if (!editFirstName.trim() || !editLastName.trim()) {
        setSnackbar({ open: true, message: 'First and Last names cannot be empty.', severity: 'error' });
        return;
    }
    try {
        const editingIdStr = String(editingStudentId);
        const updatedStudents = students.map(s =>
            String(s.studentId) === editingIdStr
            ? { ...s, firstName: editFirstName.trim(), lastName: editLastName.trim() }
            : s
        );
        // TODO: Update student in Firebase here
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents)); // Keep for now, or remove if Firebase is sole source
        setStudents(updatedStudents);
        setSnackbar({ open: true, message: 'Student details updated successfully.', severity: 'success' });
        handleCancelEdit();
    } catch (saveError) {
        console.error("Error saving student details:", saveError);
        setSnackbar({ open: true, message: 'Failed to update student details.', severity: 'error' });
    }
  };

  const handleOpenDeleteDialog = (student) => {
    setStudentToDelete(student);
    setConfirmDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setConfirmDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  const handleConfirmDelete = (studentIdToDelete) => {
    const idStr = String(studentIdToDelete ?? '');
    if (idStr === '') return;

    const studentInfo = students.find(s => String(s.studentId) === idStr);
    const studentDisplayName = studentInfo ? `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() : `ID: ${idStr}`;
    try {
      // TODO: Delete student from Firebase here
      const updatedStudents = students.filter(s => String(s.studentId) !== idStr);
      const currentSubmissions = safeJsonParse(SUBMISSIONS_STORAGE_KEY);
      const updatedSubmissions = currentSubmissions.filter(sub => String(sub?.studentId) !== idStr);
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents)); // Keep for now, or remove if Firebase is sole source
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(updatedSubmissions));
      setStudents(updatedStudents);
      setSnackbar({ open: true, message: `Student ${studentDisplayName} and their submissions removed successfully.`, severity: 'success' });
    } catch (saveError) {
      console.error("Error removing student and submissions:", saveError);
      setSnackbar({ open: true, message: `Failed to remove student ${studentDisplayName}.`, severity: 'error' });
    } finally {
      handleCloseDeleteDialog();
      setSelected(prev => prev.filter(id => String(id) !== idStr));
    }
  };

  const handleOpenViewCoursesDialog = (student) => {
    console.log("Opening view dialog for student:", student);
    setStudentToView(student);
    setViewCoursesDialogOpen(true);
  };

  const handleCloseViewCoursesDialog = () => {
    setViewCoursesDialogOpen(false);
    setTimeout(() => setStudentToView(null), 150);
  };

   const getEnrolledCourseNames = useMemo(() => {
    if (!studentToView || !isValidId(studentToView.studentId) || !Array.isArray(studentToView.enrolledCourses) || !courses.length) return [];
    const courseMap = new Map(courses.map(c => [String(c?.courseId), c?.courseName]));
    return studentToView.enrolledCourses
      .map(id => ({ id: String(id), name: courseMap.get(String(id)) || `Unknown Course (ID: ${id})` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [studentToView, courses]);

  const handleManageEnrollment = (studentId) => {
      const idToNavigate = String(studentId ?? '');
      console.log("[handleManageEnrollment] Received studentId:", studentId, " | Processed idToNavigate:", idToNavigate);
      if (!isValidId(idToNavigate)) {
          console.error("[handleManageEnrollment] FAILED: Invalid ID. Navigation aborted.");
          setSnackbar({ open: true, message: 'Cannot manage enrollment: Student ID is missing or invalid.', severity: 'error' });
          return;
      }
      console.log("[handleManageEnrollment] SUCCESS: Navigating with valid ID:", idToNavigate);
      setViewCoursesDialogOpen(false);
      setStudentToView(null);
      navigate(`/enrollmentform?studentId=${idToNavigate}`);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = paginatedRows.map((n) => n.studentId);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleCheckboxClick = (event, studentId) => {
    const studentIdStr = String(studentId);
    const selectedIndex = selected.findIndex(id => String(id) === studentIdStr);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, studentId);
    } else {
      newSelected = selected.filter(id => String(id) !== studentIdStr);
    }
    setSelected(newSelected);
    setEditingStudentId(null);
  };

  const isSelected = (studentId) => {
      return selected.some(id => String(id) === String(studentId));
  }

  const handleDeleteSelected = () => {
      setIsLoading(true);
      try {
          // TODO: Delete selected students from Firebase here (batch delete if possible)
          const studentsToDeleteIds = new Set(selected.map(String));
          const updatedStudents = students.filter(s => !studentsToDeleteIds.has(String(s.studentId)));
          const currentSubmissions = safeJsonParse(SUBMISSIONS_STORAGE_KEY);
          const updatedSubmissions = currentSubmissions.filter(sub => !studentsToDeleteIds.has(String(sub?.studentId)));
          localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents)); // Keep for now, or remove if Firebase is sole source
          localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(updatedSubmissions));
          setStudents(updatedStudents);
          setSnackbar({ open: true, message: `${selected.length} student(s) and their submissions removed successfully.`, severity: 'success' });
          setSelected([]);
      } catch (saveError) {
          console.error("Error removing selected students:", saveError);
          setSnackbar({ open: true, message: 'Failed to remove selected students.', severity: 'error' });
      } finally {
          setIsLoading(false);
      }
  };

  const headCells = [
    { id: 'lastName', label: 'Last Name' },
    { id: 'firstName', label: 'First Name' },
    { id: 'studentId', label: 'Student ID' },
    { id: 'actions', label: 'Actions', disableSort: true },
  ];
  const tableColSpan = headCells.length + 1;
  const paginatedRows = processedStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const getStudentName = (student) => {
      if (!student) return { first: 'N/A', last: 'N/A' };
      return {
          first: student.firstName || 'N/A',
          last: student.lastName || 'N/A'
      };
  }
  const numSelected = selected.length;
  const rowCount = paginatedRows.length;
  const currentVisibleIds = new Set(paginatedRows.map(row => String(row.studentId)));
  const selectedVisibleCount = selected.filter(id => currentVisibleIds.has(String(id))).length;
  const onSelectAllChecked = rowCount > 0 && selectedVisibleCount === rowCount;
  const onSelectAllIndeterminate = selectedVisibleCount > 0 && selectedVisibleCount < rowCount;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>

      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/"> <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          Students Management
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
              <Typography variant="h4" component="h1" fontWeight="600"> Students Management </Typography>
              <Typography variant="body1" color="text.secondary">
                View, add, edit, and manage student information and enrollments.
              </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleAddStudent}
            size="large"
            sx={{
              backgroundColor: '#bed630', // colors.green
              color: '#000000',       // colors.text
              '&:hover': {
                backgroundColor: '#a7bc2a' // colors.greenDark
              }
            }}
          >
            Add New Student
          </Button>
      </Box>

       <Grid container spacing={2} sx={{ mb: 3 }}>
         <Grid item xs={12} sm={4} md={4}>
             <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
                 <GroupIcon sx={{ fontSize: 40, mr: 1.5, ml: 0.5, color: 'action.active' }} />
                 <CardContent sx={{p: '8px !important'}}>
                     <Typography variant="h6">{isLoading ? <CircularProgress size={20} color="primary"/> : stats.total}</Typography>
                     <Typography variant="body2" color="text.secondary">Total Students</Typography>
                 </CardContent>
             </Card>
         </Grid>
         <Grid item xs={12} sm={4} md={4}>
             <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
                 <SchoolIcon sx={{ fontSize: 40, mr: 1.5, ml: 0.5, color: 'action.active' }} />
                 <CardContent sx={{p: '8px !important'}}>
                     <Typography variant="h6">{isLoading ? <CircularProgress size={20} color="primary"/> : stats.enrolled}</Typography>
                     <Typography variant="body2" color="text.secondary">Enrolled in Courses</Typography>
                 </CardContent>
             </Card>
         </Grid>
         <Grid item xs={12} sm={4} md={4}>
             <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
                 <NoAccountsIcon sx={{ fontSize: 40, mr: 1.5, ml: 0.5, color: 'action.active' }} />
                 <CardContent sx={{p: '8px !important'}}>
                     <Typography variant="h6">{isLoading ? <CircularProgress size={20} color="primary"/> : stats.notEnrolled}</Typography>
                     <Typography variant="body2" color="text.secondary">Not Enrolled</Typography>
                 </CardContent>
             </Card>
         </Grid>
       </Grid>

      <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: colors.filterBarBg }}>
         <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Course</InputLabel>
              <Select
                value={selectedCourseFilter}
                label="Filter by Course"
                onChange={handleCourseFilterChange}
              >
                <MenuItem value=""><em>All Courses</em></MenuItem>
                {courses
                    .sort((a, b) => (a?.courseName || '').localeCompare(b?.courseName || ''))
                    .map((course) => (
                      <MenuItem key={course?.courseId ?? Math.random()} value={course?.courseId}>
                        {course?.courseId} - {course?.courseName || 'Unnamed Course'}
                      </MenuItem>
                 ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={4}>
             <TextField fullWidth size="small" variant="outlined" placeholder="Search by name or ID..." value={searchTerm} onChange={handleSearchChange} slotProps={{ startAdornment: ( <InputAdornment position="start"> <SearchIcon fontSize="small" /> </InputAdornment> ), }} />
          </Grid>
          <Grid item xs={12} sm={3} md={4}>
             <Button fullWidth variant="outlined" size="medium" onClick={handleClearFilters} disabled={!selectedCourseFilter && !searchTerm} startIcon={<ClearIcon />}>
                Clear Filters
             </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        {numSelected > 0 && (
            <Toolbar
              sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
              }}
            >
              <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
                {numSelected} selected
              </Typography>
              <Tooltip title="Delete Selected">
                <IconButton onClick={handleDeleteSelected} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Toolbar>
        )}

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="medium" aria-label="students table">
            <TableHead>
              <TableRow sx={{ '& th': { backgroundColor: colors.headerBackground, color: colors.headerText, fontWeight: 600 } }}>
                 <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={onSelectAllIndeterminate}
                        checked={onSelectAllChecked}
                        onChange={handleSelectAllClick}
                        slotProps={{ 'aria-label': 'select all students on this page' }}
                        color="primary"
                    />
                 </TableCell>
                 {headCells.map((headCell) => (
                  <TableCell key={headCell.id} sortDirection={orderBy === headCell.id ? order : false} align={headCell.id === 'actions' ? 'center' : 'left'}>
                    {headCell.disableSort ? headCell.label : (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                        sx={{ '&.MuiTableSortLabel-active': { color: colors.headerText }, '& .MuiTableSortLabel-icon': { color: `${colors.headerText} !important` } }}
                      >
                        {headCell.label}
                        {orderBy === headCell.id ? (<Box component="span" sx={visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</Box>) : null}
                      </TableSortLabel>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && !numSelected ? ( // Show loading only if not in selection mode
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 5 }}><CircularProgress color="primary"/></TableCell></TableRow>
              ) : error ? (
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 5 }}><Typography color="error">{error}</Typography></TableCell></TableRow>
              ) : paginatedRows.length === 0 ? (
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 5 }}><Typography color="text.secondary">No students found matching the criteria.</Typography></TableCell></TableRow>
              ) : (
                paginatedRows.map((student) => {
                    const studentIdStr = String(student.studentId);
                    const isEditing = String(editingStudentId) === studentIdStr;
                    const studentSelected = isSelected(student.studentId);
                    const studentNames = getStudentName(student);

                    return (
                        <TableRow
                            key={studentIdStr}
                            hover
                            role="checkbox"
                            aria-checked={studentSelected}
                            tabIndex={-1}
                            selected={studentSelected || isEditing}
                            sx={{
                                '&.Mui-selected': {
                                    bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
                                    '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity) }
                                },
                            }}
                        >
                          <TableCell padding="checkbox">
                              <Checkbox
                                  checked={studentSelected}
                                  onChange={(event) => handleCheckboxClick(event, student.studentId)}
                                  slotProps={{ 'aria-labelledby': `student-checkbox-${studentIdStr}` }}
                                  disabled={isEditing}
                                  color="primary"
                              />
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                                <TextField value={editLastName} onChange={(e) => setEditLastName(e.target.value)} size="small" variant="outlined" fullWidth autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { handleSaveEdit(); } else if (e.key === 'Escape') { handleCancelEdit(); } }} />
                            ) : ( studentNames.last )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                                <TextField value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} size="small" variant="outlined" fullWidth onKeyDown={(e) => { if (e.key === 'Enter') { handleSaveEdit(); } else if (e.key === 'Escape') { handleCancelEdit(); } }} />
                            ) : ( studentNames.first )}
                          </TableCell>
                          <TableCell>{studentIdStr}</TableCell>
                          <TableCell align="center" sx={{ whiteSpace: 'nowrap', padding: '0 8px' }}>
                            {isEditing ? (
                                <>
                                    <Tooltip title="Save Changes (Enter)">
                                      <IconButton size="small" onClick={handleSaveEdit} color="primary" >
                                        <SaveIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Cancel Edit (Esc)">
                                      <IconButton size="small" onClick={handleCancelEdit} color="default">
                                        <CancelIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>
                                </>
                            ) : (
                                <>
                                    <Tooltip title="Edit Student Details">
                                      <span>
                                        <IconButton size="small" onClick={() => handleStartEdit(student)} color="primary" disabled={numSelected > 0}>
                                            <EditIcon fontSize="inherit" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="View Enrolled Courses">
                                       <span>
                                        <IconButton size="small" onClick={() => handleOpenViewCoursesDialog(student)} color="info" disabled={numSelected > 0}>
                                            <VisibilityIcon fontSize="inherit" />
                                        </IconButton>
                                       </span>
                                    </Tooltip>
                                    <Tooltip title="Remove Student">
                                       <span>
                                        <IconButton size="small" onClick={() => handleOpenDeleteDialog(student)} color="error" disabled={numSelected > 0}>
                                            <DeleteIcon fontSize="inherit" />
                                        </IconButton>
                                       </span>
                                    </Tooltip>
                                </>
                            )}
                          </TableCell>
                        </TableRow>
                    );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={processedStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

       <Dialog
        open={confirmDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to remove the student "{getStudentName(studentToDelete).first} {getStudentName(studentToDelete).last}" (ID: {studentToDelete?.studentId})?
            <br/>
            <Typography variant="caption" color="error">This will also remove all associated submissions and cannot be undone.</Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">Cancel</Button>
          <Button onClick={() => handleConfirmDelete(studentToDelete?.studentId)} color="error" autoFocus>
            Remove Student
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewCoursesDialogOpen}
        onClose={handleCloseViewCoursesDialog}
        aria-labelledby="view-courses-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="view-courses-dialog-title">
          Enrolled Courses for {getStudentName(studentToView).first} {getStudentName(studentToView).last}
        </DialogTitle>
        <DialogContent dividers>
          {getEnrolledCourseNames.length > 0 ? (
            <List dense>
              {getEnrolledCourseNames.map((course) => (
                <ListItem key={course.id}>
                  <ListItemText primary={course.name} secondary={`ID: ${course.id}`} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" align="center" sx={{ py: 2 }}>
              This student is not currently enrolled in any courses.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
           <Button
              onClick={() => handleManageEnrollment(studentToView?.studentId)}
              startIcon={<ManageAccountsIcon />}
              variant="outlined"
              color="primary"
              disabled={!studentToView || !isValidId(studentToView.studentId)}
            >
              Manage Enrollments
            </Button>
          <Button onClick={handleCloseViewCoursesDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

       <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity || 'info'} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Container>
  );
}
