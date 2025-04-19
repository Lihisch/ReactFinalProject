// FILE: src/components/Header.jsx

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
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import SchoolIcon from '@mui/icons-material/School';
import Divider from '@mui/material/Divider';

const primaryGreen = '#bed630';
const hoverGreen = '#a7bc2a';
const textOnPrimary = '#000000';
const menuBg = '#ffffff';
const menuItemHoverBg = '#f5f5f5';
const menuItemText = '#000000';
const avatarFallbackBg = '#616161';

const pages = [
  { name: 'Home', link: '/' },
  { name: 'Courses', link: '/courses' },
  { name: 'Assignments', link: '/Assignments' },
  { name: 'Grades', link: '/grades' },
  { name: 'Help', link: '/help' },
  { name: 'Info', link: '/info' },
];

const managementMenu = {
  name: 'Management',
  items: [
    // Courses
    { name: 'Manage Courses', link: '/Coursemanagement' },
    { name: 'Add New Course', link: '/CourseForm' },
    { isDivider: true },
    // Grades
    { name: 'Manage Grades', link: '/GradesManagement' },
    { name: 'Grade Assignment', link: '/GradesForm' }, // Updated name to match form purpose
    { isDivider: true },
    // Assignments
    { name: 'Manage Assignments', link: '/AssignmentsManagement' },
    { name: 'Add New Assignment', link: '/AssignmentsForm' },
    { isDivider: true }, // Added divider before new section
    // Students
    { name: 'Manage Students', link: '/StudentsList' }, // Link to the student list page
    { name: 'Add New Student', link: '/StudentForm' }, // Link to the student form page
    { name: 'Enroll Student to Course', link: '/EnrollmentForm' }, // Link to the enrollment form page
  ],
};

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];


function ResponsiveAppBar() {
  const navigate = useNavigate();

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElDesktopManagement, setAnchorElDesktopManagement] = useState(null);
  const [anchorElMobileManagement, setAnchorElMobileManagement] = useState(null);

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleOpenDesktopManagementMenu = (event) => setAnchorElDesktopManagement(event.currentTarget);
  const handleCloseDesktopManagementMenu = () => setAnchorElDesktopManagement(null);
  const handleOpenMobileManagementMenu = (event) => setAnchorElMobileManagement(event.currentTarget);
  const handleCloseMobileManagementMenu = () => setAnchorElMobileManagement(null);

  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleNavigate = (link) => {
    navigate(link);
    handleCloseNavMenu();
    handleCloseUserMenu();
    handleCloseDesktopManagementMenu();
    handleCloseMobileManagementMenu();
  };

  const menuItemStyles = {
    color: menuItemText,
    '&:hover': {
      backgroundColor: menuItemHoverBg,
    },
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: primaryGreen }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <SchoolIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, color: textOnPrimary }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            onClick={() => handleNavigate('/')}
            sx={{
              mr: 2, display: { xs: 'none', md: 'flex' }, fontFamily: 'monospace',
              fontWeight: 700, letterSpacing: '.1rem', color: textOnPrimary,
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            Ono Academy
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large" aria-label="open navigation menu" aria-controls="menu-appbar-mobile"
              aria-haspopup="true" onClick={handleOpenNavMenu} sx={{ color: textOnPrimary }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar-mobile" anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
              PaperProps={{ sx: { backgroundColor: menuBg } }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={() => handleNavigate(page.link)} sx={menuItemStyles}>
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
              <MenuItem onClick={handleOpenMobileManagementMenu} aria-controls="submenu-management-mobile" aria-haspopup="true" sx={menuItemStyles}>
                <Typography textAlign="center">{managementMenu.name}</Typography>
              </MenuItem>
            </Menu>
            <Menu
              id="submenu-management-mobile"
              anchorEl={anchorElMobileManagement}
              open={Boolean(anchorElMobileManagement)}
              onClose={handleCloseMobileManagementMenu}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{ sx: { backgroundColor: menuBg } }}
            >
              {managementMenu.items.map((item, index) => (
                item.isDivider
                  ? <Divider key={`divider-${index}`} sx={{ my: 0.5 }} />
                  : <MenuItem key={item.name} onClick={() => handleNavigate(item.link)} sx={menuItemStyles}>
                      <Typography textAlign="center">{item.name}</Typography>
                    </MenuItem>
              ))}
            </Menu>
          </Box>

          <SchoolIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1, color: textOnPrimary }} />
          <Typography
            variant="h5" noWrap component="a" onClick={() => handleNavigate('/')}
            sx={{
              mr: 2, display: { xs: 'flex', md: 'none' }, flexGrow: 1, fontFamily: 'monospace',
              fontWeight: 700, letterSpacing: '.1rem', color: textOnPrimary,
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            Ono Academy
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.name} onClick={() => handleNavigate(page.link)}
                sx={{ my: 2, color: textOnPrimary, display: 'block', '&:hover': { backgroundColor: hoverGreen } }}
              >
                {page.name}
              </Button>
            ))}
            <Box>
              <Button
                onClick={handleOpenDesktopManagementMenu}
                sx={{ my: 2, color: textOnPrimary, display: 'block', '&:hover': { backgroundColor: hoverGreen } }}
                aria-controls="submenu-management-desktop"
                aria-haspopup="true"
              >
                {managementMenu.name}
              </Button>
              <Menu
                id="submenu-management-desktop"
                anchorEl={anchorElDesktopManagement}
                open={Boolean(anchorElDesktopManagement)}
                onClose={handleCloseDesktopManagementMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { backgroundColor: menuBg } }}
              >
                {managementMenu.items.map((item, index) => (
                  item.isDivider
                    ? <Divider key={`divider-${index}`} sx={{ my: 0.5 }} />
                    : <MenuItem key={item.name} onClick={() => handleNavigate(item.link)} sx={menuItemStyles}>
                        <Typography textAlign="center">{item.name}</Typography>
                      </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="User Avatar" src="/static/images/avatar/2.jpg" sx={{ bgcolor: avatarFallbackBg }} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }} id="menu-appbar-user" anchorEl={anchorElUser}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }} keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElUser)} onClose={handleCloseUserMenu}
              PaperProps={{ sx: { backgroundColor: menuBg } }}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu} sx={menuItemStyles}>
                  <Typography textAlign="center">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;
