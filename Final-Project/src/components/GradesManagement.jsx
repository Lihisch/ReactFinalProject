// src/components/GradesManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, Chip,
  Snackbar, Alert, Breadcrumbs, Link, CircularProgress, Grid, FormControl, InputLabel,
  Select, MenuItem, TextField, InputAdornment, TableSortLabel, Card, CardContent,
  TablePagination // Import TablePagination
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FunctionsIcon from '@mui/icons-material/Functions';
import DangerousIcon from '@mui/icons-material/Dangerous';
import EditIcon from '@mui/icons-material/Edit';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Icon for comments indicator
import PercentIcon from '@mui/icons-material/Percent'; // Icon for weight


const colors = {
  headerBackground: '#e0e0e0',
  headerText: '#000000',
  filterBarBg: '#fafafa',
};

const COURSES_STORAGE_KEY = 'courses';
const ASSIGNMENTS_STORAGE_KEY = 'assignments';
const STUDENTS_STORAGE_KEY = 'students';
const SUBMISSIONS_STORAGE_KEY = 'submissions';

const FAILING_THRESHOLD = 55;
const EXCELLENT_THRESHOLD = 90;

const STATUS_GRADED = 'Graded';
const STATUS_PENDING = 'Pending Grade';
const STATUS_NO_SUBMISSION = 'No Submission';

export default function GradesManagement() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ average: 0, submissionRate: 0, median: 0, failingPercentage: 0 });
  const [editingCellKey, setEditingCellKey] = useState(null);
  const [editGradeValue, setEditGradeValue] = useState('');
  const [editCommentValue, setEditCommentValue] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('studentName');

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  const safeJsonParse = (key, defaultValue = []) => {
    try {
        const item = localStorage.getItem(key);
        if (item === null || item === '') return defaultValue;
        const parsed = JSON.parse(item);
        return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (e) {
        console.error(`Error parsing ${key}`, e);
        return defaultValue;
    }
  };

  const fetchAllData = useCallback(() => {
    setError(null);
    try {
      const coursesData = safeJsonParse(COURSES_STORAGE_KEY);
      const assignmentsData = safeJsonParse(ASSIGNMENTS_STORAGE_KEY);
      const studentsData = safeJsonParse(STUDENTS_STORAGE_KEY);
      const submissionsData = safeJsonParse(SUBMISSIONS_STORAGE_KEY);

      setCourses(coursesData);
      setAssignments(assignmentsData);
      setStudents(studentsData);
      setSubmissions(submissionsData);

    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError("Failed to load data.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Memo for main table data (student-assignment rows)
  const processedGrades = useMemo(() => {
    if (!selectedCourse || !students?.length || !assignments?.length || !submissions) {
      if (!selectedCourse) setStats({ average: 0, submissionRate: 0, median: 0, failingPercentage: 0 });
      return [];
    }

    const courseAssignments = assignments.filter(a => String(a.courseId) === String(selectedCourse));
    const enrolledStudents = students.filter(s =>
        Array.isArray(s.enrolledCourses) && s.enrolledCourses.some(cId => String(cId) === String(selectedCourse))
    );

    if (enrolledStudents.length === 0 || courseAssignments.length === 0) {
        setStats({ average: 0, submissionRate: 0, median: 0, failingPercentage: 0 });
        return [];
    }

    try {
      const studentMap = new Map(students.map(s => [String(s.studentId), s.studentName || `${s.firstName || ''} ${s.lastName || ''}`.trim()]));
      // Store name and weight in assignmentMap
      const assignmentMap = new Map(assignments.map(a => [String(a.assignmentCode), { name: a.assignmentName, weight: a.weight }]));

      const submissionMap = new Map();
      submissions.forEach(sub => {
          if (sub && sub.studentId != null && sub.assignmentCode != null) {
              const key = `${String(sub.studentId)}-${String(sub.assignmentCode)}`;
              submissionMap.set(key, sub);
          }
      });

      const combinedData = [];

      for (const student of enrolledStudents) {
        const studentIdStr = String(student.studentId);

        for (const assignment of courseAssignments) {
          const assignmentCodeStr = String(assignment.assignmentCode);
          const assignmentDetails = assignmentMap.get(assignmentCodeStr);

          // Apply assignment filter *before* creating record if selected
          if (selectedAssignment && assignmentCodeStr !== String(selectedAssignment)) {
            continue;
          }

          const submissionKey = `${studentIdStr}-${assignmentCodeStr}`;
          const submission = submissionMap.get(submissionKey);

          let status = STATUS_NO_SUBMISSION;
          let grade = null;
          let comments = '';

          if (submission) {
              const rawGradeValue = submission.grade;
              if (rawGradeValue !== null && rawGradeValue !== undefined && rawGradeValue !== '' && !isNaN(Number(rawGradeValue))) {
                  grade = Number(rawGradeValue);
                  status = STATUS_GRADED;
              } else {
                  // If submission exists but no valid grade, it's pending
                  grade = null;
                  status = STATUS_PENDING;
              }
              comments = submission.comments ?? '';
          } else {
              // No submission record found
              status = STATUS_NO_SUBMISSION;
              grade = null;
              comments = '';
          }

          const gradeRecord = {
            studentId: studentIdStr,
            studentName: studentMap.get(studentIdStr) || 'Unknown Student',
            courseId: String(selectedCourse),
            assignmentCode: assignmentCodeStr,
            assignmentName: assignmentDetails?.name || 'Unknown Assignment',
            assignmentWeight: assignmentDetails?.weight, // Add weight
            submissionStatus: status,
            grade: grade,
            comments: comments,
          };

          // Apply search and status filters
          const searchTermLower = searchTerm.toLowerCase();
          const nameMatch = !searchTerm ||
                            gradeRecord.studentName.toLowerCase().includes(searchTermLower) ||
                            gradeRecord.studentId.includes(searchTermLower);

          // *** UPDATED Status Filter Logic ***
          let statusMatch = true;
          if (statusFilter) { // Only apply if a filter is selected
              if (statusFilter === STATUS_GRADED) {
                  statusMatch = (gradeRecord.submissionStatus === STATUS_GRADED);
              } else if (statusFilter === STATUS_PENDING) {
                  statusMatch = (gradeRecord.submissionStatus === STATUS_PENDING);
              } else if (statusFilter === STATUS_NO_SUBMISSION) {
                  statusMatch = (gradeRecord.submissionStatus === STATUS_NO_SUBMISSION);
              }
              // 'Submitted' option removed, handled by specific statuses now
          }


          if (nameMatch && statusMatch) {
            combinedData.push(gradeRecord);
          }
        }
      }

      // Calculate Stats based on the *filtered* combinedData
      let totalGradesCount = 0;
      let gradeSum = 0;
      let submittedOrGradedCount = 0; // Count based on status in combinedData
      const gradesArray = [];
      let failingCount = 0;

      combinedData.forEach(item => {
          if (item.grade !== null) {
              const numericGrade = item.grade;
              gradeSum += numericGrade;
              totalGradesCount++;
              gradesArray.push(numericGrade);
              if (numericGrade < FAILING_THRESHOLD) {
                  failingCount++;
              }
          }
          // Count submissions based on status (Graded or Pending)
          if (item.submissionStatus === STATUS_GRADED || item.submissionStatus === STATUS_PENDING) {
              submittedOrGradedCount++;
          }
      });

      let median = 0;
      if (gradesArray.length > 0) {
          gradesArray.sort((a, b) => a - b);
          const mid = Math.floor(gradesArray.length / 2);
          median = gradesArray.length % 2 !== 0
              ? gradesArray[mid]
              : (gradesArray[mid - 1] + gradesArray[mid]) / 2;
      }

      const avg = totalGradesCount > 0 ? (gradeSum / totalGradesCount).toFixed(1) : 0;
      // Submission rate calculation needs total *possible* submissions in the current view
      const totalPossibleSubmissionsInView = combinedData.length;
      const subRate = totalPossibleSubmissionsInView > 0 ? ((submittedOrGradedCount / totalPossibleSubmissionsInView) * 100).toFixed(0) : 0;
      const failRate = totalGradesCount > 0 ? ((failingCount / totalGradesCount) * 100).toFixed(0) : 0;

      setStats({ average: avg, submissionRate: subRate, median: median.toFixed(1), failingPercentage: failRate });

      // Apply Sorting to the filtered data
       combinedData.sort((a, b) => {
           let valA = a[orderBy];
           let valB = b[orderBy];

           // Handle sorting for grade (nulls last or first depending on order)
           if (orderBy === 'grade') {
               valA = valA === null ? (order === 'asc' ? Infinity : -Infinity) : Number(valA);
               valB = valB === null ? (order === 'asc' ? Infinity : -Infinity) : Number(valB);
           } else if (orderBy === 'assignmentWeight') {
               valA = valA === null || valA === undefined ? (order === 'asc' ? Infinity : -Infinity) : Number(valA);
               valB = valB === null || valB === undefined ? (order === 'asc' ? Infinity : -Infinity) : Number(valB);
           } else {
               // Default string comparison
               valA = String(valA ?? '').toLowerCase();
               valB = String(valB ?? '').toLowerCase();
           }

           if (valA < valB) return order === 'asc' ? -1 : 1;
           if (valA > valB) return order === 'asc' ? 1 : -1;
           return 0;
       });

      return combinedData; // Return the filtered and sorted data

    } catch (processingError) {
        console.error("Error processing grades data:", processingError);
        setError("Error processing data for display.");
        setStats({ average: 0, submissionRate: 0, median: 0, failingPercentage: 0 });
        return [];
    }

  }, [selectedCourse, selectedAssignment, searchTerm, statusFilter, students, assignments, submissions, order, orderBy]);


  // Final Weighted Grades calculation REMOVED
  // const finalGrades = useMemo(() => { ... }, [ ... ]);


  // --- Loading State Effects ---
  useEffect(() => {
      // Simplified loading logic: show loading briefly when dependencies change
      if (selectedCourse) {
          setIsLoading(true);
          // Short delay to allow rendering before potentially heavy calculation
          const timer = setTimeout(() => setIsLoading(false), 50);
          return () => clearTimeout(timer);
      } else {
          setIsLoading(false); // Not loading if no course selected
      }
  }, [selectedCourse, selectedAssignment, searchTerm, statusFilter, order, orderBy, students, assignments, submissions]); // Depend on all factors affecting processedGrades


  // --- Event Handlers ---
  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setSelectedAssignment('');
    setSearchTerm('');
    setStatusFilter('');
    setEditingCellKey(null);
    setPage(0);
    setOrderBy('studentName'); // Reset sort on course change
    setOrder('asc');
  };

  const handleAssignmentChange = (event) => {
    setSelectedAssignment(event.target.value);
    setEditingCellKey(null);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setEditingCellKey(null); // Cancel edit on search
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setEditingCellKey(null); // Cancel edit on filter change
    setPage(0);
  };

  // Renamed for clarity: This now *starts* the edit mode
  const handleStartEdit = (item) => {
    setEditingCellKey(`${item.studentId}-${item.assignmentCode}`);
    setEditGradeValue(item.grade ?? '');
    setEditCommentValue(item.comments ?? '');
  };

  const handleCancelEdit = () => {
    setEditingCellKey(null);
    setEditGradeValue('');
    setEditCommentValue('');
  };

  const handleSaveInlineEdit = () => {
    if (!editingCellKey) return;

    const [studentId, assignmentCode] = editingCellKey.split('-');
    const gradeToSave = editGradeValue === '' ? null : Number(editGradeValue);
    const commentToSave = editCommentValue.trim(); // Trim comments before saving

    if (gradeToSave !== null && (isNaN(gradeToSave) || gradeToSave < 0 || gradeToSave > 100)) {
        setSnackbar({ open: true, message: 'Invalid grade. Must be between 0 and 100.', severity: 'error' });
        return;
    }

    // Find the original *submission* data, not just the processedGrade item
    const existingSubmissionIndex = submissions.findIndex(sub => String(sub.studentId) === studentId && String(sub.assignmentCode) === assignmentCode);
    const existingSubmission = existingSubmissionIndex > -1 ? submissions[existingSubmissionIndex] : null;

    // Determine the correct status after potential edit
    let newStatus;
    if (gradeToSave !== null) {
        newStatus = STATUS_GRADED;
    } else if (existingSubmission || commentToSave) { // If a submission record exists OR there's a comment, it's at least Pending
        newStatus = STATUS_PENDING;
    } else {
        newStatus = STATUS_NO_SUBMISSION; // Should not happen if saving from an existing row, but safety check
    }

    // Check if anything actually changed
    const originalGrade = existingSubmission?.grade ?? null;
    const originalComment = existingSubmission?.comments ?? '';
    if (gradeToSave === originalGrade && commentToSave === originalComment) {
        setSnackbar({ open: true, message: 'No changes detected.', severity: 'info' });
        handleCancelEdit();
        return;
    }


    handleSaveGrade({
        studentId: studentId,
        assignmentCode: assignmentCode,
        grade: gradeToSave,
        comments: commentToSave,
        // Pass necessary info to create/update submission correctly
        courseId: selectedCourse,
        status: newStatus,
        existingSubmission: existingSubmission,
        existingSubmissionIndex: existingSubmissionIndex
    });

  };

  // Updated handleSaveGrade to handle creation/update more robustly
  const handleSaveGrade = (saveData) => {
    const { studentId, assignmentCode, grade, comments, courseId, status, existingSubmission, existingSubmissionIndex } = saveData;

    // Redundant validation check, but good practice
    if (grade !== null && (isNaN(Number(grade)) || Number(grade) < 0 || Number(grade) > 100)) {
        setSnackbar({ open: true, message: 'Invalid grade value during save.', severity: 'error' });
        handleCancelEdit();
        return;
    }

    let finalSubmissions;
    const isSubmitted = status === STATUS_GRADED || status === STATUS_PENDING; // Determine if it counts as submitted

    if (existingSubmissionIndex > -1) {
        // Update existing submission
        finalSubmissions = submissions.map((sub, index) =>
            index === existingSubmissionIndex
                ? { ...sub, grade: grade, comments: comments, submitted: isSubmitted, status: status } // Update fields
                : sub
        );
    } else {
        // Create new submission only if there's a grade or comment
        if (grade !== null || comments) {
            const newSubmission = {
                studentId: studentId,
                courseId: courseId, // Make sure courseId is included
                assignmentCode: assignmentCode,
                submitted: isSubmitted, // Based on status
                grade: grade,
                comments: comments,
                status: status,
                submissionDate: new Date().toISOString().split('T')[0] // Add submission date on creation
            };
            finalSubmissions = [...submissions, newSubmission];
        } else {
             // This case should ideally be prevented by UI logic (can't save empty for non-existent)
             setSnackbar({ open: true, message: 'Cannot save empty grade/comment for a non-submitted assignment.', severity: 'warning' });
             handleCancelEdit();
             return;
        }
    }

    try {
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(finalSubmissions));
        setSubmissions(finalSubmissions); // Update state to trigger re-render
        setSnackbar({ open: true, message: 'Grade/Comment updated successfully!', severity: 'success' });
        handleCancelEdit(); // Exit edit mode
    } catch (saveError) {
        console.error("Error saving grade:", saveError);
        setSnackbar({ open: true, message: 'Failed to save grade/comment.', severity: 'error' });
        // Don't cancel edit on save error, allow user to retry or cancel
    }
  };


  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setEditingCellKey(null); // Cancel edit on sort
    setPage(0); // Reset page on sort
  };

  const handleClearFilters = () => {
      setSelectedAssignment('');
      setSearchTerm('');
      setStatusFilter('');
      setEditingCellKey(null);
      setPage(0);
  }

  // Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    setEditingCellKey(null); // Cancel edit on page change
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setEditingCellKey(null); // Cancel edit on rows per page change
  };


   // *** UPDATED headCells ***
   const headCells = [
    { id: 'studentName', label: 'Student Name' },
    { id: 'studentId', label: 'Student ID' },
    // Conditionally show Assignment Name and Weight only if 'All Assignments' is selected
    ...(selectedAssignment ? [] : [
        { id: 'assignmentName', label: 'Assignment' },
        { id: 'assignmentWeight', label: 'Weight (%)' } // Added Weight column
    ]),
    { id: 'submissionStatus', label: 'Status' },
    { id: 'grade', label: 'Grade' },
    { id: 'comments', label: 'Comments', disableSort: true }, // Comments usually not sorted
    { id: 'actions', label: 'Actions', disableSort: true }, // Actions not sortable
  ];
  const tableColSpan = headCells.length; // Recalculate based on dynamic columns

  // Calculate rows for the current page
  const paginatedRows = processedGrades.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>

      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/"> <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home </Link>
        <Typography color="text.primary">Grades Management</Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" fontWeight="600"> Grades Management </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Manage students grades by course and assignment. Easily view status, enter grades, and add feedback.
      </Typography>

       {/* Stats Row */}
       <Grid container spacing={2} sx={{ mb: 3 }}>
         <Grid item xs={12} sm={6} md={3}>
             <Card sx={{ height: '100%' }}>
                 <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                 <Typography variant="body2" color="text.secondary" gutterBottom><AssessmentIcon fontSize='small' sx={{ verticalAlign: 'middle', mr: 0.5 }}/> Average Grade</Typography>
                 <Typography variant="h5">{selectedCourse && !isLoading ? stats.average : '-'}</Typography>
                 </CardContent>
             </Card>
         </Grid>
         <Grid item xs={12} sm={6} md={3}>
             <Card sx={{ height: '100%' }}>
                 <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                 <Typography variant="body2" color="text.secondary" gutterBottom><FunctionsIcon fontSize='small' sx={{ verticalAlign: 'middle', mr: 0.5 }}/> Median Grade</Typography>
                 <Typography variant="h5">{selectedCourse && !isLoading ? stats.median : '-'}</Typography>
                 </CardContent>
             </Card>
         </Grid>
         <Grid item xs={12} sm={6} md={3}>
             <Card sx={{ height: '100%' }}>
                 <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                 <Typography variant="body2" color="text.secondary" gutterBottom><DangerousIcon fontSize='small' sx={{ verticalAlign: 'middle', mr: 0.5 }}/> Failing (&lt; {FAILING_THRESHOLD})</Typography>
                 <Typography variant="h5">{selectedCourse && !isLoading ? `${stats.failingPercentage}%` : '-'}</Typography>
                 </CardContent>
             </Card>
         </Grid>
          <Grid item xs={12} sm={6} md={3}>
             <Card sx={{ height: '100%' }}>
                 <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                 <Typography variant="body2" color="text.secondary" gutterBottom><CheckCircleOutlineIcon fontSize='small' sx={{ verticalAlign: 'middle', mr: 0.5 }}/> Submission Rate</Typography>
                 <Typography variant="h5">{selectedCourse && !isLoading ? `${stats.submissionRate}%` : '-'}</Typography>
                 </CardContent>
             </Card>
         </Grid>
       </Grid>

      {/* Filter Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: colors.filterBarBg }}>
        <Grid container spacing={2} alignItems="center">
          {/* Course Selector */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Select Course</InputLabel>
              <Select value={selectedCourse} label="Select Course" onChange={handleCourseChange}>
                <MenuItem value="" disabled><em>Select a course...</em></MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.courseId} value={course.courseId}>
                    {course.courseId} - {course.courseName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Assignment Selector */}
           <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!selectedCourse}>
              <InputLabel>Select Assignment</InputLabel>
              <Select value={selectedAssignment} label="Select Assignment" onChange={handleAssignmentChange}>
                <MenuItem value=""><em>All Assignments</em></MenuItem>
                {assignments
                    .filter(a => String(a.courseId) === String(selectedCourse))
                    .sort((a, b) => a.assignmentName.localeCompare(b.assignmentName))
                    .map((assign) => (
                      <MenuItem key={assign.assignmentCode} value={assign.assignmentCode}>
                        {assign.assignmentName} ({assign.assignmentCode})
                      </MenuItem>
                 ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Search Filter */}
          <Grid item xs={12} sm={4} md={2}>
             <TextField fullWidth size="small" variant="outlined" placeholder="Search by name or ID..." value={searchTerm} onChange={handleSearchChange} disabled={!selectedCourse} InputProps={{ startAdornment: ( <InputAdornment position="start"> <SearchIcon fontSize="small" /> </InputAdornment> ), }} />
          </Grid>
          {/* Status Filter - UPDATED */}
          <Grid item xs={12} sm={4} md={2}>
             <FormControl fullWidth size="small" disabled={!selectedCourse}>
               <InputLabel>Status</InputLabel>
               <Select value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
                 <MenuItem value=""><em>All Statuses</em></MenuItem>
                 <MenuItem value={STATUS_GRADED}>{STATUS_GRADED}</MenuItem>
                 <MenuItem value={STATUS_PENDING}>{STATUS_PENDING}</MenuItem>
                 <MenuItem value={STATUS_NO_SUBMISSION}>{STATUS_NO_SUBMISSION}</MenuItem>
               </Select>
             </FormControl>
          </Grid>
          {/* Clear Filters Button */}
          <Grid item xs={12} sm={4} md={2}>
             <Button fullWidth variant="outlined" size="medium" onClick={handleClearFilters} disabled={!selectedCourse || (!selectedAssignment && !searchTerm && !statusFilter)}> Clear Filters </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Grades Table */}
      <Paper elevation={3} sx={{ overflow: 'hidden', mb: 4 }}>
        <TableContainer sx={{ maxHeight: 650 }}>
          <Table stickyHeader size="small" aria-label="grades table">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: colors.headerBackground, color: colors.headerText, whiteSpace: 'nowrap' } }}>
                 {headCells.map((headCell) => (
                  <TableCell key={headCell.id} sortDirection={orderBy === headCell.id ? order : false} align={headCell.id === 'assignmentWeight' ? 'right' : 'left'}>
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
              {!selectedCourse ? ( // Message when no course is selected
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><Typography>Please select a course to view grades.</Typography></TableCell></TableRow>
              ) : isLoading ? ( // Loading indicator
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : error ? ( // Error message
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><Typography color="error">{error}</Typography></TableCell></TableRow>
              ) : paginatedRows.length === 0 ? ( // Message when course selected but no data matches filters
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><Typography>No grade records found for the selected criteria.</Typography></TableCell></TableRow>
              ) : (
                // Render table rows
                paginatedRows.map((item) => {
                  const itemKey = `${item.studentId}-${item.assignmentCode}`;
                  const isEditing = editingCellKey === itemKey;
                  return (
                    <TableRow key={itemKey} hover sx={{ backgroundColor: isEditing ? 'action.hover' : 'inherit' }}>
                      {/* Student Name */}
                      <TableCell>{item.studentName}</TableCell>
                      {/* Student ID */}
                      <TableCell>{item.studentId}</TableCell>
                      {/* Assignment Name (Conditional) */}
                      {!selectedAssignment && <TableCell>{item.assignmentName}</TableCell>}
                      {/* Assignment Weight (Conditional) */}
                      {!selectedAssignment && (
                        <TableCell align="right">
                          {item.assignmentWeight !== null && item.assignmentWeight !== undefined ? `${item.assignmentWeight}%` : '-'}
                        </TableCell>
                      )}
                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={item.submissionStatus}
                          size="small"
                          variant="outlined" // Use outlined for better contrast potentially
                          color={
                            item.submissionStatus === STATUS_GRADED ? 'success' :
                            item.submissionStatus === STATUS_PENDING ? 'warning' :
                            item.submissionStatus === STATUS_NO_SUBMISSION ? 'error' :
                            'default'
                          }
                        />
                      </TableCell>
                      {/* Grade */}
                      <TableCell sx={{ minWidth: 80, paddingRight: isEditing ? 1 : 2 }}>
                        {isEditing ? (
                          <TextField
                            value={editGradeValue}
                            onChange={(e) => setEditGradeValue(e.target.value)}
                            type="number"
                            size="small"
                            variant="outlined"
                            autoFocus // Focus the grade field when editing starts
                            sx={{ width: '70px' }}
                            InputProps={{ inputProps: { min: 0, max: 100, step: "any" } }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { handleSaveInlineEdit(); e.preventDefault(); } else if (e.key === 'Escape') { handleCancelEdit(); } }}
                            onClick={(e) => e.stopPropagation()} // Prevent row click propagation
                          />
                        ) : (
                          <Box // Display Box for Grade
                            sx={{
                              minWidth: '30px',
                              padding: '4px 5px',
                              fontWeight: (item.grade !== null && (item.grade < FAILING_THRESHOLD || item.grade >= EXCELLENT_THRESHOLD)) ? 'bold' : 'normal',
                              color: (item.grade !== null && item.grade < FAILING_THRESHOLD) ? 'error.main' : (item.grade !== null && item.grade >= EXCELLENT_THRESHOLD) ? 'success.main' : 'inherit',
                            }}
                          >
                            {item.grade ?? '-'}
                          </Box>
                        )}
                      </TableCell>
                      {/* Comments */}
                      <TableCell sx={{ minWidth: 150, maxWidth: 250, paddingRight: isEditing ? 1 : 2 }}>
                        {isEditing ? (
                          <TextField // Comment Edit Field
                            value={editCommentValue}
                            onChange={(e) => setEditCommentValue(e.target.value)}
                            size="small"
                            variant="outlined"
                            multiline
                            maxRows={3}
                            sx={{ width: '100%' }}
                            onClick={(e) => e.stopPropagation()} // Prevent row click propagation
                            onKeyDown={(e) => { if (e.key === 'Escape') { handleCancelEdit(); } }} // Allow Esc to cancel from comments too
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                             {item.comments && ( // Show icon only if comments exist
                                <Tooltip title="Comment exists">
                                    <ChatBubbleOutlineIcon sx={{ fontSize: '0.9rem', color: 'text.secondary', verticalAlign: 'middle', flexShrink: 0 }} />
                                </Tooltip>
                             )}
                            <Tooltip title={item.comments || 'No comment'}>
                                <Box // Display Box for Comment Text
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    padding: '4px 0px',
                                    flexGrow: 1,
                                    color: item.comments ? 'inherit' : 'text.disabled', // Dim placeholder text
                                  }}
                                >
                                  {item.comments || '-'}
                                </Box>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                      {/* Actions - UPDATED */}
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap', padding: '0 8px' }}>
                        {isEditing ? (
                          <>
                            <Tooltip title="Save Changes (Enter)">
                              <IconButton size="small" onClick={handleSaveInlineEdit} color="primary">
                                <SaveIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel Edit (Esc)">
                              <IconButton size="small" onClick={handleCancelEdit}>
                                <CancelIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip title="Edit Grade/Comment">
                            <IconButton size="small" onClick={() => handleStartEdit(item)} color="default">
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
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
            rowsPerPageOptions={[10, 25, 50, 100]} // Added 100 option
            component="div"
            count={processedGrades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Final Grades Table REMOVED */}
      {/* {!selectedAssignment && selectedCourse && finalGrades.length > 0 && ( ... )} */}


      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
