import React, { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Grid, TextField, InputAdornment,
  Breadcrumbs, Link, List, ListItem, ListItemIcon, ListItemText,
  Card, CardContent, CardHeader
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradingIcon from '@mui/icons-material/Grading';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; // Keep this for bullet points

const colors = {
  green: '#bed630',
  greenDark: '#a7bc2a',
  text: '#000000',
  white: '#ffffff',
  grey: '#e0e0e0' // Added grey for divider
};


const allHelpTopics = [
  {
    key: 'view_courses',
    icon: <ListAltIcon fontSize="large" sx={{ color: colors.green }} />,
    title: 'View Courses',
    description: 'How to access your current course list.',
    details: [
      'On the homepage, you will see your current course list.',
      'You can click on the course name to go to the full course page.',
    ]
  },
  {
    key: 'view_assignments',
    icon: <AssignmentIcon fontSize="large" sx={{ color: colors.green }} />,
    title: 'View Assignments',
    description: 'How to view all assignments and submit them on time.',
    details: [
      'On the homepage, you can see assignments that are open for submission.',
      'Clicking on an assignment will take you to the submission screen with submission details.',
    ]
  },
  {
    key: 'view_grades',
    icon: <GradingIcon fontSize="large" sx={{ color: colors.green }} />,
    title: 'View Grades',
    description: 'How to check grades entered for assignments.',
    details: [
      'You can access grades from the main menu → "Grades".',
      'Or view grades from the homepage under "Recent Grades".',
    ]
  },
  {
    key: 'view_deadlines',
    icon: <AccessTimeIcon fontSize="large" sx={{ color: colors.green }} />,
    title: 'Submission Deadlines',
    description: 'How not to miss an important deadline.',
    details: [
      'Assignments include a clear submission date on the homepage and the assignments screen.',
      'The system may provide reminders as the deadline approaches.',
    ]
  },
  {
    key: 'technical_support',
    icon: <ContactSupportIcon fontSize="large" sx={{ color: colors.green }} />,
    title: 'Technical Support',
    description: 'For additional questions or technical issues.',
    details: [ // Updated details array
      'Please contact the academic administration or the IT support center.',
      'Contact details are available on the institution\'s main website.'
    ]
  },
];

const technicalSupportTopic = allHelpTopics.find(topic => topic.key === 'technical_support');
const studentHelpTopics = allHelpTopics.filter(topic => topic.key !== 'technical_support');


export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };


  const filteredTopics = useMemo(() => {
    if (!searchTerm) return studentHelpTopics;
    const lower = searchTerm.toLowerCase();
    return studentHelpTopics.filter(topic =>
      topic.title.toLowerCase().includes(lower) ||
      topic.description.toLowerCase().includes(lower) ||
      topic.details.some(detail => detail.toLowerCase().includes(lower))
    );
  }, [searchTerm]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" sx={{ display: 'flex', alignItems: 'center' }} color="inherit" to="/">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          Help Center
        </Typography>
      </Breadcrumbs>

      {/* Paper wrapper */}
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, backgroundColor: colors.white }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Student Help Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Here you can find useful and necessary information for using the system.
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by topic (e.g., 'grades', 'assignments')..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: '600px', mx: 'auto' }}
          />
        </Box>

        {/* Cards for main help topics */}
        <Grid container spacing={3}>
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic) => (
              <Grid item xs={12} md={6} key={topic.key}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: `4px solid ${colors.green}` }}>
                  <CardHeader
                    avatar={topic.icon}
                    title={topic.title}
                    titleTypographyProps={{ variant: 'h6', fontWeight: 500 }}
                    sx={{ pb: 0 }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {topic.description}
                    </Typography>
                    <List dense disablePadding>
                      {topic.details.map((detail, idx) => (
                        <ListItem key={idx} disableGutters sx={{ py: 0.2 }}>
                          <ListItemIcon sx={{ minWidth: '24px' }}>
                            <FiberManualRecordIcon sx={{ fontSize: '0.6rem', color: colors.greenDark }} />
                          </ListItemIcon>
                          <ListItemText primary={detail} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
                No topics matching your search were found.
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Technical Support Section - */}
        {technicalSupportTopic && (
          <Box sx={{ mt: 6, pt: 4, textAlign: 'center', borderTop: `1px solid ${colors.grey}` }}>
             <Box sx={{ display: 'inline-flex', alignItems: 'center', mb: 1 }}>
                {React.cloneElement(technicalSupportTopic.icon, { fontSize: 'medium', sx: { color: colors.green, mr: 1 } })}
                <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                    {technicalSupportTopic.title} {/* Title remains "Technical Support" */}
                </Typography>
             </Box>
             {/* Display the description */}
             <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {technicalSupportTopic.description}
             </Typography>  
             <List dense disablePadding sx={{ display: 'inline-block', textAlign: 'left', maxWidth: '100%' }}>
                {technicalSupportTopic.details.map((detail, index) => (
                  <ListItem key={index} disableGutters sx={{ py: 0.2, justifyContent: 'center' }}> 
                    <ListItemIcon sx={{ minWidth: '24px', mr: 0.5 }}> 
                      <FiberManualRecordIcon sx={{ fontSize: '0.7rem', color: colors.greenDark }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={detail}
                      primaryTypographyProps={{ variant: 'body1', color: 'text.secondary' }}
                      sx={{ flexGrow: 0 }} // Prevent text from pushing icon too far left
                    />
                  </ListItem>
                ))}
             </List>
          </Box>
        )}

      </Paper>
    </Container>
  );
}
