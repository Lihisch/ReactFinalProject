import React, { useState } from 'react';
// Import Link from react-router-dom for navigation
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Breadcrumbs, // Import Breadcrumbs
  Link,        // Import MUI Link (used to style RouterLink)
} from '@mui/material';
// Optional: Import an icon for Home
import HomeIcon from '@mui/icons-material/Home';

const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff'
};

export default function CourseForm() {
  const navigate = useNavigate();
  const initialFormData = {
    courseId: '',
    courseName: '',
    creditPoints: '',
    semester: '',
    professorsName: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    description: '',
    startingDate: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const validate = () => {
    const temp = {};
    if (!formData.courseName) temp.courseName = 'Course Name is required.';
    if (!formData.courseId) temp.courseId = 'Course ID is required.';
    if (!formData.creditPoints || isNaN(formData.creditPoints) || formData.creditPoints <= 0) {
      temp.creditPoints = 'Credit Points must be a positive number.';
    }
    if (!formData.semester) temp.semester = 'Semester is required.';
    if (!formData.professorsName) temp.professorsName = "Professor's Name is required.";
    if (!formData.dayOfWeek) temp.dayOfWeek = 'Day of Week is required.';
    if (!formData.startTime) temp.startTime = 'Start Time is required.';
    if (!formData.endTime || formData.endTime <= formData.startTime) {
      temp.endTime = 'End Time must be after Start Time.';
    }
    if (!formData.description) temp.description = 'Description is required.';
    if (!formData.startingDate) temp.startingDate = 'Starting Date is required.';

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setSnackbar({ open: true, message: 'Please fix the errors in the form.', severity: 'error' });
      return;
    }

    try {
      const courses = JSON.parse(localStorage.getItem('courses')) || [];
      const exists = courses.some((c) => c.courseId === formData.courseId);
      if (exists) {
        setSnackbar({ open: true, message: `Error: Course ID ${formData.courseId} already exists!`, severity: 'error' });
        return;
      }

      const newCourse = {
        ...formData,
        courseHours: `${formData.startTime} - ${formData.endTime}`,
        courseType: 'N/A', // Default value
        maxStudents: 'N/A', // Default value
      };

      courses.push(newCourse);
      localStorage.setItem('courses', JSON.stringify(courses));

      setSnackbar({ open: true, message: 'Course added successfully!', severity: 'success' });
      setTimeout(() => {
        setFormData(initialFormData);
        navigate('/courses'); // Navigate to the course list after success
      }, 1500);
    } catch (err) {
      console.error("Error saving course:", err); // Log the specific error
      setSnackbar({ open: true, message: 'Error saving course. Please check console for details.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };


  return (
    <Container maxWidth="md" sx={{ py: 4 }}>

      {/* --- BREADCRUMBS START --- */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}> {/* Added margin-bottom */}
        {/* 1. Home Link */}
        <Link
          component={RouterLink} // Use react-router-dom Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          to="/" // Link to Home page
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>

        {/* 2. Link to the relevant Management Screen */}
        <Link
          component={RouterLink} // Use react-router-dom Link
          underline="hover"
          color="inherit"
          to="/Coursemanagement" // Link to the Manage Courses page
        >
          Manage Courses {/* Text reflects the destination */}
        </Link>

        {/* 3. Current Page (not a link) */}
        <Typography color="text.primary">Add New Course</Typography>
      </Breadcrumbs>
      {/* --- BREADCRUMBS END --- */}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          backgroundColor: colors.white,
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" align="center" fontWeight="600" gutterBottom>
          Create New Course
        </Typography>

        <Grid container spacing={2}>
          {/* Course Name */}
          <Grid item xs={12}>
            <TextField fullWidth label="Course Name" name="courseName" value={formData.courseName} onChange={handleChange} error={!!errors.courseName} helperText={errors.courseName} required />
          </Grid>

          {/* Course ID */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Course ID" name="courseId" value={formData.courseId} onChange={handleChange} error={!!errors.courseId} helperText={errors.courseId} required />
          </Grid>
          {/* Credit Points */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Credit Points" name="creditPoints" type="number" inputProps={{ min: 1 }} value={formData.creditPoints} onChange={handleChange} error={!!errors.creditPoints} helperText={errors.creditPoints} required />
          </Grid>

          {/* Semester */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.semester} required>
              <InputLabel>Semester</InputLabel>
              <Select name="semester" value={formData.semester} onChange={handleChange} label="Semester">
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="Summer">Summer</MenuItem>
              </Select>
              {errors.semester && <Typography color="error" variant="caption">{errors.semester}</Typography>}
            </FormControl>
          </Grid>

          {/* Professor's Name */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Professor's Name" name="professorsName" value={formData.professorsName} onChange={handleChange} error={!!errors.professorsName} helperText={errors.professorsName} required />
          </Grid>

          {/* Day of Week */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.dayOfWeek} required>
              <InputLabel>Day of Week</InputLabel>
              <Select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} label="Day of Week">
                <MenuItem value="Sunday">Sunday</MenuItem>
                <MenuItem value="Monday">Monday</MenuItem>
                <MenuItem value="Tuesday">Tuesday</MenuItem>
                <MenuItem value="Wednesday">Wednesday</MenuItem>
                <MenuItem value="Thursday">Thursday</MenuItem>
                <MenuItem value="Friday">Friday</MenuItem>
              </Select>
              {errors.dayOfWeek && <Typography color="error" variant="caption">{errors.dayOfWeek}</Typography>}
            </FormControl>
          </Grid>

          {/* Starting Date */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Starting Date" name="startingDate" type="date" value={formData.startingDate} onChange={handleChange} InputLabelProps={{ shrink: true }} error={!!errors.startingDate} helperText={errors.startingDate} required />
          </Grid>

          {/* Start Time */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Start Time" name="startTime" type="time" value={formData.startTime} onChange={handleChange} InputLabelProps={{ shrink: true }} error={!!errors.startTime} helperText={errors.startTime} required />
          </Grid>
          {/* End Time */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="End Time" name="endTime" type="time" value={formData.endTime} onChange={handleChange} InputLabelProps={{ shrink: true }} error={!!errors.endTime} helperText={errors.endTime} required />
          </Grid>

          {/* Course Description */}
          <Grid item xs={12}>
            <TextField fullWidth label="Course Description" name="description" multiline rows={3} value={formData.description} onChange={handleChange} error={!!errors.description} helperText={errors.description} required />
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12} textAlign="center">
            <Button
              variant="contained"
              type="submit"
              size="large"
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
                },
              }}
            >
              Add Course
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar} // Use defined handler
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {/* Ensure Alert is correctly imported if used standalone */}
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
