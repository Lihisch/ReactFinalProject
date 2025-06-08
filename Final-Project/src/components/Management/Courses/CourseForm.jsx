// src/components/CourseForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useParams, useLocation } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Grid, Select, MenuItem,
  FormControl, InputLabel, Snackbar, Alert, Breadcrumbs, Link, Tooltip,
  IconButton, InputAdornment, CircularProgress
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import { addCourse, updateCourse, getCourseById } from '../../../firebase/courses';

const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff'
};

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
];

export default function CourseForm() {
  const navigate = useNavigate();
  const { courseId: editCourseId } = useParams();
  const location = useLocation();

  const isEditMode = Boolean(editCourseId);
  const isDuplicateMode = Boolean(location.state?.courseToDuplicate);
  const courseToDuplicateData = location.state?.courseToDuplicate;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    professorsName: '',
    creditPoints: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    startingDate: '',
    endDate: '',
    description: '',
    semester: ''
  });

  useEffect(() => {
    const fetchCourseData = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const courseData = await getCourseById(editCourseId);
          if (courseData) {
            setFormData({
              ...courseData,
              startTime: courseData.startTime || '',
              endTime: courseData.endTime || '',
              startingDate: courseData.startingDate || '',
              endDate: courseData.endDate || '',
            });
          } else {
            setError('Course not found');
          }
        } catch (err) {
          setError('Error loading course data');
          console.error('Error loading course:', err);
        } finally {
          setLoading(false);
        }
      } else if (isDuplicateMode && courseToDuplicateData) {
        setFormData({
          ...courseToDuplicateData,
          courseId: '',
          startTime: '',
          endTime: '',
          startingDate: '',
          endDate: '',
        });
      }
    };

    fetchCourseData();
  }, [isEditMode, editCourseId, isDuplicateMode, courseToDuplicateData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'courseId' && !isEditMode) {
      processedValue = value.toUpperCase();
    }
    if (name === 'creditPoints' && value !== '') {
      processedValue = Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const validateForm = () => {
    if (!formData.courseId.trim()) return 'Course ID is required';
    if (!formData.courseName.trim()) return 'Course Name is required';
    if (!formData.professorsName.trim()) return 'Professor Name is required';
    if (!formData.creditPoints) return 'Credit Points is required';
    
    const creditPointsValue = parseFloat(formData.creditPoints); // Use parseFloat to handle decimals
    if (isNaN(creditPointsValue)) return 'Credit Points must be a valid number.';
    // Check if the number multiplied by 2 is an integer. This allows for .0 and .5
    if (!Number.isInteger(creditPointsValue * 2)) {
      return 'Credit Points must be a whole or half number (e.g., 1, 1.5, 2).';
    }
    if (creditPointsValue < 1 || creditPointsValue > 9) {
      return 'Credit Points must be between 1 and 9 (e.g., 1, 1.5, ..., 9).';
    }

    if (!formData.dayOfWeek) return 'Day of Week is required';
    if (!formData.startTime) return 'Start Time is required';
    if (!formData.endTime) return 'End Time is required';
    if (!formData.startingDate) return 'Starting Date is required';
    if (!formData.endDate) return 'End Date is required';
    
    const startingDate = new Date(formData.startingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    if (startingDate.getTime() < today.getTime()) return 'Starting Date cannot be in the past.';

    if (formData.startTime >= formData.endTime) return 'End Time must be after Start Time';
    if (new Date(formData.startingDate) >= new Date(formData.endDate)) return 'End Date must be after Starting Date';

    if (!isEditMode) {
      const courseNameTrimmed = formData.courseName.trim();
      const courseIdTrimmed = formData.courseId.trim(); // Trim courseId as well

      if (courseNameTrimmed) { // Only validate if courseName is not empty
        const courseNameFirstLetter = courseNameTrimmed.charAt(0).toUpperCase();
        const courseIdRegex = new RegExp(`^${courseNameFirstLetter}\\d{4}$`);
        
        // console.log("Validating Course ID:", courseIdTrimmed, "against pattern for letter:", courseNameFirstLetter); // For debugging
        if (!courseIdRegex.test(courseIdTrimmed)) {
          return `Course ID must start with '${courseNameFirstLetter}' (from the course name), followed by exactly 4 digits — e.g., ${courseNameFirstLetter}1234`;
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const courseData = {
        ...formData,
        creditPoints: Number(formData.creditPoints)
      };

      if (isEditMode) {
        await updateCourse(editCourseId, courseData);
      } else {
        await addCourse(courseData);
      }
      navigate('/coursesmanagement');
    } catch (err) {
      console.error('Error saving course:', err);
      setError(err.message || 'Error saving course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setError('');
  };

  let pageTitle = 'Create New Course';
  let submitButtonText = 'Add Course';
  let submitButtonIcon = <AddIcon />;
  if (isEditMode) {
    pageTitle = `Edit Course`;
    submitButtonText = 'Update Course';
    submitButtonIcon = <SaveIcon />;
  } else if (isDuplicateMode) {
    pageTitle = 'Create New Course';
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="250px">
          <CircularProgress sx={{ color: colors.green }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/coursesmanagement">
          Manage Courses
        </Link>
        <Typography color="text.primary">{isEditMode ? 'Edit Course' : 'Add Course'}</Typography>
      </Breadcrumbs>
      <Box component="form" onSubmit={handleSubmit} sx={{ backgroundColor: colors.white, p: 2, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" align="center" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
          {pageTitle}
        </Typography>

        <Grid container spacing={2}>
          {/* Row 1: Course Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Course Name"
              name="courseName"
              value={formData.courseName}
              onChange={handleInputChange}
              required
            />
          </Grid>

          {/* Row 2: Course ID & Professor's Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Course ID"
              name="courseId"
              value={formData.courseId}
              onChange={handleInputChange}
              disabled={isEditMode}
              required
              InputProps={{
                endAdornment: !isEditMode && (
                  <InputAdornment position="end">
                    <Tooltip
                      title={
                        formData.courseName.trim()
                          ? `Format: '${formData.courseName.trim().charAt(0).toUpperCase()}' (from Course Name) followed by 4 digits (e.g., ${formData.courseName.trim().charAt(0).toUpperCase()}1234)`
                          : "Format: First letter of Course Name + 4 digits. Please enter Course Name first."
                      }
                      arrow
                    >
                      <IconButton edge="end" size="small" aria-label="Course ID format info">
                        <InfoIcon fontSize="small" sx={{ color: 'action.active' }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Professor's Name"
              name="professorsName"
              value={formData.professorsName}
              onChange={handleInputChange}
              required
            />
          </Grid>

          {/* Row 3: Starting Date & End Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Starting Date"
              name="startingDate"
              type="date"
              value={formData.startingDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          {/* Row 4: Start Time & End Time */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 900 }} // 15 minute increments
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Time"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 900 }} // 15 minute increments
              required
            />
          </Grid>
          
          {/* Row 5: Day of Week, Semester, Credit Points */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel>Day of Week</InputLabel>
              <Select
                name="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={handleInputChange}
                label="Day of Week"
              >
                {DAYS_OF_WEEK.map(day => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel>Semester</InputLabel>
              <Select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                label="Semester"
              >
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="Summer">Summer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Credit Points"
              name="creditPoints"
              type="number"
              value={formData.creditPoints}
              onChange={handleInputChange}
              inputProps={{ min: 1, step: "0.5" }} // Allow steps of 0.5
              required
            />
          </Grid>

          {/* Row 6: Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Course Description"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>

        <Grid item xs={12} textAlign="center" sx={{ mt: 1 }}>
          <Button
            variant="contained"
            type="submit"
            size="medium"
            startIcon={submitButtonIcon}
            sx={{
              backgroundColor: colors.green,
              color: colors.text,
              fontWeight: 500,
              px: 4,
              borderRadius: '6px',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: colors.greenDark,
                boxShadow: 'none'
              },
            }}
          >
            {submitButtonText}
          </Button>
        </Grid>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}
