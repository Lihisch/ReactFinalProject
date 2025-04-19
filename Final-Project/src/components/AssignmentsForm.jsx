import React, { useState, useEffect } from 'react';
// Import navigation and linking tools
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Stack,
  Breadcrumbs, // Import Breadcrumbs
  Link,        // Import MUI Link
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home'; // Import HomeIcon
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Keep for upload button

// Consistent color palette
const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff'
};

export default function AssignmentForm() {
  const navigate = useNavigate();

  // Unified state object for form data
  const initialFormData = {
    assignmentCode: '', // Will be auto-generated (3 digits)
    courseCode: '',     // User selects
    courseName: '',     // Derived from courseCode (used internally, not displayed)
    assignmentName: '', // User inputs
    assignmentType: '', // NEW: Individual or Group
    minParticipants: '',// NEW: Conditional field
    maxParticipants: '',// NEW: Conditional field
    submissionDate: '', // User inputs
    weight: '',         // User inputs (percentage)
    description: '',    // User inputs (optional)
    fileName: '',       // Name of the uploaded file
  };

  const [formData, setFormData] = useState(initialFormData);
  const [selectedFile, setSelectedFile] = useState(null); // For the actual file object
  const [courseOptions, setCourseOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [nextAssignmentCode, setNextAssignmentCode] = useState(1); // To manage the next assignment ID

  // Helper function to format assignment code
  const formatAssignmentCode = (code) => code.toString().padStart(3, '0');

  // Fetch courses and determine the next assignment code on component mount
  useEffect(() => {
    // Fetch courses for the dropdown
    const storedCourses = JSON.parse(localStorage.getItem('courses')) || [];
    setCourseOptions(storedCourses);

    // Determine the next assignment code based on existing assignments
    const existingAssignments = JSON.parse(localStorage.getItem('assignments')) || [];
    const maxCode = existingAssignments.reduce((max, assignment) => {
        // Parse the code, ignoring non-numeric or invalid ones
        const code = parseInt(assignment.assignmentCode); // No need to pad here, just get the number
        return !isNaN(code) ? Math.max(max, code) : max;
    }, 0);
    const codeToSet = maxCode + 1;
    setNextAssignmentCode(codeToSet);
    // Set the initial assignment code in the form data, formatted to 3 digits
    setFormData(prev => ({ ...prev, assignmentCode: formatAssignmentCode(codeToSet) }));

  }, []); // Empty dependency array ensures this runs only once

  // Validation function
  const validate = () => {
    const temp = {};
    if (!formData.courseCode) temp.courseCode = 'Course Code is required.';
    if (!formData.assignmentName) temp.assignmentName = 'Assignment Name is required.';
    if (!formData.assignmentType) temp.assignmentType = 'Assignment Type is required.'; // Validate type
    if (!formData.submissionDate) temp.submissionDate = 'Submission Deadline is required.';

    // Weight validation
    const weightValue = parseFloat(formData.weight);
    if (formData.weight === '' || isNaN(weightValue)) {
        temp.weight = 'Weight is required and must be a number.';
    } else if (weightValue < 0 || weightValue > 100) {
        temp.weight = 'Weight must be between 0 and 100.';
    } else if (formData.courseCode) {
        // Total Weight Validation
        const existingAssignments = JSON.parse(localStorage.getItem('assignments')) || [];
        const assignmentsForCourse = existingAssignments.filter(
            (assign) => assign.courseCode === formData.courseCode
        );
        const currentTotalWeight = assignmentsForCourse.reduce(
            (sum, assign) => sum + parseFloat(assign.weight || 0),
            0
        );
        const prospectiveTotalWeight = currentTotalWeight + weightValue;

        if (prospectiveTotalWeight > 100) {
            temp.weight = `Adding this assignment would exceed 100% total weight for this course (Current total: ${currentTotalWeight.toFixed(1)}%).`;
        }
    }

    // Conditional Validation for Group Type
    if (formData.assignmentType === 'Group') {
        const minP = parseInt(formData.minParticipants);
        const maxP = parseInt(formData.maxParticipants);

        if (formData.minParticipants === '' || isNaN(minP) || minP < 1) {
            temp.minParticipants = 'Min Participants is required and must be at least 1.';
        }
        if (formData.maxParticipants === '' || isNaN(maxP) || maxP < 1) {
            temp.maxParticipants = 'Max Participants is required and must be at least 1.';
        }
        // Check if both are valid numbers before comparing
        if (!isNaN(minP) && !isNaN(maxP) && minP > maxP) {
             temp.maxParticipants = 'Max Participants cannot be less than Min Participants.';
             // Optionally add error to minParticipants as well: temp.minParticipants = 'Min Participants cannot be greater than Max.';
        }
    }

    setErrors(temp);
    return Object.keys(temp).length === 0; // Return true if no errors
  };

  // Handle general input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedFormData = { ...formData, [name]: value };

    // If course code changes, automatically update the associated course name (internal state)
    if (name === 'courseCode') {
      const selectedCourse = courseOptions.find(course => course.courseId === value);
      updatedFormData.courseName = selectedCourse ? selectedCourse.courseName : '';
      // Also clear weight error if course code changes, as validation depends on it
      if (errors.weight) {
          setErrors(prev => ({ ...prev, weight: '' }));
      }
    }

    // If assignment type changes back from Group, clear participant errors and potentially values
    if (name === 'assignmentType' && value !== 'Group') {
        updatedFormData.minParticipants = ''; // Clear values if switching away from Group
        updatedFormData.maxParticipants = '';
        // Clear potential errors for these fields
        if (errors.minParticipants || errors.maxParticipants) {
            setErrors(prev => ({ ...prev, minParticipants: '', maxParticipants: '' }));
        }
    }

    setFormData(updatedFormData);

    // Clear the specific error message when the user starts typing in the field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedFile(file);
        setFormData(prev => ({ ...prev, fileName: file.name })); // Store file name
    } else {
        setSelectedFile(null);
        setFormData(prev => ({ ...prev, fileName: '' }));
    }
    if (errors.file) { // Clear file error if any (though not currently used)
        setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) { // Perform validation
      setSnackbar({ open: true, message: 'Please fix the errors in the form.', severity: 'error' });
      return;
    }

    try {
      // Prepare the new assignment object from formData
      const newAssignment = {
        assignmentCode: formData.assignmentCode, // Already formatted 3-digit string
        courseCode: formData.courseCode,
        courseName: formData.courseName,         // Internal course name
        assignmentName: formData.assignmentName,
        assignmentType: formData.assignmentType, // Save type
        submissionDate: formData.submissionDate,
        weight: formData.weight,
        description: formData.description,
        fileName: formData.fileName || '',
        // Conditionally add participant info only if type is Group
        ...(formData.assignmentType === 'Group' && {
            minParticipants: formData.minParticipants,
            maxParticipants: formData.maxParticipants,
        }),
      };

      const existingAssignments = JSON.parse(localStorage.getItem('assignments')) || [];
      existingAssignments.push(newAssignment);
      localStorage.setItem('assignments', JSON.stringify(existingAssignments));

      setSnackbar({ open: true, message: 'Assignment added successfully!', severity: 'success' });

      // Prepare for the next assignment entry
      const nextCodeValue = nextAssignmentCode + 1; // Increment the *numeric* code
      setNextAssignmentCode(nextCodeValue); // Update the numeric code generator state
      // Reset form, setting the *next formatted* assignment code
      setFormData({...initialFormData, assignmentCode: formatAssignmentCode(nextCodeValue)});
      setSelectedFile(null); // Clear selected file display
      setErrors({});         // Clear any validation errors

      // Navigate to the assignments management page after a short delay
      setTimeout(() => {
        navigate('/AssignmentsManagement'); // Adjust route if needed
      }, 1500);

    } catch (err) {
        console.error("Error saving assignment:", err);
        setSnackbar({ open: true, message: 'Error saving assignment. Please check console.', severity: 'error' });
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>

      {/* --- BREADCRUMBS START --- */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/AssignmentsManagement">
          Manage Assignments
        </Link>
        <Typography color="text.primary">Add New Assignment</Typography>
      </Breadcrumbs>
      {/* --- BREADCRUMBS END --- */}

      <Box component="form" onSubmit={handleSubmit} sx={{ backgroundColor: colors.white, p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" align="center" fontWeight="600" gutterBottom>
          Create New Assignment
        </Typography>

        <Grid container spacing={2}>
          {/* Row 1: Assignment Code & Name */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Assignment Code" name="assignmentCode" value={formData.assignmentCode} disabled required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Assignment Name" name="assignmentName" value={formData.assignmentName} onChange={handleChange} required error={!!errors.assignmentName} helperText={errors.assignmentName} />
          </Grid>

          {/* Row 2: Course Code & Assignment Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.courseCode}>
              <InputLabel>Course Code</InputLabel>
              <Select name="courseCode" value={formData.courseCode} label="Course Code" onChange={handleChange}>
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
              {errors.courseCode && <Typography color="error" variant="caption" sx={{ pl: 2, pt: 0.5 }}>{errors.courseCode}</Typography>}
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
              {errors.assignmentType && <Typography color="error" variant="caption" sx={{ pl: 2, pt: 0.5 }}>{errors.assignmentType}</Typography>}
            </FormControl>
          </Grid>

          {/* Row 3: Conditional Group Participant Fields */}
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
                  required={formData.assignmentType === 'Group'} // Required only if type is Group
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
                  required={formData.assignmentType === 'Group'} // Required only if type is Group
                  inputProps={{ min: 1 }}
                  error={!!errors.maxParticipants}
                  helperText={errors.maxParticipants}
                />
              </Grid>
            </>
          )}

          {/* Row 4 (or 3 if Individual): Submission Date & Weight */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Submission Deadline" name="submissionDate" type="date" value={formData.submissionDate} onChange={handleChange} InputLabelProps={{ shrink: true }} required error={!!errors.submissionDate} helperText={errors.submissionDate} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Weight (%)" name="weight" type="number" value={formData.weight} onChange={handleChange} required inputProps={{ min: 0, max: 100, step: "any" }} error={!!errors.weight} helperText={errors.weight} />
          </Grid>

          {/* Row 5: Description */}
          <Grid item xs={12}>
            <TextField fullWidth label="Assignment Description (Optional)" name="description" multiline rows={3} value={formData.description} onChange={handleChange} error={!!errors.description} helperText={errors.description} />
          </Grid>

          {/* Row 6: File Upload */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ padding: '10px 20px' }}>
                Upload File (Optional)
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
              {selectedFile && (<Typography variant="body2" color="textSecondary">{selectedFile.name}</Typography>)}
              {errors.file && <Typography color="error" variant="caption">{errors.file}</Typography>}
            </Stack>
          </Grid>

          {/* Row 7: Submit Button */}
          <Grid item xs={12} textAlign="center" sx={{ mt: 2 }}>
            <Button variant="contained" type="submit" size="large" sx={{ backgroundColor: colors.green, color: colors.text, fontWeight: 500, px: 5, borderRadius: '6px', textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: colors.greenDark, boxShadow: 'none' } }}>
              Add Assignment
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
