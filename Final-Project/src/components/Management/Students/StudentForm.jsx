// src/components/StudentForm.jsx

import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { addStudent } from '../../../firebase/students';

// Consistent color palette
const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff'
};

export default function StudentForm() {
  const navigate = useNavigate();

  const initialFormData = {
    studentId: '',
    firstName: '',
    lastName: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const validate = () => {
    const temp = {};
    const alphaRegex = /^[A-Za-z]+$/;
    const numericRegex = /^[0-9]+$/; // Changed: Only digits allowed

    // Student ID Validation
    if (!formData.studentId) {
      temp.studentId = 'Student ID is required.';
    } else if (formData.studentId.length !== 9) {
      temp.studentId = 'Student ID must be exactly 9 digits.';
    } else if (!numericRegex.test(formData.studentId)) { // Check for numeric after length check
      temp.studentId = 'Student ID must contain only numbers.';
    } else {
      try {
        const existingStudents = JSON.parse(localStorage.getItem('students')) || [];
        const isDuplicate = existingStudents.some(student => student.studentId === formData.studentId);
        if (isDuplicate) {
          temp.studentId = `Student ID ${formData.studentId} already exists.`;
        }
      } catch (error) {
        console.error("Error reading students from localStorage:", error);
        setSnackbar({ open: true, message: 'Error checking existing students.', severity: 'error' });
      }
    }

    // First Name Validation
    if (!formData.firstName) {
      temp.firstName = 'First Name is required.';
    } else if (!alphaRegex.test(formData.firstName)) {
      temp.firstName = 'First Name must contain only letters.';
    }

    // Last Name Validation
    if (!formData.lastName) {
      temp.lastName = 'Last Name is required.';
    } else if (!alphaRegex.test(formData.lastName)) {
      temp.lastName = 'Last Name must contain only letters.';
    }

    setErrors(temp);
    return Object.keys(temp).length === 0; // Return true if no errors
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setSnackbar({ open: true, message: 'Please fix the errors in the form.', severity: 'error' });
      return;
    }

    try {
      const newStudent = {
        ...formData,
        enrolledCourses: [],
      };

      const existingStudents = JSON.parse(localStorage.getItem('students')) || [];
      existingStudents.push(newStudent);
      localStorage.setItem('students', JSON.stringify(existingStudents));
      addStudent(newStudent).then(() => {
        setSnackbar({ open: true, message: 'Student added successfully!', severity: 'success' });

        setTimeout(() => {
          setFormData(initialFormData);
          setErrors({});
          navigate('/Studentsmanagement');
        }, 1500);
      });
    } catch (err) {
      console.error("Error saving student:", err);
      setSnackbar({ open: true, message: 'Error saving student. Please check console.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/studentsmanagement">
          Students Management
        </Link>
        <Typography color="text.primary">Add New Student</Typography>
      </Breadcrumbs>
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
          Add New Student
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Student ID"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              required
              error={!!errors.studentId}
              helperText={errors.studentId}
              slotProps={{ maxLength: 9 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </Grid>

          <Grid item xs={12} textAlign="center" sx={{ mt: 2 }}>
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
              Add Student
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
