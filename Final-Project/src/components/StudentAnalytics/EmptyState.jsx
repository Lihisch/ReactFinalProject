import React from 'react';
import { Paper, Typography } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

const themeColors = {
  primary: '#bed630',
  primaryDark: '#a7bc2a',
  secondary: '#ffffff',
  background: '#ffffff',
  paper: '#ffffff',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  cardBackground: '#ffffff',
  border: '#e0e0e0',
  hover: '#f8f9fa',
};

const EmptyState = () => (
  <Paper sx={{
    p: 6,
    textAlign: 'center',
    border: `1px solid ${themeColors.border}`,
    borderRadius: 2,
    backgroundColor: themeColors.secondary,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  }}>
    <AssessmentIcon sx={{ fontSize: 48, mb: 2, color: themeColors.primaryDark }} />
    <Typography variant="h5" sx={{ fontWeight: 600, color: themeColors.textPrimary, mb: 2 }}>
      No data available for this course
    </Typography>
    <Typography variant="body1" sx={{ color: themeColors.textSecondary }}>
      Select a different course or check back later
    </Typography>
  </Paper>
);

export default EmptyState; 