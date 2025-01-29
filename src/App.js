import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';
import { theme } from './styles/theme';
import TitleBar from './components/TitleBar';
import AppBar from './components/AppBar';
import AppView from './pages/AppView';
import Home from './pages/Home';
import Settings from './pages/Settings';
import GlobalStyle from './styles/GlobalStyle';

const { ipcRenderer } = window.require('electron');

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 32px 20px 0;
  background: ${props => props.theme.colors.background};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: ${props => props.theme.colors.background};
`;

const LoadingSpinner = styled.div`
  border: 8px solid ${props => props.theme.colors.primary};
  border-top: 8px solid ${props => props.theme.colors.secondary};
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  font-size: 18px;
  color: ${props => props.theme.colors.text};
  margin-top: 20px;
`;

const HoverZone = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: fit-content;
  min-width: 500px;
  height: 10px;
  z-index: 998;
  background: ${props => props.show ? 'transparent' : 'rgba(32, 33, 36, 0.8)'};
  backdrop-filter: ${props => props.show ? 'none' : 'blur(10px)'};
  box-shadow: ${props => props.show ? 'none' : '0 -2px 10px rgba(0, 0, 0, 0.1)'};
  border-radius: 16px 16px 0 0;
  padding: 0 24px;
  display: flex;
  justify-content: center;
`;

const App = () => {
  const [apps, setApps] = useState([]);
  const [initialAppId, setInitialAppId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isBarVisible, setIsBarVisible] = useState(false);
  const hideTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsBarVisible(true);
  };

  const handleMouseLeave = () => {
    if (!hideTimeoutRef.current) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsBarVisible(false);
        hideTimeoutRef.current = null;
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const loadApps = async () => {
      try {
        const savedApps = await ipcRenderer.invoke('get-apps');
        setApps(savedApps);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load apps:', error);
        setIsLoading(false);
      }
    };
    loadApps();

    const handleOpenApp = (event, appId) => {
      console.log('Received open-app event with appId:', appId);
      setInitialAppId(appId);
    };

    const handleAppNotFound = (event, appId) => {
      console.log('App not found:', appId);
      alert(`The requested application does not exist or has been deleted.`);
      setInitialAppId(null);
      navigate('/');
    };

    const handleAppsUpdated = async () => {
      console.log('Apps updated, reloading...');
      await loadApps();
    };

    ipcRenderer.on('open-app', handleOpenApp);
    ipcRenderer.on('app-not-found', handleAppNotFound);
    ipcRenderer.on('apps-updated', handleAppsUpdated);

    return () => {
      ipcRenderer.removeListener('open-app', handleOpenApp);
      ipcRenderer.removeListener('app-not-found', handleAppNotFound);
      ipcRenderer.removeListener('apps-updated', handleAppsUpdated);
    };
  }, [navigate]);

  // Handle app redirection when initialAppId is set
  useEffect(() => {
    if (!isLoading && initialAppId) {
      const appExists = apps.some(app => app.id === initialAppId);

      if (appExists) {
        navigate(`/app/${initialAppId}`);
      } else {
        alert(`The requested application does not exist or has been deleted.`);
        navigate('/');
      }
      setInitialAppId(null);
    }
  }, [isLoading, initialAppId, apps, navigate]);

  const shouldShowBar = location.pathname !== '/';

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText></LoadingText>
        </LoadingContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <TitleBar />
      <Container>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/app/:id" element={<AppView />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        {shouldShowBar && (
          <HoverZone 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            show={isBarVisible}
          >
            <AppBar apps={apps} show={isBarVisible} />
          </HoverZone>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default App;
