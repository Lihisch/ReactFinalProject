// src/components/AssignmentsManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, Chip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Snackbar, Alert, Breadcrumbs, Link,
  CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, List, ListItem,
  ListItemText, ListItemIcon, TextField, InputAdornment, TableSortLabel,
  Card, CardContent, TablePagination
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GradingIcon from '@mui/icons-material/Grading';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format, isPast, parseISO, isValid as isValidDate } from 'date-fns';
import { listAssignments, deleteAssignment } from '../../../firebase/assignments';
import { listStudents } from '../../../firebase/students';
import { listCourses } from '../../../firebase/courses';
import { getAllSubmissions } from '../../../firebase/submissions';

const colors = {
  headerBackground: '#e0e0e0',
  headerText: '#000000',
  filterBarBg: '#fafafa',
  white: '#ffffff',
  text: '#000000',
  green: '#bed630',
  greenDark: '#a7bc2a',
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
    return format(date, 'MMM dd, yyyy');
  } catch {
      return 'Invalid Date';
  }
};

function descendingComparator(a, b, orderBy, statusOrder) {
  let aValue = a[orderBy];
  let bValue = b[orderBy];
  if (orderBy === 'status') {
    aValue = statusOrder[getAssignmentStatus(a.dueDate)] || 99;
    bValue = statusOrder[getAssignmentStatus(b.dueDate)] || 99;
  } else if (orderBy === 'dueDate') {
    aValue = a.dueDate ? parseISO(a.dueDate).getTime() : 0;
    bValue = b.dueDate ? parseISO(b.dueDate).getTime() : 0;
  } else if (typeof aValue === 'string' && typeof bValue === 'string') {
    aValue = aValue.toLowerCase();
    bValue = bValue.toLowerCase();
    }
  if (bValue < aValue) return -1;
  if (bValue > aValue) return 1;
  return 0;
}

function getComparator(order, orderBy, statusOrder) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy, statusOrder)
    : (a, b) => -descendingComparator(a, b, orderBy, statusOrder);
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

const STATUS_ORDER = {
  'Active': 1,
  'Past Due': 2,
  'Unknown': 3,
  'Invalid Date': 4
};

export default function AssignmentsManagement() {
  const navigate = useNavigate();
  const [allAssignments, setAllAssignments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allSubmissionsData, setAllSubmissionsData] = useState([]);
  const [courseEnrollmentCounts, setCourseEnrollmentCounts] = useState({});
  const [assignmentSubmissionCounts, setAssignmentSubmissionCounts] = useState({});
  const [courseOptions, setCourseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, assignmentId: null, assignmentName: '' });
  const [viewInfo, setViewInfo] = useState({ open: false, assignment: null });
  const [submissionsView, setSubmissionsView] = useState({ open: false, assignmentId: null, assignmentName: '', studentSubmissions: [], loading: false });
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('status');
  const [stats, setStats] = useState({ total: 0, active: 0, pastDue: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assignmentsData, coursesData, studentsData, submissionsData] = await Promise.all([
        listAssignments(),
        listCourses(),
        listStudents(),
        getAllSubmissions(),
      ]);
      setAllAssignments(assignmentsData);
      setCourseOptions(coursesData);
      setAllStudents(studentsData);
      setAllSubmissionsData(submissionsData);
      const enrollCounts = {};
      studentsData.forEach(student => {
        student.enrolledCourses?.forEach(courseId => {
          enrollCounts[courseId] = (enrollCounts[courseId] || 0) + 1;
        });
      });
      setCourseEnrollmentCounts(enrollCounts);
      const subCounts = {};
      submissionsData.forEach(submission => {
        const key = submission.assignmentId;
        if (key) {
          subCounts[key] = (subCounts[key] || 0) + 1;
        }
      });
      setAssignmentSubmissionCounts(subCounts);
      const activeCount = assignmentsData.filter(a => getAssignmentStatus(a.dueDate) === 'Active').length;
      const pastDueCount = assignmentsData.filter(a => getAssignmentStatus(a.dueDate) === 'Past Due').length;
      setStats({ total: assignmentsData.length, active: activeCount, pastDue: pastDueCount });
    } catch (err) {
      setError(err.message || 'Failed to load data. Please try again.');
      setSnackbar({ open: true, message: `Error loading data: ${err.message}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processedAssignments = useMemo(() => {
    if (!Array.isArray(allAssignments)) return [];
    let filtered = allAssignments.map(assign => {
      const courseName = courseOptions.find(c => c.courseId === assign.courseId)?.courseName || 'Unknown Course';
      const status = getAssignmentStatus(assign.dueDate);
      const enrolled = courseEnrollmentCounts[assign.courseId] || 0;
      const submitted = assignmentSubmissionCounts[assign.assignmentId] || 0;
      return {
        ...assign,
        courseName,
        status,
        enrolledCount: enrolled,
        submittedCount: submitted,
      };
    });
    if (courseFilter) filtered = filtered.filter(assign => assign.courseId === courseFilter);
    if (statusFilter) filtered = filtered.filter(assign => assign.status === statusFilter);
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(assign =>
        assign.assignmentName?.toLowerCase().includes(lowerSearchTerm) ||
        assign.assignmentId?.toLowerCase().includes(lowerSearchTerm) ||
        assign.courseName?.toLowerCase().includes(lowerSearchTerm)
            );
        }
    return stableSort(filtered, getComparator(order, orderBy, STATUS_ORDER));
  }, [allAssignments, courseOptions, courseFilter, statusFilter, searchTerm, order, orderBy, courseEnrollmentCounts, assignmentSubmissionCounts]);

  const handleAddAssignment = () => navigate('/assignmentsform');
  const handleEditAssignment = (assignmentId) => {
    if (!assignmentId) {
      setSnackbar({ open: true, message: 'Invalid assignment ID for edit.', severity: 'error' });
      return;
    }
    navigate(`/assignmentsform/${assignmentId}`);
  };
  const handleCopyAssignment = (assignmentId) => {
    if (!assignmentId) {
      setSnackbar({ open: true, message: 'Invalid assignment ID for duplicate.', severity: 'error' });
      return;
    }
    navigate(`/assignmentsform/copy/${assignmentId}`);
  };
  const handleOpenDeleteDialog = (assignmentId, assignmentName) => {
    setConfirmDelete({ open: true, assignmentId, assignmentName });
  };
  const handleCloseDeleteDialog = () => setConfirmDelete({ open: false, assignmentId: null, assignmentName: '' });
  const handleConfirmDelete = async () => {
    if (!confirmDelete.assignmentId) return;
    try {
      await deleteAssignment(confirmDelete.assignmentId);
      setSnackbar({ open: true, message: `Assignment '${confirmDelete.assignmentName}' deleted.`, severity: 'success' });
      fetchData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error deleting assignment.', severity: 'error' });
    } finally {
      handleCloseDeleteDialog();
    }
  };
  const handleOpenInfoDialog = (assignment) => {
    if (!assignment || !assignment.assignmentId) return;
    setViewInfo({ open: true, assignment });
   };
  const handleCloseInfoDialog = () => setViewInfo({ open: false, assignment: null });
  const handleViewSubmissions = (assignment) => {
    if (!assignment || !assignment.assignmentId) return;
    setSubmissionsView(prev => ({
      ...prev,
      loading: true,
      open: true,
      assignmentId: assignment.assignmentId,
      assignmentName: assignment.assignmentName
    }));
    const currentAssignmentIdStr = String(assignment.assignmentId).trim();
    const currentCourseIdStr = String(assignment.courseId).trim();
    const relevantSubmissions = allSubmissionsData.filter(sub =>
      String(sub.assignmentId).trim() === currentAssignmentIdStr
    );
    const submittedStudentIds = new Set(
      relevantSubmissions.map(s => String(s.studentId).trim())
    );
    const studentsInCourse = allStudents.filter(student =>
      Array.isArray(student.enrolledCourses) &&
      student.enrolledCourses.map(cId => String(cId).trim()).includes(currentCourseIdStr)
            );
    const studentSubmissionsData = studentsInCourse.map((student) => {
      const normalizedId = String(student.studentId).trim();
      const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || `Student ${normalizedId}`;
      const hasSubmitted = submittedStudentIds.has(normalizedId);
      return {
        studentId: normalizedId,
        studentName: studentName,
        status: hasSubmitted ? 'Submitted' : 'Not Submitted'
      };
            });
            setSubmissionsView({
                open: true,
      assignmentId: assignment.assignmentId,
                assignmentName: assignment.assignmentName,
                studentSubmissions: studentSubmissionsData,
                loading: false
            });
  };
  const handleCloseSubmissionsDialog = () => setSubmissionsView({ open: false, assignmentId: null, assignmentName: '', studentSubmissions: [], loading: false });
  const handleCloseSnackbar = (event, reason) => { if (reason === 'clickaway') return; setSnackbar(prev => ({ ...prev, open: false })); };
  const handleCourseFilterChange = (event) => { setCourseFilter(event.target.value); setPage(0); };
  const handleStatusFilterChange = (event) => { setStatusFilter(event.target.value); setPage(0);};
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setPage(0);};
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  const handleNavigateToGrading = (assignmentId, courseId) => {
    if (!assignmentId || !courseId) {
      setSnackbar({ open: true, message: 'Missing assignment or course ID.', severity: 'error' });
        return;
    }
    navigate(`/gradesform`, { state: { courseId: String(courseId), assignmentId } });
  };
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const headCells = [
    { id: 'status', numeric: false, label: 'Status', sortable: true },
    { id: 'assignmentId', numeric: false, label: 'Code', sortable: true },
    { id: 'assignmentName', numeric: false, label: 'Assignment Name', sortable: true },
    { id: 'courseName', numeric: false, label: 'Course', sortable: true },
    { id: 'assignmentType', numeric: false, label: 'Type', sortable: false },
    { id: 'weight', numeric: true, label: 'Weight', sortable: true },
    { id: 'dueDate', numeric: false, label: 'Deadline', sortable: true },
    { id: 'submissions', numeric: false, label: 'Submissions', sortable: false },
    { id: 'actions', numeric: false, label: 'Actions', sortable: false, align: 'center' },
  ];
  const tableColSpan = headCells.length;
  const paginatedAssignments = processedAssignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/"> <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home </Link>
        <Typography color="text.primary">Manage Assignments</Typography>
      </Breadcrumbs>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="600"> Assignment Management </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddAssignment} sx={{ backgroundColor: colors.green, color: colors.text, '&:hover': { backgroundColor: colors.greenDark }}}> Add Assignment </Button>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}> <Card sx={{ boxShadow: 1 }}> <CardContent sx={{ textAlign: 'center' }}> <Typography variant="h6">{stats.total}</Typography> <Typography color="text.secondary">Total Assignments</Typography> </CardContent> </Card> </Grid>
        <Grid item xs={12} sm={4}> <Card sx={{ boxShadow: 1 }}> <CardContent sx={{ textAlign: 'center' }}> <Typography variant="h6" color="success.main">{stats.active}</Typography> <Typography color="text.secondary">Active</Typography> </CardContent> </Card> </Grid>
        <Grid item xs={12} sm={4}> <Card sx={{ boxShadow: 1 }}> <CardContent sx={{ textAlign: 'center' }}> <Typography variant="h6" color="error.main">{stats.pastDue}</Typography> <Typography color="text.secondary">Past Due</Typography> </CardContent> </Card> </Grid>
      </Grid>
      <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: colors.filterBarBg }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}> <TextField fullWidth size="small" variant="outlined" placeholder="Search..." value={searchTerm} onChange={handleSearchChange} InputProps={{ startAdornment: ( <InputAdornment position="start"> <SearchIcon fontSize="small" /> </InputAdornment> ), }} /> </Grid>
          <Grid item xs={12} sm={6} md={3}> <FormControl fullWidth size="small"> <InputLabel>Course</InputLabel> <Select value={courseFilter} label="Course" onChange={handleCourseFilterChange}> <MenuItem value=""><em>All Courses</em></MenuItem> {courseOptions.map((course) => ( <MenuItem key={course.courseId} value={course.courseId}> {course.courseId} - {course.courseName} </MenuItem> ))} </Select> </FormControl> </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Past Due">Past Due</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}> <Button fullWidth variant="outlined" size="medium" onClick={() => { setCourseFilter(''); setStatusFilter(''); setSearchTerm(''); setPage(0); }} disabled={!courseFilter && !statusFilter && !searchTerm}> Clear Filters </Button> </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="assignments table" size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: colors.headerBackground, color: colors.headerText } }}>
                {headCells.map((headCell) => (
                  <TableCell key={headCell.id} align={headCell.align || (headCell.numeric ? 'center' : 'left')} sortDirection={orderBy === headCell.id ? order : false} >
                    {headCell.sortable === false ? headCell.label :
                      <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : 'asc'} onClick={() => handleRequestSort(headCell.id)} sx={{ '&.MuiTableSortLabel-active': { color: colors.headerText }, '& .MuiTableSortLabel-icon': { color: `${colors.headerText} !important` } }} >
                      {headCell.label} {orderBy === headCell.id ? (<Box component="span" sx={visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</Box>) : null}
                    </TableSortLabel>
                    }
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow> <TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}> <CircularProgress /> <Typography sx={{ mt: 1 }}>Loading Assignments...</Typography> </TableCell> </TableRow>
              ) : error ? (
                <TableRow> <TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}> <Typography color="error">{error}</Typography> <Button onClick={fetchData} sx={{ mt: 1 }}>Retry</Button> </TableCell> </TableRow>
              ) : paginatedAssignments.length === 0 ? (
                <TableRow> <TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}> <Typography>No assignments match filters/search.</Typography> </TableCell> </TableRow>
              ) : (
                paginatedAssignments.map((assign) => (
                    <TableRow key={assign.assignmentId} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                    <TableCell>
                        <Chip label={assign.status} size="small" variant="outlined"
                            color={ assign.status === 'Active' ? 'success' : assign.status === 'Past Due' ? 'error' : 'default'}
                        />
                    </TableCell>
                      <TableCell component="th" scope="row">{assign.assignmentId}</TableCell>
                      <TableCell>{assign.assignmentName || 'N/A'}</TableCell>
                    <TableCell> {assign.courseName} <Typography variant="caption" display="block">{assign.courseId}</Typography> </TableCell>
                    <TableCell> <Chip label={assign.assignmentType || 'N/A'} size="small" variant="outlined" color={assign.assignmentType === 'Group' ? 'primary' : 'default'} /> </TableCell>
                    <TableCell align="center">{assign.weight != null ? `${assign.weight}%` : 'N/A'}</TableCell>
                    <TableCell>{formatDate(assign.dueDate)}</TableCell>
                      <TableCell>
                        <Tooltip title="View student submissions">
                          <Chip
                                icon={<PeopleIcon fontSize="small" />}
                                label={`${assign.submittedCount} / ${assign.enrolledCount}`}
                            size="small"
                            variant="outlined"
                                onClick={() => handleViewSubmissions(assign)}
                                sx={{ cursor: 'pointer' }}
                            />
                        </Tooltip>
                      </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="View Details"><IconButton size="small" onClick={() => handleOpenInfoDialog(assign)}><InfoIcon fontSize="inherit" /></IconButton></Tooltip>
                      <Tooltip title="Edit Assignment"><IconButton size="small" onClick={() => handleEditAssignment(assign.assignmentId)} color="primary"><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                      <Tooltip title="Duplicate Assignment"><IconButton size="small" onClick={() => handleCopyAssignment(assign.assignmentId)} color="secondary"><ContentCopyIcon fontSize="inherit" /></IconButton></Tooltip>
                      <Tooltip title="Grade Assignment"><IconButton size="small" onClick={() => handleNavigateToGrading(assign.assignmentId, assign.courseId)} color="success" disabled={!assign.courseId}><GradingIcon fontSize="inherit" /></IconButton></Tooltip>
                      <Tooltip title="Delete Assignment"><IconButton size="small" onClick={() => handleOpenDeleteDialog(assign.assignmentId, assign.assignmentName)} color="error"><DeleteIcon fontSize="inherit" /></IconButton></Tooltip>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={processedAssignments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      <Dialog open={confirmDelete.open} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete "{confirmDelete.assignmentName}" (Code: {confirmDelete.assignmentId})? This cannot be undone.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={handleCloseDeleteDialog}>Cancel</Button><Button onClick={handleConfirmDelete} color="error" autoFocus>Delete</Button></DialogActions>
      </Dialog>
      <Dialog open={viewInfo.open} onClose={handleCloseInfoDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assignment Details: {viewInfo.assignment?.assignmentName}</DialogTitle>
        <DialogContent dividers>
          {viewInfo.assignment ? (
            <List dense>
              <ListItem><ListItemText primary="Code" secondary={viewInfo.assignment.assignmentId} /></ListItem>
              <ListItem><ListItemText primary="Course" secondary={`${viewInfo.assignment.courseName} (${viewInfo.assignment.courseId})`} /></ListItem>
              <ListItem><ListItemText primary="Type" secondary={viewInfo.assignment.assignmentType || 'N/A'} /></ListItem>
              {viewInfo.assignment.assignmentType === 'Group' && (<>
                <ListItem><ListItemText primary="Min Participants" secondary={viewInfo.assignment.minParticipants || 'N/A'} /></ListItem>
                <ListItem><ListItemText primary="Max Participants" secondary={viewInfo.assignment.maxParticipants || 'N/A'} /></ListItem>
              </>)}
              <ListItem><ListItemText primary="Weight" secondary={viewInfo.assignment.weight != null ? `${viewInfo.assignment.weight}%` : 'N/A'} /></ListItem>
              <ListItem><ListItemText primary="Deadline" secondary={formatDate(viewInfo.assignment.dueDate)} /></ListItem>
              <ListItem><ListItemText primary="Status" secondary={getAssignmentStatus(viewInfo.assignment.dueDate)} /></ListItem>
              <ListItem><ListItemText primary="Description" secondary={viewInfo.assignment.description || 'N/A'} sx={{ whiteSpace: 'pre-wrap' }} /></ListItem>
              <ListItem><ListItemText primary="File Name" secondary={viewInfo.assignment.fileName || 'No file attached'} /></ListItem>
              <ListItem><ListItemText primary="Submissions" secondary={`${viewInfo.assignment.submittedCount} / ${viewInfo.assignment.enrolledCount}`} /></ListItem>
            </List>
          ) : <CircularProgress />}
        </DialogContent>
        <DialogActions><Button onClick={handleCloseInfoDialog}>Close</Button></DialogActions>
      </Dialog>
      <Dialog open={submissionsView.open} onClose={handleCloseSubmissionsDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Submissions for "{submissionsView.assignmentName}"</DialogTitle>
        <DialogContent dividers>
          {submissionsView.loading ? <CircularProgress /> : submissionsView.studentSubmissions.length > 0 ? (
            <List dense>
              {submissionsView.studentSubmissions.map(sub => (
                <ListItem key={sub.studentId}>
                  <ListItemIcon>{sub.status === 'Submitted' ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}</ListItemIcon>
                  <ListItemText primary={sub.studentName} secondary={`ID: ${sub.studentId} - ${sub.status}`} />
                </ListItem>
              ))}
            </List>
          ) : <Typography>No submission data for this assignment.</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={handleCloseSubmissionsDialog}>Close</Button></DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
