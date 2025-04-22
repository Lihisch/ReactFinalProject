// src/components/AssignmentsForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useParams } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Grid, FormControl, InputLabel,
  Select, MenuItem, Snackbar, Alert, Stack, Breadcrumbs, Link, CircularProgress,
  FormHelperText
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';

const colors = {
  green: '#bed630', greenDark: '#a7bc2a', text: '#000000', white: '#ffffff'
};

const ASSIGNMENTS_STORAGE_KEY = 'assignments';
const COURSES_STORAGE_KEY = 'courses';

export default function AssignmentForm() {
  const navigate = useNavigate();
  const { assignmentCode: editAssignmentCode } = useParams();
  const isEditMode = Boolean(editAssignmentCode);

  const initialFormData = {
    assignmentCode: '',
    courseId: '',
    courseName: '', 
    assignmentName: '',
    assignmentType: '',
    minParticipants: '',
    maxParticipants: '',
    submissionDate: '',
    weight: '',
    description: '',
    fileName: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [selectedFile, setSelectedFile] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(isEditMode);

  const formatAssignmentCode = (code) => code ? code.toString().padStart(3, '0') : '';

  useEffect(() => {
    let didCancel = false;
    const loadData = async () => {
      try {
        const storedCourses = JSON.parse(localStorage.getItem(COURSES_STORAGE_KEY)) || [];
        if (!didCancel) setCourseOptions(storedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        if (!didCancel) setSnackbar({ open: true, message: 'Error loading course options.', severity: 'error' });
      }

      if (isEditMode) {
        setIsLoading(true);
        try {
          const existingAssignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)) || [];
          const assignmentToEdit = existingAssignments.find(assign => assign && assign.assignmentCode === editAssignmentCode);

          if (assignmentToEdit) {
            if (!didCancel) {
              setFormData({
                assignmentCode: assignmentToEdit.assignmentCode,
                courseId: assignmentToEdit.courseId || assignmentToEdit.courseCode || '',
                courseName: assignmentToEdit.courseName || '',
                assignmentName: assignmentToEdit.assignmentName || '',
                assignmentType: assignmentToEdit.assignmentType || '',
                minParticipants: assignmentToEdit.minParticipants ?? '',
                maxParticipants: assignmentToEdit.maxParticipants ?? '',
                submissionDate: assignmentToEdit.submissionDate || '',
                weight: assignmentToEdit.weight ?? '',
                description: assignmentToEdit.description || '',
                fileName: assignmentToEdit.fileName || '',
              });
            }
          } else {
            if (!didCancel) {
              setSnackbar({ open: true, message: `Error: Assignment with code ${editAssignmentCode} not found.`, severity: 'error' });
              navigate('/AssignmentsManagement');
            }
          }
        } catch (err) {
          console.error("Error loading assignment for editing:", err);
          if (!didCancel) setSnackbar({ open: true, message: 'Error loading assignment data.', severity: 'error' });
        } finally {
          if (!didCancel) setIsLoading(false);
        }
      } else {
        try {
            let existingAssignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)) || [];
            existingAssignments = existingAssignments.filter(assign => assign && assign.assignmentCode);
            const maxCode = existingAssignments.reduce((max, assignment) => {
                const code = parseInt(assignment.assignmentCode);
                return !isNaN(code) ? Math.max(max, code) : max;
            }, 0);
            const nextCodeValue = maxCode + 1;
            if (!didCancel) {
                setFormData(prev => ({ ...initialFormData, assignmentCode: formatAssignmentCode(nextCodeValue) }));
            }
        } catch (err) {
            console.error("Error determining next assignment code:", err);
             if (!didCancel) setSnackbar({ open: true, message: 'Error preparing form. Cannot determine next assignment code.', severity: 'error' });
        }
        setIsLoading(false);
      }
    };
    loadData();
    return () => { didCancel = true; };
  }, [isEditMode, editAssignmentCode, navigate]);

  const validate = () => {
    const temp = {};
    // *** CHANGED: Check courseId ***
    if (!formData.courseId) temp.courseId = 'Course is required.';
    if (!formData.assignmentName.trim()) temp.assignmentName = 'Assignment Name is required.';
    if (!formData.assignmentType) temp.assignmentType = 'Assignment Type is required.';
    if (!formData.submissionDate) temp.submissionDate = 'Submission Deadline is required.';

    const weightValue = parseFloat(formData.weight);
    if (formData.weight === '' || isNaN(weightValue)) {
        temp.weight = 'Weight is required and must be a number.';
    } else if (weightValue < 0 || weightValue > 100) {
        temp.weight = 'Weight must be between 0 and 100.';
    // *** CHANGED: Check courseId ***
    } else if (formData.courseId) {
        let existingAssignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)) || [];
        existingAssignments = existingAssignments.filter(assign => assign && assign.assignmentCode);
        const assignmentsForCourse = existingAssignments.filter(
            // *** CHANGED: Compare courseId (or fallback courseCode) ***
            (assign) => (assign.courseId || assign.courseCode) === formData.courseId &&
                         (!isEditMode || assign.assignmentCode !== editAssignmentCode)
        );
        const currentTotalWeight = assignmentsForCourse.reduce(
            (sum, assign) => sum + parseFloat(assign.weight || 0), 0
        );
        const prospectiveTotalWeight = currentTotalWeight + weightValue;
        if (prospectiveTotalWeight > 100.01) {
            temp.weight = `Adding/Updating this assignment would exceed 100% total weight for this course (Current other assignments total: ${currentTotalWeight.toFixed(1)}%). Max allowed for this assignment: ${(100 - currentTotalWeight).toFixed(1)}%.`;
        }
    }

    if (formData.assignmentType === 'Group') {
        const minP = parseInt(formData.minParticipants);
        const maxP = parseInt(formData.maxParticipants);
        if (formData.minParticipants === '' || isNaN(minP) || minP < 1) temp.minParticipants = 'Min Participants is required (min 1).';
        if (formData.maxParticipants === '' || isNaN(maxP) || maxP < 1) temp.maxParticipants = 'Max Participants is required (min 1).';
        if (!isNaN(minP) && !isNaN(maxP) && minP > maxP) temp.maxParticipants = 'Max Participants cannot be less than Min.';
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    
    if (name === 'courseId') {
      const selectedCourse = courseOptions.find(course => course.courseId === value);
      updatedFormData.courseName = selectedCourse ? selectedCourse.courseName : '';
      // Clear weight error if course changes, as validation depends on it
      if (errors.weight) setErrors(prev => ({ ...prev, weight: undefined }));
      // Clear courseId error if present
      if (errors.courseId) setErrors(prev => ({ ...prev, courseId: undefined }));
    }

    if (name === 'assignmentType' && value !== 'Group') {
        updatedFormData.minParticipants = '';
        updatedFormData.maxParticipants = '';
        if (errors.minParticipants || errors.maxParticipants) {
            setErrors(prev => ({ ...prev, minParticipants: undefined, maxParticipants: undefined }));
        }
    }

    setFormData(updatedFormData);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedFile(file);
        setFormData(prev => ({ ...prev, fileName: file.name }));
    } else {
        setSelectedFile(null);
        if (!isEditMode) {
             setFormData(prev => ({ ...prev, fileName: '' }));
        }
    }
    if (errors.file) setErrors(prev => ({ ...prev, file: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setSnackbar({ open: true, message: 'Please fix the errors in the form.', severity: 'error' });
      return;
    }

    try {
      let existingAssignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)) || [];
      existingAssignments = existingAssignments.filter(assign => assign && assign.assignmentCode);

      const assignmentData = {
        // Spread existing form data
        ...formData,
        // *** ENSURE courseId is saved ***
        courseId: formData.courseId,
        // Clean up potentially redundant/old courseCode if it exists from spread
        courseCode: undefined,
        // Trim name
        assignmentName: formData.assignmentName.trim(),
        // Parse numbers
        weight: parseFloat(formData.weight),
        ...(formData.assignmentType === 'Group' && {
            minParticipants: formData.minParticipants ? parseInt(formData.minParticipants) : null,
            maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        }),
        // Ensure assignmentCode is correct
        assignmentCode: isEditMode ? editAssignmentCode : formData.assignmentCode,
        fileName: formData.fileName || '',
      };
      // Remove the undefined courseCode property
      delete assignmentData.courseCode;


      if (isEditMode) {
        const assignmentIndex = existingAssignments.findIndex(assign => assign.assignmentCode === editAssignmentCode);
        if (assignmentIndex !== -1) {
          existingAssignments[assignmentIndex] = assignmentData;
          localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(existingAssignments));
          setSnackbar({ open: true, message: 'Assignment updated successfully!', severity: 'success' });
        } else {
          throw new Error(`Assignment with code ${editAssignmentCode} not found during update.`);
        }
      } else {
        const codeExists = existingAssignments.some(assign => assign.assignmentCode === assignmentData.assignmentCode);
        if (codeExists) {
             setSnackbar({ open: true, message: `Error: Assignment code ${assignmentData.assignmentCode} already exists. Please refresh.`, severity: 'error' });
             return;
        }
        existingAssignments.push(assignmentData);
        localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(existingAssignments));
        setSnackbar({ open: true, message: 'Assignment added successfully!', severity: 'success' });
      }

      setTimeout(() => { navigate('/AssignmentsManagement'); }, 1500);

      if (!isEditMode) {
         const currentAssignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)) || [];
         const validAssignments = currentAssignments.filter(assign => assign && assign.assignmentCode);
         const maxCode = validAssignments.reduce((max, assignment) => {
                const code = parseInt(assignment.assignmentCode);
                return !isNaN(code) ? Math.max(max, code) : max;
            }, 0);
         const nextCodeValue = maxCode + 1;
         setFormData({...initialFormData, assignmentCode: formatAssignmentCode(nextCodeValue)});
         setSelectedFile(null);
         setErrors({});
      }

    } catch (err) {
        console.error("Error saving assignment:", err);
        setSnackbar({ open: true, message: `Error saving assignment: ${err.message}`, severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const pageTitle = isEditMode ? 'Edit Assignment' : 'Create New Assignment';
  const submitButtonText = isEditMode ? 'Update Assignment' : 'Add Assignment';
  const submitButtonIcon = isEditMode ? <SaveIcon /> : <AddIcon />;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>

      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/AssignmentsManagement">
          Manage Assignments
        </Link>
        <Typography color="text.primary">{isEditMode ? `Edit (${editAssignmentCode})` : 'Add New'}</Typography>
      </Breadcrumbs>

      <Box component="form" onSubmit={handleSubmit} sx={{ backgroundColor: colors.white, p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" align="center" fontWeight="600" gutterBottom>
          {pageTitle}
        </Typography>

        {isLoading ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
             <CircularProgress sx={{ color: colors.green }} /> <Typography sx={{ ml: 2 }}>Loading...</Typography>
           </Box>
        ) : (
          <Grid container spacing={2}>
            {/* Row 1: Code & Name */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Assignment Code" name="assignmentCode" value={formData.assignmentCode} disabled required sx={{ backgroundColor: 'action.disabledBackground' }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Assignment Name" name="assignmentName" value={formData.assignmentName} onChange={handleChange} required error={!!errors.assignmentName} helperText={errors.assignmentName} />
            </Grid>

            {/* Row 2: Course & Type */}
            <Grid item xs={12} sm={6}>
              {/* *** CHANGED: FormControl targets courseId *** */}
              <FormControl fullWidth required error={!!errors.courseId}>
                <InputLabel>Course</InputLabel>
                {/* *** CHANGED: Select name and value use courseId *** */}
                <Select name="courseId" value={formData.courseId} label="Course" onChange={handleChange}>
                  <MenuItem value="" disabled><em>Select a Course</em></MenuItem>
                  {courseOptions.length > 0 ? (
                    courseOptions.map((course) => (
                      <MenuItem key={course.courseId} value={course.courseId}>
                        {course.courseId} - {course.courseName}
                      </MenuItem>
                    ))
                  ) : ( <MenuItem value="" disabled>No courses available</MenuItem> )}
                </Select>
              
                {errors.courseId && <FormHelperText>{errors.courseId}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.assignmentType}>
                <InputLabel>Assignment Type</InputLabel>
                <Select name="assignmentType" value={formData.assignmentType} label="Assignment Type" onChange={handleChange}>
                  <MenuItem value="" disabled><em>Select Type</em></MenuItem>
                  <MenuItem value="Individual">Individual</MenuItem>
                  <MenuItem value="Group">Group</MenuItem>
                </Select>
                {errors.assignmentType && <FormHelperText>{errors.assignmentType}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Row 3: Group Fields */}
            {formData.assignmentType === 'Group' && (
              <>
                <Grid item xs={12} sm={6}> <TextField fullWidth label="Min Participants" name="minParticipants" type="number" value={formData.minParticipants} onChange={handleChange} required={formData.assignmentType === 'Group'} inputProps={{ min: 1 }} error={!!errors.minParticipants} helperText={errors.minParticipants} /> </Grid>
                <Grid item xs={12} sm={6}> <TextField fullWidth label="Max Participants" name="maxParticipants" type="number" value={formData.maxParticipants} onChange={handleChange} required={formData.assignmentType === 'Group'} inputProps={{ min: 1 }} error={!!errors.maxParticipants} helperText={errors.maxParticipants} /> </Grid>
              </>
            )}

            {/* Row 4: Date & Weight */}
            <Grid item xs={12} sm={6}> <TextField fullWidth label="Submission Deadline" name="submissionDate" type="date" value={formData.submissionDate} onChange={handleChange} InputLabelProps={{ shrink: true }} required error={!!errors.submissionDate} helperText={errors.submissionDate} /> </Grid>
            <Grid item xs={12} sm={6}> <TextField fullWidth label="Weight (%)" name="weight" type="number" value={formData.weight} onChange={handleChange} required inputProps={{ min: 0, max: 100, step: "any" }} error={!!errors.weight} helperText={errors.weight} /> </Grid>

            {/* Row 5: Description */}
            <Grid item xs={12}> <TextField fullWidth label="Assignment Description (Optional)" name="description" multiline rows={3} value={formData.description} onChange={handleChange} error={!!errors.description} helperText={errors.description} /> </Grid>

            {/* Row 6: File Upload */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ padding: '10px 20px' }}>
                  {formData.fileName ? 'Replace File' : 'Upload File'} (Optional)
                  <input type="file" hidden onChange={handleFileChange} />
                </Button>
                {formData.fileName && (<Typography variant="body2" color="textSecondary">Current: {formData.fileName}</Typography>)}
                {errors.file && <Typography color="error" variant="caption">{errors.file}</Typography>}
              </Stack>
               {isEditMode && formData.fileName && !selectedFile && (
                 <Typography variant="caption" color="text.secondary" display="block" sx={{mt: 0.5}}> To keep the current file "{formData.fileName}", do nothing. To replace it, upload a new file. </Typography>
               )}
            </Grid>

            {/* Row 7: Submit Button */}
            <Grid item xs={12} textAlign="center" sx={{ mt: 2 }}>
              <Button variant="contained" type="submit" size="large" startIcon={submitButtonIcon} sx={{ backgroundColor: colors.green, color: colors.text, fontWeight: 500, px: 5, borderRadius: '6px', textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: colors.greenDark, boxShadow: 'none' } }}>
                {submitButtonText}
              </Button>
            </Grid>
          </Grid>
        )}
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled"> {snackbar.message} </Alert>
      </Snackbar>
    </Container>
  );
}
