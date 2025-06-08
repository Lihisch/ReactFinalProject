import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MuiLink from '@mui/material/Link';

const StudentsDialog = ({ open, onClose, dialogTitle, studentsForDialog, selectedCourseId, themeColors }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>{dialogTitle}</DialogTitle>
    <DialogContent>
      {studentsForDialog.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Assignment</TableCell>
                <TableCell>Grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentsForDialog.map((data, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <MuiLink component={RouterLink} to={`/gradesmanagement/${selectedCourseId}/${data.student.id}`} underline="hover" sx={{color: themeColors.primaryDark, fontWeight: 'medium'}}>
                      {data.student.fullName}
                    </MuiLink>
                  </TableCell>
                  <TableCell>{data.student.id}</TableCell>
                  <TableCell>{data.assignmentName}</TableCell>
                  <TableCell>{data.grade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : <Typography>No students found in this range.</Typography>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">Close</Button>
    </DialogActions>
  </Dialog>
);

export default StudentsDialog; 