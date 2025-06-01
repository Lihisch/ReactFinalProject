// src/components/GradesManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link as RouterLink, useParams } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, Chip,
  Snackbar, Alert, Breadcrumbs, Link, CircularProgress, Grid, FormControl, InputLabel,
  Select, MenuItem, TextField, InputAdornment, TableSortLabel, Card, CardContent,
  TablePagination
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
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PercentIcon from '@mui/icons-material/Percent';
import { getAllSubmissions } from '../firebase/grades';
import { listCourses } from '../firebase/courses';
import { listAssignments } from '../firebase/assignments';
import { listStudents } from '../firebase/students';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase-settings';


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

// Helper function to calculate median
const calculateMedian = (numbers) => {
    if (!numbers || numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
};

export default function GradesManagement() {
  const navigate = useNavigate();
  const params = useParams(); // Get URL parameters

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

  const fetchAllData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
        console.log('Starting to fetch all data...');
        
        // Fetch data one by one to better handle errors
        let coursesData = [];
        let assignmentsData = [];
        let studentsData = [];
        let submissionsData = [];

        try {
            coursesData = await listCourses();
            console.log('Fetched courses:', coursesData);
        } catch (err) {
            console.error('Error fetching courses:', err);
            throw new Error('Failed to load courses');
        }

        try {
            assignmentsData = await listAssignments();
            console.log('Fetched assignments:', assignmentsData);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            throw new Error('Failed to load assignments');
        }

        try {
            studentsData = await listStudents();
            console.log('Fetched students:', studentsData);
        } catch (err) {
            console.error('Error fetching students:', err);
            throw new Error('Failed to load students');
        }

        try {
            submissionsData = await getAllSubmissions();
            console.log('Fetched submissions:', submissionsData);
        } catch (err) {
            console.error('Error fetching submissions:', err);
            throw new Error('Failed to load submissions');
        }

        // Validate and filter data
        const validCourses = coursesData.filter(c => {
            const isValid = c && c.courseId;
            if (!isValid) {
                console.log('Invalid course:', c);
            }
            return isValid;
        });

        const validAssignments = assignmentsData.filter(a => {
            const isValid = a && (a.assignmentId || a.id) && a.courseId;
            if (!isValid) {
                console.log('Invalid assignment:', a);
            }
            return isValid;
        }).map(a => ({
            ...a,
            assignmentId: a.assignmentId || a.id,
            assignmentName: a.assignmentName || a.name || `Assignment ${a.assignmentId || a.id}`,
            weight: a.weight || 0
        }));

        const validStudents = studentsData.filter(s => {
            const isValid = s && s.studentId;
            if (!isValid) {
                console.log('Invalid student:', s);
            }
            return isValid;
        });

        const validSubmissions = submissionsData.filter(s => {
            const isValid = s && s.studentId && s.assignmentId && s.courseId;
            if (!isValid) {
                console.log('Invalid submission:', s);
            }
            return isValid;
        });

        console.log('Validated data:', {
            courses: validCourses,
            assignments: validAssignments,
            students: validStudents,
            submissions: validSubmissions
        });

        if (validCourses.length === 0) {
            throw new Error('No valid courses found');
        }

        setCourses(validCourses);
        setAssignments(validAssignments);
        setStudents(validStudents);
        setSubmissions(validSubmissions);

    } catch (err) {
        console.error("Error fetching initial data:", err);
        setError(err.message || "Failed to load data. Please try refreshing the page.");
    } finally {
        setIsLoading(false);
    }
}, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    // Set initial filters if courseId and studentId are present in URL params
    if (params.courseId) {
      setSelectedCourse(params.courseId);
    }
    if (params.studentId) {
      // Use studentId from URL param to set the search term for student filtering
      setSearchTerm(params.studentId);
    }
  }, [params.courseId, params.studentId]); // Re-run if URL params change

  const processedGrades = useMemo(() => {
    if (!selectedCourse) {
        setStats({ average: 0, submissionRate: 0, median: 0, failingPercentage: 0 });
        return [];
    }

    try {
        console.log('Processing grades for course:', selectedCourse);
        console.log('All assignments:', assignments);
        console.log('All students:', students);
        console.log('All submissions:', submissions);
        
        // Get course assignments - simplified filtering
        const courseAssignments = assignments.filter(a => {
            const isValid = a && a.courseId && String(a.courseId) === String(selectedCourse);
            if (!isValid) {
                console.log('Invalid assignment:', a);
            }
            return isValid;
        });
        console.log('Course assignments:', courseAssignments);

        // Get enrolled students - simplified filtering
        const enrolledStudents = students.filter(s => {
            const isValid = s && s.studentId && 
                Array.isArray(s.enrolledCourses) && 
                s.enrolledCourses.some(cId => String(cId) === String(selectedCourse));
            if (!isValid) {
                console.log('Invalid student:', s);
            }
            return isValid;
        });
        console.log('Enrolled students:', enrolledStudents);

        if (enrolledStudents.length === 0 || courseAssignments.length === 0) {
            console.log('No students or assignments found for course');
            setStats({ average: 0, submissionRate: 0, median: 0, failingPercentage: 0 });
            return [];
        }

        const combinedData = [];

        // Create a simple mapping of student names
        const studentNames = new Map(
            enrolledStudents.map(s => [
                String(s.studentId),
                `${(s.firstName || '').trim()} ${(s.lastName || '').trim()}`.trim() || 'Unknown Student'
            ])
        );

        // Process each student and assignment combination
        for (const student of enrolledStudents) {
            const studentId = String(student.studentId);

            for (const assignment of courseAssignments) {
                const assignmentId = assignment.assignmentId;

                // Skip if specific assignment is selected and this isn't it
                if (selectedAssignment && String(assignmentId) !== String(selectedAssignment)) {
                    continue;
                }

                // Find submission if exists
                const submission = submissions.find(s => 
                    String(s.studentId) === studentId && 
                    String(s.assignmentId) === String(assignmentId) &&
                    String(s.courseId) === String(selectedCourse)
                );

                // Create grade record
                let submissionStatus = STATUS_NO_SUBMISSION;
                if (submission) {
                    if (submission.grade !== null && submission.grade !== undefined && !isNaN(submission.grade)) {
                        submissionStatus = STATUS_GRADED;
                    } else {
                        submissionStatus = STATUS_PENDING;
                    }
                }
                const gradeRecord = {
                    studentId: studentId,
                    studentName: studentNames.get(studentId) || 'Unknown Student',
                    courseId: String(selectedCourse),
                    assignmentId: String(assignmentId),
                    assignmentName: assignment.assignmentName || `Assignment ${assignmentId}`,
                    assignmentWeight: assignment.weight || 0,
                    submissionStatus,
                    grade: submission?.grade ?? null,
                    comments: submission?.comments ?? '',
                };

                // Apply filters
                const searchTermLower = searchTerm.toLowerCase();
                const nameMatch = !searchTerm ||
                                gradeRecord.studentName.toLowerCase().includes(searchTermLower) ||
                                gradeRecord.studentId.includes(searchTermLower);

                const statusMatch = !statusFilter || gradeRecord.submissionStatus === statusFilter;

                if (nameMatch && statusMatch) {
                    combinedData.push(gradeRecord);
                }
            }
        }

        console.log('Combined data:', combinedData);

        // Calculate statistics
        const grades = combinedData.filter(item => item.grade !== null).map(item => item.grade);
        const totalGrades = grades.length;
        const gradeSum = grades.reduce((sum, grade) => sum + grade, 0);
        const submittedCount = combinedData.filter(item => 
            item.submissionStatus === STATUS_GRADED || item.submissionStatus === STATUS_PENDING
        ).length;

        const stats = {
            average: totalGrades > 0 ? (gradeSum / totalGrades).toFixed(1) : 0,
            submissionRate: combinedData.length > 0 ? ((submittedCount / combinedData.length) * 100).toFixed(0) : 0,
            median: totalGrades > 0 ? calculateMedian(grades).toFixed(1) : 0,
            failingPercentage: totalGrades > 0 ? 
                ((grades.filter(g => g < FAILING_THRESHOLD).length / totalGrades) * 100).toFixed(0) : 0
        };

        console.log('Calculated stats:', stats);
        setStats(stats);
        return combinedData;

    } catch (error) {
        console.error("Error processing grades:", error);
        console.error("Error details:", {
            selectedCourse,
            assignmentsCount: assignments?.length,
            studentsCount: students?.length,
            submissionsCount: submissions?.length
        });
        setError("Error processing grades data. Please try refreshing the page.");
        setStats({ average: 0, submissionRate: 0, median: 0, failingPercentage: 0 });
        return [];
    }
}, [selectedCourse, selectedAssignment, searchTerm, statusFilter, students, assignments, submissions]);

  useEffect(() => {
      if (selectedCourse) {
          setIsLoading(true);
          const timer = setTimeout(() => setIsLoading(false), 50);
          return () => clearTimeout(timer);
      } else {
          setIsLoading(false);
      }
  }, [selectedCourse, selectedAssignment, searchTerm, statusFilter, order, orderBy, students, assignments, submissions]);


  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setSelectedAssignment('');
    setSearchTerm('');
    setStatusFilter('');
    setEditingCellKey(null);
    setPage(0);
    setOrderBy('studentName');
    setOrder('asc');
  };

  const handleAssignmentChange = (event) => {
    setSelectedAssignment(event.target.value);
    setEditingCellKey(null);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setEditingCellKey(null);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setEditingCellKey(null);
    setPage(0);
  };

  const handleStartEdit = (item) => {
    // Store the complete item data for editing
    const editKey = JSON.stringify({
        studentId: item.studentId,
        assignmentId: item.assignmentId,
        courseId: item.courseId
    });
    setEditingCellKey(editKey);
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

    // Parse the stored item data
    const itemData = JSON.parse(editingCellKey);
    const { studentId: originalStudentId, assignmentId: originalAssignmentId, courseId: originalCourseId } = itemData;

    console.log('Original item data:', itemData);

    const gradeToSave = editGradeValue === '' ? null : Number(editGradeValue);
    const commentToSave = editCommentValue.trim();

    if (gradeToSave !== null && (isNaN(gradeToSave) || gradeToSave < 0 || gradeToSave > 100)) {
        setSnackbar({ open: true, message: 'Invalid grade. Must be between 0 and 100.', severity: 'error' });
        return;
    }

    handleSaveGrade({
        studentId: originalStudentId,
        assignmentId: originalAssignmentId,
        courseId: originalCourseId,
        grade: gradeToSave,
        comments: commentToSave
    });
  };

  const handleSaveGrade = async (saveData) => {
    const { studentId: saveStudentId, assignmentId: saveAssignmentId, courseId: saveCourseId, grade: saveGrade, comments: saveComments } = saveData;
    console.log('Saving with exact data:', saveData);

    if (saveGrade !== null && (isNaN(Number(saveGrade)) || Number(saveGrade) < 0 || Number(saveGrade) > 100)) {
        setSnackbar({ open: true, message: 'Invalid grade value during save.', severity: 'error' });
        handleCancelEdit();
        return;
    }

    try {
        // Create submission ID using the exact original data
        const submissionId = `${saveStudentId}_${saveCourseId}_${saveAssignmentId}`;
        console.log('Using exact submission ID:', submissionId);

        const submissionRef = doc(firestore, 'submissions', submissionId);

        const isSubmitted = saveGrade !== null || saveComments;
        const submissionData = {
            studentId: saveStudentId,
            courseId: saveCourseId,
            assignmentId: saveAssignmentId,
            grade: saveGrade !== null ? Number(saveGrade) : null,
            comments: saveComments || '',
            submitted: isSubmitted,
            submissionDate: new Date().toISOString().split('T')[0]
        };

        console.log('Saving exact submission data:', submissionData);

        await setDoc(submissionRef, submissionData, { merge: true });

        // Refresh submissions data
        const updatedSubmissions = await getAllSubmissions();
        setSubmissions(updatedSubmissions);
        setSnackbar({ open: true, message: 'Grade/Comment updated successfully!', severity: 'success' });
        handleCancelEdit();
    } catch (saveError) {
        console.error("Error saving grade:", saveError);
        setSnackbar({ open: true, message: 'Failed to save grade/comment.', severity: 'error' });
    }
  };


  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setEditingCellKey(null);
    setPage(0);
  };

  const handleClearFilters = () => {
      setSelectedAssignment('');
      setSearchTerm('');
      setStatusFilter('');
      setEditingCellKey(null);
      setPage(0);
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    setEditingCellKey(null);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setEditingCellKey(null);
  };


   const headCells = [
    { id: 'studentName', label: 'Student Name' },
    { id: 'studentId', label: 'Student ID' },
    ...(selectedAssignment ? [] : [
        { id: 'assignmentName', label: 'Assignment' },
        { id: 'assignmentWeight', label: 'Weight (%)' }
    ]),
    { id: 'submissionStatus', label: 'Status' },
    { id: 'grade', label: 'Grade' },
    { id: 'comments', label: 'Comments', disableSort: true },
    { id: 'actions', label: 'Actions', disableSort: true },
  ];
  const tableColSpan = headCells.length;

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

      <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: colors.filterBarBg }}>
        <Grid container spacing={2} alignItems="center">
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
           <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!selectedCourse}>
              <InputLabel>Select Assignment</InputLabel>
              <Select value={selectedAssignment} label="Select Assignment" onChange={handleAssignmentChange}>
                <MenuItem value=""><em>All Assignments</em></MenuItem>
                {assignments
                  .filter(a => a && a.courseId && String(a.courseId) === String(selectedCourse))
                  .sort((a, b) => a.assignmentName.localeCompare(b.assignmentName))
                  .map((assign) => (
                    <MenuItem 
                      key={`${assign.courseId}_${assign.assignmentId}`} 
                      value={assign.assignmentId}
                    >
                      {assign.assignmentName} ({assign.assignmentId})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
             <TextField fullWidth size="small" variant="outlined" placeholder="Search by name or ID..." value={searchTerm} onChange={handleSearchChange} disabled={!selectedCourse} slotProps={{ startAdornment: ( <InputAdornment position="start"> <SearchIcon fontSize="small" /> </InputAdornment> ), }} />
          </Grid>
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
          <Grid item xs={12} sm={4} md={2}>
             <Button fullWidth variant="outlined" size="medium" onClick={handleClearFilters} disabled={!selectedCourse || (!selectedAssignment && !searchTerm && !statusFilter)}> Clear Filters </Button>
          </Grid>
        </Grid>
      </Paper>

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
              {!selectedCourse ? (
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><Typography>Please select a course to view grades.</Typography></TableCell></TableRow>
              ) : isLoading ? (
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : error ? (
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><Typography color="error">{error}</Typography></TableCell></TableRow>
              ) : paginatedRows.length === 0 ? (
                 <TableRow><TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}><Typography>No grade records found for the selected criteria.</Typography></TableCell></TableRow>
              ) : (
                paginatedRows.map((item) => {
                  const itemKey = JSON.stringify({
                      studentId: item.studentId,
                      assignmentId: item.assignmentId,
                      courseId: item.courseId
                  });
                  const isEditing = editingCellKey === itemKey;
                  return (
                    <TableRow key={itemKey} hover sx={{ backgroundColor: isEditing ? 'action.hover' : 'inherit' }}>
                      <TableCell>{item.studentName}</TableCell>
                      <TableCell>{item.studentId}</TableCell>
                      {!selectedAssignment && <TableCell>{item.assignmentName}</TableCell>}
                      {!selectedAssignment && (
                        <TableCell align="right">
                          {item.assignmentWeight !== null && item.assignmentWeight !== undefined ? `${item.assignmentWeight}%` : '-'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={item.submissionStatus}
                          size="small"
                          variant="outlined"
                          color={
                            item.submissionStatus === STATUS_GRADED ? 'success' :
                            item.submissionStatus === STATUS_PENDING ? 'info' :
                            item.submissionStatus === STATUS_NO_SUBMISSION ? 'error' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 80, paddingRight: isEditing ? 1 : 2 }}>
                        {isEditing ? (
                          <TextField
                            value={editGradeValue}
                            onChange={(e) => setEditGradeValue(e.target.value)}
                            type="number"
                            size="small"
                            variant="outlined"
                            autoFocus
                            sx={{ width: '70px' }}
                            slotProps={{ slotPropsi: { min: 0, max: 100, step: "any" } }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { handleSaveInlineEdit(); e.preventDefault(); } else if (e.key === 'Escape') { handleCancelEdit(); } }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <Box
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
                      <TableCell sx={{ minWidth: 150, maxWidth: 250, paddingRight: isEditing ? 1 : 2 }}>
                        {isEditing ? (
                          <TextField
                            value={editCommentValue}
                            onChange={(e) => setEditCommentValue(e.target.value)}
                            size="small"
                            variant="outlined"
                            multiline
                            maxRows={3}
                            sx={{ width: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => { if (e.key === 'Escape') { handleCancelEdit(); } }}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                             {item.comments && (
                                <Tooltip title="Comment exists">
                                    <ChatBubbleOutlineIcon sx={{ fontSize: '0.9rem', color: 'text.secondary', verticalAlign: 'middle', flexShrink: 0 }} />
                                </Tooltip>
                             )}
                            <Tooltip title={item.comments || 'No comment'}>
                                <Box
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    padding: '4px 0px',
                                    flexGrow: 1,
                                    color: item.comments ? 'inherit' : 'text.disabled',
                                  }}
                                >
                                  {item.comments || '-'}
                                </Box>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
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
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={processedGrades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

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
