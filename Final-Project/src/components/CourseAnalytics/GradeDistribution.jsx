import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

const GradeDistribution = ({ distribution, maxDistributionCount, themeColors, handleGraphBarClick }) => (
  <>
    <Typography variant="h6" sx={{ mb: 2, color: themeColors.textPrimary, fontWeight: 'medium' }}>Grade Distribution</Typography>
    {distribution && distribution.length > 0 ? (
      <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 200, p: 2, borderRadius: 2, backgroundColor: '#f8faf5', border: `1px solid ${themeColors.secondary}` }}>
        {distribution.map((bucket, i) => (
          <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%', justifyContent: 'flex-end', width: `${100 / distribution.length}%` }}>
            <Typography variant="caption" sx={{ color: themeColors.textSecondary, fontWeight: 'medium' }}>{bucket.count}</Typography>
            <Box
              sx={{
                width: '60%',
                height: `${(bucket.count / (maxDistributionCount || 1)) * 90}%`,
                backgroundColor: themeColors.primary,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease-in-out',
                cursor: 'pointer',
                minHeight: '4px',
                '&:hover': {
                  backgroundColor: themeColors.primaryDark,
                }
              }}
              onClick={() => handleGraphBarClick(bucket)}
            />
            <Typography variant="caption" sx={{ mt: 0.5, color: themeColors.textPrimary, fontWeight: 'medium' }}>{bucket.label}</Typography>
          </Box>
        ))}
      </Paper>
    ) : (
      <Typography sx={{ textAlign: 'center', color: themeColors.textSecondary, py: 3 }}>
        No grade distribution data available for this course.
      </Typography>
    )}
  </>
);

export default GradeDistribution; 