import React from 'react';
import { TableRow, TableCell, Checkbox, Chip, Tooltip, IconButton, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

const headCells = [
  { id: 'statusText', label: 'Status', sortable: true, padding: 'normal', align: 'center', width: '100px' },
  { id: 'courseId', label: 'Course ID', sortable: true, padding: 'normal' },
  { id: 'courseName', label: 'Course Name', sortable: true, padding: 'normal' },
  { id: 'professorsName', label: 'Professor', sortable: true, padding: 'normal' },
  { id: 'semester', label: 'Semester', sortable: true, padding: 'normal', align: 'left' },
  { id: 'schedule', label: 'Schedule', sortable: false, padding: 'normal' },
  { id: 'enrolled', label: 'Enrolled', sortable: false, align: 'center', padding: 'normal' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'right', padding: 'normal', width: '180px' },
];

const CoursesTableBody = ({
  loading,
  rowsPerPage,
  sortedAndPaginatedCourses,
  isSelected,
  handleCheckboxClick,
  enrollmentCounts,
  getCourseStatus,
  handleDuplicateCourse,
  handleViewClick,
  handleEditCourse,
  handleDeleteClick,
  handleOpenEnrollmentModal,
  colors,
  emptyRows,
  filteredCourses,
  generateNoCoursesMessage
}) => {
  if (loading) {
    return Array.from(new Array(rowsPerPage)).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell padding="checkbox"><Skeleton variant="rectangular" width={18} height={18} /></TableCell>
        {headCells.map(cell => (
          <TableCell key={cell.id} align={cell.align || 'left'} sx={cell.width ? {width: cell.width, minWidth: cell.width} : {}}><Skeleton variant="text" /></TableCell>
        ))}
      </TableRow>
    ));
  }

  if (sortedAndPaginatedCourses.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={headCells.length + 2} align="center" sx={{ py: 4 }}>{generateNoCoursesMessage()}</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {sortedAndPaginatedCourses.map((course) => {
        const isItemSelected = isSelected(course?.courseId);
        const labelId = `enhanced-table-checkbox-${course?.courseId}`;
        const currentEnrollmentCount = enrollmentCounts[course.courseId] ?? 0;
        const status = getCourseStatus(course.startingDate, course.endDate);
        return (
          course && course.courseId ? (
            <TableRow
              hover
              onClick={(event) => {
                if (event.target.type !== 'checkbox' && !event.target.closest('button, a, .MuiChip-root')) {
                  handleCheckboxClick(event, course.courseId);
                }
              }}
              role="checkbox"
              aria-checked={isItemSelected}
              tabIndex={-1}
              key={course.courseId}
              selected={isItemSelected}
              sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity) } }}
            >
              <TableCell padding="checkbox">
                <Checkbox color="primary" checked={isItemSelected} onChange={(event) => handleCheckboxClick(event, course.courseId)} inputProps={{ 'aria-labelledby': labelId }} />
              </TableCell>
              <TableCell align="center" sx={{width: headCells.find(hc => hc.id === 'statusText')?.width}}>
                <Chip
                  label={status.text}
                  size="small"
                  variant={status.chipVariant}
                  color={status.chipColor}
                  sx={{ fontWeight: 500, minWidth: '70px' }}
                />
              </TableCell>
              <TableCell component="th" id={labelId} scope="row" sx={{width: headCells.find(hc => hc.id === 'courseId')?.width}}>{course.courseId}</TableCell>
              <TableCell sx={{width: headCells.find(hc => hc.id === 'courseName')?.width}}>{course.courseName || 'N/A'}</TableCell>
              <TableCell sx={{width: headCells.find(hc => hc.id === 'professorsName')?.width}}>{course.professorsName || 'N/A'}</TableCell>
              <TableCell align="left" sx={{width: headCells.find(hc => hc.id === 'semester')?.width}}>{course.semester || 'N/A'}</TableCell>
              <TableCell sx={{width: headCells.find(hc => hc.id === 'schedule')?.width}}>{`${course.dayOfWeek || 'N/A'} ${course.startTime || 'N/A'}-${course.endTime || 'N/A'}`}</TableCell>
              <TableCell align="center" sx={{width: headCells.find(hc => hc.id === 'enrolled')?.width}}>
                <Tooltip title="View/Manage Enrollment">
                  <Chip
                    icon={<PeopleAltIcon fontSize="small" />}
                    label={currentEnrollmentCount}
                    size="small"
                    variant="outlined"
                    onClick={(e) => { e.stopPropagation(); handleOpenEnrollmentModal(course); }}
                    className="enrollment-chip"
                    sx={{ minWidth: '50px', cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  />
                </Tooltip>
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: headCells.find(hc => hc.id === 'actions')?.width }}>
                <Tooltip title="Duplicate Course">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDuplicateCourse(course); }} sx={{ mr: 0.5, color: 'action.active' }}>
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewClick(course); }} sx={{ mr: 0.5, color: 'action.active' }}>
                    <VisibilityIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Course">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditCourse(course.courseId); }} sx={{ mr: 0.5, color: 'primary.main' }}>
                    <EditIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Course">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteClick(course.courseId, course.courseName); }} sx={{ color: colors.error }}>
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ) : null
        );
      })}
      {!loading && emptyRows > 0 && (
        <TableRow style={{ height: 33 * emptyRows }}>
          <TableCell colSpan={headCells.length + 2} />
        </TableRow>
      )}
    </>
  );
};

export default CoursesTableBody; 