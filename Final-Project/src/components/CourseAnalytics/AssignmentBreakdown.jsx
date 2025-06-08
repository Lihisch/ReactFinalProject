import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Grid, Paper, Divider } from '@mui/material';

const AssignmentBreakdown = ({ assignmentDetails, assignmentNameFilterBreakdown, setAssignmentNameFilterBreakdown, uniqueAssignmentNamesForFilter, themeColors, handleGraphBarClick }) => (
  assignmentDetails && assignmentDetails.length > 0 && (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h6" sx={{ mb: 2, color: themeColors.textPrimary, fontWeight: 'medium' }}>Grade Distribution by Assignment</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl fullWidth size="small" sx={{ maxWidth: 300 }}>
          <InputLabel id="assignment-name-breakdown-filter-label">Filter by Assignment</InputLabel>
          <Select
            labelId="assignment-name-breakdown-filter-label"
            value={assignmentNameFilterBreakdown}
            label="Filter by Assignment"
            onChange={(e) => setAssignmentNameFilterBreakdown(e.target.value)}
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
      <Grid container spacing={3}>
        {assignmentDetails.filter(detail => {
          const assignmentName = detail.name.toLowerCase();
          return assignmentNameFilterBreakdown ? assignmentName.includes(assignmentNameFilterBreakdown.toLowerCase()) : true;
        }).map((assignment, idx) => (
          <Grid item xs={12} md={6} lg={4} key={assignment.id}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8faf5', border: `1px solid ${themeColors.secondary}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: themeColors.primaryDark, mb: 1 }}>{assignment.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 120 }}>
                {assignment.distribution.map((bucket, i) => (
                  <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%', justifyContent: 'flex-end', width: `${100 / assignment.distribution.length}%` }}>
                    <Typography variant="caption" sx={{ color: themeColors.textSecondary, fontWeight: 'medium' }}>{bucket.count}</Typography>
                    <Box
                      sx={{
                        width: '60%',
                        height: `${(bucket.count / Math.max(...assignment.distribution.map(b => b.count), 1)) * 90}%`,
                        backgroundColor: themeColors.primary,
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease-in-out',
                        minHeight: '4px',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: themeColors.primaryDark,
                        }
                      }}
                      onClick={() => handleGraphBarClick(bucket, assignment.id)}
                    />
                    <Typography variant="caption" sx={{ mt: 0.5, color: themeColors.textPrimary, fontWeight: 'medium' }}>{bucket.label}</Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" sx={{ color: themeColors.textSecondary, textAlign: 'center' }}>
                Average: <b style={{ color: themeColors.primaryDark }}>{assignment.averageGrade}</b> | Weight: {assignment.weight}%
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
);

export default AssignmentBreakdown; 