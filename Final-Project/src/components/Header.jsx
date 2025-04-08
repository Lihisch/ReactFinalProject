import * as React from 'react';
import { useState } from 'react';
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
import AdbIcon from '@mui/icons-material/Adb';

const pages = [
  { name: 'Home', link: '/' },
  { name: 'Courses', link: '/courses' },
  { name: 'Assignments', link: '/Assignments' },
  { name: 'Grades', link: '/grades' },
  { name: 'Help', link: '/help' },
  { name: 'Info', link: '/info' },
];

const managementPage = {
  name: 'Management Screens',
  subPages: [
    { name: 'Course Management', link: '/Coursemanagement' },
    { name: 'Grade Management', link: '/GradesManagement' },
    { name: 'Assignment Management', link: '/AssignmentsManagement' },
  ],
};

const managementForms = {
  name: 'Management Forms',
  subPages: [
    { name: 'Course Form', link: '/CourseForm' },
    { name: 'Grade Form', link: '/GradesForm' },
    { name: 'Assignment Form', link: '/AssignmentsForm' },
  ],
};

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElSubNav, setAnchorElSubNav] = useState(null);
  const [anchorElForms, setAnchorElForms] = useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleOpenSubNavMenu = (event) => setAnchorElSubNav(event.currentTarget);
  const handleOpenFormsMenu = (event) => setAnchorElForms(event.currentTarget);

  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseSubNavMenu = () => setAnchorElSubNav(null);
  const handleCloseFormsMenu = () => setAnchorElForms(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            LOGO
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="open navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={handleCloseNavMenu}>
                  <a href={page.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography sx={{ textAlign: 'center' }}>{page.name}</Typography>
                  </a>
                </MenuItem>
              ))}

              {/* Management Screens */}
              <div key={managementPage.name}>
                <MenuItem onClick={handleOpenSubNavMenu}>
                  <Typography sx={{ textAlign: 'center' }}>
                    {managementPage.name}
                  </Typography>
                </MenuItem>
                <Menu
                  anchorEl={anchorElSubNav}
                  open={Boolean(anchorElSubNav)}
                  onClose={handleCloseSubNavMenu}
                >
                  {managementPage.subPages.map((subPage) => (
                    <MenuItem key={subPage.name} onClick={handleCloseSubNavMenu}>
                      <Typography sx={{ textAlign: 'center' }}>
                        <a
                          href={subPage.link}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {subPage.name}
                        </a>
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </div>

              {/* Management Forms */}
              <div key={managementForms.name}>
                <MenuItem onClick={handleOpenFormsMenu}>
                  <Typography sx={{ textAlign: 'center' }}>
                    {managementForms.name}
                  </Typography>
                </MenuItem>
                <Menu
                  anchorEl={anchorElForms}
                  open={Boolean(anchorElForms)}
                  onClose={handleCloseFormsMenu}
                >
                  {managementForms.subPages.map((subPage) => (
                    <MenuItem key={subPage.name} onClick={handleCloseFormsMenu}>
                      <Typography sx={{ textAlign: 'center' }}>
                        <a
                          href={subPage.link}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {subPage.name}
                        </a>
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            </Menu>
          </Box>

          {/* Desktop Title */}
          <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            LOGO
          </Typography>

          {/* Desktop Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                onClick={handleCloseNavMenu}
                href={page.link}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.name}
              </Button>
            ))}

            {/* Management Screens */}
            <Button onClick={handleOpenSubNavMenu} sx={{ my: 2, color: 'white', display: 'block' }}>
              {managementPage.name}
            </Button>
            <Menu anchorEl={anchorElSubNav} open={Boolean(anchorElSubNav)} onClose={handleCloseSubNavMenu}>
              {managementPage.subPages.map((subPage) => (
                <MenuItem key={subPage.name} onClick={handleCloseSubNavMenu}>
                  <Typography sx={{ textAlign: 'center' }}>
                    <a href={subPage.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {subPage.name}
                    </a>
                  </Typography>
                </MenuItem>
              ))}
            </Menu>

            {/* Management Forms */}
            <Button onClick={handleOpenFormsMenu} sx={{ my: 2, color: 'white', display: 'block' }}>
              {managementForms.name}
            </Button>
            <Menu anchorEl={anchorElForms} open={Boolean(anchorElForms)} onClose={handleCloseFormsMenu}>
              {managementForms.subPages.map((subPage) => (
                <MenuItem key={subPage.name} onClick={handleCloseFormsMenu}>
                  <Typography sx={{ textAlign: 'center' }}>
                    <a href={subPage.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {subPage.name}
                    </a>
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* User Avatar */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
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
