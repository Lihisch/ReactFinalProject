// src/components/CourseForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useParams, useLocation } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Grid, Select, MenuItem,
  FormControl, InputLabel, Snackbar, Alert, Breadcrumbs, Link, Tooltip,
  IconButton, InputAdornment, CircularProgress, FormHelperText
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import { addCourse, updateCourse, listCourses, getCourseById } from '../firebase/courses';

const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff'
};

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00'
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
            setFormData(courseData);
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
          startingDate: ''
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
    if (!formData.dayOfWeek) return 'Day of Week is required';
    if (!formData.startTime) return 'Start Time is required';
    if (!formData.endTime) return 'End Time is required';
    if (!formData.startingDate) return 'Starting Date is required';
    if (formData.startTime >= formData.endTime) return 'End Time must be after Start Time';

    // Validate course ID format
    if (!isEditMode) {
      const courseNameFirstLetter = formData.courseName.trim().charAt(0).toUpperCase();
      const courseIdRegex = new RegExp(`^${courseNameFirstLetter}\\d{4}$`);
      if (!courseIdRegex.test(formData.courseId)) {
        return `Course ID must start with '${courseNameFirstLetter}' (from the course name), followed by exactly 4 digits — e.g., ${courseNameFirstLetter}1234`;
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

        <Grid container spacing={1.5}>
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
              label="Credit Points"
              name="creditPoints"
              type="number"
              value={formData.creditPoints}
              onChange={handleInputChange}
              inputProps={{ min: 1, step: "any" }}
              required
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
            <FormControl fullWidth required>
              <InputLabel>Semester</InputLabel>
              <Select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                label="Semester"
              >
                <MenuItem value="A">Semester A</MenuItem>
                <MenuItem value="B">Semester B</MenuItem>
                <MenuItem value="Summer">Summer Semester</MenuItem>
              </Select>
            </FormControl>
          </Grid>

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
              <InputLabel>Start Time</InputLabel>
              <Select
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                label="Start Time"
              >
                {TIME_SLOTS.map(time => (
                  <MenuItem key={time} value={time}>{time}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel>End Time</InputLabel>
              <Select
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                label="End Time"
              >
                {TIME_SLOTS.map(time => (
                  <MenuItem key={time} value={time}>{time}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

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