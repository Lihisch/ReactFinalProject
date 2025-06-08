import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Popover,
  FormControlLabel,
  Switch,
  Stack,
  Typography,
  Divider,
  Button,
  alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

const CoursesFilterBar = ({
  searchInput,
  handleSearchInputChange,
  activeFilterCount,
  handleFilterIconClick,
  filterAnchorEl,
  handleFilterPopoverClose,
  openFilterPopover,
  showCompletedCourses,
  setShowCompletedCourses,
  filterSemester,
  setFilterSemester,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  colors
}) => {
  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        size="small"
        placeholder="Search courses..."
        value={searchInput}
        onChange={handleSearchInputChange}
        sx={{ flexGrow: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchInput && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => handleSearchInputChange({ target: { value: '' } })}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <IconButton
        onClick={handleFilterIconClick}
        sx={{
          bgcolor: activeFilterCount > 0 ? alpha(colors.green, 0.1) : 'transparent',
          '&:hover': {
            bgcolor: activeFilterCount > 0 ? alpha(colors.green, 0.2) : 'action.hover'
          }
        }}
      >
        <Badge badgeContent={activeFilterCount} color="primary">
          <FilterListIcon />
        </Badge>
      </IconButton>

      <Popover
        open={openFilterPopover}
        anchorEl={filterAnchorEl}
        onClose={handleFilterPopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showCompletedCourses}
                  onChange={(e) => setShowCompletedCourses(e.target.checked)}
                />
              }
              label="Show Completed Courses"
            />

            <TextField
              select
              label="Semester"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="">All Semesters</option>
              <option value="Fall 2023">Fall 2023</option>
              <option value="Spring 2024">Spring 2024</option>
              <option value="Summer 2024">Summer 2024</option>
            </TextField>

            <TextField
              label="Start Date"
              type="date"
              value={filterStartDate || ''}
              onChange={(e) => setFilterStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              size="small"
            />

            <TextField
              label="End Date"
              type="date"
              value={filterEndDate || ''}
              onChange={(e) => setFilterEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              size="small"
            />

            <Button
              variant="outlined"
              onClick={() => {
                setShowCompletedCourses(false);
                setFilterSemester('');
                setFilterStartDate(null);
                setFilterEndDate(null);
              }}
              startIcon={<ClearIcon />}
            >
              Clear All Filters
            </Button>
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
};

export default CoursesFilterBar; 