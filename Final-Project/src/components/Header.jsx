import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import SchoolIcon from '@mui/icons-material/School';
import Divider from '@mui/material/Divider';

const primaryGreen = '#bed630';
const primaryGreenDark = '#a7bc2a';
const hoverGreen = '#9fb327';
const textOnPrimary = '#2a2a2a';
const menuBg = '#ffffff';
const menuItemHoverBg = '#f8f9fa';
const menuItemText = '#2c3e50';
const headerShadow = '0 2px 12px rgba(0,0,0,0.1)';

const pages = [
  { name: 'Home', link: '/' },
  { name: 'Courses', link: '/courses' },
  { name: 'Assignments', link: '/assignments' },
  { name: 'Grades', link: '/grades' },
  { name: 'Student Analytics', link: '/info' },
  { name: 'Help', link: '/help' },
];

const managementMenu = {
  name: 'Management',
  items: [
    { name: 'Course Analytics', link: '/course-analytics' },
    { isDivider: true },
    // Courses
    { name: 'Manage Courses', link: '/coursesmanagement' }, // Matches App.jsx
    { name: 'Add New Course', link: '/courseform' },      // Matches App.jsx
    { isDivider: true },
    // Grades
    { name: 'Manage Grades', link: '/gradesmanagement' }, // Matches App.jsx
    { name: 'Grades Entry', link: '/gradesform' },     // Matches App.jsx
    { isDivider: true },
    // Assignments
    { name: 'Manage Assignments', link: '/assignmentsmanagement' }, // Matches App.jsx
    { name: 'Add New Assignment', link: '/assignmentsform' },     // Matches App.jsx
    { isDivider: true },
    // Students
    { name: 'Manage Students', link: '/studentsmanagement' }, // Matches App.jsx
    { name: 'Add New Student', link: '/studentform' },       // Matches App.jsx
    { name: 'Enroll Student to Course', link: '/enrollmentform' }, // Matches App.jsx
  ],
};

// Helper component for rendering management menu items
const ManagementMenuItems = ({ items, onNavigate, itemStyles }) => {
  return (
    <>
      {items.map((item, index) =>
        item.isDivider ? (
          <Divider key={`divider-${index}`} sx={{ my: 0.5 }} />
        ) : (
          <MenuItem key={item.name} onClick={() => onNavigate(item.link)} sx={itemStyles}>
            <Typography textAlign="center">{item.name}</Typography>
          </MenuItem>
        )
      )}
    </>
  );
};


function ResponsiveAppBar() {
  const navigate = useNavigate();

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElDesktopManagement, setAnchorElDesktopManagement] = useState(null);
  const [anchorElMobileManagement, setAnchorElMobileManagement] = useState(null);

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleOpenDesktopManagementMenu = (event) => setAnchorElDesktopManagement(event.currentTarget);
  const handleCloseDesktopManagementMenu = () => setAnchorElDesktopManagement(null);
  const handleOpenMobileManagementMenu = (event) => setAnchorElMobileManagement(event.currentTarget);
  const handleCloseMobileManagementMenu = () => setAnchorElMobileManagement(null);

  const handleCloseNavMenu = () => setAnchorElNav(null);

  const handleNavigate = (link) => {
    // If already on the target page, force a reload to reset state
    if (window.location.pathname === link) {
      window.location.replace(link);
      return;
    }
    if (link === '/assignments' || link === '/courses' || link === '/grades' || link === '/info' || link === '/') {
      window.location.href = link;
      return;
    }
    navigate(link);
    handleCloseNavMenu();
    handleCloseDesktopManagementMenu();
    handleCloseMobileManagementMenu();
  };

  const menuItemStyles = {
    color: menuItemText,
    fontWeight: 500,
    borderRadius: 1,
    mx: 1,
    my: 0.25,
    '&:hover': {
      backgroundColor: menuItemHoverBg,
      transform: 'translateX(4px)',
    },
    transition: 'all 0.2s ease',
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: `linear-gradient(135deg, ${primaryGreen} 0%, ${primaryGreenDark} 100%)`,
        boxShadow: headerShadow,
        borderBottom: `1px solid ${primaryGreenDark}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <SchoolIcon sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            mr: 1.5, 
            color: textOnPrimary,
            fontSize: '2rem',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
          }} />
          <Typography
            variant="h5" 
            noWrap 
            component="a" 
            onClick={() => handleNavigate('/')}
            sx={{
              mr: 4, 
              display: { xs: 'none', md: 'flex' }, 
              fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
              fontWeight: 800, 
              letterSpacing: '.1rem', 
              color: textOnPrimary,
              textDecoration: 'none', 
              cursor: 'pointer',
              fontSize: '1.5rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }
            }}
          >
            Ono Academy
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton size="large" onClick={handleOpenNavMenu} sx={{ color: textOnPrimary }}>
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar-mobile" anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
              PaperProps={{ 
                sx: { 
                  backgroundColor: menuBg,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid #e0e0e0',
                  mt: 1
                } 
              }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={() => handleNavigate(page.link)} sx={menuItemStyles}>
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
              <MenuItem onClick={handleOpenMobileManagementMenu} sx={menuItemStyles}>
                <Typography textAlign="center">{managementMenu.name}</Typography>
              </MenuItem>
            </Menu>
            <Menu
              id="submenu-management-mobile" anchorEl={anchorElMobileManagement}
              open={Boolean(anchorElMobileManagement)} onClose={handleCloseMobileManagementMenu}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{ 
                sx: { 
                  backgroundColor: menuBg,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid #e0e0e0',
                  mt: 1
                } 
              }}
            >
              <ManagementMenuItems items={managementMenu.items} onNavigate={handleNavigate} itemStyles={menuItemStyles} />
            </Menu>
          </Box>

          <SchoolIcon sx={{ 
            display: { xs: 'flex', md: 'none' }, 
            mr: 1, 
            color: textOnPrimary,
            fontSize: '1.8rem',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
          }} />
          <Typography
            variant="h5" 
            noWrap 
            component="a" 
            onClick={() => handleNavigate('/')}
            sx={{
              mr: 2, 
              display: { xs: 'flex', md: 'none' }, 
              flexGrow: 1, 
              fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
              fontWeight: 700, 
              letterSpacing: '.1rem', 
              color: textOnPrimary,
              textDecoration: 'none', 
              cursor: 'pointer',
              fontSize: '1.3rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }
            }}
          >
            Ono Academy
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button 
                key={page.name} 
                onClick={() => handleNavigate(page.link)}
                sx={{ 
                  my: 2, 
                  mx: 0.5,
                  px: 2.5,
                  color: textOnPrimary, 
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    backgroundColor: hoverGreen,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  }
                }}
              >
                {page.name}
              </Button>
            ))}
            <Box>
              <Button 
                onClick={handleOpenDesktopManagementMenu}
                sx={{ 
                  my: 2, 
                  mx: 0.5,
                  px: 2.5,
                  color: textOnPrimary, 
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    backgroundColor: hoverGreen,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  }
                }}
              >
                {managementMenu.name}
              </Button>
              <Menu
                id="submenu-management-desktop" anchorEl={anchorElDesktopManagement}
                open={Boolean(anchorElDesktopManagement)} onClose={handleCloseDesktopManagementMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ 
                  sx: { 
                    backgroundColor: menuBg,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid #e0e0e0',
                    mt: 1
                  } 
                }}
              >
                <ManagementMenuItems items={managementMenu.items} onNavigate={handleNavigate} itemStyles={menuItemStyles} />
              </Menu>
            </Box>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;
