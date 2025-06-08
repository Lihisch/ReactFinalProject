import React from 'react';
import { Card, Typography } from '@mui/material';

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

const StatCard = ({ title, value }) => (
  <Card sx={{
    p: 3,
    height: '100%',
    border: `1px solid ${themeColors.border}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderRadius: 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
      borderColor: themeColors.primary,
      transform: 'translateY(-2px)'
    }
  }}>
    <Typography variant="body2" sx={{
      color: themeColors.textSecondary,
      fontWeight: 500,
      mb: 2,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontSize: '0.75rem'
    }}>
      {title}
    </Typography>
    <Typography variant="h3" sx={{
      fontWeight: 700,
      color: themeColors.textPrimary,
      lineHeight: 1
    }}>
      {value}
    </Typography>
  </Card>
);

export default StatCard; 