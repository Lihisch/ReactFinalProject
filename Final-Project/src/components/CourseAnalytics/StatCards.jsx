import React from 'react';
import { Grid, Card, Box, Typography, Tooltip } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FactCheckIcon from '@mui/icons-material/FactCheck';

const StatCards = ({ stats, additionalStats, themeColors }) => (
  <Grid container spacing={3} mb={4} alignItems="stretch">
    <Grid item xs={12} md={3}>
      <Card sx={{ p: 2, borderRadius: 2, boxShadow: 1, backgroundColor: '#f8faf5', height: '100%' }}>
        <Box sx={{display: 'flex', alignItems: 'center', mb:1}}>
          <AssessmentIcon sx={{color: themeColors.primaryDark, mr: 1}}/>
          <Typography variant="h6" sx={{color: themeColors.primaryDark, fontWeight: 'medium'}}>Average Grade</Typography>
        </Box>
        <Typography fontWeight="bold" fontSize="28px" color={themeColors.primaryDark} sx={{textAlign: 'center'}}>
          {stats.average || 'N/A'}
        </Typography>
        <Tooltip title="Overall course average">
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: themeColors.textSecondary, mt: 1 }}>
            Overall Performance
          </Typography>
        </Tooltip>
      </Card>
    </Grid>
    <Grid item xs={12} md={3}>
      <Card sx={{ p: 2, borderRadius: 2, boxShadow: 1, backgroundColor: '#f8faf5', height: '100%' }}>
        <Box sx={{display: 'flex', alignItems: 'center', mb:1}}>
          <GroupIcon sx={{color: themeColors.primaryDark, mr: 1}}/>
          <Typography variant="h6" sx={{color: themeColors.primaryDark, fontWeight: 'medium'}}>Enrolled Students</Typography>
        </Box>
        <Typography fontWeight="bold" fontSize="28px" color={themeColors.primaryDark} sx={{textAlign: 'center'}}>
          {stats.enrolledStudentsCount || 'N/A'}
        </Typography>
        <Tooltip title="Total number of enrolled students">
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: themeColors.textSecondary, mt: 1 }}>
            Active Students
          </Typography>
        </Tooltip>
      </Card>
    </Grid>
    <Grid item xs={12} md={3}>
      <Card sx={{ p: 2, borderRadius: 2, boxShadow: 1, backgroundColor: '#f8faf5', height: '100%' }}>
        <Box sx={{display: 'flex', alignItems: 'center', mb:1}}>
          <TrendingUpIcon sx={{color: themeColors.primaryDark, mr: 1}}/>
          <Typography variant="h6" sx={{color: themeColors.primaryDark, fontWeight: 'medium'}}>Pass Rate</Typography>
        </Box>
        <Typography fontWeight="bold" fontSize="28px" color={themeColors.primaryDark} sx={{textAlign: 'center'}}>
          {additionalStats.passRate.toFixed(1)}%
        </Typography>
        <Tooltip title="Percentage of students who passed">
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: themeColors.textSecondary, mt: 1 }}>
            Success Rate
          </Typography>
        </Tooltip>
      </Card>
    </Grid>
    <Grid item xs={12} md={3}>
      <Card sx={{ p: 2, borderRadius: 2, boxShadow: 1, backgroundColor: '#f8faf5', height: '100%' }}>
        <Box sx={{display: 'flex', alignItems: 'center', mb:1}}>
          <FactCheckIcon sx={{color: themeColors.primaryDark, mr: 1}}/>
          <Typography variant="h6" sx={{color: themeColors.primaryDark, fontWeight: 'medium'}}>Top Grade</Typography>
        </Box>
        <Typography fontWeight="bold" fontSize="28px" color={themeColors.primaryDark} sx={{textAlign: 'center'}}>
          {additionalStats.topGrade || 'N/A'}
        </Typography>
        <Tooltip title="Highest grade achieved">
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: themeColors.textSecondary, mt: 1 }}>
            Best Performance
          </Typography>
        </Tooltip>
      </Card>
    </Grid>
  </Grid>
);

export default StatCards; 