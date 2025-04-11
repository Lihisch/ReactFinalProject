import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
  Stack,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function AssignmentsForm() {
  const [assignmentCode, setAssignmentCode] = useState(1);
  const [assignmentName, setAssignmentName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fileErrorMessage, setFileErrorMessage] = useState('');

  // Load courses from localStorage when the component mounts
  useEffect(() => {
    const storedCourses = JSON.parse(localStorage.getItem('courses')) || [];
    setCourseOptions(storedCourses);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    // Remove the error message if a file is selected
    if (file) {
      setFileErrorMessage('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Validate form fields
    if (!assignmentName || !courseCode || !submissionDate || !description || !weight) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    // Ensure a file is selected before submitting
    if (!selectedFile) {
      setFileErrorMessage('Please upload a file.');
      return;
    }

    setErrorMessage('');
    setFileErrorMessage('');

    // Create the new assignment entry
    const newAssignment = {
      assignmentCode,
      assignmentName,
      courseCode,
      submissionDate,
      description,
      weight,
      selectedFile,
    };

    // Retrieve existing assignments from localStorage
    const existingAssignments = JSON.parse(localStorage.getItem('assignments')) || [];
    
    // Add the new assignment to the existing assignments
    existingAssignments.push(newAssignment);

    // Save updated assignments back to localStorage
    localStorage.setItem('assignments', JSON.stringify(existingAssignments));

    // Set success message
    setSuccessMessage('Assignment submitted successfully!');

    // Clear the form fields after submission
    setAssignmentCode(assignmentCode + 1);
    setAssignmentName('');
    setCourseCode('');
    setSubmissionDate('');
    setDescription('');
    setWeight('');
    setSelectedFile(null);
    
    // Hide the success message after a short period
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 5,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: '#f9f9f9',
        }}
      >
        <Typography variant="h5" mb={3}>
          Assignments Form
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {/* Course Code Dropdown */}
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Course Code</InputLabel>
            <Select
              value={courseCode}
              label="Course Code"
              onChange={(e) => setCourseCode(e.target.value)} // Update the courseCode on change
            >
              {courseOptions.length > 0 ? (
                courseOptions.map((course) => (
                  <MenuItem key={course.courseCode} value={course.courseCode}>
                    {course.courseCode} - {course.courseName}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No courses available</MenuItem>
              )}
            </Select>
          </FormControl>

          {/* Assignment Name */}
          <TextField
            label="Assignment Name"
            value={assignmentName}
            onChange={(e) => setAssignmentName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          {/* Submission Date */}
          <TextField
            label="Submission Date"
            type="date"
            value={submissionDate}
            onChange={(e) => setSubmissionDate(e.target.value)}
            fullWidth
            margin="normal"
            required
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* Description */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            required
            multiline
            rows={4}
          />

          {/* Weight */}
          <TextField
            label="Weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          {/* Custom Upload Button */}
          <Stack direction="row" spacing={2} alignItems="center" marginTop={2}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              color="primary"
              sx={{ padding: '10px 20px' }}
            >
              Upload File
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {selectedFile && (
              <Typography variant="body2" color="textSecondary">
                {selectedFile.name}
              </Typography>
            )}
          </Stack>

          {/* File Upload Error Message */}
          {fileErrorMessage && (
            <Typography color="error" sx={{ mt: 2 }}>
              {fileErrorMessage}
            </Typography>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Typography color="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Typography>
          )}

          {/* Success Message */}
          {successMessage && (
            <Typography color="success" sx={{ mt: 2 }}>
              {successMessage}
            </Typography>
          )}

          {/* Submit Button */}
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }} fullWidth>
            Submit Assignment
          </Button>
        </Box>
      </Box>
    </Container>
  );
}



console.log(JSON.parse(localStorage.getItem('assignments')));
