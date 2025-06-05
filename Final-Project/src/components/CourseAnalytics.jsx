import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, Grid, Table, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem,
  Select, FormControl, InputLabel, Container, Breadcrumbs, Link as MuiLink, CircularProgress, Divider, Tooltip, IconButton
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../firebase/firebase-settings';

const themeColors = {
  primary: '#bed630',
  primaryDark: '#a7bc2a',
  secondary: '#e0e0e0',
  background: '#f5f5f5',
  paper: '#ffffff',
  textPrimary: 'rgba(0, 0, 0, 0.87)',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
};

const CourseAnalytics = () => {
  // ... existing code ...
};

export default CourseAnalytics; 