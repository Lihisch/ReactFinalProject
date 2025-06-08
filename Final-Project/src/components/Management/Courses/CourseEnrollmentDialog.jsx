import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Paper, List, ListItem, ListItemText, IconButton, Tooltip, Divider, Autocomplete, TextField, Stack } from '@mui/material';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function CourseEnrollmentDialog({
  open,
  onClose,
  enrollmentCourse,
  sortedEnrollmentStudents,
  enrollableStudents,
  selectedStudentToEnroll,
  setSelectedStudentToEnroll,
  handleUnenroll,
  handleEnroll,
  colors
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        Manage Enrollment{enrollmentCourse ? `: ${enrollmentCourse.courseName}` : ''}
      </DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        {enrollmentCourse ? (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Currently Enrolled ({sortedEnrollmentStudents.length})
            </Typography>
            {sortedEnrollmentStudents.length > 0 ? (
              <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                <List dense>
                  {sortedEnrollmentStudents.map(student => (
                    <ListItem key={student.studentId}
                      secondaryAction={
                        <Tooltip title="Unenroll Student">
                          <IconButton edge="end" aria-label="unenroll" size="small" onClick={() => handleUnenroll(student.studentId)} sx={{ color: colors.error }}>
                            <PersonRemoveIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      }
                      sx={{ pr: 5 }}
                    >
                      <ListItemText primary={`${student.firstName || ''} ${student.lastName || ''}`} secondary={`ID: ${student.studentId}`} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No students currently enrolled.</Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Enroll New Student</Typography>
            <Autocomplete
              options={enrollableStudents}
              getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''} (ID: ${option.studentId})`}
              value={selectedStudentToEnroll}
              onChange={(event, newValue) => {
                setSelectedStudentToEnroll(newValue);
              }}
              isOptionEqualToValue={(option, value) => option.studentId === value.studentId}
              renderInput={(params) => <TextField {...params} label="Select student to enroll" variant="outlined" size="small" />}
              size="small"
              sx={{ mb: 1 }}
              noOptionsText="All students are enrolled or no students exist"
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={handleEnroll}
              disabled={!selectedStudentToEnroll || enrollableStudents.length === 0}
              sx={{ backgroundColor: colors.green, color: colors.text, '&:hover': { backgroundColor: colors.greenDark } }}
            >
              Enroll Selected Student
            </Button>
          </>
        ) : (
          <Typography>No course selected for enrollment management.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ pb: 2, px: 3 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 