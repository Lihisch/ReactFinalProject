import React from 'react';
import { TableRow, TableCell, Checkbox, TableSortLabel, Grid, InputAdornment } from '@mui/material';

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

const CoursesTableHead = ({ order, orderBy, onRequestSort, rowCount, numSelected, onSelectAllClick }) => {
  return (
    <TableRow>
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          indeterminate={numSelected > 0 && numSelected < rowCount}
          checked={rowCount > 0 && numSelected === rowCount}
          onChange={onSelectAllClick}
          inputProps={{ 'aria-label': 'select all courses' }}
        />
      </TableCell>
      {headCells.map((headCell) => (
        <TableCell
          key={headCell.id}
          align={headCell.align || 'left'}
          padding={headCell.padding || 'normal'}
          sortDirection={orderBy === headCell.id ? order : false}
          sx={{
            fontWeight: 'bold',
            ...(orderBy === headCell.id && { bgcolor: 'action.selected' }),
            ...(headCell.width && { width: headCell.width, minWidth: headCell.width })
          }}
        >
          {headCell.sortable ? (
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={() => onRequestSort(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          ) : (
            headCell.label
          )}
        </TableCell>
      ))}
    </TableRow>
  );
};

export default CoursesTableHead; 