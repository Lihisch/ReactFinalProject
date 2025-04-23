// src/components/AssignmentsManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Snackbar, Alert, Breadcrumbs, Link,
  CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, List, ListItem,
  ListItemText, ListItemIcon, Divider, TextField, InputAdornment, TableSortLabel,
  Card, CardContent
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GradingIcon from '@mui/icons-material/Grading';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { format, isPast, parseISO, isValid } from 'date-fns';

// Simplified color palette, similar to GradesManagement
const colors = {
  headerBackground: '#e0e0e0', // Light grey for table header
  headerText: '#000000',       // Black text for table header
  filterBarBg: '#fafafa',       // Very light grey for filter area
  white: '#ffffff',
  text: '#000000',
  green: '#bed630', // Added green from CoursesManagement
  greenDark: '#a7bc2a', // Added dark green from CoursesManagement
  // Using standard MUI semantic colors (success, error, warning, primary, default)
  // instead of custom hex codes for buttons and chips where appropriate.
};


const ASSIGNMENTS_STORAGE_KEY = 'assignments';
const COURSES_STORAGE_KEY = 'courses';
const STUDENTS_STORAGE_KEY = 'students';
const SUBMISSIONS_STORAGE_KEY = 'submissions';

// --- Sorting Helper Functions ---
function descendingComparator(a, b, orderBy) {
    let aValue = a[orderBy]; let bValue = b[orderBy];
    if (bValue == null && aValue != null) return -1; if (aValue == null && bValue != null) return 1;
    if (orderBy === 'submissionDate') {
        const dateA = aValue ? parseISO(aValue) : null; const dateB = bValue ? parseISO(bValue) : null;
        const validA = dateA && isValid(dateA); const validB = dateB && isValid(dateB);
        if (!validB && validA) return -1; if (!validA && validB) return 1; if (!validA && !validB) return 0;
        if (dateB < dateA) return -1; if (dateB > dateA) return 1; return 0;
    }
    if (bValue < aValue) return -1; if (bValue > aValue) return 1; return 0;
}
function getComparator(order, orderBy) { return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy); }
function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => { const order = comparator(a[0], b[0]); if (order !== 0) return order; return a[1] - b[1]; });
    return stabilizedThis.map((el) => el[0]);
}
// --- End Sorting Helpers ---

export default function AssignmentsManagement() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, assignmentCode: null, assignmentName: '' });
  const [viewInfo, setViewInfo] = useState({ open: false, assignment: null });
  const [submissionsView, setSubmissionsView] = useState({ open: false, assignmentCode: null, assignmentName: '', studentSubmissions: [], loading: false });
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('assignmentCode');
  const [stats, setStats] = useState({ total: 0, active: 0, pastDue: 0 });

  const safeJsonParse = (key, defaultValue = []) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === '') return defaultValue;
      const parsed = JSON.parse(item);
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
          return defaultValue;
      }
      return parsed;
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  };

  const getAssignmentStatus = (submissionDateStr) => {
    if (!submissionDateStr) return 'Unknown';
    try {
      if (typeof submissionDateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(submissionDateStr)) {
          return 'Invalid Date';
      }
      const deadline = parseISO(`${submissionDateStr}T23:59:59`);
      if (!isValid(deadline)) {
          return 'Invalid Date';
      }
      return isPast(deadline) ? 'Past Due' : 'Active';
    } catch (e) {
        console.error("Error in getAssignmentStatus:", e);
        return 'Invalid Date';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return 'N/A';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return 'Invalid Date';
      return format(date, 'MMM dd, yyyy');
    } catch (e) {
        console.error("Error in formatDate:", e);
        return 'Invalid Date';
    }
  };

  const fetchInitialData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const parsedAssignments = safeJsonParse(ASSIGNMENTS_STORAGE_KEY).filter(assign => assign && assign.assignmentCode);
      const parsedCourses = safeJsonParse(COURSES_STORAGE_KEY);
      const allStudents = safeJsonParse(STUDENTS_STORAGE_KEY);
      const allSubmissions = safeJsonParse(SUBMISSIONS_STORAGE_KEY);

      const submissionMapByAssignment = new Map();
      allSubmissions.forEach(sub => {
        if (sub && sub.assignmentCode && sub.studentId) {
          if (!submissionMapByAssignment.has(sub.assignmentCode)) { submissionMapByAssignment.set(sub.assignmentCode, new Map()); }
          submissionMapByAssignment.get(sub.assignmentCode).set(sub.studentId, sub.submitted);
        }
      });

      let activeCount = 0, pastDueCount = 0;
      const enhancedAssignments = parsedAssignments.map((assign) => {
        const status = getAssignmentStatus(assign.submissionDate);
        if (status === 'Active') activeCount++;
        if (status === 'Past Due') pastDueCount++;

        const courseIdentifier = assign.courseId || assign.courseCode;
        const assignmentCourseIdString = courseIdentifier ? String(courseIdentifier).trim() : null;

        let enrolledCount = 0, submittedCount = 0;
        if (assignmentCourseIdString) {
          const assignmentSubmissions = submissionMapByAssignment.get(assign.assignmentCode) || new Map();

          allStudents.forEach(student => {
            if (student && student.studentId && Array.isArray(student.enrolledCourses)) {
              if (student.enrolledCourses.some(id => id != null && String(id).trim() === assignmentCourseIdString)) {
                enrolledCount++;
                if (assignmentSubmissions.get(student.studentId)) {
                  submittedCount++;
                }
              }
            }
          });
        }
        return { ...assign, courseIdentifier, status, enrolledCount, submittedCount };
      });

      setAssignments(enhancedAssignments);
      setCourseOptions(parsedCourses);
      setStats({ total: parsedAssignments.length, active: activeCount, pastDue: pastDueCount });

    } catch (err) {
      console.error("[FetchData] CRITICAL ERROR during initial data processing:", err);
      setError("Failed to load or process data. Check console.");
      setAssignments([]); setCourseOptions([]); setStats({ total: 0, active: 0, pastDue: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const processedAssignments = useMemo(() => {
    if (!Array.isArray(assignments)) {
        return [];
    }
    try {
        let processed = [...assignments];
        processed = processed.filter(assign => {
            if (!assign || !assign.assignmentCode) return false;
            const courseMatch = !courseFilter || (assign.courseIdentifier != null && String(assign.courseIdentifier) === String(courseFilter));
            const statusMatch = !statusFilter || assign.status === statusFilter;
            return courseMatch && statusMatch;
        });
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            processed = processed.filter(assign =>
                (assign.assignmentName && assign.assignmentName.toLowerCase().includes(lowerSearchTerm)) ||
                (assign.assignmentCode && assign.assignmentCode.toLowerCase().includes(lowerSearchTerm)) ||
                (assign.courseIdentifier && String(assign.courseIdentifier).toLowerCase().includes(lowerSearchTerm))
            );
        }
        processed = stableSort(processed, getComparator(order, orderBy));
        return processed;
    } catch (sortError) {
        console.error("Error during sorting/filtering:", sortError);
        setError("Error processing assignment list.");
        return [];
    }
  }, [assignments, courseFilter, statusFilter, searchTerm, order, orderBy]);

  const handleAddAssignment = () => { navigate('/assignmentsform'); };
  const handleEditAssignment = (assignmentCode) => { navigate(`/assignmentsform/${assignmentCode}`); };
  const handleOpenDeleteDialog = (assignmentCode, assignmentName) => { setConfirmDelete({ open: true, assignmentCode, assignmentName }); };
  const handleCloseDeleteDialog = () => { setConfirmDelete({ open: false, assignmentCode: null, assignmentName: '' }); };

  const handleConfirmDelete = () => {
    if (!confirmDelete.assignmentCode) return;
    try {
      const currentAssignments = safeJsonParse(ASSIGNMENTS_STORAGE_KEY);
      const updatedAssignments = currentAssignments.filter(a => a && a.assignmentCode && a.assignmentCode !== confirmDelete.assignmentCode);
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updatedAssignments || []));
      fetchInitialData();
      setSnackbar({ open: true, message: `Assignment '${confirmDelete.assignmentName}' deleted successfully.`, severity: 'success' });
    } catch (err) {
      console.error("Error deleting assignment:", err);
      setSnackbar({ open: true, message: 'Error deleting assignment.', severity: 'error' });
    }
    finally {
      handleCloseDeleteDialog();
    }
  };

  const handleOpenInfoDialog = (assignment) => {
    if (!assignment || !assignment.assignmentCode) {
        return;
    }
    const currentAssignmentData = assignments.find(a => a.assignmentCode === assignment.assignmentCode) || assignment;
    setViewInfo({ open: true, assignment: currentAssignmentData });
   };
  const handleCloseInfoDialog = () => { setViewInfo({ open: false, assignment: null }); };

  const handleViewSubmissions = (assignmentCode) => {
    if (!assignmentCode) return;
    setSubmissionsView(prev => ({ ...prev, loading: true, open: true, assignmentCode }));

    setTimeout(() => {
        const assignment = assignments.find(a => a.assignmentCode === assignmentCode);
        if (!assignment || !assignment.courseIdentifier) {
            setSnackbar({ open: true, message: 'Error: Assignment details or Course ID missing.', severity: 'error' });
            setSubmissionsView(prev => ({ ...prev, loading: false, open: false }));
            return;
        }

        const assignmentCourseIdString = String(assignment.courseIdentifier).trim();

        try {
            const allStudents = safeJsonParse(STUDENTS_STORAGE_KEY);
            const allSubmissions = safeJsonParse(SUBMISSIONS_STORAGE_KEY);
            const studentMap = new Map(allStudents.map(s => [s.studentId, s.studentName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || `Unknown (${s.studentId})`]));
            const submissionMap = new Map();
            allSubmissions.forEach(sub => {
                if (sub && sub.assignmentCode === assignmentCode && sub.studentId) {
                    submissionMap.set(sub.studentId, sub.submitted);
                }
            });

            const enrolledStudents = allStudents.filter(student =>
                student && student.studentId && Array.isArray(student.enrolledCourses) &&
                student.enrolledCourses.some(id => id != null && String(id).trim() === assignmentCourseIdString)
            );

            const studentSubmissionsData = enrolledStudents.map(student => {
                const studentId = student.studentId;
                const studentName = studentMap.get(studentId);
                const submitted = submissionMap.get(studentId) || false;
                return { studentId, studentName, status: submitted ? 'Submitted' : 'Not Submitted' };
            });

            setSubmissionsView({
                open: true,
                assignmentCode,
                assignmentName: assignment.assignmentName,
                studentSubmissions: studentSubmissionsData,
                loading: false
            });
        } catch (err) {
            console.error("[Submissions] Error processing submission data:", err);
            setSnackbar({ open: true, message: 'Error loading submission data.', severity: 'error' });
            setSubmissionsView(prev => ({ ...prev, loading: false, open: false }));
        }
    }, 50);
  };

  const handleCloseSubmissionsDialog = () => { setSubmissionsView({ open: false, assignmentCode: null, assignmentName: '', studentSubmissions: [], loading: false }); };
  const handleCloseSnackbar = (event, reason) => { if (reason === 'clickaway') return; setSnackbar(prev => ({ ...prev, open: false })); };
  const handleCourseFilterChange = (event) => { setCourseFilter(event.target.value); };
  const handleStatusFilterChange = (event) => { setStatusFilter(event.target.value); };
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); };
  const handleRequestSort = (property) => { const isAsc = orderBy === property && order === 'asc'; setOrder(isAsc ? 'desc' : 'asc'); setOrderBy(property); };

  const handleNavigateToGrading = (assignmentCode, courseId) => {
    if (!assignmentCode || !courseId) {
        setSnackbar({ open: true, message: 'Cannot navigate: Missing assignment or course ID.', severity: 'error' });
        return;
    }
    navigate(`/gradesform`, { state: { courseId: String(courseId), assignmentCode: assignmentCode } });
  };

  const headCells = [
    { id: 'assignmentCode', numeric: false, label: 'Code' },
    { id: 'assignmentName', numeric: false, label: 'Assignment Name' },
    { id: 'courseIdentifier', numeric: false, label: 'Course' },
    { id: 'assignmentType', numeric: false, label: 'Type' },
    { id: 'weight', numeric: true, label: 'Weight' },
    { id: 'submissionDate', numeric: false, label: 'Deadline' },
    { id: 'status', numeric: false, label: 'Status' },
  ];
  const tableColSpan = headCells.length + 1;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>

      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/"> <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home </Link>
        <Typography color="text.primary">Manage Assignments</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="600"> Assignment Management </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAssignment}
          sx={{
            backgroundColor: colors.green, // Use green color
            color: colors.text,       // Use black text
            '&:hover': {
              backgroundColor: colors.greenDark // Use darker green on hover
            }
          }}
        >
          Add Assignment
        </Button>
      </Box>

      {/* --- Stats Cards --- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Typography sx={{ fontSize: 14, display:'flex', alignItems:'center', gap: 1, mb: 1 }} color="text.secondary" gutterBottom>
                <AssignmentIcon fontSize='small' sx={{ color: 'action.active' }}/> Total Assignments
              </Typography>
              <Typography variant="h4" component="div" fontWeight="medium"> {stats.total} </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Typography sx={{ fontSize: 14, display:'flex', alignItems:'center', gap: 1, mb: 1 }} color="text.secondary" gutterBottom>
                <AccessTimeIcon fontSize='small' sx={{ color: 'action.active' }}/> Active
              </Typography>
              <Typography variant="h4" component="div" fontWeight="medium" sx={{ color: 'success.main' }}> {stats.active} </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Typography sx={{ fontSize: 14, display:'flex', alignItems:'center', gap: 1, mb: 1 }} color="text.secondary" gutterBottom>
                <EventBusyIcon fontSize='small' sx={{ color: 'action.active' }}/> Past Due
              </Typography>
              <Typography variant="h4" component="div" fontWeight="medium" sx={{ color: 'error.main' }}> {stats.pastDue} </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* --- End Stats Cards --- */}


      {/* --- Filters & Search Bar --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: colors.filterBarBg }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}> <TextField fullWidth size="small" variant="outlined" placeholder="Search..." value={searchTerm} onChange={handleSearchChange} slotProps={{ startAdornment: ( <InputAdornment position="start"> <SearchIcon fontSize="small" /> </InputAdornment> ), }} /> </Grid>
          <Grid item><FilterListIcon color="action" /></Grid>
          <Grid item xs={12} sm={3} md={3}> <FormControl fullWidth size="small"> <InputLabel>Filter by Course</InputLabel> <Select value={courseFilter} label="Filter by Course" onChange={handleCourseFilterChange}> <MenuItem value=""><em>All Courses</em></MenuItem> {courseOptions.map((course) => ( <MenuItem key={course.courseId} value={course.courseId}> {course.courseId} - {course.courseName} </MenuItem> ))} </Select> </FormControl> </Grid>
          <Grid item xs={12} sm={3} md={3}> <FormControl fullWidth size="small"> <InputLabel>Filter by Status</InputLabel> <Select value={statusFilter} label="Filter by Status" onChange={handleStatusFilterChange}> <MenuItem value=""><em>All</em></MenuItem> <MenuItem value="Active">Active</MenuItem> <MenuItem value="Past Due">Past Due</MenuItem> </Select> </FormControl> </Grid>
          <Grid item xs={12} sm={1}> <Button fullWidth variant="outlined" size="medium" onClick={() => { setCourseFilter(''); setStatusFilter(''); setSearchTerm(''); }} disabled={!courseFilter && !statusFilter && !searchTerm}> Clear </Button> </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader aria-label="assignments table">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: colors.headerBackground, color: colors.headerText } }}>
                {headCells.map((headCell) => (
                  <TableCell key={headCell.id} align={headCell.numeric ? 'center' : 'left'} sortDirection={orderBy === headCell.id ? order : false} >
                    <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : 'asc'} onClick={() => handleRequestSort(headCell.id)} sx={{ '&.MuiTableSortLabel-active': { color: colors.headerText }, '& .MuiTableSortLabel-icon': { color: `${colors.headerText} !important` } }} >
                      {headCell.label} {orderBy === headCell.id ? (<Box component="span" sx={visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</Box>) : null}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? ( <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><CircularProgress /><Typography sx={{ mt: 1 }}>Loading...</Typography></TableCell></TableRow> )
               : error ? ( <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><Typography color="error">{error}</Typography><Button onClick={fetchInitialData} sx={{ mt: 1 }}>Retry</Button></TableCell></TableRow> )
               : processedAssignments.length === 0 ? ( <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><Typography>No assignments match filters/search.</Typography></TableCell></TableRow> )
               : (
                processedAssignments.map((assign) => {
                  if (!assign || !assign.assignmentCode) return null;
                  const displayCourseId = assign.courseIdentifier || 'N/A';
                  const courseName = courseOptions.find(c => c && c.courseId != null && String(c.courseId) === String(displayCourseId))?.courseName || '';

                  return (
                    <TableRow key={assign.assignmentCode} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                      <TableCell component="th" scope="row">{assign.assignmentCode}</TableCell>
                      <TableCell>{assign.assignmentName || 'N/A'}</TableCell>
                      <TableCell>{displayCourseId} <Typography variant="caption" display="block">{courseName}</Typography></TableCell>
                      <TableCell>
                        {assign.assignmentType ? (
                           <Chip
                             label={assign.assignmentType}
                             size="small"
                             variant="outlined"
                             color={assign.assignmentType === 'Group' ? 'primary' : 'default'}
                           />
                         ) : 'N/A'}
                      </TableCell>
                      <TableCell align="center">{assign.weight != null ? `${assign.weight}%` : 'N/A'}</TableCell>
                      <TableCell>{formatDate(assign.submissionDate)}</TableCell>
                      <TableCell align="center">
                        {assign.status && (assign.status === 'Active' || assign.status === 'Past Due' || assign.status === 'Unknown' || assign.status === 'Invalid Date') ? (
                           <Chip
                             label={assign.status}
                             size="small"
                             variant="outlined"
                             color={
                               assign.status === 'Active' ? 'success' :
                               assign.status === 'Past Due' ? 'error' :
                               'default'
                             }
                           />
                         ) : ( <Typography variant="caption" color="text.secondary">-</Typography> )}
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title={`${assign.submittedCount ?? '?'} submitted / ${assign.enrolledCount ?? '?'} enrolled. Click to view details.`}>
                           <Box
                             sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mr: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.8, py: 0.3, cursor: 'pointer', '&:hover': {backgroundColor: 'action.hover'} }}
                             onClick={() => handleViewSubmissions(assign.assignmentCode)}
                           >
                             <Typography variant="body2" sx={{ lineHeight: 1 }}> {assign.submittedCount ?? '?'} / {assign.enrolledCount ?? '?'} </Typography>
                             <PeopleIcon fontSize="inherit" color="primary" sx={{ ml: 0.3 }}/>
                           </Box>
                        </Tooltip>
                        <Tooltip title="View Details"><IconButton size="small" onClick={() => handleOpenInfoDialog(assign)} color="default"><InfoIcon fontSize="inherit" /></IconButton></Tooltip>
                        <Tooltip title="Edit Assignment"><IconButton size="small" onClick={() => handleEditAssignment(assign.assignmentCode)} color="primary"><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                        <Tooltip title="Grade Assignment"><IconButton size="small" onClick={() => handleNavigateToGrading(assign.assignmentCode, assign.courseIdentifier)} color="success" disabled={!assign.courseIdentifier}><GradingIcon fontSize="inherit" /></IconButton></Tooltip>
                        <Tooltip title="Delete Assignment"><IconButton size="small" onClick={() => handleOpenDeleteDialog(assign.assignmentCode, assign.assignmentName)} color="error"><DeleteIcon fontSize="inherit" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- Dialogs --- */}
      <Dialog open={confirmDelete.open} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the assignment "{confirmDelete.assignmentName}" (Code: {confirmDelete.assignmentCode})? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewInfo.open} onClose={handleCloseInfoDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assignment Details</DialogTitle>
        <DialogContent>
          {viewInfo.assignment ? (
            <List dense>
              <ListItem><ListItemText primary="Code" secondary={viewInfo.assignment.assignmentCode} /></ListItem>
              <ListItem><ListItemText primary="Name" secondary={viewInfo.assignment.assignmentName} /></ListItem>
              <ListItem><ListItemText primary="Course ID" secondary={viewInfo.assignment.courseIdentifier || 'N/A'} /></ListItem>
              <ListItem><ListItemText primary="Type" secondary={viewInfo.assignment.assignmentType || 'N/A'} /></ListItem>
              <ListItem><ListItemText primary="Weight" secondary={viewInfo.assignment.weight != null ? `${viewInfo.assignment.weight}%` : 'N/A'} /></ListItem>
              <ListItem><ListItemText primary="Deadline" secondary={formatDate(viewInfo.assignment.submissionDate)} /></ListItem>
              <ListItem><ListItemText primary="Status" secondary={viewInfo.assignment.status} /></ListItem>
              <ListItem><ListItemText primary="Submissions" secondary={`${viewInfo.assignment.submittedCount ?? '?'} / ${viewInfo.assignment.enrolledCount ?? '?'}`} /></ListItem>
            </List>
          ) : (
            <DialogContentText>Loading details...</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInfoDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={submissionsView.open} onClose={handleCloseSubmissionsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Submissions for "{submissionsView.assignmentName}"</DialogTitle>
        <DialogContent>
          {submissionsView.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress /></Box>
          ) : submissionsView.studentSubmissions.length > 0 ? (
            <List dense>
              {submissionsView.studentSubmissions.map(sub => (
                <ListItem key={sub.studentId}>
                  <ListItemIcon>
                    {sub.status === 'Submitted' ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText primary={sub.studentName} secondary={`ID: ${sub.studentId} - ${sub.status}`} />
                </ListItem>
              ))}
            </List>
          ) : (
            <DialogContentText>No students found or no submissions recorded for this assignment in the selected course.</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubmissionsDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* --- Snackbar --- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity || 'info'} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Container>
  );
}
