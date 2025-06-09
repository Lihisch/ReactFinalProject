import React, { useState, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Grid, TextField, InputAdornment,
  Breadcrumbs, Link, List, ListItem, ListItemIcon, ListItemText,
  Card, CardContent, CardHeader, Button, Chip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradingIcon from '@mui/icons-material/Grading';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LaunchIcon from '@mui/icons-material/Launch';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
// import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'; // Removed as per request
import { Link as MuiLink } from '@mui/material';

const themeColors = {
  primary: '#bed630',
  primaryDark: '#a7bc2a',
  secondary: '#ffffff',
  background: '#f5f5f5',
  paper: '#ffffff',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  cardBackground: '#ffffff',
  border: '#e0e0e0',
  hover: '#f8f9fa',
  success: '#27ae60',
  info: '#3498db',
};

const quickNavigation = [
  {
    title: 'Home Page',
    description: 'View your overview and recent activity',
    link: '/',
    color: themeColors.info,
    icon: <HomeIcon />
  },
  {
    title: 'My Courses',
    description: 'Browse and manage your enrolled courses',
    link: '/courses',
    color: themeColors.primary,
    icon: <ListAltIcon />
  },
  {
    title: 'My Assignments',
    description: 'View and submit assignments',
    link: '/assignments',
    color: themeColors.primaryDark,
    icon: <AssignmentIcon />
  },
  {
    title: 'My Grades',
    description: 'Check your grades and performance',
    link: '/grades',
    color: themeColors.success,
    icon: <GradingIcon />
  },
  {
    title: 'Student Analytics',
    description: 'Detailed performance analysis',
    link: '/info',
    color: '#9c27b0', // A distinct purple
    icon: <BarChartIcon />
  }
  // { // Removed "Management" card
  //   title: 'Management',
  //   description: 'Administrative tools and settings',
  //   link: '/coursesmanagement',
  //   color: '#ff5722', // A distinct orange
  //   icon: <ManageAccountsIcon />
  // }
];

const helpTopics = [
  {
    key: 'getting_started',
    icon: <HomeIcon fontSize="large" sx={{ color: themeColors.primary }} />,
    title: 'Getting Started',
    description: 'First steps in using the student portal',
    details: [
      'Select your student profile from the dropdown on the home page',
      'Navigate through different sections using the top menu',
      'Your dashboard shows recent grades, upcoming assignments, and course calendar',
      'Use the search function to quickly find specific information'
    ]
  },
  {
    key: 'view_courses',
    icon: <ListAltIcon fontSize="large" sx={{ color: themeColors.primary }} />,
    title: 'Managing Courses',
    description: 'How to view and interact with your courses',
    details: [
      'View all enrolled courses organized by semester',
      'Click on any course card to see detailed information',
      'Register for new courses using the "Register to a Course" button',
      'See course schedules, professors, and credit points',
      'Track assignment deadlines for each course'
    ]
  },
  {
    key: 'assignments',
    icon: <AssignmentIcon fontSize="large" sx={{ color: themeColors.primary }} />,
    title: 'Assignments & Submissions',
    description: 'Complete guide to assignment management',
    details: [
      'View assignments organized by semester and course',
      'Submit individual or group assignments with files and text',
      'Track submission status and deadlines',
      'See assignment weights and requirements',
      'View past due assignments using the toggle switch'
    ]
  },
  {
    key: 'grades',
    icon: <GradingIcon fontSize="large" sx={{ color: themeColors.primary }} />,
    title: 'Grades & Performance',
    description: 'Understanding your academic performance',
    details: [
      'View grades for submitted assignments',
      'See class averages and compare your performance',
      'Track your overall GPA and course-specific averages',
      'Access detailed analytics in the Student Analytics section'
    ]
  },
  {
    key: 'analytics',
    icon: <BarChartIcon fontSize="large" sx={{ color: themeColors.primary }} />,
    title: 'Student Analytics',
    description: 'Deep dive into your academic progress',
    details: [
      'View comprehensive performance statistics',
      'See grade progression charts over time',
      'Compare your performance with class averages',
      'Analyze course-specific performance metrics',
      'Track submission rates and improvement trends'
    ]
  },
  {
    key: 'tips_practices',
    icon: <AccessTimeIcon fontSize="large" sx={{ color: themeColors.primary }} />,
    title: 'Tips & Best Practices',
    description: 'Maximize your success with the student portal',
    details: [
      'Check your dashboard regularly for important updates',
      'Set up a routine to review upcoming assignment deadlines',
      'Use the calendar view to plan your submission schedule',
      'Submit assignments early to avoid last-minute technical issues',
      'Regularly review your grades and analytics to track progress'
    ]
  }
];

const faqData = [
  {
    question: 'How do I submit a group assignment?',
    answer: 'When submitting a group assignment, enter your group partners\' student IDs in the designated fields. All group members will receive the same grade once it\'s entered by the instructor.'
  },
  {
    question: 'What happens if I miss a submission deadline?',
    answer: 'Assignments past their due date will appear as "Past Due" in your assignments list. Contact your instructor directly regarding late submissions and potential penalties.'
  },
  {
    question: 'How can I see my overall GPA?',
    answer: 'Your overall GPA and statistics are available on the home dashboard and in the Student Analytics section, which provides detailed performance breakdowns.'
  },
  {
    question: 'Can I register for courses from previous semesters?',
    answer: 'You can only register for future courses. The system filters available courses to show only those with start dates in the future.'
  },
  {
    question: 'How do I track my assignment submission status?',
    answer: 'In the Assignments section, you\'ll see colored status indicators: submitted assignments show "Submitted" chips, while pending ones show "Submit Assignment" buttons.'
  }
];

export default function Help() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleNavigation = (link) => {
    if (link === '/assignments' || link === '/courses' || link === '/grades' || link === '/info' || link === '/') {
      window.location.href = link;
    } else {
      navigate(link);
    }
  };

  const filteredTopics = useMemo(() => {
    if (!searchTerm) return helpTopics;
    const lower = searchTerm.toLowerCase();
    return helpTopics.filter(topic =>
      topic.title.toLowerCase().includes(lower) ||
      topic.description.toLowerCase().includes(lower) ||
      topic.details.some(detail => detail.toLowerCase().includes(lower))
    );
  }, [searchTerm]);

  const filteredFAQ = useMemo(() => {
    if (!searchTerm) return faqData;
    const lower = searchTerm.toLowerCase();
    return faqData.filter(faq =>
      faq.question.toLowerCase().includes(lower) ||
      faq.answer.toLowerCase().includes(lower)
    );
  }, [searchTerm]);

  return (
    <Box sx={{ backgroundColor: themeColors.background, minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', px: { xs: 1, sm: 3, md: 4 } }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <MuiLink
              component={RouterLink}
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center' }}
              color="inherit"
              to="/"
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Home
            </MuiLink>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              Help
            </Typography>
          </Breadcrumbs>
          <Box sx={{ width: '100%', maxWidth: 1300, mb: 1.5 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: themeColors.primaryDark, mb: 0.2, letterSpacing: '.02em', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              Help Center
            </Typography>
            <Typography variant="subtitle1" sx={{ color: themeColors.textSecondary, fontWeight: 400, fontSize: '0.98rem' }}>
              Find answers to common questions and learn how to use the system
            </Typography>
          </Box>
          <Paper elevation={3} sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            backgroundColor: themeColors.paper,
            boxShadow: '0 2px 16px #e0e0e0',
            minHeight: 400,
            width: '100%',
          }}>
            {/* Search Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: themeColors.textPrimary }}>
                How can we help you today?
              </Typography>
              <Typography variant="body1" color={themeColors.textSecondary} sx={{ mb: 3 }}>
                Search for help topics, browse guides, or jump directly to different sections
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search help topics, FAQs, or features..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: themeColors.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  maxWidth: '600px',
                  mx: 'auto',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: themeColors.secondary,
                  }
                }}
              />
            </Box>

            {/* Quick Navigation */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: themeColors.textPrimary, mb: 3 }}>
                Quick Navigation
              </Typography>
              <Grid container spacing={3} sx={{ justifyContent: 'center' }}> {/* Centered the grid items */}
                {quickNavigation.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        height: '100%',
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                          borderColor: item.color,
                          '& .nav-icon': {
                            transform: 'scale(1.1)',
                          }
                        }
                      }}
                      onClick={() => handleNavigation(item.link)}
                    >
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 2
                        }}>
                          <Box
                            className="nav-icon"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: `${item.color}15`,
                              border: `2px solid ${item.color}30`,
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {React.cloneElement(item.icon, {
                              sx: { color: item.color, fontSize: '1.8rem' }
                            })}
                          </Box>
                        </Box>
                        <Typography variant="h6" sx={{
                          fontWeight: 600,
                          mb: 1.5,
                          color: themeColors.textPrimary,
                          fontSize: '1.1rem'
                        }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{
                          color: themeColors.textSecondary,
                          lineHeight: 1.5
                        }}>
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Help Topics */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: themeColors.textPrimary, mb: 3 }}>
                Help Topics
              </Typography>
              <Grid container spacing={3}>
                {filteredTopics.length > 0 ? (
                  filteredTopics.map((topic) => (
                    <Grid item xs={12} md={6} key={topic.key}>
                      <Card sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderTop: `4px solid ${themeColors.primary}`,
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: 2,
                        transition: 'box-shadow 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                        }
                      }}>
                        <CardHeader
                          avatar={topic.icon}
                          title={topic.title}
                          titleTypographyProps={{ variant: 'h6', fontWeight: 600, color: themeColors.textPrimary }}
                          sx={{ pb: 1 }}
                        />
                        <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                          <Typography variant="body2" color={themeColors.textSecondary} sx={{ mb: 2 }}>
                            {topic.description}
                          </Typography>
                          <List dense disablePadding>
                            {topic.details.map((detail, idx) => (
                              <ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
                                <ListItemIcon sx={{ minWidth: '20px' }}>
                                  <FiberManualRecordIcon sx={{ fontSize: '0.5rem', color: themeColors.primaryDark }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={detail}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    color: themeColors.textPrimary,
                                    lineHeight: 1.4
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color={themeColors.textSecondary}>
                        No help topics matching your search were found.
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* FAQ Section */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: themeColors.textPrimary, mb: 3 }}>
                Frequently Asked Questions
              </Typography>
              {filteredFAQ.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{
                    mb: 1,
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: 2,
                    '&:before': { display: 'none' },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center'
                      }
                    }}
                  >
                    <QuestionAnswerIcon sx={{ mr: 2, color: themeColors.primary }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: themeColors.textPrimary }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Typography variant="body2" color={themeColors.textSecondary} sx={{ ml: 5 }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>

            {/* Contact Support */}
            <Box sx={{
              textAlign: 'center',
              pt: 4,
              borderTop: `1px solid ${themeColors.border}`,
              backgroundColor: themeColors.secondary,
              borderRadius: 2,
              p: 4
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.primary, mb: 1 }}>
                Need help?
              </Typography>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                color: themeColors.primaryDark,
                mb: 2
              }}>
                We're here for you.
              </Typography>
              <Typography variant="body1" color={themeColors.textSecondary} sx={{ mb: 3 }}>
                Call our support team for assistance and guidance.
              </Typography>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                backgroundColor: themeColors.hover,
                borderRadius: 2,
                p: 3,
                border: `1px solid ${themeColors.primary}30`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <Typography variant="h6" sx={{
                  fontWeight: 700,
                  color: themeColors.primary,
                  fontSize: '1.3rem'
                }}>
                  📞 03-5311888
                </Typography>
                <Typography variant="body2" sx={{
                  color: themeColors.textSecondary,
                  fontWeight: 500
                }}>
                  Support hours: Sunday–Thursday, 08:00–16:00
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
