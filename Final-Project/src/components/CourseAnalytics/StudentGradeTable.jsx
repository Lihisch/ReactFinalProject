import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MuiLink from '@mui/material/Link';

const StudentGradeTable = ({
  filteredSubmissionsForTable,
  getStudentName,
  getAssignmentName,
  selectedCourseId,
  studentNameFilter,
  setStudentNameFilter,
  assignmentNameFilterTable,
  setAssignmentNameFilterTable,
  uniqueStudentNamesForFilter,
  uniqueAssignmentNamesForFilter,
  themeColors,
  formatSubmissionDate
}) => (
  <>
    <Typography variant="h6" sx={{ mt: 4, mb: 2, color: themeColors.textPrimary, fontWeight: 'medium' }}>Student Grade List</Typography>
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="student-name-filter-label">Filter by Student Name</InputLabel>
        <Select
          labelId="student-name-filter-label"
          value={studentNameFilter}
          label="Filter by Student Name"
          onChange={(e) => setStudentNameFilter(e.target.value)}
        >
          <MenuItem value="">
            <em>All Students</em>
          </MenuItem>
          {uniqueStudentNamesForFilter.map(name => (
            <MenuItem key={name} value={name}>{name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small">
        <InputLabel id="assignment-name-table-filter-label">Filter by Assignment Name</InputLabel>
        <Select
          labelId="assignment-name-table-filter-label"
          value={assignmentNameFilterTable}
          label="Filter by Assignment Name"
          onChange={(e) => setAssignmentNameFilterTable(e.target.value)}
        >
          <MenuItem value="">
            <em>All Assignments</em>
          </MenuItem>
          {uniqueAssignmentNamesForFilter.map(name => (
            <MenuItem key={name} value={name}>{name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
    <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: 2, border: `1px solid ${themeColors.secondary}` }}>
      <Table stickyHeader aria-label="student grades table">
        <TableHead>
          <TableRow>
            <TableCell sx={{fontWeight: 'bold', backgroundColor: themeColors.background}}>Student Name</TableCell>
            <TableCell sx={{fontWeight: 'bold', backgroundColor: themeColors.background}}>Student ID</TableCell>
            <TableCell sx={{fontWeight: 'bold', backgroundColor: themeColors.background}}>Assignment Name</TableCell>
            <TableCell sx={{fontWeight: 'bold', backgroundColor: themeColors.background}}>Grade</TableCell>
            <TableCell sx={{fontWeight: 'bold', backgroundColor: themeColors.background}}>Submission Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredSubmissionsForTable.length > 0 ? filteredSubmissionsForTable.map((s, i) => {
            const studentDetails = getStudentName(s.studentId);
            return (
              <TableRow key={s.id || i} hover>
                <TableCell>
                  <MuiLink component={RouterLink} to={`/gradesmanagement/${selectedCourseId}/${studentDetails.id}`} underline="hover" sx={{color: themeColors.primaryDark, fontWeight: 'medium'}}>
                    {studentDetails.fullName}
                  </MuiLink>
                </TableCell>
                <TableCell>{studentDetails.id}</TableCell>
                <TableCell>{getAssignmentName(s.assignmentId)}</TableCell>
                <TableCell sx={{fontWeight: 'medium', color: s.grade >= 55 ? themeColors.primaryDark : 'error.main'}}>
                  {s.grade !== null && s.grade !== undefined ? s.grade : 'N/A'}
                </TableCell>
                <TableCell>{formatSubmissionDate(s.submissionDate)}</TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={5} sx={{textAlign: 'center', color: themeColors.textSecondary}}>
                No submissions match your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </>
);

export default StudentGradeTable; 