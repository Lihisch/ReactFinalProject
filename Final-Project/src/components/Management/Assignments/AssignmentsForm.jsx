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
import { addAssignment, updateAssignment, listAssignments } from '../../../firebase/assignments';
import { listCourses } from '../../../firebase/courses';

const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff'
};

export default function AssignmentsForm() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  
  // Check if we're in copy mode by looking at the route structure
  const isCopyMode = window.location.pathname.includes('/copy/');
  const isEditMode = Boolean(assignmentId) && !isCopyMode;
  const originalAssignmentId = isCopyMode ? assignmentId : null;

  const initialFormData = {
    assignmentId: '',
    courseId: '',
    courseName: '',
    assignmentName: '',
    assignmentType: '',
    minParticipants: '',
    maxParticipants: '',
    dueDate: '',
    weight: '',
    description: '',
    fileName: '',
    status: 'Pending'
  };

  const [formData, setFormData] = useState(initialFormData);
  const [selectedFile, setSelectedFile] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(isEditMode || isCopyMode);

  useEffect(() => {
    const loadData = async () => {
      try {
    setIsLoading(true);
        const coursesData = await listCourses();
      setCourseOptions(coursesData);

        if (isEditMode || isCopyMode) {
          const assignments = await listAssignments();
          const assignmentToEdit = assignments.find(assign => assign.assignmentId === (isCopyMode ? originalAssignmentId : assignmentId));
          
          if (assignmentToEdit) {
            const newFormData = {
              ...assignmentToEdit,
              minParticipants: assignmentToEdit.minParticipants?.toString() || '',
              maxParticipants: assignmentToEdit.maxParticipants?.toString() || '',
              weight: assignmentToEdit.weight?.toString() || '',
              dueDate: assignmentToEdit.dueDate || ''
            };

            if (isCopyMode) {
              // Generate new ID for copied assignment
              const maxId = assignments.reduce((max, assignment) => {
                const id = parseInt(assignment.assignmentId);
                return !isNaN(id) ? Math.max(max, id) : max;
              }, 0);
              const nextId = (maxId + 1).toString().padStart(3, '0');
              newFormData.assignmentId = nextId;
              newFormData.assignmentName = `${assignmentToEdit.assignmentName} (Duplicate)`;
            }

            setFormData(newFormData);
          } else {
            console.error('Assignment not found:', isCopyMode ? originalAssignmentId : assignmentId);
            setSnackbar({ open: true, message: 'Assignment not found', severity: 'error' });
            navigate('/AssignmentsManagement');
          }
        } else {
          const assignments = await listAssignments();
          const maxId = assignments.reduce((max, assignment) => {
            const id = parseInt(assignment.assignmentId);
            return !isNaN(id) ? Math.max(max, id) : max;
          }, 0);
          const nextId = (maxId + 1).toString().padStart(3, '0');
          setFormData(prev => ({ ...initialFormData, assignmentId: nextId }));
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setSnackbar({ open: true, message: 'Error loading data', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
    };

    loadData();
  }, [isEditMode, isCopyMode, assignmentId, originalAssignmentId, navigate]);

  const validate = async () => {
    const temp = {};
    if (!formData.courseId) temp.courseId = 'Course is required.';
    if (!formData.assignmentName.trim()) temp.assignmentName = 'Assignment Name is required.';
    if (!formData.assignmentType) temp.assignmentType = 'Assignment Type is required.';
    if (!formData.dueDate) {
      temp.dueDate = 'Due Date is required.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
      const dueDate = new Date(formData.dueDate);
      if (dueDate < today) {
        temp.dueDate = 'Due Date cannot be in the past. Please select today or a future date.';
      }
    }

    // Weight validation
    const weightValue = parseFloat(formData.weight);
    if (formData.weight === '' || isNaN(weightValue)) {
      temp.weight = 'Weight is required and must be a number.';
    } else if (weightValue < 0 || weightValue > 100) {
      temp.weight = 'Weight must be between 0 and 100.';
    } else {
      // Check total weight for the course
      const assignments = await listAssignments();
      const sameCourseAssignments = assignments.filter(
        a => a.courseId === formData.courseId && a.assignmentId !== formData.assignmentId
      );
      const totalWeight = sameCourseAssignments.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0) + weightValue;
      if (totalWeight > 100) {
        temp.weight = `Total weight for this course exceeds 100% (current total: ${totalWeight}%)`;
      }
    }

    // Group participants validation
    if (formData.assignmentType === 'Group') {
      const minP = parseInt(formData.minParticipants);
      const maxP = parseInt(formData.maxParticipants);
      if (formData.minParticipants === '' || isNaN(minP) || minP < 1) temp.minParticipants = 'Min Participants is required (min 1).';
      if (formData.maxParticipants === '' || isNaN(maxP) || maxP < 1) temp.maxParticipants = 'Max Participants is required (min 1).';
      if (!isNaN(minP) && !isNaN(maxP) && minP > maxP) temp.maxParticipants = 'Max Participants cannot be less than Min.';
    }

    // Placeholder for future validation
    // if (SOME_CONDITION) temp.someField = 'Some validation message';

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    if (name === 'courseId') {
      const selectedCourse = courseOptions.find(course => course.courseId === value);
      updatedFormData.courseName = selectedCourse ? selectedCourse.courseName : '';
      if (errors.weight) setErrors(prev => ({ ...prev, weight: undefined }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!await validate()) {
      setSnackbar({ open: true, message: 'Please fix the errors in the form.', severity: 'error' });
      return;
    }

    try {
      const assignmentData = {
        ...formData,
        weight: parseFloat(formData.weight),
        ...(formData.assignmentType === 'Group' && {
          minParticipants: parseInt(formData.minParticipants),
          maxParticipants: parseInt(formData.maxParticipants),
        })
      };

      if (isEditMode) {
        await updateAssignment(assignmentId, assignmentData);
        setSnackbar({ open: true, message: 'Assignment updated successfully!', severity: 'success' });
      } else {
        await addAssignment(assignmentData);
        setSnackbar({ open: true, message: 'Assignment added successfully!', severity: 'success' });
      }

      setTimeout(() => { 
        navigate('/AssignmentsManagement'); 
      }, 1500);
    } catch (error) {
      console.error("Error saving:", error);
      setSnackbar({ 
        open: true, 
        message: `Error: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const pageTitle = isEditMode ? 'Edit Assignment' : isCopyMode ? 'Duplicate Assignment' : 'Add New Assignment';
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
        <Typography color="text.primary">
          {isEditMode 
            ? `Edit Assignment ${assignmentId}` 
            : isCopyMode 
            ? `Duplicate Assignment ${originalAssignmentId}` 
            : 'Add New Assignment'
          }
        </Typography>
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
              <TextField
                fullWidth
                label="Assignment ID"
                name="assignmentId"
                value={formData.assignmentId}
                disabled
                required
                sx={{ backgroundColor: 'action.disabledBackground' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Assignment Name"
                name="assignmentName"
                value={formData.assignmentName}
                onChange={handleChange}
                required
                error={!!errors.assignmentName}
                helperText={errors.assignmentName}
              />
      </Grid>

            {/* Row 2: Course & Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.courseId}>
                <InputLabel>Course</InputLabel>
                <Select
                  name="courseId"
                  value={formData.courseId}
                  label="Course"
                  onChange={handleChange}
                >
                  <MenuItem value="" disabled><em>Select a Course</em></MenuItem>
                  {courseOptions.length > 0 ? (
                    courseOptions.map((course) => (
                      <MenuItem key={course.courseId} value={course.courseId}>
                        {course.courseId} - {course.courseName}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>No courses available</MenuItem>
                  )}
                </Select>
                {errors.courseId && <FormHelperText>{errors.courseId}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.assignmentType}>
                <InputLabel>Assignment Type</InputLabel>
                <Select
                  name="assignmentType"
                  value={formData.assignmentType}
                  label="Assignment Type"
                  onChange={handleChange}
                >
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Min Participants"
                    name="minParticipants"
                    type="number"
                    value={formData.minParticipants}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 1 }}
                    error={!!errors.minParticipants}
                    helperText={errors.minParticipants}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Participants"
                    name="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 1 }}
                    error={!!errors.maxParticipants}
                    helperText={errors.maxParticipants}
                  />
                </Grid>
              </>
            )}

            {/* Row 4: Date & Weight */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                error={!!errors.dueDate}
                helperText={errors.dueDate}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weight (%)"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                required
                inputProps={{ min: 0, max: 100, step: "any" }}
                error={!!errors.weight}
                helperText={errors.weight}
              />
        </Grid>

            {/* Row 5: Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assignment Description (Optional)"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>

            {/* Row 6: File Upload */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                                variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{ padding: '10px 20px' }}
                >
                  {formData.fileName ? 'Replace File' : 'Upload File'} (Optional)
                  <input type="file" hidden onChange={handleFileChange} />
                </Button>
                {formData.fileName && (
                  <Typography variant="body2" color="textSecondary">
                    Current: {formData.fileName}
                  </Typography>
                )}
                {errors.file && (
                  <Typography color="error" variant="caption">
                    {errors.file}
                  </Typography>
                )}
              </Stack>
              {isEditMode && formData.fileName && !selectedFile && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  To keep the current file "{formData.fileName}", do nothing. To replace it, upload a new file.
                </Typography>
              )}
            </Grid>

            {/* Row 7: Submit Button */}
            <Grid item xs={12} textAlign="center" sx={{ mt: 2 }}>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/AssignmentsManagement')}
                  sx={{
                    color: colors.text,
                    borderColor: colors.green,
                    '&:hover': {
                      borderColor: colors.greenDark,
                      backgroundColor: 'rgba(190, 214, 48, 0.04)'
                    }
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  startIcon={submitButtonIcon}
                  sx={{
                    backgroundColor: colors.green,
                    color: colors.text,
                    fontWeight: 500,
                    px: 5,
                    borderRadius: '6px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: colors.greenDark,
                      boxShadow: 'none'
                    }
                  }}
                >
                  {submitButtonText}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}