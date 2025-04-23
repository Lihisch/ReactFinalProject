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

const colors = {
  green: '#bed630', greenDark: '#a7bc2a', text: '#000000', white: '#ffffff'
};

const COURSES_STORAGE_KEY = 'courses';

export default function CourseForm() {
  const navigate = useNavigate();
  const { courseId: editCourseId } = useParams();
  const location = useLocation();

  const isEditMode = Boolean(editCourseId);
  const isDuplicateMode = Boolean(location.state?.courseToDuplicate);
  const courseToDuplicateData = location.state?.courseToDuplicate;

  const getInitialState = () => {
    if (isDuplicateMode && courseToDuplicateData) {
      return {
        courseId: '',
        courseName: courseToDuplicateData.courseName || '',
        creditPoints: courseToDuplicateData.creditPoints ?? '',
        semester: courseToDuplicateData.semester || '',
        professorsName: courseToDuplicateData.professorsName || '',
        dayOfWeek: courseToDuplicateData.dayOfWeek || '',
        startTime: courseToDuplicateData.startTime || '',
        endTime: courseToDuplicateData.endTime || '',
        description: courseToDuplicateData.description || '',
        startingDate: courseToDuplicateData.startingDate || '',
      };
    }
    return {
      courseId: '', courseName: '', creditPoints: '', semester: '',
      professorsName: '', dayOfWeek: '', startTime: '', endTime: '',
      description: '', startingDate: '',
    };
  };

  const [formData, setFormData] = useState(getInitialState);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      let courseFound = false;
      try {
        const courses = JSON.parse(localStorage.getItem(COURSES_STORAGE_KEY)) || [];
        const courseToEdit = courses.find(c => c.courseId === editCourseId);
        if (courseToEdit) {
          setFormData({
            courseId: courseToEdit.courseId,
            courseName: courseToEdit.courseName || '',
            creditPoints: courseToEdit.creditPoints ?? '',
            semester: courseToEdit.semester || '',
            professorsName: courseToEdit.professorsName || '',
            dayOfWeek: courseToEdit.dayOfWeek || '',
            startTime: courseToEdit.startTime || '',
            endTime: courseToEdit.endTime || '',
            description: courseToEdit.description || '',
            startingDate: courseToEdit.startingDate || '',
          });
          courseFound = true;
        } else {
          setSnackbar({ open: true, message: `Error: Course with ID ${editCourseId} not found.`, severity: 'error' });
          navigate('/coursesmanagement');
        }
      } catch (err) {
        console.error("Error loading course for editing:", err);
        setSnackbar({ open: true, message: 'Error loading course data.', severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    } else {
       setIsLoading(false);
       if (location.state?.courseToDuplicate) {
          navigate(location.pathname, { replace: true, state: {} });
       }
    }
  }, [editCourseId, isEditMode, navigate, location.state, location.pathname]);


  const validate = () => {
    const temp = {};
    const courseName = formData.courseName.trim();

    if (!courseName) {
      temp.courseName = 'Course Name is required.';
    }

    if (!isEditMode) {
        if (!formData.courseId) {
          temp.courseId = 'Course ID is required.';
        } else if (!courseName) {
          temp.courseId = 'Enter Course Name first to validate ID format.';
        } else {
          const expectedFirstLetter = courseName.charAt(0).toUpperCase();
          const courseIdRegex = new RegExp(`^${expectedFirstLetter}\\d{4}$`);
          if (!courseIdRegex.test(formData.courseId)) {
            temp.courseId = `Course ID must start with '${expectedFirstLetter}' (from the course name), followed by exactly 4 digits — e.g., ${expectedFirstLetter}1234.`;
          }
        }
    }

    if (formData.creditPoints === '' || formData.creditPoints === null || isNaN(formData.creditPoints) || Number(formData.creditPoints) <= 0) {
      temp.creditPoints = 'Credit Points must be a positive number.';
    }
    if (!formData.semester) temp.semester = 'Semester is required.';
    if (!formData.professorsName) temp.professorsName = "Professor's Name is required.";
    if (!formData.dayOfWeek) temp.dayOfWeek = 'Day of Week is required.';
    if (!formData.startTime) temp.startTime = 'Start Time is required.';
    if (!formData.endTime) {
        temp.endTime = 'End Time is required.';
    } else if (formData.startTime && formData.endTime <= formData.startTime) {
        temp.endTime = 'End Time must be after Start Time.';
    }
    if (!formData.description) temp.description = 'Description is required.';
    if (!formData.startingDate) temp.startingDate = 'Starting Date is required.';

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'courseId' && !isEditMode) {
        processedValue = value.toUpperCase();
    }
    if (name === 'creditPoints' && value !== '') {
        processedValue = Number(value);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setSnackbar({ open: true, message: 'Please fix the errors in the form.', severity: 'error' });
      return;
    }

    try {
      const courses = JSON.parse(localStorage.getItem(COURSES_STORAGE_KEY)) || [];

      if (isEditMode) {
        const courseIndex = courses.findIndex(c => c.courseId === editCourseId);
        if (courseIndex === -1) {
           setSnackbar({ open: true, message: `Error: Course with ID ${editCourseId} not found for update.`, severity: 'error' });
           return;
        }
        const updatedCourse = {
            ...courses[courseIndex],
            ...formData,
            courseId: editCourseId,
            courseHours: `${formData.startTime || 'N/A'} - ${formData.endTime || 'N/A'}`,
            creditPoints: Number(formData.creditPoints)
        };
        courses[courseIndex] = updatedCourse;
        localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
        setSnackbar({ open: true, message: 'Course updated successfully!', severity: 'success' });

      } else {
        const exists = courses.some((c) => c.courseId === formData.courseId);
        if (exists) {
          setSnackbar({ open: true, message: `Error: Course ID ${formData.courseId} already exists!`, severity: 'error' });
          return;
        }
        const newCourse = {
          ...formData,
          courseHours: `${formData.startTime || 'N/A'} - ${formData.endTime || 'N/A'}`,
          creditPoints: Number(formData.creditPoints)
        };
        courses.push(newCourse);
        localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
        setSnackbar({ open: true, message: `Course ${isDuplicateMode ? 'duplicated and ' : ''}added successfully!`, severity: 'success' });
      }

      setTimeout(() => {
        navigate('/coursesmanagement');
      }, 1500);

    } catch (err) {
      console.error("Error saving course:", err);
      setSnackbar({ open: true, message: 'Error saving course. Please check console for details.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
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

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/"> <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/coursesmanagement"> Manage Courses </Link>
        <Typography color="text.primary">{isEditMode ? 'Edit Course' : 'Add Course'}</Typography>
      </Breadcrumbs>

      <Box component="form" onSubmit={handleSubmit} sx={{ backgroundColor: colors.white, p: 2, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" align="center" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
          {pageTitle}
        </Typography>

        {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '250px' }}>
                <CircularProgress sx={{ color: colors.green }} />
            </Box>
        ) : (
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <TextField fullWidth label="Course Name" name="courseName" value={formData.courseName} onChange={handleChange} error={!!errors.courseName} helperText={errors.courseName} required />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Course ID"
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  error={!!errors.courseId}
                  helperText={errors.courseId}
                  required
                  disabled={isEditMode}
                  slotProps={{
                      maxLength: 5,
                      style: {
                          textTransform: 'uppercase',
                          backgroundColor: isEditMode ? 'action.disabledBackground' : 'inherit',
                          color: isEditMode ? 'text.disabled' : 'inherit',
                      }
                  }}
                  slotPropss={ isEditMode ? {} : {
                    endAdornment: (
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
                <TextField fullWidth label="Credit Points" name="creditPoints" type="number" slotProps={{ min: 1, step: "any" }} value={formData.creditPoints} onChange={handleChange} error={!!errors.creditPoints} helperText={errors.creditPoints} required />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.semester} required>
                  <InputLabel>Semester</InputLabel>
                  <Select name="semester" value={formData.semester} onChange={handleChange} label="Semester">
                    <MenuItem value="A">A</MenuItem>
                    <MenuItem value="B">B</MenuItem>
                    <MenuItem value="Summer">Summer</MenuItem>
                  </Select>
                  {errors.semester && <FormHelperText>{errors.semester}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Professor's Name" name="professorsName" value={formData.professorsName} onChange={handleChange} error={!!errors.professorsName} helperText={errors.professorsName} required />
              </Grid>

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
                  {errors.dayOfWeek && <FormHelperText>{errors.dayOfWeek}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Starting Date" name="startingDate" type="date" value={formData.startingDate} onChange={handleChange} InputLabelProps={{ shrink: true }} error={!!errors.startingDate} helperText={errors.startingDate} required />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Start Time" name="startTime" type="time" value={formData.startTime} onChange={handleChange} InputLabelProps={{ shrink: true }} error={!!errors.startTime} helperText={errors.startTime} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="End Time" name="endTime" type="time" value={formData.endTime} onChange={handleChange} InputLabelProps={{ shrink: true }} error={!!errors.endTime} helperText={errors.endTime} required />
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth label="Course Description" name="description" multiline rows={3} value={formData.description} onChange={handleChange} error={!!errors.description} helperText={errors.description} required />
              </Grid>

              <Grid item xs={12} textAlign="center" sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  type="submit"
                  size="medium"
                  startIcon={submitButtonIcon}
                  sx={{
                    backgroundColor: colors.green, color: colors.text, fontWeight: 500, px: 4,
                    borderRadius: '6px', textTransform: 'none', boxShadow: 'none',
                    '&:hover': { backgroundColor: colors.greenDark, boxShadow: 'none' },
                  }}
                >
                  {submitButtonText}
                </Button>
              </Grid>
            </Grid>
        )}
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}> {snackbar.message} </Alert>
      </Snackbar>
    </Container>
  );
}