import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack, Box } from '@mui/material';
import { formatDateForDisplay, getCourseStatus } from './courseUtils';

export default function CourseViewDialog({ open, onClose, course }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>Course Details</DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        {course ? (
          <Stack spacing={1.5}>
            <Typography variant="h6" gutterBottom>{course.courseName || 'N/A'} ({course.courseId})</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Status:</Typography>
              {(() => {
                const status = getCourseStatus(course.startingDate, course.endDate);
                return <Typography variant="body1" sx={{ color: status.textColor, fontWeight: 'medium' }}>{status.text}</Typography>;
              })()}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}> <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Semester:</Typography> <Typography variant="body1">{course.semester || 'N/A'}</Typography> </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}> <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Schedule:</Typography> <Typography variant="body1">{`${course.dayOfWeek || 'N/A'} ${course.startTime || 'N/A'}-${course.endTime || 'N/A'}`}</Typography> </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}> <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>Start Date:</Typography> <Typography variant="body1">{formatDateForDisplay(course.startingDate)}</Typography> </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}> <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 'bold' }}>End Date:</Typography> <Typography variant="body1">{formatDateForDisplay(course.endDate)}</Typography> </Box>
            <Box> <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Description:</Typography> <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', pl: 1 }}>{course.description || 'N/A'}</Typography> </Box>
          </Stack>
        ) : (
          <Typography>No course data available.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ pb: 2, px: 3 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 