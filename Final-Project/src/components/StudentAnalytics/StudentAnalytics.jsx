import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import StatCard from './StatCard';
import ChartContainer from './ChartContainer';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend, Tooltip } from 'recharts';

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

const StudentAnalytics = ({ 
  selectedStudentData, 
  overallStats, 
  overallTrendData,
  maxXAxisLabelLineLength 
}) => {
  const renderXAxisTick = ({ x, y, payload }) => {
    const words = payload.value.split(' ');
    const lines = [];
    let current = '';
    words.forEach(word => {
      if ((current + ' ' + word).length > maxXAxisLabelLineLength) {
        lines.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    });
    if (current) lines.push(current);
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, i) => (
          <text
            key={i}
            x={0}
            y={i * 15}
            dy={16}
            textAnchor="middle"
            fill={themeColors.textSecondary}
            fontSize={12}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  return (
    <Box sx={{ mt: 4, pt: 4, borderTop: `1px solid ${themeColors.border}` }}>
      <Typography variant="h4" sx={{ mb: 4, color: themeColors.textPrimary, fontWeight: 700 }}>
        Overall Performance
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Average Grade" value={overallStats.avgGrade} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Highest Grade" value={overallStats.topGrade} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Submission Rate" value={`${overallStats.submissionRate}%`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Courses" value={overallStats.activeCourses} />
        </Grid>
      </Grid>
      <ChartContainer title="Grade Trend">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={overallTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border} />
            <XAxis 
              dataKey="name" 
              tick={renderXAxisTick}
              height={60}
            />
            <YAxis 
              domain={[0, 100]} 
              tickFormatter={(value) => `${value}%`}
              stroke={themeColors.textSecondary}
              tick={{ fontSize: 12, fill: themeColors.textSecondary }}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Grade']}
              labelFormatter={(label) => `Assignment: ${label}`}
              contentStyle={{ background: 'white', border: `1px solid ${themeColors.border}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              cursor={{ fill: 'transparent' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="grade" 
              stroke={themeColors.primary} 
              strokeWidth={2}
              dot={{ fill: themeColors.primary, strokeWidth: 2 }}
              activeDot={{ r: 8, fill: themeColors.primary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Box>
  );
};

export default StudentAnalytics; 