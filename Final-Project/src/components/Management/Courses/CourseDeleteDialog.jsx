import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export default function CourseDeleteDialog({ open, onClose, onConfirm, courseName, courseId, isBulk, selectedCount, warning }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete {isBulk ? `the selected ${selectedCount} course(s)` : `"${courseName || 'N/A'}" (ID: ${courseId || 'N/A'})`}? {warning} This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ pb: 2, px: 3 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus>Delete</Button>
      </DialogActions>
    </Dialog>
  );
} 