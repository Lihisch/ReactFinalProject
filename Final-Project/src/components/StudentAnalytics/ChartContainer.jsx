import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

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

const ChartContainer = ({ children, title, height = 300 }) => (
  <Paper sx={{
    p: 4,
    mb: 4,
    border: `1px solid ${themeColors.border}`,
    borderRadius: 2,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
    }
  }}>
    {title && (
      <Typography variant="h6" sx={{
        fontWeight: 600,
        color: themeColors.textPrimary,
        mb: 3,
        pb: 2,
        borderBottom: `1px solid ${themeColors.border}`
      }}>
        {title}
      </Typography>
    )}
    <Box sx={{ height, width: '100%' }}>
      {children}
    </Box>
  </Paper>
);

export default ChartContainer; 